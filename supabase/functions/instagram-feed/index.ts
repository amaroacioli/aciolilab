import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { jwtVerify } from 'https://esm.sh/jose@5.9.6';
import { instagramCacheBucket, instagramSnapshot } from '../_shared/instagram-feed.ts';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const signingKey = new TextEncoder().encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const appId = Deno.env.get('INSTAGRAM_APP_ID');
const appSecret = Deno.env.get('INSTAGRAM_APP_SECRET');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
class InstagramError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
async function hash(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function meta(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
  const body = await response.json();
  if (!response.ok || body.error) {
    if (body.error?.code === 190) throw new InstagramError('A autorização do Instagram expirou ou foi revogada. Conecte a conta novamente.', 401);
    throw new InstagramError('A Meta não autorizou esta operação. Confira a conta profissional, as permissões e as configurações do aplicativo.', 400);
  }
  return body;
}
async function cacheImage(remote: string, deliveryId: string, mediaId: string) {
  let current = remote;
  for (let redirects = 0; redirects < 4; redirects++) {
    const url = new URL(current);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !['cdninstagram.com', 'fbcdn.net'].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) throw new Error('Unsupported image host');
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Missing image redirect');
      await response.body?.cancel();
      current = new URL(location, url).href;
      continue;
    }
    const mime = response.headers.get('content-type')?.split(';')[0].toLowerCase();
    const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : null;
    if (!response.ok || !extension || !response.body || Number(response.headers.get('content-length')) > 10485760) { await response.body?.cancel(); throw new Error('Invalid image'); }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 10485760) { await reader.cancel(); throw new Error('Image too large'); }
      chunks.push(chunk.value);
    }
    if (!size) throw new Error('Empty image');
    const imagePath = `${deliveryId}/${mediaId}.${extension}`;
    const { error } = await db.storage.from(instagramCacheBucket).upload(imagePath, new Blob(chunks, { type: mime }), { contentType: mime, upsert: true });
    if (error) throw error;
    return imagePath;
  }
  throw new Error('Too many redirects');
}
async function synchronize(deliveryId: string, force: boolean) {
  const { data: connection, error } = await db.from('delivery_instagram_connections').select('*').eq('delivery_id', deliveryId).single();
  if (error || !connection) throw new InstagramError('Conecte primeiro a conta profissional do Instagram.', 404);
  const age = connection.synced_at ? Date.now() - Date.parse(connection.synced_at) : Infinity;
  if (age < (force ? 60000 : 30 * 60000)) return instagramSnapshot(db, deliveryId);
  if (Date.parse(connection.expires_at) <= Date.now()) throw new InstagramError('A autorização expirou. Conecte o Instagram novamente.', 401);
  const { data: lock, error: lockError } = await db.from('delivery_instagram_connections').update({ sync_started_at: new Date().toISOString() }).eq('delivery_id', deliveryId).eq('instagram_user_id', connection.instagram_user_id).or(`sync_started_at.is.null,sync_started_at.lt.${new Date(Date.now() - 180000).toISOString()}`).select('delivery_id').maybeSingle();
  if (lockError) throw lockError;
  if (!lock) throw new InstagramError('O feed já está sendo atualizado ou a conexão mudou. Aguarde e tente novamente.', 409);
  try {
    let token = connection.access_token;
    if (Date.parse(connection.expires_at) - Date.now() < 7 * 86400000) {
      const refreshUrl = new URL('https://graph.instagram.com/refresh_access_token');
      refreshUrl.search = new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: token }).toString();
      const refreshed = await meta(refreshUrl.href);
      if (typeof refreshed.access_token !== 'string' || !Number.isFinite(refreshed.expires_in)) throw new Error('Invalid refreshed token');
      token = refreshed.access_token;
      const { error: refreshError } = await db.from('delivery_instagram_connections').update({ access_token: token, expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString() }).eq('delivery_id', deliveryId).eq('instagram_user_id', connection.instagram_user_id);
      if (refreshError) throw refreshError;
    }
    const mediaUrl = new URL(`https://graph.instagram.com/v22.0/${connection.instagram_user_id}/media`);
    mediaUrl.search = new URLSearchParams({ fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp', limit: '12' }).toString();
    const media = await meta(mediaUrl.href, { headers: { Authorization: `Bearer ${token}` } });
    if (!Array.isArray(media.data)) throw new Error('Invalid media response');
    const posts = [];
    for (const post of media.data.slice(0, 12)) {
      const source = post.thumbnail_url || (post.media_type === 'VIDEO' ? undefined : post.media_url);
      if (!source || !/^\d+$/.test(String(post.id))) continue;
      try {
        const imagePath = await cacheImage(source, deliveryId, String(post.id));
        posts.push({ id: String(post.id), caption: typeof post.caption === 'string' ? post.caption.slice(0, 20000) : '', mediaType: post.media_type, timestamp: post.timestamp, imagePath });
      } catch { console.warn('[instagram-feed] Não foi possível guardar uma miniatura', { mediaId: post.id }); }
    }
    if (media.data.length && !posts.length) throw new InstagramError('A conta foi conectada, mas as imagens não puderam ser carregadas. Tente atualizar o feed novamente.', 502);
    posts.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    const { data: savedConnection, error: saveError } = await db.from('delivery_instagram_connections').update({ posts, synced_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('delivery_id', deliveryId).eq('instagram_user_id', connection.instagram_user_id).select('delivery_id').maybeSingle();
    if (saveError) throw saveError;
    if (!savedConnection) throw new InstagramError('A conexão mudou durante a atualização. Verifique a conta e tente novamente.', 409);
    const { data: files } = await db.storage.from(instagramCacheBucket).list(deliveryId, { limit: 1000 });
    const old = files?.filter(file => !posts.some(post => post.imagePath === `${deliveryId}/${file.name}`) && Date.parse(file.updated_at) < Date.now() - 86400000).map(file => `${deliveryId}/${file.name}`) || [];
    if (old.length) await db.storage.from(instagramCacheBucket).remove(old);
    console.info('[instagram-feed] Feed atualizado', { deliveryId, posts: posts.length });
    return instagramSnapshot(db, deliveryId);
  } finally {
    const { error: unlockError } = await db.from('delivery_instagram_connections').update({ sync_started_at: null }).eq('delivery_id', deliveryId).eq('instagram_user_id', connection.instagram_user_id);
    if (unlockError) console.warn('[instagram-feed] Não foi possível liberar a atualização');
  }
}

serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  let action = '';
  try {
    const body = await req.json();
    action = body.action;
    if (action !== 'callback') {
      try {
        const { payload } = await jwtVerify(req.headers.get('x-admin-token') || '', signingKey, { issuer: 'acioli-deliveries', audience: 'delivery-admin', algorithms: ['HS256'] });
        if (payload.role !== 'delivery-admin') throw new Error('Invalid role');
      } catch { return json({ error: 'Entre novamente no admin para conectar ou atualizar o Instagram.' }, 401); }
    }
    if (action === 'callback') {
      if (!appId || !appSecret) return json({ error: 'Configure INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET no Supabase.' }, 503);
      if (typeof body.state !== 'string' || !/^[a-f0-9]{64}$/.test(body.state) || typeof body.code !== 'string' || !body.code || body.code.length > 4096) return json({ error: 'Retorno de autorização inválido.' }, 400);
      const { data: state, error: stateError } = await db.from('delivery_instagram_oauth_states').delete().eq('state_hash', await hash(body.state)).gt('expires_at', new Date().toISOString()).select().maybeSingle();
      if (stateError) throw stateError;
      if (!state) return json({ error: 'A autorização expirou ou já foi utilizada. Conecte o Instagram novamente pelo editor.' }, 400);
      const short = await meta('https://api.instagram.com/oauth/access_token', { method: 'POST', body: new URLSearchParams({ client_id: appId, client_secret: appSecret, grant_type: 'authorization_code', redirect_uri: state.redirect_uri, code: body.code }) });
      if (typeof short.access_token !== 'string') throw new InstagramError('A Meta não forneceu uma autorização válida.');
      const exchangeUrl = new URL('https://graph.instagram.com/access_token');
      exchangeUrl.search = new URLSearchParams({ grant_type: 'ig_exchange_token', client_secret: appSecret, access_token: short.access_token }).toString();
      const long = await meta(exchangeUrl.href);
      if (typeof long.access_token !== 'string' || !Number.isFinite(long.expires_in) || long.expires_in <= 0) throw new InstagramError('Não foi possível concluir a autorização de longa duração.');
      const account = await meta('https://graph.instagram.com/v22.0/me?fields=user_id,username', { headers: { Authorization: `Bearer ${long.access_token}` } });
      const accountId = String(account.user_id || account.id || '');
      if (!/^\d+$/.test(accountId) || typeof account.username !== 'string') throw new InstagramError('Não foi possível identificar a conta profissional.');
      const { error: connectionError } = await db.from('delivery_instagram_connections').upsert({ delivery_id: state.delivery_id, instagram_user_id: accountId, username: account.username, access_token: long.access_token, expires_at: new Date(Date.now() + long.expires_in * 1000).toISOString(), posts: [], synced_at: null, sync_started_at: null, updated_at: new Date().toISOString() });
      if (connectionError) throw connectionError;
      console.info('[instagram-feed] Conta autorizada', { deliveryId: state.delivery_id });
      let warning = '';
      try { await synchronize(state.delivery_id, true); } catch { warning = 'Conta conectada. Volte ao editor e atualize o feed para carregar as imagens.'; }
      return json({ deliveryId: state.delivery_id, warning });
    }
    if (!uuid.test(body.deliveryId || '')) return json({ error: 'Entrega inválida.' }, 400);
    if (action === 'status') return json({ configured: !!appId && !!appSecret, snapshot: await instagramSnapshot(db, body.deliveryId) });
    if (action === 'authorize') {
      if (!appId || !appSecret) return json({ error: 'Configure INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET no Supabase antes de conectar.' }, 503);
      let redirect: URL;
      try { redirect = new URL(body.redirectUri); } catch { return json({ error: 'URL de retorno inválida.' }, 400); }
      if ((redirect.protocol !== 'https:' && !(redirect.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(redirect.hostname))) || redirect.username || redirect.password || redirect.pathname !== '/instagram/callback' || redirect.search || redirect.hash) return json({ error: 'Use a URL pública /instagram/callback do aplicativo, cadastrada na Meta.' }, 400);
      const state = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
      await db.from('delivery_instagram_oauth_states').delete().lt('expires_at', new Date().toISOString());
      const { error } = await db.from('delivery_instagram_oauth_states').insert({ state_hash: await hash(state), delivery_id: body.deliveryId, redirect_uri: redirect.href });
      if (error) throw error;
      const authorizeUrl = new URL('https://www.instagram.com/oauth/authorize');
      authorizeUrl.search = new URLSearchParams({ client_id: appId, redirect_uri: redirect.href, response_type: 'code', scope: 'instagram_business_basic', state, enable_fb_login: '0', force_authentication: '1' }).toString();
      return json({ url: authorizeUrl.href });
    }
    if (action === 'refresh') return json({ snapshot: await synchronize(body.deliveryId, body.force === true) });
    if (action === 'disconnect') {
      const { error } = await db.from('delivery_instagram_connections').delete().eq('delivery_id', body.deliveryId);
      if (error) throw error;
      const { error: stateError } = await db.from('delivery_instagram_oauth_states').delete().eq('delivery_id', body.deliveryId);
      if (stateError) throw stateError;
      const { data: files } = await db.storage.from(instagramCacheBucket).list(body.deliveryId, { limit: 1000 });
      if (files?.length) await db.storage.from(instagramCacheBucket).remove(files.map(file => `${body.deliveryId}/${file.name}`));
      console.info('[instagram-feed] Conexão removida', { deliveryId: body.deliveryId });
      return json({ success: true });
    }
    return json({ error: 'Operação inválida.' }, 400);
  } catch (error) {
    console.error('[instagram-feed] Falha na operação', { action, kind: error instanceof InstagramError ? 'instagram' : 'internal' });
    return json({ error: error instanceof InstagramError ? error.message : 'Não foi possível concluir a conexão com o Instagram. Tente novamente.' }, error instanceof InstagramError ? error.status : 500);
  }
});
