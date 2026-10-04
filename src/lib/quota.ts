import { getPublishingQuota } from "./threads";

export type QuotaSummary = { postsUsed: number; postsTotal: number } | null;

// Kuota Threads hanya berubah ketika ada postingan terkirim, jadi tidak perlu
// menelepon Meta API setiap kali halaman dibuka. Cache 10 menit + dedup
// request bersamaan (layout & dashboard me-load dalam request yang sama).
const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { data: QuotaSummary; expires: number }>();
const inflight = new Map<string, Promise<QuotaSummary>>();

export async function getCachedQuota(
  threadsUserId: string,
  accessToken: string
): Promise<QuotaSummary> {
  const now = Date.now();
  const hit = cache.get(threadsUserId);
  if (hit && hit.expires > now) return hit.data;

  const ongoing = inflight.get(threadsUserId);
  if (ongoing) return ongoing;

  const task = (async (): Promise<QuotaSummary> => {
    try {
      const q = await getPublishingQuota(threadsUserId, accessToken);
      const data: QuotaSummary = {
        postsUsed: q.usage.posts,
        postsTotal: q.totals.posts,
      };
      cache.set(threadsUserId, { data, expires: Date.now() + TTL_MS });
      return data;
    } catch {
      return null;
    } finally {
      inflight.delete(threadsUserId);
    }
  })();

  inflight.set(threadsUserId, task);
  return task;
}
