import type { SocialAsset } from '@/lib/social-media';

export type DeliveryArtwork = { feed?: SocialAsset; story?: SocialAsset };
export interface InstagramProfile {
  handle: string;
  name: string;
  bio: string;
  avatar?: SocialAsset;
}
export const emptyInstagramProfile = (): InstagramProfile => ({ handle: '', name: '', bio: '' });

export async function inspectAvatar(file: File): Promise<SocialAsset> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) throw new Error('A foto de perfil deve ser JPG, PNG ou WebP de até 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url;
    try { await image.decode(); } catch { throw new Error('Não foi possível abrir a foto de perfil.'); }
    return { file, fileName: file.name, mime: file.type, width: image.naturalWidth, height: image.naturalHeight, size: file.size };
  } finally { URL.revokeObjectURL(url); }
}

export function imagePayload(asset?: SocialAsset) {
  if (!asset) return undefined;
  return { path: asset.path, fileName: asset.fileName, mime: asset.mime, width: asset.width, height: asset.height, size: asset.size };
}
