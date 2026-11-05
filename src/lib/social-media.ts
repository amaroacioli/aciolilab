import { supabase } from '@/integrations/supabase/client';

export type SocialFormat = 'feed' | 'story';
export const socialFormats: { key: SocialFormat; label: string; height: number }[] = [
  { key: 'feed', label: 'Feed', height: 1350 },
  { key: 'story', label: 'Story', height: 1920 },
];
export interface SocialAsset {
  file?: Blob;
  fileName: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  path?: string;
  url?: string;
  downloadUrl?: string;
}
export interface SocialPost {
  id: string;
  title: string;
  caption: string;
  assets: Partial<Record<SocialFormat, SocialAsset>>;
  updatedAt?: string;
}
export const newSocialPost = (): SocialPost => ({ id: crypto.randomUUID(), title: '', caption: '', assets: {} });

async function request<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('social-media', {
    body, headers: { 'x-admin-token': sessionStorage.getItem('acioli_delivery_token') || '' },
  });
  if (error) {
    let message = 'Não foi possível conectar à biblioteca. Tente novamente.';
    if (error.context instanceof Response) {
      const detail = await error.context.json().catch(() => null);
      if (detail?.error) message = detail.error;
    }
    throw new Error(message);
  }
  return data as T;
}
export async function listSocialPosts() {
  return (await request<{ posts: SocialPost[] }>({ action: 'list' })).posts;
}
export async function deleteSocialPost(id: string) {
  await request({ action: 'delete', id });
}
export async function saveSocialPost(post: SocialPost, checkpoint: (post: SocialPost) => Promise<void>, progress: (message: string) => void) {
  const working = { ...post, assets: { ...post.assets } };
  for (const { key, label } of socialFormats) {
    const asset = working.assets[key];
    if (!asset?.file || asset.path) continue;
    progress(`Enviando ${label}...`);
    const { path, token } = await request<{ path: string; token: string }>({ action: 'upload', id: post.id, format: key, mime: asset.mime });
    const { error } = await supabase.storage.from('social-media').uploadToSignedUrl(path, token, asset.file, { contentType: asset.mime });
    if (error) throw new Error(`Falha ao enviar ${label}: ${error.message}`);
    working.assets = { ...working.assets, [key]: { ...asset, path } };
    await checkpoint({ ...working });
  }
  progress('Salvando título e legenda...');
  const assets = Object.fromEntries(Object.entries(working.assets).map(([format, asset]) => [format, {
    path: asset.path, mime: asset.mime, width: asset.width, height: asset.height, size: asset.size, fileName: asset.fileName,
  }]));
  return (await request<{ post: SocialPost }>({ action: 'save', post: { id: post.id, title: post.title, caption: post.caption, assets } })).post;
}

export async function inspectSocialFile(file: File, format: SocialFormat): Promise<SocialAsset> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(file.type)) throw new Error('Use JPG, PNG, WebP, MP4 ou WebM.');
  if (!file.size || file.size > 50 * 1024 * 1024) throw new Error('Cada arquivo deve ter até 50 MB.');
  const url = URL.createObjectURL(file);
  const expectedHeight = format === 'feed' ? 1350 : 1920;
  let width = 0;
  let height = 0;
  try {
    if (file.type.startsWith('image/')) {
      const image = new Image();
      image.src = url;
      try { await image.decode(); } catch { throw new Error('Não foi possível abrir a imagem. Envie um JPG, PNG ou WebP válido.'); }
      width = image.naturalWidth; height = image.naturalHeight;
      if (width !== 1080 || height !== expectedHeight) {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = expectedHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Não foi possível ajustar a imagem neste navegador.');
        const scale = Math.min(canvas.width / width, canvas.height / height);
        const fittedWidth = width * scale;
        const fittedHeight = height * scale;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, (canvas.width - fittedWidth) / 2, (canvas.height - fittedHeight) / 2, fittedWidth, fittedHeight);
        const normalized = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível gerar a imagem ajustada. Tente novamente.')), 'image/png');
        });
        const fileName = `${file.name.replace(/\.[^.]+$/, '')}-${format}-1080x${expectedHeight}.png`;
        return { file: normalized, fileName, mime: normalized.type, width: 1080, height: expectedHeight, size: normalized.size };
      }
    } else {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const video = document.createElement('video');
        const cleanup = () => { clearTimeout(timeout); video.onloadedmetadata = null; video.onerror = null; video.removeAttribute('src'); video.load(); };
        const timeout = setTimeout(() => { cleanup(); reject(new Error('Não foi possível ler o vídeo. Use MP4/H.264 ou WebM compatível com este navegador.')); }, 15000);
        video.preload = 'metadata';
        video.onloadedmetadata = () => { const result = { width: video.videoWidth, height: video.videoHeight }; cleanup(); resolve(result); };
        video.onerror = () => { cleanup(); reject(new Error('Não foi possível abrir o vídeo. Use MP4/H.264 ou WebM.')); };
        video.src = url;
      });
      width = dimensions.width; height = dimensions.height;
    }
  } finally { URL.revokeObjectURL(url); }
  if (width !== 1080 || height !== expectedHeight) throw new Error(`O vídeo tem ${width} × ${height}px. Para ${format === 'feed' ? 'Feed' : 'Story'}, envie exatamente 1080 × ${expectedHeight}px.`);
  return { file, fileName: file.name, mime: file.type, width, height, size: file.size };
}

function openDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('acioli-social-draft', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('draft');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Não foi possível abrir o rascunho local. Verifique as permissões do navegador.'));
  });
}
let draftWrites: Promise<unknown> = Promise.resolve();
export function saveSocialDraft(post: SocialPost | null): Promise<void> {
  const snapshot = post ? { ...post, assets: { ...post.assets } } : null;
  const operation = draftWrites.catch(() => undefined).then(async () => {
    const db = await openDraftDatabase();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('draft', 'readwrite');
      tx.objectStore('draft').put(snapshot, 'active');
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(new Error('Não foi possível salvar o rascunho local. Verifique o espaço disponível e não feche esta página.')); };
    });
  });
  draftWrites = operation;
  return operation;
}
export async function loadSocialDraft(): Promise<SocialPost | null> {
  await draftWrites.catch(() => undefined);
  const db = await openDraftDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('draft', 'readonly');
    const request = tx.objectStore('draft').get('active');
    tx.oncomplete = () => { db.close(); resolve(request.result || null); };
    tx.onabort = () => { db.close(); reject(new Error('Não foi possível recuperar o rascunho local.')); };
  });
}
