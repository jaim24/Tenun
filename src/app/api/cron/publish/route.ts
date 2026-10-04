import { prisma } from "@/lib/db";
import { isCronAuthorized, ok, fail } from "@/lib/http";
import { publishPostRecord } from "@/lib/publish";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!(await isCronAuthorized(req))) return fail("Unauthorized", 401);

  // Klaim atomik per baris: updateMany dengan syarat status hanya berhasil
  // bila baris masih SCHEDULED (atau PROCESSING basi >10 mnt dari run yang
  // crash). Dua run cron yang overlap tidak akan memproses postingan yang sama.
  const now = new Date();
  const staleBefore = new Date(now.getTime() - 10 * 60 * 1000);
  const claimable = {
    scheduledFor: { lte: now },
    OR: [{ status: "SCHEDULED" }, { status: "PROCESSING", updatedAt: { lt: staleBefore } }],
  } as const;
  const candidates = await prisma.threadPost.findMany({
    where: claimable,
    orderBy: { scheduledFor: "asc" },
    take: 10,
  });
  const due: typeof candidates = [];
  for (const post of candidates) {
    const claimed = await prisma.threadPost.updateMany({
      where: { id: post.id, ...claimable },
      data: { status: "PROCESSING", error: null },
    });
    if (claimed.count > 0) due.push(post);
  }

  const results = [];
  for (const post of due) {
    try {
      await publishPostRecord(post);
      results.push({ id: post.id, ok: true });
    } catch (e) {
      results.push({ id: post.id, ok: false, error: e instanceof Error ? e.message : "fail" });
    }
  }

  await logActivity("CRON", `Cron publish: ${due.length} post jatuh tempo`, { published: results.filter((r) => r.ok).length });
  return ok({ window: "publish", scanned: due.length, results } as Record<string, unknown>);
}