import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { deliveryCover } from './delivery-cover';

const supabase = createClient(
  'https://wnrmxusdetjgjtaohlkc.supabase.co',
  'sb_publishable_vU_omXTjVZAcGVAZlKhwWg_YlIp_72X',
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);
const siteOrigin = 'https://www.aciolilab.com.br';
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]!);

interface PreviewRequest {
  query: { slug?: string | string[]; previewImage?: string | string[] };
}
interface PreviewResponse {
  setHeader(name: string, value: string): void;
  status(code: number): PreviewResponse;
  send(body: string | Buffer): void;
}

export default async function deliveryPreview(req: PreviewRequest, res: PreviewResponse) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  const slug = req.query.slug;
  if (typeof slug !== 'string' || !/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(slug)) {
    res.status(404).send('Entrega indisponível');
    return;
  }
  try {
    const { data, error } = await supabase.functions.invoke('client-deliveries', {
      body: { action: 'public', slug },
    });
    if (error || !data?.delivery) {
      res.status(404).send('Entrega indisponível');
      return;
    }
    const delivery = data.delivery;
    if (req.query.previewImage === '1') {
      const cover = await deliveryCover(delivery);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', String(cover.length));
      res.status(200).send(cover);
      return;
    }
    const title = escapeHtml(delivery.title);
    const description = escapeHtml(`Entrega exclusiva para ${delivery.client}`);
    const canonical = `${siteOrigin}/entregas/${slug}`;
    const image = escapeHtml(`${canonical}?previewImage=1&v=${encodeURIComponent(delivery.updatedAt || '1')}`);
    const tags = `<title>${title}</title>
<meta name="robots" content="noindex, nofollow, noarchive" />
<meta name="description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:secure_url" content="${image}" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${title} — ${description}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />`;
    // Serve the built React page with metadata already present, regardless of user-agent.
    const shell = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8');
    const html = shell
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
      .replace(/<meta\b[^>]*(?:property|name)=["'](?:og:[^"']*|twitter:[^"']*|description|robots)["'][^>]*>/gi, '')
      .replace('</head>', `${tags}\n</head>`);
    res.status(200).send(html);
  } catch (error) {
    console.error('[delivery-preview] Falha ao carregar prévia', error);
    res.status(502).send('Não foi possível carregar a entrega. Tente novamente.');
  }
}
