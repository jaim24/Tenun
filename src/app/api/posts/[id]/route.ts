import { prisma } from "@/lib/db";
import { fail, handleRoute, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = handleRoute(async (_req, ctx: any) => {
  const { id } = await ctx.params;
  const post = await prisma.threadPost.findUnique({
    where: { id },
    include: { account: { select: { username: true } } },
  });
  if (!post) return fail("Post tidak ditemukan", 404);
  return { post };
});

export const PATCH = handleRoute(async (req, ctx: any) => {
  const { id } = await ctx.params;
  const post = await prisma.threadPost.findUnique({ where: { id } });
  if (!post) return fail("Post tidak ditemukan", 404);
  if (["PUBLISHED", "PROCESSING"].includes(post.status)) {
    return fail("Post yang sudah terbit tidak bisa diubah", 409);
  }

  const body = await readJson(req);
  const data: Record<string, unknown> = {};

  if (typeof body.text === "string") {
    const text = body.text.trim();
    if (!text) return fail("Naskah post wajib diisi", 422);
    if (text.length > 500) return fail(`Naskah melebihi 500 karakter (${text.length})`, 422);
    data.text = text;
  }
  if (body.imageUrl !== undefined) {
    data.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
  }
  if (body.scheduledFor !== undefined) {
    if (body.scheduledFor) {
      const s = new Date(String(body.scheduledFor));
      if (Number.isNaN(s.getTime())) return fail("Format jadwal tidak valid", 422);
      if (s.getTime() < Date.now()) return fail("Jadwal harus di masa depan", 422);
      data.scheduledFor = s;
      data.status = "SCHEDULED";
    } else {
      data.scheduledFor = null;
      data.status = "DRAFT";
    }
  }
  if (body.status !== undefined && ["DRAFT", "CANCELLED"].includes(body.status as string)) {
    data.status = body.status;
    if (body.status === "CANCELLED") data.scheduledFor = null;
  }

  const post2 = await prisma.threadPost.update({ where: { id }, data });
  return { post: post2 };
});

export const DELETE = handleRoute(async (_req, ctx: any) => {
  const { id } = await ctx.params;
  const post = await prisma.threadPost.findUnique({ where: { id } });
  if (!post) return fail("Post tidak ditemukan", 404);
  if (["PUBLISHED", "PROCESSING"].includes(post.status)) {
    return fail("Post yang sudah terbit tidak bisa dihapus", 409);
  }
  await prisma.threadPost.delete({ where: { id } });
  return { deleted: id };
});