import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import type { SocialAsset } from '@/lib/social-media';

export function useDeliveryImageUrl(asset?: SocialAsset) {
  const [localUrl, setLocalUrl] = useState('');
  useEffect(() => {
    if (!asset?.file) { setLocalUrl(''); return; }
    const url = URL.createObjectURL(asset.file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [asset?.file]);
  return asset?.file ? localUrl : asset?.url || '';
}
export default function DeliveryImage({ asset, alt, className = '' }: { asset?: SocialAsset; alt: string; className?: string }) {
  const url = useDeliveryImageUrl(asset);
  return url ? <img src={url} alt={alt} className={className} /> : <div className={`flex items-center justify-center bg-zinc-100 text-zinc-400 ${className}`}><ImageIcon size={22} /></div>;
}
