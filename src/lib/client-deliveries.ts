import { supabase } from '@/integrations/supabase/client';
import { prepareDeliveryVideo, releaseVideoCompressor } from '@/lib/video-compression';
import { DeliveryArtwork, InstagramProfile, imagePayload } from '@/lib/delivery-art';
import type { SocialAsset } from '@/lib/social-media';

export interface DeliveryItem {
  id: string;
  title: string;
  description: string;
  artwork?: DeliveryArtwork;
  photo?: SocialAsset;
  photoPreview?: SocialAsset;
  caption?: string;
  video?: Blob;
  videoPrepared?: boolean;
  videoPath?: string;
  videoUrl?: string;
  videoSize?: number;
  fileName?: string;
}

export interface ClientDelivery {
  id: string;
  client: string;
  title: string;
  slug: string;
  introduction: string;
  nextSteps: string;
  updatedAt: string;
  published: boolean;
  localOnly?: boolean;
  type?: 'video' | 'artwork' | 'photo';
  instagram?: InstagramProfile;
  items: DeliveryItem[];
}

export const hasVideo = (item: DeliveryItem) => !!(item.video || item.videoPath || item.videoUrl);
export const hasArtwork = (item: DeliveryItem) => !!(item.artwork?.feed || item.artwork?.story);
export const hasPhoto = (item: DeliveryItem) => !!item.photo;
export const normalizeSlug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
export const deliveryLink = (delivery: ClientDelivery) => new URL(`/entregas/${delivery.slug}`, window.location.origin).href;
export class DeliverySessionError extends Error {}

async function request<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('client-deliveries', {
    body,
    headers: { 'x-admin-token': sessionStorage.getItem('acioli_delivery_token') || '' },
  });
  if (error) {
    let detail: { error?: string; code?: string } = {};
    if (error.context instanceof Response) {
      try { detail = await error.context.json(); } catch { /* Network failures may not contain JSON. */ }
    }
    if (detail.code === 'ADMIN_SESSION_EXPIRED') {
      sessionStorage.removeItem('acioli_delivery_token');
      sessionStorage.removeItem('acioli_admin_auth');
      throw new DeliverySessionError(detail.error);
    }
    throw new Error(detail.error || 'Não foi possível conectar ao servidor de entregas. Tente novamente.');
  }
  return data as T;
}

export async function loginDeliveryAdmin(username: string, password: string) {
  const { token } = await request<{ token: string }>({ action: 'login', username, password });
  sessionStorage.setItem('acioli_delivery_token', token);
}

function localDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const operation = indexedDB.open('acioli-deliveries', 1);
    operation.onupgradeneeded = () => operation.result.createObjectStore('deliveries', { keyPath: 'id' });
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(new Error('Não foi possível abrir os rascunhos neste navegador. Verifique as permissões de armazenamento.'));
  });
}

// Serialize writes and deletions so an older autosave cannot overwrite newer text or resurrect a published draft.
let localWrites: Promise<unknown> = Promise.resolve();
export function saveLocalDeliveryDraft(delivery: ClientDelivery): Promise<ClientDelivery> {
  const snapshot = { ...delivery, items: delivery.items.map(item => ({ ...item })), localOnly: true, updatedAt: new Date().toISOString() };
  const operation = localWrites.catch(() => undefined).then(async () => {
    const db = await localDatabase();
    return new Promise<ClientDelivery>((resolve, reject) => {
      const tx = db.transaction('deliveries', 'readwrite');
      tx.objectStore('deliveries').put(snapshot);
      tx.oncomplete = () => { db.close(); resolve(snapshot); };
      tx.onabort = () => {
        db.close();
        reject(new Error(tx.error?.name === 'QuotaExceededError' ? 'O navegador está sem espaço para guardar os arquivos. O rascunho mais recente não foi salvo; não feche esta janela.' : 'Não foi possível salvar o rascunho neste navegador. Não feche esta janela e tente salvar novamente.'));
      };
    });
  });
  localWrites = operation;
  return operation;
}

