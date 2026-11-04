import { FFmpeg, FFFSType } from '@ffmpeg/ffmpeg';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import classWorkerURL from '@ffmpeg/ffmpeg/worker?worker&url';

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const TARGET_BYTES = 46 * 1024 * 1024;
interface PreparedVideo { video: Blob; fileName: string; originalSize: number }
interface MediaInfo { format?: { duration?: string }; streams?: { codec_type?: string; duration?: string }[] }
const prepared = new WeakMap<Blob, PreparedVideo>();
let engine: FFmpeg | null = null;

export function releaseVideoCompressor() {
  engine?.terminate();
  engine = null;
}
function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Processamento cancelado.', 'AbortError');
}
async function inspect(ffmpeg: FFmpeg, input: string): Promise<{ duration: number; videoDuration: number; audioDuration: number; audio: boolean }> {
  const stdout: string[] = [];
  const diagnostics: string[] = [];
  const capture = ({ type, message }: { type: string; message: string }) => {
    if (type === 'stdout') stdout.push(message);
    diagnostics.push(message);
    if (diagnostics.length > 80) diagnostics.shift();
  };
  ffmpeg.on('log', capture);
  try {
    // Read JSON from stdout. WASM exit status is not a reliable indication that metadata was produced.
    try {
      await ffmpeg.ffprobe(['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,duration', '-of', 'json', input]);
    } catch (error) {
      if (!ffmpeg.loaded) throw error;
      diagnostics.push(error instanceof Error ? error.message : String(error));
    }
    let info: MediaInfo | undefined;
    try { info = JSON.parse(stdout.join('\n')); } catch { /* Some WASM builds only expose probe metadata through FFmpeg stderr. */ }
    const durations = [info?.format?.duration, ...(info?.streams || []).map(stream => stream.duration)].map(Number).filter(value => Number.isFinite(value) && value > 0);
    if (durations.length && info?.streams?.some(stream => stream.codec_type === 'video')) {
      const duration = Math.max(...durations);
      const videoDuration = Number(info.streams.find(stream => stream.codec_type === 'video')?.duration);
      const audioDuration = Number(info.streams.find(stream => stream.codec_type === 'audio')?.duration);
      return { duration, videoDuration: Number.isFinite(videoDuration) && videoDuration > 0 ? videoDuration : duration, audioDuration: Number.isFinite(audioDuration) && audioDuration > 0 ? audioDuration : 0, audio: info.streams.some(stream => stream.codec_type === 'audio') };
    }

    // With no output file, FFmpeg reports metadata and exits nonzero by design; it does not encode or cut the video.
    diagnostics.length = 0;
    await ffmpeg.exec(['-hide_banner', '-loglevel', 'info', '-i', input]);
    const report = diagnostics.join('\n');
    const match = report.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
    const duration = match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : 0;
    if (duration > 0 && /Stream\s+#.*Video:/i.test(report)) {
      return { duration, videoDuration: duration, audioDuration: 0, audio: /Stream\s+#.*Audio:/i.test(report) };
    }
    const detail = diagnostics.filter(line => /error|invalid|failed|not found|denied|moov|unsupported|could not/i.test(line)).slice(-3).join(' ').slice(0, 450);
    throw new Error(`O compactador não conseguiu abrir o vídeo para ler os metadados.${detail ? ` Detalhe técnico: ${detail}` : ' Nenhuma duração válida foi encontrada no arquivo.'} O original não foi alterado.`);
  } finally {
    ffmpeg.off('log', capture);
  }
}

export async function prepareDeliveryVideo(video: Blob, fileName: string, onProgress?: (message: string) => void, signal?: AbortSignal): Promise<PreparedVideo> {
  checkAbort(signal);
  const cached = prepared.get(video);
  if (cached) return cached;
  const needsConversion = video.size > TARGET_BYTES || video.type !== 'video/mp4' || /\.mov$/i.test(fileName);
  if (!needsConversion) return { video, fileName, originalSize: video.size };
  if (typeof WebAssembly === 'undefined' || typeof Worker === 'undefined') throw new Error('Este navegador não permite a compactação de vídeo. Abra o painel em um navegador atualizado.');

  const ffmpeg = engine || new FFmpeg();
  engine = ffmpeg;
  let loadingTimer: ReturnType<typeof setTimeout> | undefined;
  let loadTimedOut = false;
  let sourceDuration = 0;
  let attempt = 0;
  const abort = () => { ffmpeg.terminate(); if (engine === ffmpeg) engine = null; };
  signal?.addEventListener('abort', abort, { once: true });
  const progress = ({ time }: { time: number }) => {
    if (sourceDuration > 0) {
      const percent = Math.min(99, Math.max(0, Math.floor(time / 1_000_000 / sourceDuration * 100)));
      onProgress?.(`Compactando${attempt ? ' — ajuste de tamanho' : ''}: ${percent}%`);
    }
  };
  ffmpeg.on('progress', progress);
  try {
    if (!ffmpeg.loaded) {
      onProgress?.('Carregando compactador (primeiro uso pode demorar)...');
      loadingTimer = setTimeout(() => { loadTimedOut = true; abort(); }, 120000);
      await ffmpeg.load({ coreURL: new URL(coreURL, window.location.href).href, wasmURL: new URL(wasmURL, window.location.href).href, classWorkerURL: new URL(classWorkerURL, window.location.href).href });
      clearTimeout(loadingTimer);
    }
    checkAbort(signal);
    onProgress?.('Analisando duração e áudio do vídeo original...');
    await ffmpeg.createDir('/source');
    // WORKERFS reads the original Blob in chunks instead of copying a large iPhone file into WASM memory.
    const mounted = await ffmpeg.mount(FFFSType.WORKERFS, { blobs: [{ name: 'original', data: video }] }, '/source');
    if (!mounted) throw new Error('O navegador não conseguiu abrir o vídeo para compactação. Tente em um computador.');
    const source = await inspect(ffmpeg, '/source/original');
    sourceDuration = source.duration;
    const totalBitrate = Math.floor(TARGET_BYTES * 8 / source.duration * 0.96);
    const audioBitrate = source.audio ? Math.min(96000, Math.max(24000, Math.floor(totalBitrate * 0.15))) : 0;
    let videoBitrate = Math.min(4_000_000, totalBitrate - audioBitrate);
    if (videoBitrate < 24000) throw new Error('Este vídeo é longo demais para caber no limite atual sem tornar a imagem ilegível. Divida em capítulos ou use um serviço de processamento de vídeo no servidor. O vídeo não foi cortado.');

    for (attempt = 0; attempt < 3; attempt++) {
      checkAbort(signal);
      const maxEdge = videoBitrate < 350000 ? 640 : videoBitrate < 800000 ? 960 : 1280;
      onProgress?.(`Compactando${attempt ? ' — ajuste de tamanho' : ''}: 0%`);
      // No -t, -to, -fs or -shortest: compress the full timeline, never truncate it to satisfy the size limit.
      const code = await ffmpeg.exec([
        '-xerror', '-i', '/source/original', '-map', '0:v:0', '-map', '0:a:0?',
        '-vf', `scale=w='min(${maxEdge},iw)':h='min(${maxEdge},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
        '-c:v', 'libx264', '-preset', 'veryfast', '-threads', '1', '-pix_fmt', 'yuv420p', '-r', '30',
        '-b:v', String(Math.floor(videoBitrate)), '-maxrate', String(Math.floor(videoBitrate * 1.2)), '-bufsize', String(Math.floor(videoBitrate * 2)),
        '-c:a', 'aac', '-b:a', String(audioBitrate || 96000), '-ac', '2', '-movflags', '+faststart', '-map_metadata', '-1', 'delivery.mp4',
      ]);
      checkAbort(signal);
      if (code !== 0) throw new Error('A conversão não foi concluída. O vídeo original foi mantido; tente novamente em um computador com mais memória.');
      onProgress?.('Verificando duração integral e áudio...');
      const resultInfo = await inspect(ffmpeg, 'delivery.mp4');
      if (resultInfo.duration < source.duration - 1 || resultInfo.duration > source.duration + 2 || resultInfo.videoDuration < source.videoDuration - 1 || (source.audio && (!resultInfo.audio || (source.audioDuration > 0 && resultInfo.audioDuration < source.audioDuration - 1)))) throw new Error('A verificação detectou diferença de duração ou ausência de áudio. O arquivo não será enviado.');
      const bytes = await ffmpeg.readFile('delivery.mp4');
      if (typeof bytes === 'string') throw new Error('Não foi possível ler o vídeo compactado.');
      const result = new Blob([new Uint8Array(bytes)], { type: 'video/mp4' });
      if (result.size <= MAX_VIDEO_BYTES && result.size > 0) {
        const output = { video: result, fileName: `${fileName.replace(/\.[^.]+$/, '') || 'video'}.mp4`, originalSize: video.size };
        prepared.set(video, output);
        onProgress?.(`Vídeo pronto: ${(video.size / 1024 / 1024).toFixed(1)} MB → ${(result.size / 1024 / 1024).toFixed(1)} MB`);
        return output;
      }
      videoBitrate *= Math.min(0.8, TARGET_BYTES / result.size * 0.9);
      await ffmpeg.deleteFile('delivery.mp4');
    }
    throw new Error('Não foi possível atingir o tamanho de envio preservando o vídeo completo. O original não foi alterado.');
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Processamento cancelado.', 'AbortError');
    if (loadTimedOut || !ffmpeg.loaded) throw new Error('Não foi possível carregar o compactador. Verifique sua conexão e tente novamente em um navegador atualizado.');
    if (error instanceof Error && !(error instanceof RangeError) && !/memory|out of bounds|abort\(|terminated/i.test(error.message)) throw error;
    throw new Error('O navegador ficou sem recursos para compactar este vídeo. Tente em um computador com mais memória. Para vídeos muito grandes, é necessário processamento no servidor.');
  } finally {
    if (loadingTimer) clearTimeout(loadingTimer);
    signal?.removeEventListener('abort', abort);
    ffmpeg.off('progress', progress);
    if (ffmpeg.loaded && engine === ffmpeg) {
      try { await ffmpeg.unmount('/source'); await ffmpeg.deleteDir('/source'); } catch { /* Mount may not have completed. */ }
      try { await ffmpeg.deleteFile('delivery.mp4'); } catch { /* Output is not created if conversion fails early. */ }
    }
  }
}
