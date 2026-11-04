import { useEffect, useState } from 'react';
import { ArrowDown, Check, FileText, Play, Sparkles } from 'lucide-react';
import { ClientDelivery, DeliveryItem } from '@/lib/client-deliveries';

function DeliveryVideo({ item }: { item: DeliveryItem }) {
  const [url, setUrl] = useState('');
  const [playbackError, setPlaybackError] = useState(false);
  useEffect(() => {
    setPlaybackError(false);
    setUrl('');
    if (!item.video) return;
    const objectUrl = URL.createObjectURL(item.video);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [item.video]);
  return url ? <div>
    <video className="max-h-[560px] w-full rounded-xl bg-black" controls playsInline preload="metadata" src={url} aria-label={item.title} onError={() => setPlaybackError(true)} />
    {playbackError && <div role="alert" className="mt-3 rounded-xl border border-white/10 p-4 text-xs leading-6 text-zinc-400">
      Não foi possível reproduzir este vídeo neste navegador. MOV/HEVC do iPhone pode exigir Safari e um dispositivo compatível. Você também pode baixar o original e abrir em um reprodutor compatível.
      <a href={url} download={item.fileName || 'video.mov'} className="mt-2 block text-[#b7dca0] underline">Baixar vídeo original</a>
    </div>}
  </div> : null;
}

export default function ClientDeliveryView({ delivery }: { delivery: ClientDelivery }) {
  return <div className="min-h-screen bg-[#0b0d10] text-zinc-100">
    <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-white/10 px-6 py-7"><span className="text-xl font-extrabold tracking-tight">ACIOLI<span className="text-[#b7dca0]">.</span></span><span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Espaço do cliente</span></header>
    <main className="mx-auto max-w-5xl px-6 pb-12">
      <div className="py-16 md:py-24"><span className="inline-flex items-center gap-2 rounded-full border border-[#b7dca0]/20 bg-[#b7dca0]/5 px-3 py-1.5 text-xs text-[#b7dca0]"><Sparkles size={13} /> Preparado exclusivamente para {delivery.client}</span><h1 className="mt-7 max-w-3xl break-words text-4xl font-medium leading-[1.1] tracking-tight md:text-6xl">{delivery.title}</h1><p className="mt-6 max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-zinc-400">{delivery.introduction}</p><div className="mt-9 flex items-center gap-5 text-xs text-zinc-500"><span className="flex items-center gap-2"><Check size={14} className="text-[#b7dca0]" /> {delivery.items.length} {delivery.items.length === 1 ? 'entrega organizada' : 'entregas organizadas'}</span><a href="#entregas" className="flex items-center gap-2 text-zinc-300">Explore sua entrega <ArrowDown size={14} /></a></div></div>
      <div id="entregas" className="space-y-6 scroll-mt-6">{delivery.items.map((item, index) => <section key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111419] p-5 md:p-8"><div className="mb-6 flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-sm text-[#b7dca0]">{String(index + 1).padStart(2, '0')}</span><div><p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">{item.video ? 'Apresentação em vídeo' : 'Guia da entrega'}</p><h2 className="break-words text-xl font-medium md:text-2xl">{item.title}</h2></div><span className="ml-auto hidden text-zinc-600 sm:block">{item.video ? <Play size={18} /> : <FileText size={18} />}</span></div><DeliveryVideo item={item} />{item.description && <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-zinc-400">{item.description}</div>}</section>)}</div>
      {delivery.nextSteps && <section className="mt-10 rounded-2xl border border-[#b7dca0]/20 bg-[#b7dca0]/5 p-7 md:p-10"><p className="text-[10px] uppercase tracking-[0.25em] text-[#b7dca0]">O que vem agora</p><h2 className="mt-3 text-2xl font-medium">Seus próximos passos.</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-400">{delivery.nextSteps}</p></section>}
      <footer className="pt-16 text-center text-xs leading-7 text-zinc-600">Feito com intenção. Entregue com cuidado.<br /><span className="text-[9px] tracking-[0.25em]">ACIOLI • EXPERIÊNCIAS DIGITAIS</span></footer>
    </main>
  </div>;
}
