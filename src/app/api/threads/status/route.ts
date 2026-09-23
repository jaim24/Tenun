import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";
import { getPublishingQuota, PUBLISHING_LIMIT, REPLY_LIMIT, SEARCH_LIMIT } from "@/lib/threads";

export const dynamic = "force-dynamic";

export const GET = handleRoute(async () => {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  if (!account) {
    return { connected: false };
  }

  let quota: { usage: { posts: number; replies: number }; totals: { posts: number; replies: number } } | null = null;
  if (account.accessToken) {
    quota = await getPublishingQuota(account.threadsUserId, account.accessToken);
  }

  const remainingDays = Math.max(0, Math.round((account.tokenExpiresAt.getTime() - Date.now()) / 86400000));

  return {
    connected: true,
    account: {
      id: account.id,
      username: account.username,
      name: account.name,
      profilePictureUrl: account.profilePictureUrl,
      tokenExpiresInDays: remainingDays,
    },
    quota: quota
      ? {
          postsUsed: quota.usage.posts,
          postsTotal: quota.totals.posts ?? PUBLISHING_LIMIT,
          repliesUsed: quota.usage.replies,
          repliesTotal: quota.totals.replies ?? REPLY_LIMIT,
        }
      : null,
    limits: { posts: PUBLISHING_LIMIT, replies: REPLY_LIMIT, searches7d: SEARCH_LIMIT },
  };
});