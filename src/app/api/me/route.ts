import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/http";
import { getThreadsConfig, getEffectiveScopes } from "@/lib/config";

export async function GET() {
  const user = await getSessionUser();

  let threadsConfigured = false;
  let scopes: string[] = [];
  try {
    await getThreadsConfig();
    threadsConfigured = true;
    scopes = (await getEffectiveScopes()).split(" ");
  } catch {
    threadsConfigured = false;
  }

  const [account, pendingReplies, activeKeywords, scheduledCount] = await Promise.all([
    prisma.account.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.replyDraft.count({ where: { status: "PENDING" } }),
    prisma.keyword.count({ where: { isActive: true } }),
    prisma.threadPost.count({ where: { status: "SCHEDULED" } }),
  ]);

  return ok({
    user,
    threadsConfigured,
    scopes,
    account: account
      ? {
          id: account.id,
          threadsUserId: account.threadsUserId,
          username: account.username,
          name: account.name,
          profilePictureUrl: account.profilePictureUrl,
          tokenExpiresAt: account.tokenExpiresAt,
        }
      : null,
    pendingReplies,
    activeKeywords,
    scheduledCount,
  });
}