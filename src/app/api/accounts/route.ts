import { prisma } from "@/lib/db";
import { fail, handleRoute } from "@/lib/http";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export const DELETE = handleRoute(async () => {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  if (!account) return fail("Belum ada akun terhubung", 404);
  const username = account.username;
  await prisma.account.delete({ where: { id: account.id } });
  await logActivity("AUTH", `Akun @${username} diputus dari studio`);
  return { disconnected: username };
});