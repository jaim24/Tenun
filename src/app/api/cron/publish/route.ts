import { prisma } from "@/lib/db";
import { isCronAuthorized, ok, fail } from "@/lib/http";
import { publishPostRecord } from "@/lib/publish";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!(await isCronAuthorized(req))) return fail("Unauthorized", 401);

  const due = await prisma.threadPost.findMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: new Date() } },
    orderBy: { scheduledFor: "asc" },
    take: 10,
  });

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