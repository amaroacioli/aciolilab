import { ClientDelivery, DeliveryItem, listLocalDeliveryDrafts, normalizeSlug, saveLocalDeliveryDraft } from '@/lib/client-deliveries';
import { loadSocialDraft, saveSocialDraft } from '@/lib/social-media';

export async function migrateSocialDraft() {
  const previous = await loadSocialDraft();
  if (!previous || (await listLocalDeliveryDrafts()).some(draft => draft.id === previous.id)) return;
  const artwork: NonNullable<DeliveryItem['artwork']> = {};
  const videos: DeliveryItem[] = [];
  for (const format of ['feed', 'story'] as const) {
    const asset = previous.assets[format];
    if (!asset) continue;
    if (asset.mime.startsWith('image/')) artwork[format] = { ...asset, path: undefined, downloadUrl: undefined };
    else if (asset.file) videos.push({ id: crypto.randomUUID(), title: previous.title || 'Vídeo recuperado', description: previous.caption, video: asset.file, fileName: asset.fileName });
  }
  const hasImages = !!(artwork.feed || artwork.story);
  const items: DeliveryItem[] = hasImages || !videos.length ? [{ id: crypto.randomUUID(), title: previous.title, description: '', caption: previous.caption, artwork }, ...videos] : videos;
  const delivery: ClientDelivery = { id: previous.id, type: hasImages || !videos.length ? 'artwork' : 'video', client: '', title: previous.title, introduction: '', nextSteps: '', slug: `${normalizeSlug(previous.title).slice(0, 60) || 'artes'}-${previous.id.slice(0, 8)}`, published: false, updatedAt: new Date().toISOString(), items };
  await saveLocalDeliveryDraft(delivery);
  await saveSocialDraft(null);
}
