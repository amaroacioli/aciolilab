import sharp from 'sharp';

const xml = (text: string) => text.replace(/[&<>"']/g, value => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[value]!);

function lines(text: string, limit: number, count: number) {
  const result: string[] = [];
  let current = '';
  for (const word of text.trim().split(/\s+/)) {
    if (current && `${current} ${word}`.length > limit) {
      result.push(current);
      current = word;
    } else current = current ? `${current} ${word}` : word;
  }
  if (current) result.push(current);
  const visible = result.slice(0, count);
  if (result.length > count) visible[count - 1] += '…';
  return visible;
}

export async function deliveryCover(delivery: { title: string; client: string; instagram?: { avatar?: { url?: string } } }) {
  let background = await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#101316' } }).png().toBuffer();
  const avatarUrl = delivery.instagram?.avatar?.url;
  if (avatarUrl) {
    const url = new URL(avatarUrl);
    // Only fetch signed images from our own storage; never arbitrary profile URLs.
    if (url.origin === 'https://wnrmxusdetjgjtaohlkc.supabase.co' && url.pathname.startsWith('/storage/v1/object/sign/client-delivery-images/')) {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'error' });
      if (!response.ok) throw new Error('Não foi possível carregar a foto da capa.');
      const photo = await response.arrayBuffer();
      if (photo.byteLength > 5242880) throw new Error('Foto da capa excede o limite.');
      background = await sharp(Buffer.from(photo), { limitInputPixels: 40000000 })
        .rotate().resize(1200, 630, { fit: 'cover' }).modulate({ saturation: 0.35 })
        .composite([{ input: Buffer.from('<svg width="1200" height="630"><rect width="1200" height="630" fill="#101316" fill-opacity="0.84"/></svg>') }])
        .png().toBuffer();
    }
  }
  const title = lines(delivery.title, 35, 3);
  const client = lines(`Entrega exclusiva para ${delivery.client}`, 65, 2);
  const titleY = 260 - (title.length - 1) * 31;
  const subtitleY = titleY + title.length * 64 + 25;
  const overlay = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <rect x="28" y="28" width="1144" height="574" rx="26" fill="none" stroke="#ffffff" stroke-opacity="0.12"/>
    <path d="M88 132h54" stroke="#b7dca0" stroke-width="3"/>
    <text x="88" y="104" fill="#b7dca0" font-family="sans-serif" font-size="16" letter-spacing="5">ENTREGA EXCLUSIVA</text>
    ${title.map((line, i) => `<text x="88" y="${titleY + i * 64}" fill="#f5f5f2" font-family="sans-serif" font-size="52" font-weight="400">${xml(line)}</text>`).join('')}
    ${client.map((line, i) => `<text x="90" y="${subtitleY + i * 32}" fill="#c0c6c1" font-family="sans-serif" font-size="25">${xml(line)}</text>`).join('')}
    <text x="88" y="548" fill="#b7dca0" font-family="sans-serif" font-size="17" letter-spacing="4">ACIOLI.LAB</text>
  </svg>`;
  return sharp(background).composite([{ input: Buffer.from(overlay) }]).jpeg({ quality: 88 }).toBuffer();
}
