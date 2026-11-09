import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Camera, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DeliveryImage from '@/components/DeliveryImage';
import type { ClientDelivery, DeliveryItem } from '@/lib/client-deliveries';
import { inspectDeliveryPhoto } from '@/lib/delivery-photo';

const fieldClass = 'border-white/10 bg-[#0d1014] text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#b7dca0]/50';

export default function DeliveryPhotoEditor({ draft, onChange, onReading, publishing }: {
  draft: ClientDelivery;
  onChange: (draft: ClientDelivery) => void;
  onReading: (reading: boolean) => void;
  publishing: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const busy = publishing || reading;
  const photos = draft.items.filter(item => item.photo);
  const updateItem = (id: string, changes: Partial<DeliveryItem>) => onChange({ ...draft, items: draft.items.map(item => item.id === id ? { ...item, ...changes } : item) });
  const move = (id: string, offset: number) => {
    const index = draft.items.findIndex(item => item.id === id);
    const other = draft.items.findIndex(item => item.id === photos[photos.findIndex(item => item.id === id) + offset]?.id);
    if (index < 0 || other < 0) return;
    const items = [...draft.items];
    [items[index], items[other]] = [items[other], items[index]];
    onChange({ ...draft, items });
  };
  const addFiles = async (files: FileList | null) => {
    if (!files?.length || busy) return;
    if (draft.items.length + files.length > 100) { toast.error('O limite é 100 blocos por entrega, incluindo as fotos.'); return; }
    setReading(true);
    onReading(true);
    const added: DeliveryItem[] = [];
    const errors: string[] = [];
    try {
      for (const file of Array.from(files)) {
        try {
          const assets = await inspectDeliveryPhoto(file);
          added.push({ id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, '').slice(0, 180), description: '', ...assets });
          onChange({ ...draft, items: [...draft.items, ...added] });
        } catch (error) { errors.push(`${file.name}: ${error instanceof Error && error.name !== 'EncodingError' ? error.message : 'Não foi possível abrir esta foto.'}`); }
      }
      if (added.length) {
        onChange({ ...draft, items: [...draft.items, ...added] });
        toast.success(`${added.length} ${added.length === 1 ? 'foto adicionada' : 'fotos adicionadas'}. Aguarde a confirmação de rascunho salvo.`);
      }
      if (errors.length) toast.error(errors.slice(0, 3).join('\n'), { duration: 8000 });
    } finally { setReading(false); onReading(false); }
  };

  return <section className="space-y-4">
    <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-medium"><Camera size={17} className="text-[#b7dca0]" /> Entrega de fotos</h3><span className="text-xs text-zinc-500">{photos.length} fotos</span></div>
    <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.jpg,.jpeg,.png,.webp,.heic,.heif" className="hidden" disabled={busy} onChange={event => { void addFiles(event.target.files); event.target.value = ''; }} />
    <button type="button" disabled={busy} onClick={() => input.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void addFiles(event.dataTransfer.files); }} className="w-full rounded-xl border border-dashed border-[#b7dca0]/30 bg-[#b7dca0]/5 px-5 py-8 text-center hover:bg-[#b7dca0]/10 disabled:opacity-50">
      {reading ? <Loader2 className="mx-auto mb-3 animate-spin text-[#b7dca0]" /> : <Upload className="mx-auto mb-3 text-[#b7dca0]" />}
      <p className="text-sm">{reading ? 'Preparando fotos e prévias JPG dos HEIC...' : 'Arraste suas fotos ou selecione os arquivos'}</p><p className="mt-2 text-xs text-zinc-500">Seleção múltipla · JPG, PNG, WebP e HEIC/HEIF · Até 50 MB por foto</p>
    </button>
    <p className="text-xs leading-6 text-zinc-500">O download mantém o arquivo original, sem cortes nem compressão. Para HEIC/HEIF, geramos uma prévia JPG para visualizar na galeria e também disponibilizamos essa versão para baixar. A conversão acontece neste aparelho, uma foto por vez. Até 100 blocos por entrega. RAW ainda precisa ser exportado em JPG.</p>
    <div className="grid gap-4 sm:grid-cols-2">{photos.map((item, index) => <article key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1014] p-4">
      <div className="mb-3 flex items-center gap-1"><span className="mr-auto text-xs text-[#b7dca0]">Foto {String(index + 1).padStart(2, '0')}</span>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={busy || index === 0} aria-label="Mover foto para cima" onClick={() => move(item.id, -1)}><ArrowUp size={14} /></Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={busy || index === photos.length - 1} aria-label="Mover foto para baixo" onClick={() => move(item.id, 1)}><ArrowDown size={14} /></Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-red-400" disabled={busy} aria-label="Remover foto" onClick={() => onChange({ ...draft, items: draft.items.filter(entry => entry.id !== item.id) })}><X size={14} /></Button>
      </div>
      <DeliveryImage asset={item.photoPreview || item.photo} alt={item.title} className="aspect-[4/3] w-full rounded-lg bg-black/30 object-contain" />
      <p className="my-3 break-all text-[11px] leading-5 text-zinc-500">{item.photo!.fileName} · {item.photo!.width} × {item.photo!.height}px · {(item.photo!.size / 1024 / 1024).toFixed(1)} MB{item.photo!.path ? ' · Enviada' : ' · Original'}{item.photoPreview ? ' · Prévia JPG disponível' : ''}</p>
      <Label htmlFor={`photo-title-${item.id}`} className="text-xs text-zinc-400">Título da foto *</Label><Input id={`photo-title-${item.id}`} value={item.title} maxLength={180} className={`${fieldClass} mb-3 mt-2`} onChange={event => updateItem(item.id, { title: event.target.value })} />
      <Label htmlFor={`photo-description-${item.id}`} className="text-xs text-zinc-400">Descrição (opcional)</Label><Textarea id={`photo-description-${item.id}`} value={item.description} maxLength={20000} rows={2} className={`${fieldClass} mt-2`} onChange={event => updateItem(item.id, { description: event.target.value })} />
    </article>)}</div>
  </section>;
}
