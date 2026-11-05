import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Instagram, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { completeInstagramAuthorization } from '@/lib/instagram-feed';

export default function InstagramCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Concluindo a autorização e carregando as imagens recentes...');
  const operation = useRef<ReturnType<typeof completeInstagramAuthorization> | null>(null);
  const params = useRef(new URLSearchParams(window.location.search));
  useEffect(() => {
    let active = true;
    const code = params.current.get('code');
    const state = params.current.get('state');
    window.history.replaceState(null, '', window.location.pathname);
    if (params.current.has('error') || !code || !state) {
      setStatus('error'); setMessage('A autorização não foi concluída. Solicite um novo link ou reconecte a conta pelo editor de entregas.');
      return;
    }
    operation.current ||= completeInstagramAuthorization(code, state);
    operation.current.then(result => {
      if (!active) return;
      setStatus('success');
      setMessage(result.warning || 'Conta conectada. Você pode fechar esta janela. As imagens recentes estão disponíveis na prévia da entrega.');
      window.opener?.postMessage({ type: 'acioli-instagram-connected', deliveryId: result.deliveryId }, window.location.origin);
    }).catch(error => {
      if (active) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'Não foi possível concluir. Solicite um novo link de autorização.'); }
    });
    return () => { active = false; };
  }, []);
  return <main className="flex min-h-screen items-center justify-center bg-[#0b0d10] px-6 text-zinc-100"><div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111419] p-8 text-center">{status === 'loading' ? <Loader2 size={32} className="mx-auto animate-spin text-[#b7dca0]" /> : status === 'success' ? <CheckCircle2 size={34} className="mx-auto text-[#b7dca0]" /> : <Instagram size={34} className="mx-auto text-red-300" />}<h1 className="mt-5 text-2xl font-medium">{status === 'loading' ? 'Conectando Instagram' : status === 'success' ? 'Instagram conectado' : 'Não foi possível conectar'}</h1><p role="status" className="mt-4 text-sm leading-7 text-zinc-400">{message}</p>{status !== 'loading' && <div className="mt-6 flex flex-wrap justify-center gap-3"><Button type="button" className="bg-[#b7dca0] text-black hover:bg-[#c8e8b4]" onClick={() => window.close()}>Fechar janela</Button>{sessionStorage.getItem('acioli_admin_auth') === 'true' && <Button variant="outline" asChild className="border-white/10 bg-transparent"><Link to="/clientes">Voltar às entregas</Link></Button>}</div>}</div></main>;
}
