export const instagramCacheBucket = 'delivery-instagram-cache';

export async function instagramSnapshot(db: any, deliveryId: string) {
  const { data, error } = await db.from('delivery_instagram_connections').select('username, posts, synced_at, expires_at').eq('delivery_id', deliveryId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const posts = await Promise.all(data.posts.map(async (post: any) => {
    const { data: signed, error: signError } = await db.storage.from(instagramCacheBucket).createSignedUrl(post.imagePath, 21600);
    if (signError) throw signError;
    return { id: post.id, caption: post.caption, mediaType: post.mediaType, timestamp: post.timestamp, imageUrl: signed.signedUrl };
  }));
  return { username: data.username, posts, syncedAt: data.synced_at, expired: Date.parse(data.expires_at) <= Date.now() };
}
