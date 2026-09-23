import { prisma } from "@/lib/db";
import { isCronAuthorized, ok, fail, sleep } from "@/lib/http";
import { getPrimaryAccount, requireAccount, searchThreads } from "@/lib/threads";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!(await isCronAuthorized(req))) return fail("Unauthorized", 401);

  const account = await getPrimaryAccount(prisma);
  if (!account) {
    await logActivity("CRON", "Cron search dilewati: belum ada akun Threads");
    return ok({ window: "search", skipped: "no-account" } as Record<string, unknown>);
  }

  const keywords = await prisma.keyword.findMany({ where: { isActive: true } });
  const summary: Array<{ keyword: string; scanned: number; newMatches: number; drafts: number }> = [];
  let totalNew = 0;
  let totalDrafts = 0;

  for (const keyword of keywords) {
    if (!account) continue;
    let posts: any[] = [];
    try {
      const result = await searchThreads(account.threadsUserId, account.accessToken, {
        q: keyword.text,
        searchType: keyword.mode === "TAG" ? "TAG" : "KEYWORD",
        limit: 10,
      });
      posts = Array.from(result.data ?? []);
    } catch (e) {
      await logActivity("ERROR", `Gagal scan "${keyword.text}": ${e instanceof Error ? e.message : "fail"}`);
      continue;
    }

    let newMatches = 0;
    let drafts = 0;
    for (const item of posts) {
      const match = await prisma.searchMatch.upsert({
        where: { keywordId_threadId: { keywordId: keyword.id, threadId: item.id } },
        create: {
          keywordId: keyword.id,
          threadId: item.id,
          username: item.username ?? null,
          text: item.text ?? null,
          permalink: item.permalink ?? null,
          postedAt: item.timestamp ? new Date(String(item.timestamp)) : null,
        },
        update: {},
      });

      if (match.createdAt.getTime() > Date.now() - 60000) newMatches += 1;

      if (keyword.autoReplyEnabled && keyword.replyTemplate && match.createdAt.getTime() > Date.now() - 60000) {
        const exists = await prisma.replyDraft.findUnique({ where: { matchId: match.id } });
        if (!exists && keyword.replyTemplate) {
          await prisma.replyDraft.create({
            data: {
              accountId: account.id,
              keywordId: keyword.id,
              matchId: match.id,
              targetThreadId: match.threadId,
              targetUsername: match.username,
              targetText: match.text,
              targetPermalink: match.permalink,
              suggestedText: keyword.replyTemplate.replace("{username}", `@${match.username ?? ""}`).slice(0, 500),
              status: "PENDING",
            },
          });
          drafts += 1;
        }
      }
    }
    totalNew += newMatches;
    totalDrafts += drafts;
    summary.push({ keyword: keyword.text, scanned: posts.length, newMatches, drafts });
    await sleep(150);
  }

  await logActivity("CRON", `Cron search: ${keywords.length} vektor, ${totalNew} match baru, ${totalDrafts} draf auto-reply`);
  return ok({ window: "search", keywords: keywords.length, summary, newMatches: totalNew, drafts: totalDrafts } as Record<string, unknown>);
}