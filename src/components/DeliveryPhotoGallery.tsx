import { useState } from 'react';
import { Camera, Download, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DeliveryImage, { useDeliveryImageUrl } from '@/components/DeliveryImage';
import type { DeliveryItem } from '@/lib/client-deliveries';
import type { SocialAsset } from '@/lib/social-media';

function PhotoDownload({ photo, label = 'Baixar original' }: { photo: SocialAsset; label?: string }) {
  const url = useDeliveryImageUrl(photo);
  return <Button variant="outline" size="sm" disabled={!url} className="gap-2 border-white/10 bg-transparent text-xs" asChild={!!url}>{url ? <a href={photo.file ? url : photo.downloadUrl || url} download={photo.fileName} rel="noopener noreferrer"><Download size={14} />{label}</a> : <span>Preparando foto...</span>}</Button>;
}

function Downloads({ item }: { item: DeliveryItem }) {
  return <div className="flex flex-wrap gap-2"><PhotoDownload photo={item.photo!} label={item.photoPreview ? 'Baixar original HEIC/HEIF' : 'Baixar original'} />{item.photoPreview && <PhotoDownload photo={item.photoPreview} label="Baixar JPG" />}</div>;
}

export default function DeliveryPhotoGallery({ items }: { items: DeliveryItem[] }) {
  const [selected, setSelected] = useState<DeliveryItem | null>(null);
  const photos = items.filter(item => item.photo);
  if (!photos.length) return null;
  return <section className="rounded-2xl border border-white/10 bg-[#111419] p-5 md:p-8">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
      <div><p className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#b7dca0]"><Camera size={14} /> Sua galeria</p><h2 className="text-2xl font-medium">Fotos preparadas para você.</h2><p className="mt-3 text-xs leading-6 text-zinc-500">Toque em uma foto para ampliar. O download original mantém o arquivo sem cortes nem compressão. Fotos HEIC/HEIF são exibidas em JPG e oferecem as duas versões para baixar.</p></div>
      <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-zinc-400">{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</span>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{photos.map(item => <article key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0d10]">
      <button type="button" onClick={() => setSelected(item)} className="group relative block w-full" aria-label={`Ampliar ${item.title}`}><DeliveryImage asset={item.photoPreview || item.photo} alt={item.title} className="aspect-[4/3] w-full bg-black/30 object-contain" /><span className="absolute bottom-3 right-3 rounded-lg bg-black/60 p-2 text-white transition-colors group-hover:bg-black/80"><Expand size={15} /></span></button>
      <div className="space-y-3 p-4"><h3 className="break-words text-sm font-medium">{item.title}</h3>{item.description && <p className="whitespace-pre-wrap text-xs leading-6 text-zinc-400">{item.description}</p>}<p className="text-[11px] text-zinc-500">{item.photo!.width} × {item.photo!.height}px · {(item.photo!.size / 1024 / 1024).toFixed(1)} MB</p><Downloads item={item} /></div>
    </article>)}</div>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className="max-h-[94vh] max-w-5xl overflow-y-auto border-white/10 bg-[#111419] p-5 text-zinc-100">
        <DialogHeader><DialogTitle className="pr-8 font-medium">{selected?.title}</DialogTitle></DialogHeader>
        {selected?.photo && <><DeliveryImage asset={selected.photoPreview || selected.photo} alt={selected.title} className="max-h-[70vh] w-full rounded-lg bg-black/40 object-contain" /><div className="flex flex-wrap items-center justify-between gap-4"><p className="break-all text-xs text-zinc-500">{selected.photo.fileName}</p><Downloads key={selected.id} item={selected} /></div>{selected.description && <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-400">{selected.description}</p>}</>}
      </DialogContent>
    </Dialog>
  </section>;
}
