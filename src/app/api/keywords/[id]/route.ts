import { prisma } from "@/lib/db";
import { fail, handleRoute, readJson } from "@/lib/http";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export const PATCH = handleRoute(async (req, ctx: any) => {
  const { id } = await ctx.params;
  const body = await readJson(req);
  const keyword = await prisma.keyword.findUnique({ where: { id } });
  if (!keyword) return fail("Kata kunci tidak ditemukan", 404);

  const data: Record<string, unknown> = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.autoReplyEnabled === "boolean") data.autoReplyEnabled = body.autoReplyEnabled;
  if (body.replyTemplate !== undefined) {
    data.replyTemplate = body.replyTemplate ? String(body.replyTemplate).trim() : null;
  }
  if (typeof body.text === "string" && body.text.trim()) data.text = body.text.trim();

  const updated = await prisma.keyword.update({ where: { id }, data });
  if (typeof data.isActive === "boolean") {
    await logActivity("KEYWORD", `Vektor "${keyword.text}" ${data.isActive ? "diaktifkan" : "dijeda"}`);
  }
  return { keyword: updated };
});

export const DELETE = handleRoute(async (_req, ctx: any) => {
  const { id } = await ctx.params;
  const keyword = await prisma.keyword.findUnique({ where: { id } });
  if (!keyword) return fail("Kata kunci tidak ditemukan", 404);
  await prisma.keyword.delete({ where: { id } });
  await logActivity("KEYWORD", `Vektor "${keyword.text}" dihapus`);
  return { deleted: id };
});