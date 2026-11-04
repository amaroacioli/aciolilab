import { supabase } from '@/integrations/supabase/client';
import { prepareDeliveryVideo, releaseVideoCompressor } from '@/lib/video-compression';

export interface DeliveryItem {
  id: string;
  title: string;
  description: string;
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
  items: DeliveryItem[];
}

export const hasVideo = (item: DeliveryItem) => !!(item.video || item.videoPath || item.videoUrl);
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
        reject(new Error(tx.error?.name === 'QuotaExceededError' ? 'O navegador está sem espaço para guardar o vídeo. O rascunho mais recente não foi salvo; não feche esta janela.' : 'Não foi possível salvar o rascunho neste navegador. Não feche esta janela e tente salvar novamente.'));
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
    return { ...draft, published: remote?.published || false, items: draft.items.map(item => ({ ...item, videoUrl: remote?.items.find(video => video.videoPath && video.videoPath === item.videoPath)?.videoUrl || item.videoUrl })) };
  });
  return [...merged, ...deliveries.filter(remote => !local.some(draft => draft.id === remote.id))].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveDelivery(delivery: ClientDelivery, onProgress?: (message: string) => void, signal?: AbortSignal, onCheckpoint?: (items: DeliveryItem[]) => Promise<void>): Promise<ClientDelivery> {
  const items: DeliveryItem[] = [];
  const working = delivery.items.map(item => ({ ...item }));
  const checkAbort = () => { if (signal?.aborted) throw new DOMException('Processamento cancelado.', 'AbortError'); };
  try {
    for (const [index, item] of delivery.items.entries()) {
      checkAbort();
      if (item.video && !item.videoPath) {
        const label = `Vídeo ${index + 1}/${delivery.items.length}`;
        const prepared = item.videoPrepared ? { video: item.video, fileName: item.fileName || 'video.mp4', originalSize: item.video.size } : await prepareDeliveryVideo(item.video, item.fileName || 'video.mp4', message => onProgress?.(`${label} — ${message}`), signal);
        working[index] = { ...item, video: prepared.video, videoPrepared: true, fileName: prepared.fileName, videoSize: prepared.video.size };
        await onCheckpoint?.([...working]);
        checkAbort();
        const extension = prepared.video.type === 'video/mp4' ? 'mp4' : prepared.video.type === 'video/webm' ? 'webm' : prepared.video.type === 'video/ogg' ? 'ogg' : 'mov';
        onProgress?.(`Enviando vídeo ${index + 1} de ${delivery.items.length} (${(prepared.originalSize / 1024 / 1024).toFixed(1)} → ${(prepared.video.size / 1024 / 1024).toFixed(1)} MB)...`);
        const { path, token } = await request<{ path: string; token: string }>({ action: 'upload', id: delivery.id, extension });
        const { error } = await supabase.storage.from('client-delivery-videos').uploadToSignedUrl(path, token, prepared.video, { contentType: prepared.video.type });
        if (error) throw new Error(`Falha ao enviar ${item.fileName || item.title}: ${error.message}`);
        working[index] = { ...working[index], videoPath: path };
        await onCheckpoint?.([...working]);
        items.push({ id: item.id, title: item.title, description: item.description, videoPath: path, fileName: prepared.fileName, videoSize: prepared.video.size });
      } else {
        items.push({ id: item.id, title: item.title, description: item.description, videoPath: item.videoPath, fileName: item.fileName, videoSize: item.videoSize });
      }
    }
    checkAbort();
    onProgress?.(delivery.published ? 'Publicando página...' : 'Salvando rascunho online...');
    const { delivery: saved } = await request<{ delivery: ClientDelivery }>({ action: 'save', delivery: { ...delivery, items, localOnly: undefined } });
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
