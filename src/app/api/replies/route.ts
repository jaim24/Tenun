import { prisma } from "@/lib/db";
import { handleRoute, readJson, fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = handleRoute(async (req) => {
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") ?? "PENDING") as
    | "PENDING"
    | "APPROVED"
    | "SENT"
    | "SKIPPED"
    | "FAILED";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 300);

  const drafts = await prisma.replyDraft.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      match: {
        select: {
          username: true,
          text: true,
          permalink: true,
          postedAt: true,
          keyword: { select: { text: true, mode: true } },
        },
      },
    },
  });
  return { drafts };
});

export const PATCH = handleRoute(async (req, ctx: any) => {
  const { id } = await ctx.params;
  const body = await readJson(req);
  const draft = await prisma.replyDraft.findUnique({ where: { id } });
  if (!draft) return fail("Draf tidak ditemukan", 404);

  const data: Record<string, unknown> = {};
  if (typeof body.suggestedText === "string") {
    const text = body.suggestedText.trim();
    if (!text) return fail("Naskah balasan wajib diisi", 422);
    if (text.length > 500) return fail("Naskah balasan maksimal 500 karakter", 422);
    data.suggestedText = text;
  }
  if (body.status === "PENDING") data.status = "PENDING";

  const updated = await prisma.replyDraft.update({ where: { id }, data });
  return { draft: updated };
});