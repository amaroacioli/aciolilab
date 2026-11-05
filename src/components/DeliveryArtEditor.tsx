import { useRef } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Instagram, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClientDelivery, DeliveryItem } from '@/lib/client-deliveries';
import { emptyInstagramProfile, inspectAvatar } from '@/lib/delivery-art';
import { inspectSocialFile, SocialFormat, socialFormats } from '@/lib/social-media';
import DeliveryImage from '@/components/DeliveryImage';
import InstagramPreviewButton from '@/components/InstagramDeliveryPreview';
import InstagramConnection from '@/components/InstagramConnection';

const field = 'border-white/10 bg-[#0d1014] text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#b7dca0]/50';
interface Props { draft: ClientDelivery; onChange: (draft: ClientDelivery) => void; onReading: (reading: boolean) => void; publishing: boolean }
export default function DeliveryArtEditor({ draft, onChange, onReading, publishing }: Props) {
  const latest = useRef(draft);
  latest.current = draft;
  const locked = useRef(publishing);
  locked.current = publishing;
  const profile = draft.instagram || emptyInstagramProfile();
  const updateItem = (id: string, values: Partial<DeliveryItem>) => { const current = latest.current; onChange({ ...current, items: current.items.map(item => item.id === id ? { ...item, ...values } : item) }); };
  const select = async (file?: File, item?: DeliveryItem, format?: SocialFormat) => {
    if (!file) return;
    onReading(true);
    try {
      if (item && format) {
        if (!file.type.startsWith('image/')) throw new Error('Para artes, envie uma imagem JPG, PNG ou WebP. Vídeos têm seu próprio tipo de entrega.');
        const asset = await inspectSocialFile(file, format);
        updateItem(item.id, { artwork: { ...item.artwork, [format]: asset } });
      } else {
        const avatar = await inspectAvatar(file);
        const current = latest.current;
        onChange({ ...current, instagram: { ...(current.instagram || emptyInstagramProfile()), avatar } });
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível abrir a imagem.'); }
    finally { onReading(false); }
  };
  const move = (index: number, direction: number) => {
    const items = [...draft.items];
    [items[index], items[index + direction]] = [items[index + direction], items[index]];
    onChange({ ...draft, items });
  };
  return <div className="space-y-6">
    <section className="rounded-xl border border-[#b7dca0]/20 bg-[#b7dca0]/5 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-medium"><Instagram size={16} className="text-[#b7dca0]" /> Perfil do Instagram do cliente</h3><InstagramPreviewButton delivery={draft} /></div>
      <InstagramConnection deliveryId={draft.id} snapshot={profile.connectedFeed} onSnapshot={connectedFeed => { if (locked.current) return; const current = latest.current; const saved = current.instagram || emptyInstagramProfile(); onChange({ ...current, instagram: { ...saved, handle: saved.handle || connectedFeed?.username || '', connectedFeed } }); }} />
      <p className="mb-4 text-xs leading-6 text-zinc-400">O @, a foto, o nome e a bio abaixo personalizam a simulação e ficam salvos nesta entrega. A conexão oficial fornece as imagens dos posts recentes; as novas artes aparecem primeiro na grade.</p>
      <div className="mb-4 flex items-center gap-4"><DeliveryImage asset={profile.avatar} alt="Foto do perfil do cliente" className="h-16 w-16 shrink-0 rounded-full object-cover" /><div className="min-w-0 flex-1"><Label htmlFor="delivery-avatar" className="text-xs">Foto de perfil · até 5 MB</Label><Input id="delivery-avatar" type="file" accept="image/jpeg,image/png,image/webp" className={`${field} mt-2 h-auto py-2 file:text-zinc-400`} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void select(file); }} /></div>{profile.avatar && <Button type="button" variant="ghost" size="icon" aria-label="Remover foto de perfil" onClick={() => onChange({ ...draft, instagram: { ...profile, avatar: undefined } })}><Trash2 size={15} /></Button>}</div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="instagram-handle">@ do perfil</Label><Input id="instagram-handle" className={field} value={profile.handle} maxLength={30} placeholder="studio.aurora" onChange={event => onChange({ ...draft, instagram: { ...profile, handle: event.target.value.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '') } })} /></div><div className="space-y-2"><Label htmlFor="instagram-name">Nome exibido</Label><Input id="instagram-name" className={field} value={profile.name} maxLength={120} placeholder={draft.client || 'Studio Aurora'} onChange={event => onChange({ ...draft, instagram: { ...profile, name: event.target.value } })} /></div></div>
      <div className="mt-4 space-y-2"><Label htmlFor="instagram-bio">Bio</Label><Textarea id="instagram-bio" className={field} value={profile.bio} rows={3} maxLength={500} placeholder="Como o perfil do cliente se apresenta..." onChange={event => onChange({ ...draft, instagram: { ...profile, bio: event.target.value } })} /></div>
    </section>
    <section>
      <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium">Artes da entrega</h3><span className="text-xs text-zinc-500">Feed + Story por criativo</span></div>
      <div className="space-y-4">{draft.items.map((item, index) => item.artwork !== undefined && <div key={item.id} className="rounded-xl border border-white/10 bg-[#0d1014] p-4">
        <div className="mb-4 flex items-center gap-2"><span className="mr-auto flex items-center gap-2 text-xs text-[#b7dca0]"><ImagePlus size={15} /> Arte · Bloco {index + 1}</span><Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} aria-label="Mover arte para cima" onClick={() => move(index, -1)}><ArrowUp size={13} /></Button><Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === draft.items.length - 1} aria-label="Mover arte para baixo" onClick={() => move(index, 1)}><ArrowDown size={13} /></Button><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-red-400" aria-label="Remover arte" onClick={() => onChange({ ...draft, items: draft.items.filter(entry => entry.id !== item.id) })}><Trash2 size={14} /></Button></div>
        <Label htmlFor={`art-title-${item.id}`}>Título da arte *</Label><Input id={`art-title-${item.id}`} className={`${field} mt-2`} value={item.title} maxLength={180} placeholder="Ex.: Lançamento da nova coleção" onChange={event => updateItem(item.id, { title: event.target.value })} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{socialFormats.map(({ key, label, height }) => {
          const asset = item.artwork?.[key];
          return <div key={key} className="rounded-lg border border-white/10 p-3"><div className="mb-3 flex items-center justify-between"><Label htmlFor={`art-${key}-${item.id}`} className="text-xs">{label} · 1080 × {height}px</Label>{asset && <Button type="button" size="icon" variant="ghost" className="h-6 w-6" aria-label={`Remover ${label}`} onClick={() => { const artwork = { ...item.artwork }; delete artwork[key]; updateItem(item.id, { artwork }); }}><Trash2 size={12} /></Button>}</div>{asset && <div className="mx-auto mb-3 max-w-40"><DeliveryImage asset={asset} alt={item.title || label} className={`w-full rounded-lg bg-black object-contain ${key === 'feed' ? 'aspect-[4/5]' : 'aspect-[9/16]'}`} /><p className="mt-2 break-all text-[10px] text-zinc-500">{asset.fileName}</p></div>}<Input id={`art-${key}-${item.id}`} type="file" accept="image/jpeg,image/png,image/webp" className={`${field} h-auto py-2 text-xs file:text-zinc-400`} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void select(file, item, key); }} /></div>;
        })}</div>
        <div className="mt-4 space-y-2"><Label htmlFor={`caption-${item.id}`}>Legenda sugerida</Label><Textarea id={`caption-${item.id}`} className={field} value={item.caption || ''} rows={4} maxLength={20000} placeholder="Legenda, chamada para ação e hashtags..." onChange={event => updateItem(item.id, { caption: event.target.value })} /></div>
        <div className="mt-4 space-y-2"><Label htmlFor={`art-note-${item.id}`} className="text-xs text-zinc-400">Orientação para o cliente</Label><Textarea id={`art-note-${item.id}`} className={field} value={item.description} rows={2} maxLength={20000} placeholder="Explique a proposta ou indique quando usar esta arte." onChange={event => updateItem(item.id, { description: event.target.value })} /></div>
      </div>)}</div>
      <Button type="button" variant="outline" disabled={draft.items.length >= 100} className="mt-4 w-full gap-2 border-[#b7dca0]/30 bg-transparent text-[#b7dca0]" onClick={() => onChange({ ...draft, items: [...draft.items, { id: crypto.randomUUID(), title: '', description: '', caption: '', artwork: {} }] })}><Plus size={16} /> Adicionar arte / criativo</Button>
      <p className="mt-3 text-xs leading-6 text-zinc-500">JPG, PNG ou WebP, até 50 MB por imagem. Cada arte pode ter Feed, Story ou ambos. Os originais são entregues sem recorte ou compressão. A grade da prévia usa a ordem dos blocos e simula o recorte do perfil; abrir o post mostra a imagem completa.</p>
    </section>
  </div>;
}
