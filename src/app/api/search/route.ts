import { prisma } from "@/lib/db";
import { fail, handleRoute, parseLimit, readJson } from "@/lib/http";
import { logActivity } from "@/lib/activity";
import { getPrimaryAccount, requireAccount, searchThreads, SEARCH_LIMIT } from "@/lib/threads";

export const dynamic = "force-dynamic";

export const POST = handleRoute(async (req) => {
  const body = await readJson(req);
  const q = String(body.q ?? "").trim();
  if (!q) return fail("Kata kunci pencarian wajib diisi", 422);
  const mode = body.mode === "TAG" ? "TAG" : "KEYWORD";
  const limit = parseLimit(body.limit, 25, 50);

  const account = await getPrimaryAccount(prisma);
  requireAccount(account);

  const result = await searchThreads(account.threadsUserId, account.accessToken, {
    q,
    searchType: mode,
    limit,
  });

  const posts = Array.from(result.data ?? []);
  await logActivity("SEARCH", `Pencarian "${q}" → ${posts.length} hasil`, { mode });

    // Kuota real: hitung pencarian manual 7 hari terakhir dari ActivityLog
  // (sebelumnya angka palsu = konstanta mentah). Cron search tidak dihitung
  // di sini karena memakai tipe log CRON.
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const searchesThisWeek = await prisma.activityLog.count({
    where: { type: "SEARCH", createdAt: { gte: weekAgo } },
  });
  return { posts, searchType: mode, searchesLeftWeekly: Math.max(0, SEARCH_LIMIT - searchesThisWeek) };
});