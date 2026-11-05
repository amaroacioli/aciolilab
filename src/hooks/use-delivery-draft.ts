import { useEffect, useRef, useState } from 'react';
import { ClientDelivery, saveLocalDeliveryDraft } from '@/lib/client-deliveries';

const ACTIVE_DRAFT = 'acioli_active_delivery_draft';
export function getActiveDeliveryDraftId() {
  try { return localStorage.getItem(ACTIVE_DRAFT); } catch { return null; }
}

export function useDeliveryDraft() {
  const [draft, setDraft] = useState<ClientDelivery | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState('');
  const latest = useRef<ClientDelivery | null>(null);
  const revision = useRef(0);
  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const unsettled = useRef(false);

  const persist = (value: ClientDelivery) => {
    const currentRevision = ++revision.current;
    unsettled.current = true;
    setStatus('saving');
    setError('');
    const operation = saveLocalDeliveryDraft(value).then(saved => {
      if (currentRevision === revision.current) {
        unsettled.current = false;
        setStatus('saved');
        setSavedAt(saved.updatedAt);
      }
      return saved;
    }).catch(reason => {
      if (currentRevision === revision.current) {
        setStatus('error');
        setError(reason instanceof Error ? reason.message : 'Não foi possível salvar neste navegador.');
      }
      throw reason;
    });
    pending.current = operation;
    return operation;
  };

  const change = (value: ClientDelivery) => {
    latest.current = value;
    setDraft(value);
    try { localStorage.setItem(ACTIVE_DRAFT, value.id); } catch { /* Drafts remain recoverable from the IndexedDB list. */ }
    void persist(value).catch(() => { /* The persistent status message reports storage failures. */ });
  };
  const flush = async () => {
    if (!latest.current) return;
    await pending.current.catch(() => undefined);
    return persist(latest.current);
  };
  const checkpoint = async (changes: Partial<ClientDelivery>) => {
    if (!latest.current) return;
    const next = { ...latest.current, ...changes };
    latest.current = next;
    setDraft(next);
    await persist(next);
  };
  const clear = () => {
    revision.current++;
    latest.current = null;
    unsettled.current = false;
    try { localStorage.removeItem(ACTIVE_DRAFT); } catch { /* A stale active ID is ignored when its draft is absent. */ }
    setDraft(null);
    setStatus('idle');
    setError('');
  };
  const close = async () => { const saved = await flush(); clear(); return saved; };

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (unsettled.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);

  return { draft, change, flush, checkpoint, clear, close, hasOpenDraft: () => latest.current !== null, status, error, savedAt };
}
