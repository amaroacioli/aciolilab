import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, FolderLock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClientDeliveryView from '@/components/ClientDeliveryView';
import { ClientDelivery, getPublicDelivery } from '@/lib/client-deliveries';

export default function Entrega() {
  const { slug = '' } = useParams();
  const [delivery, setDelivery] = useState<ClientDelivery | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow, noarchive';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setDelivery(null);
    getPublicDelivery(slug).then(result => { if (active) setDelivery(result); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, attempt]);
  useEffect(() => {
    const previous = document.title;
    if (delivery) document.title = `${delivery.title} — ${delivery.client} | Acioli`;
    return () => { document.title = previous; };
  }, [delivery]);
  if (loading) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0b0d10] text-zinc-400"><Loader2 className="animate-spin text-[#b7dca0]" /><p className="text-sm">Preparando sua entrega...</p></div>;
  if (error || !delivery) return <div className="flex min-h-screen items-center justify-center bg-[#0b0d10] px-6 text-zinc-100"><div className="max-w-md text-center"><FolderLock size={40} className="mx-auto mb-6 text-[#b7dca0]" /><h1 className="text-2xl font-medium">Entrega indisponível</h1><p className="mt-4 text-sm leading-6 text-zinc-400">{error || 'Confira o endereço recebido ou entre em contato com quem enviou sua entrega.'}</p><Button variant="outline" className="mt-6 border-white/15 bg-transparent" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</Button></div></div>;
  return <ClientDeliveryView delivery={delivery} />;
}
