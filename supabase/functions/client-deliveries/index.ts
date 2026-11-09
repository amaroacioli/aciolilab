import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { SignJWT, jwtVerify } from 'https://esm.sh/jose@5.9.6';
import { instagramCacheBucket, instagramSnapshot } from '../_shared/instagram-feed.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const signingKey = new TextEncoder().encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const bucket = 'client-delivery-videos';
const imageBucket = 'client-delivery-images';
const imageExtensions: Record<string, string> = Object.assign(Object.create(null), { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/;
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
const validPath = (path: string, id: string) => new RegExp(`^${id}/[0-9a-f-]{36}\\.(mp4|mov|webm|ogg)$`, 'i').test(path);

function cleanImage(asset: any, id: string, format: 'feed' | 'story' | 'avatar' | 'photo') {
  if (!asset || !imageExtensions[asset.mime] || typeof asset.path !== 'string' || !new RegExp(`^${id}/${format}-[0-9a-f-]{36}\\.${imageExtensions[asset.mime]}$`, 'i').test(asset.path) || typeof asset.fileName !== 'string' || !asset.fileName || asset.fileName.length > 255 || !Number.isInteger(asset.size) || asset.size < 1 || asset.size > (format === 'avatar' ? 5242880 : 52428800) || !Number.isInteger(asset.width) || !Number.isInteger(asset.height) || asset.width < 1 || asset.height < 1 || ((format === 'feed' || format === 'story') && (asset.width !== 1080 || asset.height !== (format === 'feed' ? 1350 : 1920)))) throw new Error('INVALID_IMAGE');
  return { path: asset.path, fileName: asset.fileName, mime: asset.mime, size: asset.size, width: asset.width, height: asset.height };
}
async function withImageUrls(asset: any) {
  if (!asset) return undefined;
  const [view, download] = await Promise.all([
    db.storage.from(imageBucket).createSignedUrl(asset.path, 21600),
    db.storage.from(imageBucket).createSignedUrl(asset.path, 21600, { download: asset.fileName }),
  ]);
  if (view.error) throw view.error;
  if (download.error) throw download.error;
  return { ...asset, url: view.data.signedUrl, downloadUrl: download.data.signedUrl };
}
async function withVideoUrls(row: any) {
  const items = await Promise.all(row.items.map(async (item: any) => {
    const result = { ...item };
    if (item.videoPath) {
      const { data, error } = await db.storage.from(bucket).createSignedUrl(item.videoPath, 21600);
      if (error) throw error;
      result.videoUrl = data.signedUrl;
    }
    if (item.photo) result.photo = await withImageUrls(item.photo);
    if (item.artwork) result.artwork = { feed: await withImageUrls(item.artwork.feed), story: await withImageUrls(item.artwork.story) };
    return result;
  }));
  const profile = row.instagram || {};
  let connectedFeed = null;
  if (row.delivery_type === 'artwork' || row.items.some((item: any) => item.artwork)) {
    try { connectedFeed = await instagramSnapshot(db, row.id); }
    catch { console.warn('[client-deliveries] Cópia do Instagram indisponível; mantendo o conteúdo principal', { id: row.id }); }
  }
  const instagram = { handle: profile.handle || '', name: profile.name || '', bio: profile.bio || '', avatar: await withImageUrls(profile.avatar), connectedFeed };
  return { id: row.id, type: row.delivery_type, instagram, slug: row.slug, client: row.client, title: row.title, introduction: row.introduction, nextSteps: row.next_steps, updatedAt: row.updated_at, published: row.published, items };
}

serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return response({ error: 'Método não permitido.' }, 405);
  try {
    const body = await req.json();
    const { action } = body;
    if (action === 'login') {
      if (typeof body.username !== 'string' || typeof body.password !== 'string' || body.username.length > 100 || body.password.length > 200) return response({ error: 'Credenciais inválidas.' }, 400);
      const { data, error } = await db.rpc('verify_delivery_admin', { p_username: body.username, p_password: body.password });
      if (error) throw error;
      if (!data) return response({ error: 'Usuário ou senha incorretos. Após muitas tentativas, aguarde 15 minutos.' }, 401);
      const token = await new SignJWT({ role: 'delivery-admin' }).setProtectedHeader({ alg: 'HS256' }).setSubject(body.username).setIssuer('acioli-deliveries').setAudience('delivery-admin').setIssuedAt().setExpirationTime('8h').sign(signingKey);
      console.info('[client-deliveries] Admin autenticado');
      return response({ token });
    }
    if (action === 'public') {
      if (typeof body.slug !== 'string' || !slugPattern.test(body.slug)) return response({ error: 'Entrega não encontrada.' }, 404);
      const { data, error } = await db.from('client_deliveries').select('*').eq('slug', body.slug).eq('published', true).maybeSingle();
      if (error) throw error;
      if (!data) return response({ error: 'Esta entrega não está disponível ou foi retirada do ar.' }, 404);
      return response({ delivery: await withVideoUrls(data) });
    }
    try {
      const { payload } = await jwtVerify(req.headers.get('x-admin-token') || '', signingKey, { issuer: 'acioli-deliveries', audience: 'delivery-admin', algorithms: ['HS256'] });
      if (payload.role !== 'delivery-admin') throw new Error('Invalid role');
    } catch {
      return response({ error: 'Sua sessão expirou. Entre novamente no painel.', code: 'ADMIN_SESSION_EXPIRED' }, 401);
    }
    if (action === 'list') {
      const { data, error } = await db.from('client_deliveries').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return response({ deliveries: await Promise.all(data.map(withVideoUrls)) });
    }
    if (action === 'upload-image') {
      if (!uuid.test(body.id || '') || !['feed', 'story', 'avatar', 'photo'].includes(body.format) || !imageExtensions[body.mime]) return response({ error: 'Imagem inválida. Use JPG, PNG ou WebP.' }, 400);
      const path = `${body.id}/${body.format}-${crypto.randomUUID()}.${imageExtensions[body.mime]}`;
      const { data, error } = await db.storage.from(imageBucket).createSignedUploadUrl(path);
      if (error) throw error;
      return response({ path, token: data.token });
    }
    if (action === 'upload') {
      if (!uuid.test(body.id || '') || !['mp4', 'mov', 'webm', 'ogg'].includes(body.extension)) return response({ error: 'Vídeo inválido.' }, 400);
      const path = `${body.id}/${crypto.randomUUID()}.${body.extension}`;
      const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);
      if (error) throw error;
      return response({ path, token: data.token });
    }
    if (action === 'save') {
      const d = body.delivery;
      if (!d || !uuid.test(d.id || '') || typeof d.slug !== 'string' || !slugPattern.test(d.slug) || typeof d.client !== 'string' || !d.client.trim() || d.client.length > 120 || typeof d.title !== 'string' || !d.title.trim() || d.title.length > 180 || typeof d.introduction !== 'string' || d.introduction.length > 20000 || typeof d.nextSteps !== 'string' || d.nextSteps.length > 20000 || typeof d.published !== 'boolean' || !Array.isArray(d.items) || d.items.length > 100 || (d.type !== undefined && !['video', 'artwork', 'photo'].includes(d.type))) return response({ error: 'Revise os dados e o endereço da entrega.' }, 400);
      if (d.published && !d.items.length) return response({ error: 'Adicione conteúdo antes de publicar.' }, 400);
      const profile = d.instagram || {};
      const instagram: Record<string, any> = {};
      for (const [key, limit] of [['handle', 30], ['name', 120], ['bio', 500]] as const) {
        const value = profile[key] ?? '';
        if (typeof value !== 'string' || value.length > limit || (key === 'handle' && value && !/^[a-zA-Z0-9._]+$/.test(value))) return response({ error: 'Revise o @, nome e bio do perfil Instagram.' }, 400);
        instagram[key] = value;
      }
      if (profile.avatar) instagram.avatar = cleanImage(profile.avatar, d.id, 'avatar');
      const items = [];
      for (const item of d.items) {
        if (!item || !uuid.test(item.id || '') || typeof item.title !== 'string' || !item.title.trim() || item.title.length > 180 || typeof item.description !== 'string' || item.description.length > 20000 || (item.caption !== undefined && (typeof item.caption !== 'string' || item.caption.length > 20000)) || (item.videoPath && (typeof item.videoPath !== 'string' || !validPath(item.videoPath, d.id))) || (item.fileName && (typeof item.fileName !== 'string' || item.fileName.length > 255))) return response({ error: 'Revise os títulos e conteúdos dos blocos.' }, 400);
        let artwork;
        if (item.artwork !== undefined) {
          if (!item.artwork || typeof item.artwork !== 'object' || Array.isArray(item.artwork)) return response({ error: 'Arte inválida.' }, 400);
          artwork = { ...(item.artwork.feed ? { feed: cleanImage(item.artwork.feed, d.id, 'feed') } : {}), ...(item.artwork.story ? { story: cleanImage(item.artwork.story, d.id, 'story') } : {}) };
          if (!Object.keys(artwork).length) return response({ error: 'Adicione uma imagem de Feed ou Story a cada arte.' }, 400);
        }
        const photo = item.photo ? cleanImage(item.photo, d.id, 'photo') : undefined;
        if (!item.videoPath && !artwork && !photo && !item.description.trim()) return response({ error: 'Cada bloco precisa de vídeo, arte, foto ou explicação.' }, 400);
        items.push({ id: item.id, title: item.title.trim(), description: item.description, caption: item.caption || '', ...(photo ? { photo } : {}), ...(artwork ? { artwork } : {}), ...(item.videoPath ? { videoPath: item.videoPath, fileName: item.fileName || 'video', videoSize: Number(item.videoSize) || 0 } : {}) });
      }
      if (d.type === 'artwork' && d.published && !items.some(item => item.artwork)) return response({ error: 'Adicione pelo menos uma arte antes de publicar uma entrega de criativos.' }, 400);
      if (d.type === 'photo' && d.published && !items.some(item => item.photo)) return response({ error: 'Adicione pelo menos uma foto antes de publicar esta entrega.' }, 400);
      const { data: previous, error: previousError } = await db.from('client_deliveries').select('items').eq('id', d.id).maybeSingle();
      if (previousError) throw previousError;
      const { data, error } = await db.from('client_deliveries').upsert({ id: d.id, delivery_type: d.type || 'video', instagram, slug: d.slug, client: d.client.trim(), title: d.title.trim(), introduction: d.introduction, next_steps: d.nextSteps, items, published: d.published, updated_at: new Date().toISOString() }).select().single();
      if (error?.code === '23505') return response({ error: 'Este endereço já está em uso. Escolha outro nome para o link.' }, 409);
      if (error) throw error;
      const delivery = await withVideoUrls(data);
      const unused = (previous?.items || []).map((item: any) => item.videoPath).filter((path: string) => path && !items.some(item => item.videoPath === path));
      if (unused.length) {
        const { error: cleanupError } = await db.storage.from(bucket).remove(unused);
        if (cleanupError) console.warn('[client-deliveries] Falha ao remover vídeos substituídos', cleanupError.message);
      }
      console.info('[client-deliveries] Entrega salva', { id: d.id, published: d.published, type: d.type || 'video' });
      return response({ delivery });
    }
    if (action === 'unpublish') {
      if (!uuid.test(body.id || '')) return response({ error: 'Entrega inválida.' }, 400);
      const { error } = await db.from('client_deliveries').update({ published: false, updated_at: new Date().toISOString() }).eq('id', body.id);
      if (error) throw error;
      return response({ success: true });
    }
    if (action === 'delete') {
      if (!uuid.test(body.id || '')) return response({ error: 'Entrega inválida.' }, 400);
      const { error } = await db.from('client_deliveries').delete().eq('id', body.id);
      if (error) throw error;
      const { error: connectionError } = await db.from('delivery_instagram_connections').delete().eq('delivery_id', body.id);
      if (connectionError) throw connectionError;
      const { error: stateError } = await db.from('delivery_instagram_oauth_states').delete().eq('delivery_id', body.id);
      if (stateError) throw stateError;
      for (const storageBucket of [bucket, imageBucket, instagramCacheBucket]) {
        const { data: files, error: listError } = await db.storage.from(storageBucket).list(body.id, { limit: 1000 });
        if (listError) console.warn('[client-deliveries] Falha ao listar mídias para exclusão', listError.message);
        if (files?.length) {
          const { error: removeError } = await db.storage.from(storageBucket).remove(files.map(file => `${body.id}/${file.name}`));
          if (removeError) console.warn('[client-deliveries] Falha ao remover mídias excluídas', removeError.message);
        }
      }
      return response({ success: true });
    }
    return response({ error: 'Operação inválida.' }, 400);
  } catch (error) {
    if (error instanceof SyntaxError) return response({ error: 'Requisição inválida.' }, 400);
    if (error instanceof Error && error.message === 'INVALID_IMAGE') return response({ error: 'Imagem inválida. Use JPG, PNG ou WebP. Fotos: até 50 MB, sem restrição de proporção; Feed: 1080 × 1350; Story: 1080 × 1920; perfil: até 5 MB.' }, 400);
    console.error('[client-deliveries] Falha na operação', { message: error instanceof Error ? error.message : String(error) });
    return response({ error: 'Não foi possível concluir a operação. Tente novamente.' }, 500);
  }
});
