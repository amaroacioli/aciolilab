import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, ImagePlus, Loader2, Pencil, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSocialDraft } from '@/hooks/use-social-draft';
import { deleteSocialPost, inspectSocialFile, listSocialPosts, newSocialPost, saveSocialPost, socialFormats, SocialFormat, SocialPost } from '@/lib/social-media';
import SocialMediaPreview from '@/components/SocialMediaPreview';

const fieldClass = 'border-white/10 bg-black/40 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#b7dca0]/50';
const message = (error: unknown) => error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.';

export default function SocialMediaPanel() {
  const editor = useSocialDraft();
  const { draft } = editor;
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState('');
  const [deleting, setDeleting] = useState('');
  const listVersion = useRef(0);
  const disabled = busy || reading;

  const load = async () => {
    const version = ++listVersion.current;
    setLoading(true); setLoadError('');
    try { const rows = await listSocialPosts(); if (version === listVersion.current) setPosts(rows); }
    catch (error) { if (version === listVersion.current) setLoadError(message(error)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const selectFile = async (format: SocialFormat, file?: File) => {
    if (!file || !draft || disabled) return;
    setReading(true);
    try {
      const asset = await inspectSocialFile(file, format);
      editor.change({ ...draft, assets: { ...draft.assets, [format]: asset } });
    } catch (error) { toast.error(message(error)); }
    finally { setReading(false); }
  };
  const begin = (post: SocialPost) => {
    if (draft && draft.id !== post.id) {
      setHidden(false);
      toast.error('Há um rascunho em andamento. Salve ou descarte esse rascunho antes de editar outra publicação.');
      return;
    }
    editor.change(draft || post); setHidden(false);
  };
  const close = async () => {
    setBusy(true);
    try { await editor.flush(); setHidden(true); }
    catch (error) { toast.error(message(error)); }
    finally { setBusy(false); }
  };
  const discard = async () => {
    if (!window.confirm('Descartar o rascunho local? Os arquivos e textos não salvos online serão perdidos. A versão já salva na biblioteca não será excluída.')) return;
    setBusy(true);
    try { await editor.clear(); setHidden(false); }
    catch (error) { toast.error(message(error)); }
    finally { setBusy(false); }
  };
  const save = async () => {
    if (!draft || disabled) return;
    if (!draft.title.trim()) { toast.error('Preencha o título da publicação.'); return; }
    if (!Object.keys(draft.assets).length) { toast.error('Adicione pelo menos um arquivo de Feed ou Story.'); return; }
    setBusy(true); setProgress('Protegendo o rascunho...');
    try {
      await editor.flush();
      const saved = await saveSocialPost(draft, editor.checkpoint, setProgress);
      listVersion.current++;
      setPosts(current => [saved, ...current.filter(post => post.id !== saved.id)]);
      try { await editor.clear(); }
      catch (error) { toast.warning(`Salvo online, mas não foi possível limpar a cópia local: ${message(error)}`); }
      setHidden(false);
      toast.success('Mídias, título e legenda salvos na biblioteca.');
    } catch (error) { toast.error(message(error)); }
    finally { setBusy(false); setProgress(''); }
  };
  const remove = async (post: SocialPost) => {
    if (!window.confirm(`Excluir “${post.title}” e os arquivos dessa publicação?`)) return;
    setDeleting(post.id);
    try {
      await deleteSocialPost(post.id);
      listVersion.current++;
      setPosts(current => current.filter(row => row.id !== post.id));
      toast.success('Publicação excluída.');
    } catch (error) { toast.error(message(error)); }
    finally { setDeleting(''); }
  };
  const copyCaption = async (caption: string) => {
    try { await navigator.clipboard.writeText(caption); toast.success('Legenda copiada.'); }
    catch { window.prompt('Copie a legenda sugerida:', caption); }
  };

  return <section id="midias-sociais" className="rounded-3xl border border-[#b7dca0]/15 bg-zinc-950/80 p-5 sm:p-8">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
      <div><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#b7dca0]">Biblioteca criativa</p><h2 className="text-2xl font-semibold tracking-tight text-white">Mídias para redes sociais</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Feed e Story organizados com título e legenda sugerida.</p></div>
      <div className="flex gap-2"><Button type="button" variant="outline" size="icon" className="border-white/10 bg-transparent" disabled={loading || disabled} onClick={load} aria-label="Atualizar biblioteca de mídias"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></Button>{(!draft || hidden) && <Button type="button" className="gap-2 bg-[#b7dca0] text-black hover:bg-[#c8e8b4]" disabled={!editor.ready || disabled} onClick={() => draft ? setHidden(false) : begin(newSocialPost())}><Plus size={16} />{draft ? 'Continuar rascunho' : 'Adicionar mídias'}</Button>}</div>
    </div>

    {editor.error && <div role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-300"><p>{editor.error}</p>{!editor.ready && <Button type="button" variant="outline" className="mt-3 border-white/10 bg-transparent" onClick={editor.retryRecovery}>Tentar recuperar rascunho novamente</Button>}</div>}
    {draft && !hidden && <div className="mt-7 rounded-2xl border border-white/10 bg-[#111419] p-4 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3"><div><h3 className="font-medium text-white">{posts.some(post => post.id === draft.id) ? 'Editar publicação' : 'Preparar publicação'}</h3><p role="status" className={`mt-2 flex items-center gap-2 text-xs ${editor.status === 'error' ? 'text-red-300' : 'text-[#b7dca0]'}`}>{editor.status === 'saving' ? <Loader2 size={13} className="animate-spin" /> : editor.status === 'error' ? <X size={13} /> : <Check size={13} />}{editor.status === 'saving' ? 'Salvando rascunho e arquivos neste navegador...' : editor.status === 'error' ? 'Rascunho não salvo. Não feche esta página.' : 'Rascunho salvo neste navegador, incluindo os arquivos.'}</p></div><Button type="button" variant="ghost" size="icon" disabled={disabled} onClick={close} aria-label="Fechar editor e guardar rascunho"><X size={18} /></Button></div>
      <fieldset disabled={disabled} className="space-y-6 disabled:opacity-70">
        <div className="grid gap-5 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="social-title">Título da publicação *</Label><Input id="social-title" value={draft.title} maxLength={180} onChange={event => editor.change({ ...draft, title: event.target.value })} placeholder="Ex.: Lançamento da nova coleção" className={fieldClass} /></div><div className="space-y-2"><Label htmlFor="social-caption">Legenda sugerida</Label><Textarea id="social-caption" value={draft.caption} maxLength={20000} rows={4} onChange={event => editor.change({ ...draft, caption: event.target.value })} placeholder="Escreva a legenda, chamada para ação e hashtags..." className={fieldClass} /></div></div>
        <div className="grid gap-5 sm:grid-cols-2">{socialFormats.map(({ key, label, height }) => {
          const original = draft.assets[key];
          const asset = original && !original.file ? { ...original, url: posts.find(post => post.assets[key]?.path === original.path)?.assets[key]?.url || original.url } : original;
          return <div key={key} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-4 flex items-center justify-between"><div><h4 className="text-sm font-medium text-white">{label}</h4><p className="mt-1 text-xs text-zinc-500">1080 × {height}px · {key === 'feed' ? '4:5' : '9:16'}</p></div>{asset && <Button type="button" variant="ghost" size="icon" aria-label={`Remover arquivo de ${label}`} onClick={() => { const assets = { ...draft.assets }; delete assets[key]; editor.change({ ...draft, assets }); }}><Trash2 size={15} className="text-zinc-500" /></Button>}</div>
            {asset && <div className="mx-auto mb-4 max-w-[200px]"><SocialMediaPreview asset={asset} format={key} /><p className="mt-2 break-all text-[11px] leading-5 text-zinc-500">{asset.fileName} · {(asset.size / 1024 / 1024).toFixed(1)} MB</p></div>}
            <Label htmlFor={`social-file-${key}`} className="mb-2 flex items-center gap-2 text-xs text-zinc-300"><ImagePlus size={15} />{asset ? 'Substituir arquivo' : `Selecionar ${label}`}</Label><Input id={`social-file-${key}`} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.mp4,.webm" className={`${fieldClass} h-auto min-h-10 py-2 file:mr-3 file:text-zinc-300`} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void selectFile(key, file); }} />
          </div>;
        })}</div>
        <p className="text-xs leading-6 text-zinc-500">JPG, PNG, WebP, MP4 ou WebM, até 50 MB por arquivo. Envie pelo menos um dos formatos, nas dimensões exatas indicadas. O sistema preserva os arquivos sem recortar ou redimensionar. Salvar na biblioteca não publica nas redes sociais.</p>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-5"><Button type="button" variant="ghost" className="mr-auto text-zinc-500 hover:text-red-300" onClick={discard}>Descartar rascunho</Button><Button type="button" variant="outline" className="gap-2 border-white/10 bg-transparent" onClick={async () => { try { await editor.flush(); toast.success('Rascunho salvo com os arquivos.'); } catch (error) { toast.error(message(error)); } }}><Save size={15} /> Salvar rascunho</Button><Button type="button" className="gap-2 bg-[#b7dca0] text-black hover:bg-[#c8e8b4]" onClick={save}><ImagePlus size={16} /> Salvar mídias</Button></div>
      </fieldset>
      {disabled && <p role="status" className="mt-4 flex items-center justify-center gap-2 text-xs text-[#b7dca0]"><Loader2 size={14} className="animate-spin" />{reading ? 'Conferindo arquivo e dimensões...' : progress || 'Salvando rascunho...'}</p>}
      <p className="mt-4 text-[11px] leading-5 text-zinc-500">O rascunho fica neste navegador. Aguarde a confirmação antes de sair e não limpe os dados do site. Depois de salvar na biblioteca, as mídias ficam guardadas online com acesso administrativo.</p>
    </div>}

    {loadError && <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/20 p-4 text-sm text-red-300"><span>{loadError}</span><Button type="button" variant="outline" onClick={load} className="border-white/10 bg-transparent">Tentar novamente</Button></div>}
    {loading && !posts.length ? <p role="status" className="mt-8 flex items-center gap-2 text-sm text-zinc-500"><Loader2 size={16} className="animate-spin" /> Carregando biblioteca...</p> : !posts.length && !loadError ? <div className="mt-7 rounded-2xl border border-dashed border-white/10 p-8 text-center"><ImagePlus size={27} className="mx-auto mb-3 text-[#b7dca0]" /><p className="text-sm text-zinc-300">Suas próximas publicações começam aqui.</p><p className="mt-2 text-xs leading-6 text-zinc-500">Adicione o Feed, o Story e a legenda para manter tudo no mesmo lugar.</p></div> : null}
    {!!posts.length && <div className="mt-7 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">{posts.map(post => <article key={post.id} className="flex flex-col rounded-2xl border border-white/10 bg-[#111419] p-5">
      <div className="mb-4 flex items-start justify-between gap-3"><h3 className="break-words text-base font-medium text-white">{post.title}</h3><div className="flex shrink-0"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Editar ${post.title}`} disabled={disabled || !editor.ready || !!deleting} onClick={() => begin(post)}><Pencil size={14} /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400" aria-label={`Excluir ${post.title}`} disabled={disabled || !!deleting || draft?.id === post.id} title={draft?.id === post.id ? 'Finalize ou descarte o rascunho antes de excluir' : 'Excluir publicação'} onClick={() => remove(post)}>{deleting === post.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</Button></div></div>
      <div className="grid grid-cols-2 items-start gap-3">{socialFormats.map(({ key, label }) => post.assets[key] && <div key={key}><p className="mb-2 text-[10px] uppercase tracking-wider text-[#b7dca0]">{label}</p><SocialMediaPreview asset={post.assets[key]} format={key} /><Button type="button" asChild variant="outline" size="sm" className="mt-2 w-full gap-1 border-white/10 bg-transparent text-[11px]"><a href={post.assets[key]?.downloadUrl} download rel="noopener noreferrer"><Download size={12} /> Baixar {label}</a></Button></div>)}</div>
      <div className="mt-5 flex-1 border-t border-white/10 pt-4"><p className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">Legenda sugerida</p><p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-6 text-zinc-300">{post.caption || 'Nenhuma legenda adicionada.'}</p></div><div className="mt-4 flex items-center justify-between gap-2"><span className="text-[10px] text-zinc-600">{post.updatedAt ? new Date(post.updatedAt).toLocaleDateString('pt-BR') : ''}</span><Button type="button" variant="ghost" size="sm" className="gap-2 text-xs text-[#b7dca0]" disabled={!post.caption} onClick={() => copyCaption(post.caption)}><Copy size={13} /> Copiar legenda</Button></div>
    </article>)}</div>}
    {!!posts.length && <p className="mt-4 text-[11px] text-zinc-500">Se um link de mídia expirar, use o botão de atualizar a biblioteca para gerar novos links privados.</p>}
  </section>;
}
