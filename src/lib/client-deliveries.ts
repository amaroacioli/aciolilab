export interface DeliveryItem {
  id: string;
  title: string;
  description: string;
  video?: Blob;
  fileName?: string;
}

export interface ClientDelivery {
  id: string;
  client: string;
  title: string;
  introduction: string;
  nextSteps: string;
  updatedAt: string;
  items: DeliveryItem[];
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('acioli-deliveries', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('deliveries', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Não foi possível abrir o armazenamento deste navegador.'));
  });
}

export async function listDeliveries(): Promise<ClientDelivery[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deliveries', 'readonly');
    const request = tx.objectStore('deliveries').getAll();
    request.onsuccess = () => resolve((request.result as ClientDelivery[]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    request.onerror = () => reject(new Error('Não foi possível carregar as entregas.'));
    tx.oncomplete = () => db.close();
  });
}

export async function saveDelivery(delivery: ClientDelivery): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deliveries', 'readwrite');
    tx.objectStore('deliveries').put(delivery);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = () => { db.close(); reject(new Error('Não foi possível salvar. Verifique o espaço disponível no navegador.')); };
    tx.onerror = () => reject(new Error('Falha ao salvar a entrega.'));
  });
}

export async function deleteDelivery(id: string): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deliveries', 'readwrite');
    tx.objectStore('deliveries').delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(new Error('Não foi possível excluir a entrega.'));
  });
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const asDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = () => reject(new Error('Não foi possível preparar o vídeo.'));
  reader.readAsDataURL(blob);
});

export async function exportDelivery(delivery: ClientDelivery) {
  const sections = [];
  for (const [index, item] of delivery.items.entries()) {
    const video = item.video ? `<video controls playsinline preload="metadata" src="${await asDataUrl(item.video)}"></video>` : '';
    const movNotice = item.video && (/\.mov$/i.test(item.fileName || '') || /quicktime/i.test(item.video.type))
      ? '<p style="font-size:12px">Vídeo original MOV do iPhone. Se não reproduzir, abra em Safari com dispositivo compatível. A reprodução de HEVC depende do navegador e do dispositivo.</p>' : '';
    sections.push(`<section><small>ENTREGA ${String(index + 1).padStart(2, '0')}</small><h2>${escapeHtml(item.title)}</h2>${video}${movNotice}<p>${escapeHtml(item.description)}</p></section>`);
  }
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(delivery.title)} — ${escapeHtml(delivery.client)}</title><style>body{margin:0;background:#0b0d10;color:#f4f4f5;font:16px/1.8 system-ui,sans-serif}main{max-width:920px;margin:auto;padding:48px 24px}header{display:flex;justify-content:space-between;border-bottom:1px solid #292d32;padding-bottom:24px}small{color:#b7dca0;letter-spacing:3px;font-size:11px}h1{font-size:clamp(36px,7vw,68px);line-height:1.1;letter-spacing:-2px;margin:24px 0}h2{font-size:28px;line-height:1.3}p{white-space:pre-wrap;color:#b4b8c0;overflow-wrap:anywhere}section{padding:32px;margin:32px 0;border:1px solid #292d32;border-radius:20px;background:#111419}video{width:100%;max-height:600px;border-radius:12px;background:#000}footer{color:#757d88;text-align:center;padding:32px}</style></head><body><main><header><strong>ACIOLI<span style="color:#b7dca0">.</span></strong><small>ESPAÇO DO CLIENTE</small></header><div style="padding:56px 0 16px"><small>PREPARADO PARA ${escapeHtml(delivery.client)}</small><h1>${escapeHtml(delivery.title)}</h1><p>${escapeHtml(delivery.introduction)}</p></div>${sections.join('')}${delivery.nextSteps ? `<section><small>O QUE VEM AGORA</small><h2>Seus próximos passos</h2><p>${escapeHtml(delivery.nextSteps)}</p></section>` : ''}<footer>Feito com intenção. Entregue com cuidado.<br>ACIOLI • EXPERIÊNCIAS DIGITAIS</footer></main></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `entrega-${delivery.client.replace(/[^a-zA-Z0-9À-ÿ_-]/g, '-').slice(0, 60)}.html`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
