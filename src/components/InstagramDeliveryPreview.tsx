import { useState } from 'react';
import { ArrowLeft, Bookmark, ChevronDown, Grid3X3, Heart, Instagram, MessageCircle, MoreHorizontal, Send, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClientDelivery, DeliveryItem } from '@/lib/client-deliveries';
import DeliveryImage from '@/components/DeliveryImage';

export function InstagramDeliveryPreview({ delivery }: { delivery: ClientDelivery }) {
  const [selected, setSelected] = useState<DeliveryItem | null>(null);
  const [mode, setMode] = useState<'feed' | 'story'>('feed');
  const profile = delivery.instagram;
  const handle = profile?.handle || 'perfil.do.cliente';
  const name = profile?.name || delivery.client || 'Nome do cliente';
  const feed = delivery.items.filter(item => item.artwork?.feed);
  const stories = delivery.items.filter(item => item.artwork?.story);
  const open = (item: DeliveryItem, format: 'feed' | 'story') => { setSelected(item); setMode(format); };
  return <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[24px] border border-zinc-200 bg-white text-zinc-950 shadow-xl">
    <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><span className="flex min-w-0 items-center gap-1 truncate text-lg font-semibold">{handle}<ChevronDown size={15} /></span><Instagram size={22} /></div>
    {selected ? <>
      <button type="button" onClick={() => setSelected(null)} className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-zinc-600"><ArrowLeft size={15} /> Voltar ao perfil</button>
      <div className="flex items-center gap-3 px-4 pb-3"><DeliveryImage asset={profile?.avatar} alt="Foto do perfil" className="h-9 w-9 shrink-0 rounded-full object-cover" /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{handle}</span><MoreHorizontal size={20} /></div>
      <DeliveryImage asset={selected.artwork?.[mode]} alt={selected.title} className={`w-full object-contain ${mode === 'feed' ? 'aspect-[4/5]' : 'aspect-[9/16] max-h-[65vh] bg-zinc-950'}`} />
      {mode === 'feed' && <div className="flex items-center gap-4 px-4 py-3" aria-hidden="true"><Heart size={24} /><MessageCircle size={24} /><Send size={23} /><Bookmark size={23} className="ml-auto" /></div>}
      <div className="max-h-56 overflow-y-auto px-4 pb-5 text-sm leading-6"><p className="mb-1 font-semibold">{selected.title}</p><p className="whitespace-pre-wrap break-words"><span className="mr-2 font-semibold">{handle}</span>{selected.caption || 'Sem legenda sugerida.'}</p></div>
    </> : <>
      <div className="px-5 py-5"><div className="flex items-center gap-6"><div className="shrink-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]"><DeliveryImage asset={profile?.avatar} alt="Foto do perfil do cliente" className="h-[76px] w-[76px] rounded-full border-[3px] border-white object-cover" /></div><div className="flex flex-1 justify-around gap-2 text-center"><div><p className="font-semibold">{feed.length}</p><p className="text-[11px]">publicações</p></div><div><p className="font-semibold">—</p><p className="text-[11px]">seguidores</p></div><div><p className="font-semibold">—</p><p className="text-[11px]">seguindo</p></div></div></div><p className="mt-4 text-sm font-semibold">{name}</p>{profile?.bio && <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5">{profile.bio}</p>}<div aria-hidden="true" className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-semibold"><span className="rounded-lg bg-zinc-100 py-2">Seguir</span><span className="rounded-lg bg-zinc-100 py-2">Mensagem</span></div></div>
      {!!stories.length && <div className="flex gap-4 overflow-x-auto px-5 pb-5">{stories.map(item => <button type="button" key={item.id} className="w-16 shrink-0 text-center" onClick={() => open(item, 'story')} aria-label={`Ver Story: ${item.title}`}><div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]"><DeliveryImage asset={item.artwork?.story} alt={item.title} className="h-[60px] w-[60px] rounded-full border-[3px] border-white object-cover" /></div><p className="mt-1 truncate text-[10px]">{item.title}</p></button>)}</div>}
      <div className="flex items-center justify-center border-y border-zinc-200 py-3"><Grid3X3 size={19} /></div>
      {feed.length ? <div className="grid grid-cols-3 gap-[2px]">{feed.map(item => <button type="button" key={item.id} onClick={() => open(item, 'feed')} aria-label={`Ver publicação: ${item.title}`}><DeliveryImage asset={item.artwork?.feed} alt={item.title} className="aspect-[3/4] w-full object-cover" /></button>)}</div> : <div className="p-9 text-center text-sm text-zinc-500"><UserRound size={28} className="mx-auto mb-3" />Adicione artes de Feed para montar a grade.</div>}
    </>}
    <p className="border-t border-zinc-100 px-4 py-3 text-center text-[10px] leading-4 text-zinc-400">Simulação visual com as artes desta entrega. Não conecta nem publica no Instagram.</p>
  </div>;
}

export default function InstagramPreviewButton({ delivery, disabled = false }: { delivery: ClientDelivery; disabled?: boolean }) {
  return <Dialog><DialogTrigger asChild><Button type="button" variant="outline" disabled={disabled} className="gap-2 border-[#b7dca0]/25 bg-[#b7dca0]/5 text-[#b7dca0] hover:bg-[#b7dca0]/10"><Instagram size={16} /> Prévia do Instagram</Button></DialogTrigger><DialogContent className="max-h-[94vh] max-w-xl overflow-y-auto border-white/10 bg-[#111419] p-5 text-zinc-100"><DialogHeader><DialogTitle>Prévia do Instagram do cliente</DialogTitle></DialogHeader><InstagramDeliveryPreview delivery={delivery} /></DialogContent></Dialog>;
}