export async function listLocalDeliveryDrafts(): Promise<ClientDelivery[]> {
  await localWrites.catch(() => undefined);
  const db = await localDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deliveries', 'readonly');
    const operation = tx.objectStore('deliveries').getAll();
    operation.onsuccess = () => resolve(operation.result.map((delivery: ClientDelivery) => ({ ...delivery, slug: typeof delivery.slug === 'string' ? delivery.slug : `${normalizeSlug(delivery.client).slice(0, 71).replace(/-$/, '') || 'cliente'}-${delivery.id.slice(0, 8)}`, published: delivery.published === true, localOnly: true })));
    operation.onerror = () => reject(new Error('Não foi possível recuperar os rascunhos deste navegador.'));
    tx.oncomplete = () => db.close();
  });
}

export function discardLocalDeliveryDraft(id: string): Promise<void> {
  const operation = localWrites.catch(() => undefined).then(async () => {
    const db = await localDatabase();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('deliveries', 'readwrite');
      tx.objectStore('deliveries').delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(new Error('Não foi possível remover o rascunho local.')); };
    });
  });
  localWrites = operation;
  return operation;
}

export async function listDeliveries(): Promise<ClientDelivery[]> {
  const { deliveries } = await request<{ deliveries: ClientDelivery[] }>({ action: 'list' });
  const local = await listLocalDeliveryDrafts();
  const merged = local.map(draft => {
    const remote = deliveries.find(entry => entry.id === draft.id);
    const refreshAsset = (asset?: SocialAsset, online?: SocialAsset) => asset?.path && online && online.path === asset.path ? { ...asset, url: online.url, downloadUrl: online.downloadUrl } : asset;
    const instagram = draft.instagram ? { ...draft.instagram, avatar: refreshAsset(draft.instagram.avatar, remote?.instagram?.avatar), connectedFeed: remote ? remote.instagram?.connectedFeed : draft.instagram.connectedFeed } : remote?.instagram;
    return { ...draft, instagram, published: remote?.published || false, items: draft.items.map(item => {
      const online = remote?.items.find(entry => entry.id === item.id);
      return { ...item, photo: refreshAsset(item.photo, online?.photo), photoPreview: refreshAsset(item.photoPreview, online?.photoPreview), videoUrl: remote?.items.find(video => video.videoPath && video.videoPath === item.videoPath)?.videoUrl || item.videoUrl, ...(item.artwork ? { artwork: { feed: refreshAsset(item.artwork.feed, online?.artwork?.feed), story: refreshAsset(item.artwork.story, online?.artwork?.story) } } : {}) };
    }) };
  });
  return [...merged, ...deliveries.filter(remote => !local.some(draft => draft.id === remote.id))].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveDelivery(delivery: ClientDelivery, onProgress?: (message: string) => void, signal?: AbortSignal, onCheckpoint?: (changes: Partial<ClientDelivery>) => Promise<void>): Promise<ClientDelivery> {
  const working = delivery.items.map(item => ({ ...item, ...(item.artwork ? { artwork: { ...item.artwork } } : {}) }));
  let instagram = delivery.instagram ? { ...delivery.instagram } : undefined;
  const checkAbort = () => { if (signal?.aborted) throw new DOMException('Processamento cancelado.', 'AbortError'); };
  const uploadImage = async (asset: SocialAsset, format: 'feed' | 'story' | 'avatar' | 'photo') => {
    checkAbort();
    if (!asset.file || asset.path) return asset;
    onProgress?.(`Enviando ${format === 'avatar' ? 'foto do perfil' : format === 'photo' ? `foto ${asset.fileName}` : `arte de ${format}`}...`);
    const { path, token } = await request<{ path: string; token: string }>({ action: 'upload-image', id: delivery.id, format, mime: asset.mime });
    const { error } = await supabase.storage.from('client-delivery-images').uploadToSignedUrl(path, token, asset.file, { contentType: asset.mime });
    if (error) throw new Error(`Falha ao enviar ${asset.fileName}: ${error.message}`);
    return { ...asset, path };
  };
  try {
    if (instagram?.avatar) {
      instagram = { ...instagram, avatar: await uploadImage(instagram.avatar, 'avatar') };
      await onCheckpoint?.({ instagram });
    }
    for (const [index, original] of delivery.items.entries()) {
      checkAbort();
      if (original.photo) {
        working[index] = { ...working[index], photo: await uploadImage(original.photo, 'photo') };
        await onCheckpoint?.({ items: [...working] });
      }
      if (original.photoPreview) {
        working[index] = { ...working[index], photoPreview: await uploadImage(original.photoPreview, 'photo') };
        await onCheckpoint?.({ items: [...working] });
      }
      for (const format of ['feed', 'story'] as const) {
        const asset = working[index].artwork?.[format];
        if (asset) {
          working[index] = { ...working[index], artwork: { ...working[index].artwork, [format]: await uploadImage(asset, format) } };
          await onCheckpoint?.({ items: [...working] });
        }
      }
      if (original.video && !original.videoPath) {
        const label = `Vídeo ${index + 1}/${delivery.items.length}`;
        const prepared = original.videoPrepared ? { video: original.video, fileName: original.fileName || 'video.mp4', originalSize: original.video.size } : await prepareDeliveryVideo(original.video, original.fileName || 'video.mp4', message => onProgress?.(`${label} — ${message}`), signal);
        working[index] = { ...working[index], video: prepared.video, videoPrepared: true, fileName: prepared.fileName, videoSize: prepared.video.size };
        await onCheckpoint?.({ items: [...working] });
        checkAbort();
        const extension = prepared.video.type === 'video/mp4' ? 'mp4' : prepared.video.type === 'video/webm' ? 'webm' : prepared.video.type === 'video/ogg' ? 'ogg' : 'mov';
        onProgress?.(`Enviando vídeo ${index + 1} de ${delivery.items.length} (${(prepared.originalSize / 1024 / 1024).toFixed(1)} → ${(prepared.video.size / 1024 / 1024).toFixed(1)} MB)...`);
        const { path, token } = await request<{ path: string; token: string }>({ action: 'upload', id: delivery.id, extension });
        const { error } = await supabase.storage.from('client-delivery-videos').uploadToSignedUrl(path, token, prepared.video, { contentType: prepared.video.type });
        if (error) throw new Error(`Falha ao enviar ${original.fileName || original.title}: ${error.message}`);
        working[index] = { ...working[index], videoPath: path };
        await onCheckpoint?.({ items: [...working] });
      }
    }
    checkAbort();
    const items = working.map(item => ({ id: item.id, title: item.title, description: item.description, caption: item.caption || '', photo: imagePayload(item.photo), photoPreview: imagePayload(item.photoPreview), videoPath: item.videoPath, fileName: item.fileName, videoSize: item.videoSize, ...(item.artwork ? { artwork: { feed: imagePayload(item.artwork.feed), story: imagePayload(item.artwork.story) } } : {}) }));
    const profile = instagram ? { handle: instagram.handle, name: instagram.name, bio: instagram.bio, avatar: imagePayload(instagram.avatar) } : undefined;
    onProgress?.(delivery.published ? 'Publicando página...' : 'Salvando rascunho online...');
    const { delivery: saved } = await request<{ delivery: ClientDelivery }>({ action: 'save', delivery: { ...delivery, instagram: profile, items, localOnly: undefined } });
    if ((delivery.type && saved.type !== delivery.type) || items.some(item => (item.artwork && !saved.items.find(entry => entry.id === item.id)?.artwork) || (item.photo && saved.items.find(entry => entry.id === item.id)?.photo?.path !== item.photo.path) || (item.photoPreview && saved.items.find(entry => entry.id === item.id)?.photoPreview?.path !== item.photoPreview.path)) || (profile && (['handle', 'name', 'bio'] as const).some(key => profile[key] !== saved.instagram?.[key]))) throw new Error('O serviço de publicação ainda não confirmou as mídias e configurações da entrega. O rascunho foi mantido para não perder seus dados.');
    await discardLocalDeliveryDraft(delivery.id).catch(error => console.warn('[client-deliveries] Página salva, mas a limpeza do rascunho local falhou', error));
    return saved;
  } finally { releaseVideoCompressor(); }
}

export async function deleteDelivery(id: string) {
  await request({ action: 'delete', id });
  await discardLocalDeliveryDraft(id);
}
export async function unpublishDelivery(id: string) {
  await request({ action: 'unpublish', id });
  const local = (await listLocalDeliveryDrafts()).find(draft => draft.id === id);
  if (local) await saveLocalDeliveryDraft({ ...local, published: false });
}
export async function getPublicDelivery(slug: string) {
  const { delivery } = await request<{ delivery: ClientDelivery }>({ action: 'public', slug });
  return delivery;
}
