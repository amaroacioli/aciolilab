import { useRef } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, FileText, Film, Globe, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientDelivery, DeliveryItem, hasVideo, normalizeSlug } from '@/lib/client-deliveries';
import { toast } from 'sonner';

const fieldClass = 'border-white/10 bg-[#0d1014] text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#b7dca0]/50';
interface Props {
  draft: ClientDelivery;
  onChange: (value: ClientDelivery) => void;
  onClose: () => void;
  onPreview: () => void;
  onSave: (publish: boolean) => void;
  onCancel?: () => void;
  busy: boolean;
  progress: string;
}

export default function DeliveryEditor({ draft, onChange, onClose, onPreview, onSave, onCancel, busy, progress }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const update = (values: Partial<ClientDelivery>) => onChange({ ...draft, ...values });
  const updateItem = (id: string, values: Partial<DeliveryItem>) => update({ items: draft.items.map(item => item.id === id ? { ...item, ...values } : item) });
  const addFiles = (files: FileList | null) => {
    if (!files || busy) return;
    const valid = Array.from(files).filter(file => ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-quicktime'].includes(file.type.toLowerCase()) || /\.(mov|mp4|webm|ogg)$/i.test(file.name));
    if (valid.length !== files.length) toast.error('Use vídeos MOV (iPhone), MP4, WebM ou Ogg.');
    if (draft.items.length + valid.length > 100) { toast.error('O limite é 100 blocos por entrega.'); return; }
    update({ items: [...draft.items, ...valid.map(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const type = ({ mov: 'video/quicktime', mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg' } as Record<string, string>)[extension || ''] || file.type;
      return { id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').slice(0, 180), description: '', video: file.slice(0, file.size, type), fileName: file.name };
    })] });
    if (valid.length) toast.success('Vídeos adicionados. A otimização será feita automaticamente ao salvar ou publicar.');
  };
  const move = (index: number, direction: number) => {
    const items = [...draft.items];
    [items[index], items[index + direction]] = [items[index + direction], items[index]];
    update({ items });
  };

  return <Dialog open onOpenChange={open => { if (!open && !busy && window.confirm('Fechar o editor? Alterações não salvas serão descartadas.')) onClose(); }}>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-white/10 bg-[#111419] p-6 text-zinc-100 md:p-8" onInteractOutside={event => { if (busy) event.preventDefault(); }} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}>
      <DialogHeader><p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#b7dca0]">Uma entrega à altura do seu trabalho</p><DialogTitle className="text-2xl font-medium">{draft.published ? 'Editar página publicada' : 'Preparar entrega'}</DialogTitle></DialogHeader>
      <fieldset disabled={busy} className="mt-3 space-y-7 disabled:opacity-70">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="client-name">Nome do cliente *</Label><Input id="client-name" className={fieldClass} value={draft.client} onChange={event => update({ client: event.target.value, ...(!draft.published && (!draft.slug || draft.slug === normalizeSlug(draft.client)) ? { slug: normalizeSlug(event.target.value) } : {}) })} placeholder="Ex.: Studio Aurora" maxLength={120} /></div>
          <div className="space-y-2"><Label htmlFor="delivery-title">Título da entrega *</Label><Input id="delivery-title" className={fieldClass} value={draft.title} onChange={event => update({ title: event.target.value })} placeholder="Ex.: Sua nova presença digital" maxLength={180} /></div>
        </div>
        <div className="rounded-xl border border-[#b7dca0]/20 bg-[#b7dca0]/5 p-4">
          <Label htmlFor="delivery-slug" className="flex items-center gap-2"><Globe size={15} className="text-[#b7dca0]" /> Endereço personalizado da página *</Label>
          <div className="mt-3 flex items-center overflow-hidden rounded-lg border border-white/10 bg-[#0d1014]"><span className="pl-3 text-xs text-zinc-500">/entregas/</span><Input id="delivery-slug" className="border-0 bg-transparent focus-visible:ring-inset focus-visible:ring-[#b7dca0]/50" value={draft.slug} onChange={event => update({ slug: event.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') })} onBlur={() => update({ slug: normalizeSlug(draft.slug) })} placeholder="studio-aurora" maxLength={80} /></div>
          <p className="mt-2 break-all text-[11px] text-zinc-500">{window.location.origin}/entregas/{draft.slug || 'nome-do-cliente'}</p>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500">De 3 a 80 caracteres. Letras, números e hífens. {draft.published ? 'Se alterar o endereço, o link anterior deixará de funcionar.' : 'O endereço só fica acessível depois de publicar.'}</p>
        </div>
        <div className="space-y-2"><Label htmlFor="delivery-intro">Mensagem de boas-vindas</Label><Textarea id="delivery-intro" className={fieldClass} value={draft.introduction} onChange={event => update({ introduction: event.target.value })} placeholder="Apresente o que foi desenvolvido e o que o cliente vai encontrar aqui." rows={3} maxLength={20000} /></div>
        <section>
          <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium">Conteúdo da entrega</h3><span className="text-xs text-zinc-500">{draft.items.length} blocos</span></div>
          <input ref={fileInput} type="file" multiple accept=".mov,.mp4,.webm,.ogg,video/quicktime,video/mp4,video/webm,video/ogg" className="hidden" onChange={event => { addFiles(event.target.files); event.target.value = ''; }} />
          <button type="button" className="w-full rounded-xl border border-dashed border-[#b7dca0]/30 bg-[#b7dca0]/[0.03] p-7 text-center hover:bg-[#b7dca0]/10" onClick={() => fileInput.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files); }}>
            <Upload size={24} className="mx-auto mb-3 text-[#b7dca0]" /><p className="text-sm">Arraste seus vídeos ou <span className="text-[#b7dca0]">selecione os arquivos</span></p><p className="mt-2 text-xs text-zinc-500">MOV do iPhone · MP4 · WebM · Ogg · Compactação rápida automática</p>
          </button>
          <div className="mt-3 rounded-xl border border-[#b7dca0]/15 bg-[#b7dca0]/5 p-4 text-xs leading-6 text-zinc-400"><p className="font-medium text-[#b7dca0]">Modo rápido: menor qualidade, menos processamento.</p><p>Pode adicionar o original acima de 50 MB. Ao salvar ou publicar, vídeos grandes e MOV são convertidos para MP4, mantendo o vídeo inteiro e o áudio. A saída prioriza velocidade: até 480p em vídeos 16:9, 20 quadros por segundo e menor taxa de dados. Textos pequenos e detalhes finos podem perder nitidez.</p><p className="mt-2 text-zinc-500">A compactação acontece neste aparelho, um vídeo por vez. Mantenha a aba aberta. A leitura de originais 4K ainda pode demorar ou exceder a memória do iPhone; nesse caso, tente em um computador. A prévia antes de salvar ainda usa o original.</p></div>
          <Button variant="outline" disabled={draft.items.length >= 100} className="mt-3 w-full gap-2 border-white/10 bg-transparent" onClick={() => update({ items: [...draft.items, { id: crypto.randomUUID(), title: '', description: '' }] })}><FileText size={15} /> Adicionar explicação em texto</Button>
          <div className="mt-5 space-y-4">{draft.items.map((item, index) => <div key={item.id} className="rounded-xl border border-white/10 bg-[#0d1014] p-4">
            <div className="mb-4 flex items-center gap-2"><span className="mr-auto flex items-center gap-2 text-xs text-[#b7dca0]">{hasVideo(item) ? <Film size={14} /> : <FileText size={14} />} Bloco {String(index + 1).padStart(2, '0')}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0} aria-label="Mover para cima" onClick={() => move(index, -1)}><ArrowUp size={13} /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === draft.items.length - 1} aria-label="Mover para baixo" onClick={() => move(index, 1)}><ArrowDown size={13} /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-500 hover:text-red-400" aria-label="Remover bloco" onClick={() => update({ items: draft.items.filter(entry => entry.id !== item.id) })}><X size={14} /></Button>
            </div>
            <Label htmlFor={`title-${item.id}`} className="text-xs text-zinc-400">Título do bloco *</Label><Input id={`title-${item.id}`} className={`${fieldClass} mb-3 mt-2`} value={item.title} onChange={event => updateItem(item.id, { title: event.target.value })} placeholder="Ex.: Conheça seu novo site" maxLength={180} />
            {hasVideo(item) && <p className="mb-3 flex items-center gap-2 break-all text-[11px] text-zinc-500"><Check size={12} className="shrink-0 text-[#b7dca0]" />{item.fileName} · {((item.video?.size || item.videoSize || 0) / 1024 / 1024).toFixed(1)} MB · {item.video ? 'Original — otimização automática ao salvar' : 'Salvo online'}</p>}
            <Label htmlFor={`description-${item.id}`} className="text-xs text-zinc-400">Explicação {hasVideo(item) ? '' : '*'}</Label><Textarea id={`description-${item.id}`} className={`${fieldClass} mt-2`} value={item.description} onChange={event => updateItem(item.id, { description: event.target.value })} placeholder="Explique o que foi entregue, as decisões e como usar." rows={3} maxLength={20000} />
          </div>)}</div>
        </section>
        <div className="space-y-2"><Label htmlFor="next-steps">Próximos passos</Label><Textarea id="next-steps" className={fieldClass} value={draft.nextSteps} onChange={event => update({ nextSteps: event.target.value })} placeholder="Oriente o cliente: o que revisar, como enviar feedback e como começar a usar." rows={3} maxLength={20000} /></div>
        <p className="text-xs leading-5 text-zinc-500">A página publicada abre sem login. Qualquer pessoa com o link poderá visualizar a entrega. Não inclua informações confidenciais.</p>
        <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
          <Button variant="outline" className="gap-2 border-white/10 bg-transparent" onClick={onPreview}><Eye size={15} /> Prévia</Button>
          {!draft.published && <Button variant="outline" className="border-white/10 bg-transparent" onClick={() => onSave(false)}>Salvar rascunho</Button>}
          <Button className="gap-2 bg-[#b7dca0] text-[#182215] hover:bg-[#c8e8b4]" onClick={() => onSave(true)}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}{busy ? 'Aguarde...' : draft.published ? 'Atualizar página' : 'Publicar entrega'}</Button>
        </div>
      </fieldset>
      {busy && <div className="space-y-3 rounded-xl border border-[#b7dca0]/20 bg-[#b7dca0]/5 p-4 text-center"><p role="status" className="text-xs leading-6 text-[#b7dca0]">{progress}</p>{/\d+%/.test(progress) && <Progress value={Number(progress.match(/(\d+)%/)?.[1] || 0)} aria-label="Progresso da compactação" className="h-1.5 bg-white/10 [&>div]:bg-[#b7dca0]" />}<p className="text-[11px] text-zinc-500">Mantenha esta janela aberta e o aparelho ativo até concluir.</p>{onCancel && <Button variant="outline" size="sm" className="border-white/10 bg-transparent text-xs" onClick={onCancel}>Cancelar compactação</Button>}</div>}
    </DialogContent>
  </Dialog>;
}
