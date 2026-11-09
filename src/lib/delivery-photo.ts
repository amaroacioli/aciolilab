import type { SocialAsset } from '@/lib/social-media';

export async function inspectDeliveryPhoto(file: File): Promise<{ photo: SocialAsset; photoPreview?: SocialAsset }> {
  const heic = /^image\/(heic|heif)(-sequence)?$/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if ((!heic && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) || !file.size || file.size > 50 * 1024 * 1024 || file.name.length > 255) {
    throw new Error('Use JPG, PNG, WebP ou HEIC de até 50 MB.');
  }
  const mime = heic ? (/\.heif$/i.test(file.name) || /^image\/heif/i.test(file.type) ? 'image/heif' : 'image/heic') : file.type;
  const original = file.type === mime ? file : file.slice(0, file.size, mime);
  let display: Blob = original;
  if (heic) {
    try {
      const { heicTo } = await import('heic-to/csp');
      display = await heicTo({ blob: original, type: 'image/jpeg', quality: 0.9 });
    } catch {
      throw new Error('Não foi possível gerar a prévia deste HEIC. Tente novamente neste navegador ou em um computador. O arquivo original no seu aparelho não foi alterado.');
    }
    if (!display.size || display.size > 50 * 1024 * 1024) throw new Error('A prévia JPG excedeu o limite de 50 MB. Exporte uma versão menor desta foto.');
  }
  const url = URL.createObjectURL(display);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
    return {
      photo: { file: original, fileName: file.name, mime, size: original.size, ...dimensions },
      ...(heic ? { photoPreview: { file: display, fileName: `${file.name.replace(/\.[^.]+$/, '').slice(0, 240)}-preview.jpg`, mime: 'image/jpeg', size: display.size, ...dimensions } } : {}),
    };
  } finally { URL.revokeObjectURL(url); }
}
