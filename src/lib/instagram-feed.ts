import { supabase } from '@/integrations/supabase/client';
import type { InstagramFeedSnapshot } from '@/lib/delivery-art';

async function request<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('instagram-feed', { body, headers: { 'x-admin-token': sessionStorage.getItem('acioli_delivery_token') || '' } });
  if (error) {
    let message = 'Não foi possível acessar a integração com o Instagram.';
    if (error.context instanceof Response) {
      const detail = await error.context.json().catch(() => null);
      if (typeof detail?.error === 'string') message = detail.error;
    }
    throw new Error(message);
  }
  return data as T;
}
export const instagramCallbackUrl = () => new URL('/instagram/callback', window.location.origin).href;
export const getInstagramStatus = (deliveryId: string) => request<{ configured: boolean; snapshot: InstagramFeedSnapshot | null }>({ action: 'status', deliveryId });
export const authorizeInstagram = (deliveryId: string) => request<{ url: string }>({ action: 'authorize', deliveryId, redirectUri: instagramCallbackUrl() });
export const refreshInstagram = (deliveryId: string, force = false) => request<{ snapshot: InstagramFeedSnapshot }>({ action: 'refresh', deliveryId, force });
export const disconnectInstagram = (deliveryId: string) => request<{ success: boolean }>({ action: 'disconnect', deliveryId });
export const completeInstagramAuthorization = (code: string, state: string) => request<{ deliveryId: string; warning: string }>({ action: 'callback', code, state });
