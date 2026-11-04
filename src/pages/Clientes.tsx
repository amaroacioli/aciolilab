import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Copy, ExternalLink, Eye, Film, FolderOpen, Globe, Loader2, Plus, Search, Sparkles, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientDelivery, DeliverySessionError, deleteDelivery, deliveryLink, hasVideo, listDeliveries, saveDelivery, unpublishDelivery } from '@/lib/client-deliveries';
import ClientDeliveryView from '@/components/ClientDeliveryView';
import DeliveryEditor from '@/components/DeliveryEditor';
import { toast } from 'sonner';

const freshDelivery = (): ClientDelivery => ({ id: crypto.randomUUID(), client: '', title: '', slug: '', introduction: '', nextSteps: '', updatedAt: new Date().toISOString(), published: false, items: [] });

export default function Clientes() {
  const { id } = useParams();
  const [authenticated, setAuthenticated] = useState(sessionStorage.getItem('acioli_admin_auth') === 'true');
  const [deliveries, setDeliveries] = useState<ClientDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<ClientDelivery | null>(null);
  const [preview, setPreview] = useState<ClientDelivery | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [publishedDelivery, setPublishedDelivery] = useState<ClientDelivery | null>(null);
  const processingController = useRef<AbortController | null>(null);
  useEffect(() => () => processingController.current?.abort(), []);

  const reportError = (error: unknown) => {
    if (error instanceof DeliverySessionError) { setAuthenticated(false); toast.error('Entre novamente para acessar a publicação online.'); }
    else toast.error(error instanceof Error ? error.message : 'Não foi possível concluir a operação.');
  };
  const load = async () => {
    setLoading(true);
    setLoadError('');
    try { setDeliveries(await listDeliveries()); }
    catch (error) { setLoadError(error instanceof Error ? error.message : 'Falha ao carregar as entregas.'); reportError(error); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (authenticated) void load(); }, [authenticated]);

  const save = async (published: boolean) => {
    if (!draft || busy) return;
    if (!draft.client.trim() || !draft.title.trim()) { toast.error('Preencha o nome do cliente e o título.'); return; }
    if (!/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(draft.slug)) { toast.error('O endereço precisa ter de 3 a 80 caracteres: letras minúsculas, números e hífens.'); return; }
    if ((published && !draft.items.length) || draft.items.some(item => !item.title.trim() || (!hasVideo(item) && !item.description.trim()))) { toast.error('Cada bloco precisa de título e vídeo ou explicação. Adicione conteúdo antes de publicar.'); return; }
    setBusy(true);
    setProgress('Preparando envio...');
    const controller = new AbortController();
    processingController.current = controller;
    try {
      const saved = await saveDelivery({ ...draft, client: draft.client.trim(), title: draft.title.trim(), published }, setProgress, controller.signal);
      setDeliveries(current => [saved, ...current.filter(entry => entry.id !== saved.id)]);
      setDraft(null);
      if (saved.published) setPublishedDelivery(saved);
      toast.success(saved.published ? 'Página publicada! O link já pode ser enviado ao cliente.' : 'Rascunho salvo online. Ainda não está público.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') toast.info('Compactação cancelada. Os vídeos continuam no editor para tentar novamente.');
      else reportError(error);
    } finally { processingController.current = null; setBusy(false); setProgress(''); }
  };
  const copyLink = async (delivery: ClientDelivery) => {
    const link = deliveryLink(delivery);
    try { await navigator.clipboard.writeText(link); toast.success('Link copiado! Envie ao cliente.'); }
    catch { window.prompt('Copie o link da entrega:', link); }
  };
  const unpublish = async (delivery: ClientDelivery) => {
    if (!window.confirm('Tirar esta página do ar? O conteúdo será mantido como rascunho e o link ficará indisponível.')) return;
    setWorkingId(delivery.id);
    try {
      await unpublishDelivery(delivery.id);
      setDeliveries(current => current.map(entry => entry.id === delivery.id ? { ...entry, published: false } : entry));
      toast.success('Página retirada do ar. Você pode publicar novamente quando quiser.');
    } catch (error) { reportError(error); } finally { setWorkingId(null); }
  };
  const remove = async (delivery: ClientDelivery) => {
    if (!window.confirm(`Excluir a entrega de ${delivery.client}? A página ficará indisponível e os vídeos serão removidos.`)) return;
    setWorkingId(delivery.id);
    try { await deleteDelivery(delivery.id); setDeliveries(current => current.filter(entry => entry.id !== delivery.id)); toast.success('Entrega excluída.'); }
    catch (error) { reportError(error); } finally { setWorkingId(null); }
  };

  if (!authenticated) return <Navigate to="/admin" replace />;
  if (id && !loading) {
    const delivery = deliveries.find(entry => entry.id === id);
    return delivery ? <><div className="border-b border-white/10 bg-[#111419] px-6 py-3 text-center text-xs text-zinc-400"><Link to="/clientes" className="text-[#b7dca0]">← Voltar ao painel</Link> · Prévia administrativa</div><ClientDeliveryView delivery={delivery} /></> : <div className="p-10 text-center"><p>{loadError || 'Entrega não encontrada.'}</p><Link to="/clientes" className="mt-4 inline-block underline">Voltar para clientes</Link></div>;
  }
  const filtered = deliveries.filter(entry => `${entry.client} ${entry.title}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));

  return <div className="min-h-screen bg-[#0b0d10] text-zinc-100">
    <header className="border-b border-white/[0.07]"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
      <Link to="/admin" className="text-xl font-extrabold tracking-tight">ACIOLI<span className="text-[#b7dca0]">.</span><span className="ml-4 border-l border-white/10 pl-4 text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">Admin</span></Link>
      <Link to="/admin" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white"><ArrowLeft size={14} /> Voltar ao painel</Link>
    </div></header>
    <main className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-14">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[#b7dca0]"><span className="h-1.5 w-1.5 rounded-full bg-[#b7dca0]" /> Relacionamento & entregas</p><h1 className="text-4xl font-medium tracking-tight md:text-5xl">Cada entrega, uma experiência<span className="text-[#b7dca0]">.</span></h1><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500">Publique uma página exclusiva no seu domínio. Um link, todos os vídeos e cada detalhe explicado para o seu cliente.</p></div><Button onClick={() => setDraft(freshDelivery())} className="shrink-0 gap-2 rounded-xl bg-[#b7dca0] px-5 py-6 text-[#182215] hover:bg-[#c8e8b4]"><Plus size={17} /> Nova entrega</Button></div>
      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">{[
        { icon: Users, label: 'Clientes atendidos', value: new Set(deliveries.map(entry => entry.client.toLocaleLowerCase())).size },
        { icon: Globe, label: 'Páginas publicadas', value: deliveries.filter(entry => entry.published).length },
        { icon: Film, label: 'Vídeos na biblioteca', value: deliveries.reduce((sum, entry) => sum + entry.items.filter(hasVideo).length, 0) },
      ].map(stat => <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#111419] px-6 py-5"><div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-zinc-500"><stat.icon size={18} /></div><div><p className="text-2xl font-medium">{String(stat.value).padStart(2, '0')}</p><p className="mt-1 text-xs text-zinc-500">{stat.label}</p></div></div>)}</div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><h2 className="text-lg font-medium">Suas entregas</h2><span className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-zinc-500">{deliveries.length}</span></div><div className="relative sm:w-72"><Search size={15} className="absolute left-3 top-3 text-zinc-600" /><Input aria-label="Buscar cliente ou projeto" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar cliente ou projeto..." className="rounded-xl border-white/10 bg-[#0d1014] pl-9 text-zinc-100 placeholder:text-zinc-600" /></div></div>
      {loadError && <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-400/20 p-4 text-sm text-red-400"><span>{loadError}</span><Button variant="outline" onClick={load}>Tentar novamente</Button></div>}
      {loading ? <div className="flex justify-center py-24"><Loader2 className="animate-spin text-[#b7dca0]" /></div> : filtered.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map(delivery => <article key={delivery.id} className="rounded-2xl border border-white/[0.08] bg-[#111419] p-6 transition-colors hover:border-[#b7dca0]/30">
        <div className="mb-8 flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#b7dca0]/15 bg-[#b7dca0]/5 text-lg text-[#b7dca0]">{delivery.client.slice(0, 2).toUpperCase()}</span><span className={`rounded-full px-3 py-1 text-[10px] ${delivery.published ? 'bg-[#b7dca0]/10 text-[#b7dca0]' : 'bg-white/5 text-zinc-500'}`}>{delivery.published ? 'Publicada' : delivery.localOnly ? 'Rascunho local' : 'Rascunho'}</span></div>
        <p className="text-[10px] uppercase tracking-[0.17em] text-[#b7dca0]">{delivery.client}</p><h3 className="mb-3 mt-2 break-words text-xl font-medium">{delivery.title}</h3><p className="line-clamp-2 min-h-10 text-xs leading-5 text-zinc-500">{delivery.introduction || 'Vídeos e explicações preparados para este cliente.'}</p>
        <div className="my-4 flex justify-between text-[11px] text-zinc-500"><span>{delivery.items.length} blocos · {delivery.items.filter(hasVideo).length} vídeos</span><span>{new Date(delivery.updatedAt).toLocaleDateString('pt-BR')}</span></div>
        <div className="mb-4 rounded-lg border border-white/5 bg-[#0b0d10] px-3 py-2"><p className="truncate text-[11px] text-zinc-500">/entregas/{delivery.slug}</p></div>
        <div className="flex items-center gap-2 border-t border-white/5 pt-4"><Button variant="outline" size="sm" className="flex-1 gap-2 border-white/10 bg-transparent text-xs" onClick={() => setDraft(delivery)}>Gerenciar <ArrowUpRight size={13} /></Button><Button variant="ghost" size="icon" aria-label="Visualizar prévia" title="Visualizar prévia" onClick={() => setPreview(delivery)}><Eye size={16} /></Button><Button variant="ghost" size="icon" disabled={!delivery.published} title="Copiar link publicado" aria-label="Copiar link publicado" onClick={() => copyLink(delivery)}><Copy size={16} /></Button><Button variant="ghost" size="icon" disabled={!!workingId} aria-label="Excluir entrega" className="text-zinc-600 hover:text-red-400" onClick={() => remove(delivery)}>{workingId === delivery.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}</Button></div>
        {delivery.published && <div className="mt-3 flex items-center justify-between"><a href={deliveryLink(delivery)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] text-[#b7dca0]">Abrir página <ExternalLink size={12} /></a><button disabled={!!workingId} onClick={() => unpublish(delivery)} className="text-[11px] text-zinc-600 hover:text-zinc-300">Tirar do ar</button></div>}
      </article>)}</div> : !loadError && <div className="rounded-2xl border border-dashed border-white/10 bg-[#111419]/60 px-6 py-20 text-center"><div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#b7dca0]/20 bg-[#b7dca0]/5 text-[#b7dca0]"><FolderOpen size={26} strokeWidth={1.4} /></div><h3 className="text-xl font-medium">{search ? 'Nenhuma entrega encontrada' : 'Seu trabalho merece uma boa apresentação.'}</h3><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">{search ? 'Tente outro nome de cliente ou projeto.' : 'Crie a entrega, adicione vídeos e explicações, personalize o link e publique para o cliente.'}</p>{!search && <Button onClick={() => setDraft(freshDelivery())} variant="outline" className="mt-7 gap-2 rounded-xl border-white/15 bg-transparent"><Plus size={16} /> Criar primeira entrega</Button>}</div>}
      <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/5 px-5 py-4 text-xs leading-5 text-zinc-500"><Sparkles size={16} className="mt-0.5 shrink-0 text-[#b7dca0]/70" /><p><span className="text-zinc-300">Entregas publicadas no seu domínio.</span> Vídeos e textos ficam salvos online. O cliente acessa sem login pelo link enviado. Qualquer pessoa com esse endereço poderá visualizar; para interromper novos acessos à página, use “Tirar do ar”. Links de vídeo já abertos expiram em até 6 horas.</p></div>
    </main>
    {draft && <DeliveryEditor key={draft.id} draft={draft} onChange={setDraft} onClose={() => setDraft(null)} onPreview={() => setPreview(draft)} onSave={save} onCancel={busy && progress.includes(' — ') ? () => processingController.current?.abort() : undefined} busy={busy} progress={progress} />}
    <Dialog open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}><DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto border-white/10 bg-[#0b0d10] p-0"><DialogHeader className="sr-only"><DialogTitle>Prévia da entrega para o cliente</DialogTitle></DialogHeader>{preview && <ClientDeliveryView delivery={preview} />}</DialogContent></Dialog>
    <Dialog open={!!publishedDelivery} onOpenChange={open => { if (!open) setPublishedDelivery(null); }}><DialogContent className="max-w-lg border-white/10 bg-[#111419] text-zinc-100"><DialogHeader><Globe className="mb-4 text-[#b7dca0]" size={30} /><DialogTitle className="text-2xl">Sua entrega está no ar.</DialogTitle></DialogHeader><p className="text-sm leading-6 text-zinc-400">Envie este link ao cliente. A página abre sem login, com todos os vídeos e explicações.</p>{publishedDelivery && <><Input readOnly aria-label="Link da entrega publicada" value={deliveryLink(publishedDelivery)} className="border-white/10 bg-[#0b0d10] text-xs text-[#b7dca0]" onFocus={event => event.target.select()} /><div className="flex gap-3"><Button className="flex-1 gap-2 bg-[#b7dca0] text-[#182215] hover:bg-[#c8e8b4]" onClick={() => copyLink(publishedDelivery)}><Copy size={15} /> Copiar link</Button><Button variant="outline" className="gap-2 border-white/10 bg-transparent" asChild><a href={deliveryLink(publishedDelivery)} target="_blank" rel="noopener noreferrer">Abrir <ExternalLink size={15} /></a></Button></div></>}</DialogContent></Dialog>
  </div>;
}
