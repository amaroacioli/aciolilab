import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Instagram, Loader2, RefreshCw, Unplug } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { InstagramFeedSnapshot } from '@/lib/delivery-art';
import { authorizeInstagram, disconnectInstagram, getInstagramStatus, instagramCallbackUrl, refreshInstagram } from '@/lib/instagram-feed';

export default function InstagramConnection({ deliveryId, snapshot, onSnapshot }: { deliveryId: string; snapshot?: InstagramFeedSnapshot | null; onSnapshot: (snapshot: InstagramFeedSnapshot | null) => void }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const receiver = useRef(onSnapshot);
  receiver.current = onSnapshot;
  const popup = useRef<Window | null>(null);
  const mounted = useRef(true);
  const requestVersion = useRef(0);
  const load = async (sync = false) => {
    const version = ++requestVersion.current;
    setBusy(true); setError('');
    try {
      const status = await getInstagramStatus(deliveryId);
      if (!mounted.current || version !== requestVersion.current) return;
      setConfigured(status.configured);
      receiver.current(status.snapshot);
      if (sync && status.configured && status.snapshot && !status.snapshot.expired) {
        const { snapshot: updated } = await refreshInstagram(deliveryId);
        if (mounted.current && version === requestVersion.current) receiver.current(updated);
      }
    } catch (reason) { if (mounted.current && version === requestVersion.current) setError(reason instanceof Error ? reason.message : 'Não foi possível consultar o Instagram.'); }
    finally { if (mounted.current && version === requestVersion.current) setBusy(false); }
  };
  useEffect(() => {
    mounted.current = true;
    void load(true);
    const received = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== popup.current || event.data?.type !== 'acioli-instagram-connected' || event.data?.deliveryId !== deliveryId) return;
      void load(true);
    };
    window.addEventListener('message', received);
    return () => { mounted.current = false; window.removeEventListener('message', received); };
  }, [deliveryId]);
  const connect = async (copy = false) => {
    const child = copy ? null : window.open('about:blank', 'acioli-instagram', 'popup,width=620,height=780');
    if (!copy && !child) { toast.error('Permita a abertura da janela de autorização ou use o link para o cliente.'); return; }
    popup.current = child;
    setBusy(true); setError('');
    try {
      const { url } = await authorizeInstagram(deliveryId);
      if (copy) {
        try { await navigator.clipboard.writeText(url); toast.success('Link copiado. O cliente deve autorizar em até 10 minutos.'); }
        catch { window.prompt('Link de autorização, válido por 10 minutos:', url); }
      } else if (child) child.location.href = url;
    } catch (reason) { child?.close(); setError(reason instanceof Error ? reason.message : 'Não foi possível iniciar a autorização.'); }
    finally { if (mounted.current) setBusy(false); }
  };
  const refresh = async () => {
    if (!snapshot) { await load(true); return; }
    setBusy(true); setError('');
    try { const { snapshot: updated } = await refreshInstagram(deliveryId, true); if (mounted.current) receiver.current(updated); }
    catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : 'Falha ao atualizar. A última cópia foi mantida.'); }
    finally { if (mounted.current) setBusy(false); }
  };
  const disconnect = async () => {
    if (!window.confirm('Desconectar o Instagram desta entrega e remover a cópia dos posts atuais? As novas artes e o perfil personalizado serão mantidos.')) return;
    setBusy(true); setError('');
    try { await disconnectInstagram(deliveryId); if (mounted.current) receiver.current(null); }
    catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : 'Não foi possível desconectar.'); }
    finally { if (mounted.current) setBusy(false); }
  };
  return <div className="mb-5 rounded-xl border border-white/10 bg-black/20 p-4">
    <h4 className="flex items-center gap-2 text-sm font-medium"><Instagram size={15} className="text-[#b7dca0]" /> Feed atual · integração oficial</h4>
    <p className="mt-2 text-xs leading-6 text-zinc-400">Conecte a conta profissional do cliente para mostrar os posts recentes abaixo das novas artes, sem carregar vídeos. Não publica nem altera o Instagram.</p>
    {configured === false && <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-6 text-amber-200"><p>A integração ainda precisa de configuração: adicione <strong>INSTAGRAM_APP_ID</strong> e <strong>INSTAGRAM_APP_SECRET</strong> nos segredos das Edge Functions do Supabase.</p><p className="mt-2">Na Meta, configure Instagram API com Instagram Login, a permissão instagram_business_basic e esta URL de retorno:</p><p className="mt-1 break-all font-mono text-[11px]">{instagramCallbackUrl()}</p><p className="mt-2">Contas de clientes externos exigem as liberações aplicáveis do aplicativo na Meta. Em desenvolvimento, use uma conta profissional autorizada como teste.</p></div>}
    {snapshot && <div className="mt-3 text-xs leading-6 text-zinc-300"><p className="flex items-center gap-2"><Check size={13} className="text-[#b7dca0]" /> @{snapshot.username} · {snapshot.posts.length} posts carregados</p><p className="text-zinc-500">{snapshot.syncedAt ? `Atualizado em ${new Date(snapshot.syncedAt).toLocaleString('pt-BR')}` : 'Aguardando primeira atualização.'}</p>{snapshot.expired && <p className="text-amber-300">Autorização expirada. Reconecte a conta para atualizar. A última cópia continua na prévia.</p>}</div>}
    {error && <p role="alert" className="mt-3 text-xs leading-6 text-red-300">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" className="gap-2 border-[#b7dca0]/25 bg-transparent text-xs text-[#b7dca0]" disabled={busy || configured !== true} onClick={() => connect()}><Instagram size={14} />{snapshot ? 'Reconectar conta' : 'Conectar Instagram'}</Button><Button type="button" size="sm" variant="outline" className="gap-2 border-white/10 bg-transparent text-xs" disabled={busy || configured !== true} onClick={() => connect(true)}><Copy size={13} /> Link para o cliente</Button><Button type="button" size="sm" variant="outline" className="gap-2 border-white/10 bg-transparent text-xs" disabled={busy} onClick={refresh}>{busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}{snapshot ? 'Atualizar feed' : 'Verificar conexão'}</Button>{snapshot && <Button type="button" size="sm" variant="ghost" className="gap-2 text-xs text-zinc-500" disabled={busy} onClick={disconnect}><Unplug size={13} /> Desconectar</Button>}</div>
    <p className="mt-3 text-[11px] leading-5 text-zinc-500">Busca até 12 posts ao abrir a edição ou a prévia no admin, usando cache de 30 minutos. A atualização manual tem intervalo mínimo de 1 minuto. Ao autorizar por link em outro aparelho, clique em Verificar conexão. A entrega pública mostra a última cópia sincronizada. Fixados e reordenações manuais do Instagram podem diferir da ordem dos posts recentes.</p>
    <p className="mt-2 break-all text-[10px] leading-5 text-zinc-600">URL de retorno para cadastrar na Meta: {instagramCallbackUrl()}</p>
    <p className="mt-1 text-[10px] leading-5 text-zinc-600">Para autorizar em outro aparelho, abra o editor pelo domínio HTTPS publicado. Um link de retorno localhost aponta para o aparelho do próprio cliente.</p>
  </div>;
}
