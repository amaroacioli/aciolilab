import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { SocialAsset, SocialFormat } from '@/lib/social-media';

export default function SocialMediaPreview({ asset, format }: { asset?: SocialAsset; format: SocialFormat }) {
  const [localUrl, setLocalUrl] = useState('');
  useEffect(() => {
    if (!asset?.file) { setLocalUrl(''); return; }
    const url = URL.createObjectURL(asset.file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [asset?.file]);
  const url = asset?.file ? localUrl : asset?.url;
  return <div className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black ${format === 'feed' ? 'aspect-[4/5]' : 'aspect-[9/16]'}`}>
    {!url ? <ImageIcon size={28} className="text-zinc-700" /> : asset?.mime.startsWith('video/') ? <video src={url} controls playsInline preload="metadata" className="h-full w-full object-contain" /> : <img src={url} alt={asset?.fileName || 'Prévia da mídia'} className="h-full w-full object-contain" loading="lazy" />}
  </div>;
}
