import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = handleRoute(async (req) => {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100);
  const activities = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return { activities };
});