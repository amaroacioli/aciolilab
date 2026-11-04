import { supabase } from '@/integrations/supabase/client';

export interface DeliveryItem {
  id: string;
  title: string;
  description: string;
  video?: Blob;
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

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
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
      try { detail = await error.context.json(); } catch { /* A network failure may not contain JSON. */ }
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

// Preserve deliveries created before online publishing was available.
function localDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('acioli-deliveries', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('deliveries', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function localDeliveries(): Promise<ClientDelivery[]> {
  const db = await localDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deliveries', 'readonly');
    const operation = tx.objectStore('deliveries').getAll();
    operation.onsuccess = () => resolve(operation.result.map((delivery: ClientDelivery) => ({ ...delivery, slug: delivery.slug || `${normalizeSlug(delivery.client).slice(0, 71).replace(/-$/, '') || 'cliente'}-${delivery.id.slice(0, 8)}`, published: false, localOnly: true })));
    operation.onerror = () => reject(operation.error);
    tx.oncomplete = () => db.close();
  });
}
async function removeLocal(id: string): Promise<void> {
  const db = await localDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deliveries', 'readwrite');
    tx.objectStore('deliveries').delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

export async function listDeliveries(): Promise<ClientDelivery[]> {
  const { deliveries } = await request<{ deliveries: ClientDelivery[] }>({ action: 'list' });
  const local = await localDeliveries();
  return [...deliveries, ...local.filter(entry => !deliveries.some(remote => remote.id === entry.id))].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveDelivery(delivery: ClientDelivery, onProgress?: (message: string) => void): Promise<ClientDelivery> {
  const items: DeliveryItem[] = [];
  for (const [index, item] of delivery.items.entries()) {
    if (item.video) {
      if (item.video.size > MAX_VIDEO_BYTES) throw new Error(`${item.fileName || item.title}: o limite é 50 MB por vídeo.`);
      onProgress?.(`Enviando vídeo ${index + 1} de ${delivery.items.length}...`);
      const extension = /\.mov$/i.test(item.fileName || '') || /quicktime/i.test(item.video.type) ? 'mov' : item.video.type === 'video/webm' ? 'webm' : item.video.type === 'video/ogg' ? 'ogg' : 'mp4';
      const { path, token } = await request<{ path: string; token: string }>({ action: 'upload', id: delivery.id, extension });
      const contentType = { mov: 'video/quicktime', mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg' }[extension];
      const { error } = await supabase.storage.from('client-delivery-videos').uploadToSignedUrl(path, token, item.video, { contentType });
      if (error) throw new Error(`Falha ao enviar ${item.fileName || item.title}: ${error.message}`);
      items.push({ id: item.id, title: item.title, description: item.description, videoPath: path, fileName: item.fileName, videoSize: item.video.size });
    } else {
      items.push({ id: item.id, title: item.title, description: item.description, videoPath: item.videoPath, fileName: item.fileName, videoSize: item.videoSize });
    }
  }
  onProgress?.(delivery.published ? 'Publicando página...' : 'Salvando rascunho...');
  const { delivery: saved } = await request<{ delivery: ClientDelivery }>({ action: 'save', delivery: { ...delivery, items, localOnly: undefined } });
  await removeLocal(delivery.id);
  return saved;
}

export async function deleteDelivery(id: string) {
  await request({ action: 'delete', id });
  await removeLocal(id);
}
export async function unpublishDelivery(id: string) { await request({ action: 'unpublish', id }); }
export async function getPublicDelivery(slug: string) {
  const { delivery } = await request<{ delivery: ClientDelivery }>({ action: 'public', slug });
  return delivery;
}
