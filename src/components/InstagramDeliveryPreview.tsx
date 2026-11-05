import { useState } from 'react';
import { ArrowLeft, Bookmark, ChevronDown, Grid3X3, Heart, Instagram, Loader2, MessageCircle, MoreHorizontal, Play, Send, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ClientDelivery, DeliveryItem } from '@/lib/client-deliveries';
import type { InstagramFeedPost, InstagramFeedSnapshot } from '@/lib/delivery-art';
import { getInstagramStatus, refreshInstagram } from '@/lib/instagram-feed';
import DeliveryImage from '@/components/DeliveryImage';

type Selected = { item: DeliveryItem; mode: 'feed' | 'story' } | { post: InstagramFeedPost };
export function InstagramDeliveryPreview({ delivery }: { delivery: ClientDelivery }) {
  const [selected, setSelected] = useState<Selected | null>(null);
  const profile = delivery.instagram;
  const current = profile?.connectedFeed;
  const handle = profile?.handle || current?.username || 'perfil.do.cliente';
  const name = profile?.name || delivery.client || 'Nome do cliente';
  const feed = delivery.items.filter(item => item.artwork?.feed);
  const stories = delivery.items.filter(item => item.artwork?.story);
  const existing = current?.posts || [];
  const selectedItem = selected && 'item' in selected ? selected.item : null;
  const selectedPost = selected && 'post' in selected ? selected.post : null;
  const isStory = selected && 'mode' in selected && selected.mode === 'story';
  const caption = selectedItem?.caption || selectedPost?.caption || 'Sem legenda sugerida.';
  return <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[24px] border border-zinc-200 bg-white text-zinc-950 shadow-xl">
    <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><span className="flex min-w-0 items-center gap-1 truncate text-lg font-semibold">{handle}<ChevronDown size={15} /></span><Instagram size={22} /></div>
    {selected ? <>
      <button type="button" onClick={() => setSelected(null)} className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-zinc-600"><ArrowLeft size={15} /> Voltar ao perfil</button>
      <div className="flex items-center gap-3 px-4 pb-3"><DeliveryImage asset={profile?.avatar} alt="Foto do perfil" className="h-9 w-9 shrink-0 rounded-full object-cover" /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{selectedPost ? current?.username : handle}</span><MoreHorizontal size={20} /></div>
      {selectedItem && 'mode' in selected ? <DeliveryImage asset={selectedItem.artwork?.[selected.mode]} alt={selectedItem.title} className={`w-full object-contain ${isStory ? 'aspect-[9/16] max-h-[65vh] bg-zinc-950' : 'aspect-[4/5]'}`} /> : selectedPost ? <img src={selectedPost.imageUrl} alt={selectedPost.caption || 'Post atual do Instagram'} className="aspect-[4/5] w-full bg-zinc-950 object-contain" /> : null}
      {!isStory && <div className="flex items-center gap-4 px-4 py-3" aria-hidden="true"><Heart size={24} /><MessageCircle size={24} /><Send size={23} /><Bookmark size={23} className="ml-auto" /></div>}
      <div className="max-h-56 overflow-y-auto px-4 pb-5 text-sm leading-6"><p className="mb-1 font-semibold">{selectedItem?.title || 'Post já publicado'}</p><p className="whitespace-pre-wrap break-words"><span className="mr-2 font-semibold">{selectedPost ? current?.username : handle}</span>{caption}</p>{selectedPost?.mediaType === 'VIDEO' && <p className="mt-2 text-xs text-zinc-500">Miniatura do vídeo publicado. O vídeo não é carregado nesta simulação.</p>}</div>
    </> : <>
      <div className="px-5 py-5"><div className="flex items-center gap-6"><div className="shrink-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]"><DeliveryImage asset={profile?.avatar} alt="Foto do perfil do cliente" className="h-[76px] w-[76px] rounded-full border-[3px] border-white object-cover" /></div><div className="flex flex-1 justify-around gap-2 text-center"><div><p className="font-semibold">{feed.length + existing.length}</p><p className="text-[11px]">na prévia</p></div><div><p className="font-semibold">—</p><p className="text-[11px]">seguidores</p></div><div><p className="font-semibold">—</p><p className="text-[11px]">seguindo</p></div></div></div><p className="mt-4 text-sm font-semibold">{name}</p>{profile?.bio && <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5">{profile.bio}</p>}<div aria-hidden="true" className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-semibold"><span className="rounded-lg bg-zinc-100 py-2">Seguir</span><span className="rounded-lg bg-zinc-100 py-2">Mensagem</span></div></div>
      {!!stories.length && <div className="flex gap-4 overflow-x-auto px-5 pb-5">{stories.map(item => <button type="button" key={item.id} className="w-16 shrink-0 text-center" onClick={() => setSelected({ item, mode: 'story' })} aria-label={`Ver Story: ${item.title}`}><div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]"><DeliveryImage asset={item.artwork?.story} alt={item.title} className="h-[60px] w-[60px] rounded-full border-[3px] border-white object-cover" /></div><p className="mt-1 truncate text-[10px]">{item.title}</p></button>)}</div>}
      <div className="flex items-center justify-center border-y border-zinc-200 py-3"><Grid3X3 size={19} /></div>
      {feed.length + existing.length ? <div className="grid grid-cols-3 gap-[2px]">{feed.map(item => <button type="button" key={`new-${item.id}`} className="relative" onClick={() => setSelected({ item, mode: 'feed' })} aria-label={`Ver nova publicação: ${item.title}`}><DeliveryImage asset={item.artwork?.feed} alt={item.title} className="aspect-[3/4] w-full object-cover" /><span className="absolute left-1 top-1 rounded bg-[#b7dca0] px-1.5 py-0.5 text-[9px] font-semibold text-black">Nova</span></button>)}{existing.map(post => <button type="button" key={`existing-${post.id}`} className="relative" onClick={() => setSelected({ post })} aria-label="Ver post atual do Instagram"><img src={post.imageUrl} alt={post.caption || 'Post atual'} loading="lazy" className="aspect-[3/4] w-full object-cover" />{post.mediaType === 'VIDEO' && <Play size={15} className="absolute right-2 top-2 fill-white text-white drop-shadow" />}</button>)}</div> : <div className="p-9 text-center text-sm text-zinc-500"><UserRound size={28} className="mx-auto mb-3" />Adicione artes ou conecte o feed atual para montar a grade.</div>}
    </>}
    <div className="border-t border-zinc-100 px-4 py-3 text-center text-[10px] leading-4 text-zinc-400">{current?.syncedAt && <p className="mb-1">Posts recentes de @{current.username} · cópia de {new Date(current.syncedAt).toLocaleString('pt-BR')}. Fixados e ordenação manual podem diferir.</p>}<p>As novas artes entram primeiro. Simulação visual; não publica no Instagram.</p></div>
  </div>;
}

export default function InstagramPreviewButton({ delivery, disabled = false }: { delivery: ClientDelivery; disabled?: boolean }) {
  const [snapshot, setSnapshot] = useState<InstagramFeedSnapshot | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const update = async (open: boolean) => {
    if (!open || !sessionStorage.getItem('acioli_delivery_token') || loading) return;
    setLoading(true); setError('');
    try {
      const status = await getInstagramStatus(delivery.id);
      setSnapshot(status.snapshot);
      if (status.configured && status.snapshot && !status.snapshot.expired) {
        const result = await refreshInstagram(delivery.id);
        setSnapshot(result.snapshot);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar. A última cópia disponível foi mantida.'); }
    finally { setLoading(false); }
  };
  const preview = snapshot === undefined ? delivery : { ...delivery, instagram: { handle: '', name: '', bio: '', ...delivery.instagram, connectedFeed: snapshot } };
  return <Dialog onOpenChange={open => { void update(open); }}><DialogTrigger asChild><Button type="button" variant="outline" disabled={disabled} className="gap-2 border-[#b7dca0]/25 bg-[#b7dca0]/5 text-[#b7dca0] hover:bg-[#b7dca0]/10"><Instagram size={16} /> Prévia do Instagram</Button></DialogTrigger><DialogContent className="max-h-[94vh] max-w-xl overflow-y-auto border-white/10 bg-[#111419] p-5 text-zinc-100"><DialogHeader><DialogTitle>Prévia do Instagram do cliente</DialogTitle></DialogHeader>{loading && <p role="status" className="flex items-center gap-2 text-xs text-[#b7dca0]"><Loader2 size={13} className="animate-spin" /> Conferindo os posts recentes...</p>}{error && <p role="alert" className="text-xs leading-5 text-amber-200">{error}</p>}<InstagramDeliveryPreview delivery={preview} /></DialogContent></Dialog>;
}
