import sharp from 'sharp';

export async function deliveryCover(delivery: { instagram?: { avatar?: { url?: string } } }) {
  const background = sharp({ create: { width: 800, height: 800, channels: 3, background: '#101316' } });
  const avatarUrl = delivery.instagram?.avatar?.url;
  if (!avatarUrl) return background.jpeg({ quality: 90 }).toBuffer();

  const url = new URL(avatarUrl);
  if (url.origin !== 'https://wnrmxusdetjgjtaohlkc.supabase.co' || !url.pathname.startsWith('/storage/v1/object/sign/client-delivery-images/')) {
    throw new Error('Endereço inválido para a foto da prévia.');
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'error' });
  if (!response.ok) throw new Error('Não foi possível carregar a foto da prévia.');
  const photo = await response.arrayBuffer();
  if (photo.byteLength > 5242880) throw new Error('Foto da prévia excede o limite.');

  const fitted = await sharp(Buffer.from(photo), { limitInputPixels: 40000000 })
    .rotate()
    .resize(680, 680, { fit: 'contain', background: '#101316' })
    .png().toBuffer();
  const dimmed = await sharp(fitted).composite([{
    input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="680" height="680"><rect width="680" height="680" fill="#101316" fill-opacity="0.35"/></svg>'),
  }]).png().toBuffer();

  return background.composite([{ input: dimmed, gravity: 'centre' }]).jpeg({ quality: 90 }).toBuffer();
}
