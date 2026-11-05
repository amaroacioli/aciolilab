import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { jwtVerify } from 'https://esm.sh/jose@5.9.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const signingKey = new TextEncoder().encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const extensions: Record<string, string> = Object.assign(Object.create(null), { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' });
const formats = ['feed', 'story'];
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

async function withUrls(row: any) {
  const assets: Record<string, unknown> = {};
  for (const [format, asset] of Object.entries(row.assets) as [string, any][]) {
    const [preview, download] = await Promise.all([
      db.storage.from('social-media').createSignedUrl(asset.path, 3600),
      db.storage.from('social-media').createSignedUrl(asset.path, 3600, { download: asset.fileName }),
    ]);
    if (preview.error) throw preview.error;
    if (download.error) throw download.error;
    assets[format] = { ...asset, url: preview.data.signedUrl, downloadUrl: download.data.signedUrl };
  }
  return { id: row.id, title: row.title, caption: row.caption, assets, updatedAt: row.updated_at };
}

serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return response({ error: 'Método não permitido.' }, 405);
  try {
    const { payload } = await jwtVerify(req.headers.get('x-admin-token') || '', signingKey, { issuer: 'acioli-deliveries', audience: 'delivery-admin', algorithms: ['HS256'] });
    if (payload.role !== 'delivery-admin') throw new Error('Invalid role');
  } catch {
    return response({ error: 'Sua sessão expirou. Entre novamente no painel; o rascunho local será mantido.', code: 'ADMIN_SESSION_EXPIRED' }, 401);
  }
  try {
    const body = await req.json();
    if (body.action === 'list') {
      const { data, error } = await db.from('social_media').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return response({ posts: await Promise.all(data.map(withUrls)) });
    }
    if (body.action === 'upload') {
      if (!uuid.test(body.id || '') || !formats.includes(body.format) || !extensions[body.mime]) return response({ error: 'Arquivo inválido. Use JPG, PNG, WebP, MP4 ou WebM.' }, 400);
      const path = `${body.id}/${body.format}-${crypto.randomUUID()}.${extensions[body.mime]}`;
      const { data, error } = await db.storage.from('social-media').createSignedUploadUrl(path);
      if (error) throw error;
      return response({ path, token: data.token });
    }
    if (body.action === 'save') {
      const post = body.post;
      if (!post || !uuid.test(post.id || '') || typeof post.title !== 'string' || !post.title.trim() || post.title.length > 180 || typeof post.caption !== 'string' || post.caption.length > 20000 || !post.assets || typeof post.assets !== 'object' || Array.isArray(post.assets)) return response({ error: 'Preencha o título e revise os dados.' }, 400);
      const assets: Record<string, any> = {};
      for (const [format, asset] of Object.entries(post.assets) as [string, any][]) {
        if (!formats.includes(format) || !asset || !extensions[asset.mime] || typeof asset.path !== 'string' || !new RegExp(`^${post.id}/${format}-[0-9a-f-]{36}\\.${extensions[asset.mime]}$`, 'i').test(asset.path) || asset.width !== 1080 || asset.height !== (format === 'feed' ? 1350 : 1920) || !Number.isInteger(asset.size) || asset.size < 1 || asset.size > 52428800 || typeof asset.fileName !== 'string' || !asset.fileName || asset.fileName.length > 255) return response({ error: 'Confira os arquivos: Feed 1080 × 1350 e Story 1080 × 1920, até 50 MB cada.' }, 400);
        assets[format] = { path: asset.path, mime: asset.mime, width: asset.width, height: asset.height, size: asset.size, fileName: asset.fileName };
      }
      if (!Object.keys(assets).length) return response({ error: 'Adicione pelo menos uma mídia de Feed ou Story.' }, 400);
      const { data, error } = await db.from('social_media').upsert({ id: post.id, title: post.title.trim(), caption: post.caption, assets, updated_at: new Date().toISOString() }).select().single();
      if (error) throw error;
      console.info('[social-media] Mídias salvas', { id: post.id });
      return response({ post: await withUrls(data) });
    }
    if (body.action === 'delete') {
      if (!uuid.test(body.id || '')) return response({ error: 'Publicação inválida.' }, 400);
      const { error } = await db.from('social_media').delete().eq('id', body.id);
      if (error) throw error;
      const { data: files, error: listError } = await db.storage.from('social-media').list(body.id, { limit: 1000 });
      if (listError) console.warn('[social-media] Falha ao listar arquivos para limpeza', listError.message);
      if (files?.length) {
        const { error: cleanupError } = await db.storage.from('social-media').remove(files.map(file => `${body.id}/${file.name}`));
        if (cleanupError) console.warn('[social-media] Falha ao limpar arquivos', cleanupError.message);
      }
      console.info('[social-media] Publicação excluída', { id: body.id });
      return response({ success: true });
    }
    return response({ error: 'Operação inválida.' }, 400);
  } catch (error) {
    console.error('[social-media] Falha na operação', { message: error instanceof Error ? error.message : String(error) });
    return response({ error: error instanceof SyntaxError ? 'Requisição inválida.' : 'Não foi possível concluir a operação. Seu rascunho local foi mantido.' }, error instanceof SyntaxError ? 400 : 500);
  }
});
