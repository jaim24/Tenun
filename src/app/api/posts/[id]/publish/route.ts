import { prisma } from "@/lib/db";
import { fail, handleRoute } from "@/lib/http";
import { publishPostRecord } from "@/lib/publish";

export const dynamic = "force-dynamic";

export const POST = handleRoute(async (_req, ctx: any) => {
  const { id } = await ctx.params;
  const post = await prisma.threadPost.findUnique({ where: { id } });
  if (!post) return fail("Post tidak ditemukan", 404);
  const updated = await publishPostRecord(post);
  return { post: updated };
});