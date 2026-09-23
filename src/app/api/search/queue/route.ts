import { prisma } from "@/lib/db";
import { fail, handleRoute, readJson } from "@/lib/http";
import { logActivity } from "@/lib/activity";
import { getPrimaryAccount, requireAccount } from "@/lib/threads";

export const dynamic = "force-dynamic";

// Antre balasan dari hasil pencarian manual → buat ReplyDraft PENDING.
export const POST = handleRoute(async (req) => {
  const body = await readJson(req);
  const q = String(body.q ?? "").trim();
  const thread = body.thread ? JSON.parse(JSON.stringify(body.thread)) : null;
  const replyText = body.replyText ? String(body.replyText).trim() : null;
  const mode = body.mode === "TAG" ? "TAG" : "KEYWORD";

  if (!q) return fail("Kata kunci wajib diisi", 422);
  if (!thread?.id) return fail("Detail thread tidak lengkap", 422);

  const account = await getPrimaryAccount(prisma);
  requireAccount(account);

  const keyword = await prisma.keyword.upsert({
    where: { text_mode: { text: q, mode } },
    create: { text: q, mode, isActive: true },
    update: { isActive: true },
  });

  const match = await prisma.searchMatch.upsert({
    where: { keywordId_threadId: { keywordId: keyword.id, threadId: String(thread.id) } },
    create: {
      keywordId: keyword.id,
      threadId: String(thread.id),
      username: thread.username ?? null,
      text: thread.text ?? null,
      permalink: thread.permalink ?? null,
      postedAt: thread.timestamp ? new Date(String(thread.timestamp)) : null,
    },
    update: {},
  });

  let draft = null;
  const text = replyText || (keyword.replyTemplate ? keyword.replyTemplate.replace("{username}", `@${thread.username ?? ""}`) : null);
  if (text) {
    draft = await prisma.replyDraft.create({
      data: {
        accountId: account.id,
        keywordId: keyword.id,
        matchId: match.id,
        targetThreadId: match.threadId,
        targetUsername: thread.username ?? null,
        targetText: thread.text ?? null,
        targetPermalink: thread.permalink ?? null,
        suggestedText: text.slice(0, 500),
        status: "PENDING",
      },
    });
  }

  await logActivity("REPLY", `Draf balasan untuk @${thread.username ?? "thread"} masuk antrean${text ? "" : " (tanpa naskah)"}`);
  return { match, draft };
});