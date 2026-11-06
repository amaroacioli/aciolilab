import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wnrmxusdetjgjtaohlkc.supabase.co',
  'sb_publishable_vU_omXTjVZAcGVAZlKhwWg_YlIp_72X',
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]!);

interface PreviewRequest {
  query: { slug?: string | string[] };
}
interface PreviewResponse {
  setHeader(name: string, value: string): void;
  status(code: number): PreviewResponse;
  send(body: string): void;
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
    // Reuse the public API so unpublished deliveries remain inaccessible.
    const { data, error } = await supabase.functions.invoke('client-deliveries', {
      body: { action: 'public', slug },
    });
    if (error || !data?.delivery) {
      res.status(404).send('Entrega indisponível');
      return;
    }
    const delivery = data.delivery;
    const title = escapeHtml(`${delivery.title} — ${delivery.client}`);
    const description = escapeHtml(`Confira a entrega de ${delivery.client}.`);
    const avatar = delivery.instagram?.avatar;
    const image = avatar?.url ? escapeHtml(avatar.url) : '';
    const path = `/entregas/${slug}`;
    res.status(200).send(`<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="robots" content="noindex, nofollow, noarchive" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
${image ? `<meta property="og:image" content="${image}" />
<meta property="og:image:secure_url" content="${image}" />
<meta property="og:image:type" content="${escapeHtml(avatar.mime)}" />
<meta property="og:image:width" content="${Number(avatar.width)}" />
<meta property="og:image:height" content="${Number(avatar.height)}" />
<meta property="og:image:alt" content="Foto de ${escapeHtml(delivery.client)}" />` : ''}
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
${image ? `<meta name="twitter:image" content="${image}" />` : ''}
</head><body><h1>${title}</h1><p>${description}</p><a href="${path}">Abrir entrega</a></body></html>`);
  } catch (error) {
    console.error('[delivery-preview] Falha ao carregar prévia', error);
    res.status(502).send('Não foi possível carregar a prévia da entrega.');
  }
}
