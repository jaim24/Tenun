import { prisma } from "@/lib/db";
import { fail, handleRoute, ok, readJson } from "@/lib/http";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export const GET = handleRoute(async (req) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 300);

  const statusFilter = status
    ? {
        status: status as "DRAFT" | "SCHEDULED" | "PROCESSING" | "PUBLISHED" | "FAILED" | "CANCELLED",
      }
    : undefined;
  const posts = await prisma.threadPost.findMany({
    where: statusFilter,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { account: { select: { username: true } } },
  });
  return { posts };
});

export const POST = handleRoute(async (req) => {
  const body = await readJson(req);
  const text = String(body.text ?? "").trim();
  if (!text) return fail("Naskah post wajib diisi", 422);
  if (text.length > 500) return fail(`Naskah melebihi 500 karakter (${text.length})`, 422);

  const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
  let scheduledFor: Date | null = null;
  let status: "DRAFT" | "SCHEDULED" = "DRAFT";

  if (body.scheduledFor) {
    scheduledFor = new Date(String(body.scheduledFor));
    if (Number.isNaN(scheduledFor.getTime())) return fail("Format jadwal tidak valid", 422);
    if (scheduledFor.getTime() < Date.now()) return fail("Jadwal harus di masa depan", 422);
    status = "SCHEDULED";
  }

  const post = await prisma.threadPost.create({
    data: { text, imageUrl, scheduledFor, status },
  });

  await logActivity("DISPATCH", status === "SCHEDULED" ? "Post dijadwalkan" : "Draf post tersimpan", {
    postId: post.id,
  });

  return { post };
});