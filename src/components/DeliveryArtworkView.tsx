import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DeliveryItem } from '@/lib/client-deliveries';
import { SocialAsset, socialFormats } from '@/lib/social-media';
import DeliveryImage, { useDeliveryImageUrl } from '@/components/DeliveryImage';

function ArtworkFile({ asset, format, title }: { asset: SocialAsset; format: 'feed' | 'story'; title: string }) {
  const url = useDeliveryImageUrl(asset);
  return <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="mb-4 text-xs font-medium text-[#b7dca0]">{format === 'feed' ? 'Feed · 1080 × 1350' : 'Story · 1080 × 1920'}</p><div className="mx-auto max-w-[280px]"><DeliveryImage asset={asset} alt={title} className={`w-full rounded-lg bg-black object-contain ${format === 'feed' ? 'aspect-[4/5]' : 'aspect-[9/16]'}`} /></div>{url ? <Button variant="outline" asChild className="mt-4 w-full gap-2 border-white/10 bg-transparent"><a href={asset.file ? url : asset.downloadUrl || url} download={asset.fileName} rel="noopener noreferrer"><Download size={15} /> Baixar {format === 'feed' ? 'Feed' : 'Story'} original</a></Button> : <Button variant="outline" disabled className="mt-4 w-full border-white/10 bg-transparent">Preparando arquivo...</Button>}</div>;
}
export default function DeliveryArtworkView({ item }: { item: DeliveryItem }) {
  const copy = async () => {
    try { await navigator.clipboard.writeText(item.caption || ''); toast.success('Legenda copiada!'); }
    catch { window.prompt('Copie a legenda sugerida:', item.caption || ''); }
  };
  return <div className="space-y-5"><div className="grid items-start gap-4 sm:grid-cols-2">{socialFormats.map(({ key }) => item.artwork?.[key] && <ArtworkFile key={key} asset={item.artwork[key]} format={key} title={item.title} />)}</div>{item.caption && <div className="rounded-xl border border-[#b7dca0]/20 bg-[#b7dca0]/5 p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-medium text-[#b7dca0]">Legenda sugerida</h3><Button type="button" size="sm" variant="outline" className="gap-2 border-white/10 bg-transparent text-xs" onClick={copy}><Copy size={13} /> Copiar legenda</Button></div><p className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">{item.caption}</p></div>}</div>;
}
