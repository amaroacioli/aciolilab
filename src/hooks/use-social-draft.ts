import { useEffect, useRef, useState } from 'react';
import { loadSocialDraft, saveSocialDraft, SocialPost } from '@/lib/social-media';

export function useSocialDraft() {
  const [draft, setDraft] = useState<SocialPost | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const latest = useRef<SocialPost | null>(null);
  const revision = useRef(0);
  const unsettled = useRef(false);

  useEffect(() => {
    let active = true;
    loadSocialDraft().then(saved => {
      if (active) { latest.current = saved; setDraft(saved); setStatus('saved'); setError(''); setReady(true); }
    }).catch(reason => {
      if (active) { setError(reason instanceof Error ? reason.message : 'Falha ao recuperar rascunho.'); setStatus('error'); setReady(false); }
    });
    const warn = (event: BeforeUnloadEvent) => {
      if (unsettled.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warn);
    return () => { active = false; window.removeEventListener('beforeunload', warn); };
  }, [attempt]);

  const persist = async (post: SocialPost) => {
    const version = ++revision.current;
    latest.current = post;
    unsettled.current = true;
    setDraft(post); setStatus('saving'); setError('');
    try {
      await saveSocialDraft(post);
      if (revision.current === version) { unsettled.current = false; setStatus('saved'); }
    } catch (reason) {
      if (revision.current === version) { setStatus('error'); setError(reason instanceof Error ? reason.message : 'Falha ao salvar rascunho. Não feche esta página.'); }
      throw reason;
    }
  };
  const change = (post: SocialPost) => { void persist(post).catch(() => undefined); };
  const flush = async () => { if (latest.current) await persist(latest.current); };
  const clear = async () => {
    await saveSocialDraft(null);
    revision.current++;
    latest.current = null; unsettled.current = false;
    setDraft(null); setStatus('saved'); setError('');
  };
  const retryRecovery = () => { setError(''); setAttempt(value => value + 1); };
  return { draft, ready, status, error, change, flush, checkpoint: persist, clear, retryRecovery };
}
