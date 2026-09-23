import { prisma } from "@/lib/db";
import { fail, handleRoute, readJson } from "@/lib/http";
import { logActivity } from "@/lib/activity";
import { getPrimaryAccount, requireAccount, searchThreads, SEARCH_LIMIT } from "@/lib/threads";

export const dynamic = "force-dynamic";

export const POST = handleRoute(async (req) => {
  const body = await readJson(req);
  const q = String(body.q ?? "").trim();
  if (!q) return fail("Kata kunci pencarian wajib diisi", 422);
  const mode = body.mode === "TAG" ? "TAG" : "KEYWORD";
  const limit = Math.min(Number(body.limit ?? 25), 50);

  const account = await getPrimaryAccount(prisma);
  requireAccount(account);

  const result = await searchThreads(account.threadsUserId, account.accessToken, {
    q,
    searchType: mode,
    limit,
  });

  const posts = Array.from(result.data ?? []);
  await logActivity("SEARCH", `Pencarian "${q}" → ${posts.length} hasil`, { mode });

  return { posts, searchType: mode, searchesLeftWeekly: SEARCH_LIMIT };
});