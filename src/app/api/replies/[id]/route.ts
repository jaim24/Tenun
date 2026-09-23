import { prisma } from "@/lib/db";
import { fail, handleRoute, readJson } from "@/lib/http";
import { sendReplyDraft } from "@/lib/reply";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export const PATCH = handleRoute(async (req, ctx: any) => {
  const { id } = await ctx.params;
  const body = await readJson(req);
  const draft = await prisma.replyDraft.findUnique({ where: { id } });
  if (!draft) return fail("Draf tidak ditemukan", 404);

  const data: Record<string, unknown> = {};
  if (typeof body.suggestedText === "string") {
    const text = body.suggestedText.trim();
    if (!text) return fail("Naskah balasan wajib diisi", 422);
    data.suggestedText = text;
  }
  const updated = await prisma.replyDraft.update({ where: { id }, data });
  return { draft: updated };
});

export const POST = handleRoute(async (_req, ctx: any) => {
  const { id } = await ctx.params;
  const draft = await prisma.replyDraft.findUnique({ where: { id } });
  if (!draft) return fail("Draf tidak ditemukan", 404);
  const updated = await sendReplyDraft(draft);
  return { draft: updated };
});

export const DELETE = handleRoute(async (_req, ctx: any) => {
  const { id } = await ctx.params;
  const draft = await prisma.replyDraft.findUnique({ where: { id } });
  if (!draft) return fail("Draf tidak ditemukan", 404);
  await prisma.replyDraft.update({ where: { id }, data: { status: "SKIPPED" } });
  await logActivity("REPLY", `Balasan untuk @${draft.targetUsername ?? "thread"} diskip`);
  return { skipped: id };
});