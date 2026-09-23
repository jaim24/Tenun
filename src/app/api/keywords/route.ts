import { prisma } from "@/lib/db";
import { fail, handleRoute, readJson } from "@/lib/http";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export const GET = handleRoute(async () => {
  const keywords = await prisma.keyword.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { matches: true } },
      matches: { where: { replyDraft: null }, take: 1, select: { id: true } },
    },
  });
  const pendingByKeyword = await prisma.replyDraft.groupBy({
    by: ["keywordId"],
    _count: { _all: true },
    where: { status: "PENDING" },
  });
  const pendingMap: Record<string, number> = {};
  for (const row of pendingByKeyword) {
    if (row.keywordId) pendingMap[row.keywordId] = row._count._all;
  }
  return {
    keywords: keywords.map((k) => ({
      ...k,
      pendingReplies: pendingMap[k.id] ?? 0,
      unmatched: k._count.matches,
    })),
  };
});

export const POST = handleRoute(async (req) => {
  const body = await readJson(req);
  const text = String(body.text ?? "").trim();
  if (!text) return fail("Kata kunci wajib diisi", 422);
  const mode = body.mode === "TAG" ? "TAG" : "KEYWORD";
  const autoReplyEnabled = Boolean(body.autoReplyEnabled);
  const replyTemplate = body.replyTemplate ? String(body.replyTemplate).trim() : null;

  const existing = await prisma.keyword.findUnique({ where: { text_mode: { text, mode } } });
  if (existing) {
    const keyword = await prisma.keyword.update({
      where: { id: existing.id },
      data: { autoReplyEnabled, replyTemplate, isActive: true },
    });
    return { keyword, updated: true };
  }

  const keyword = await prisma.keyword.create({
    data: { text, mode, autoReplyEnabled, replyTemplate, isActive: true },
  });
  await logActivity("KEYWORD", `Vektor monitor "${text}" diaktifkan`, { keywordId: keyword.id });
  return { keyword, updated: false };
});