import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPublishingQuota } from "@/lib/threads";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import ToastProvider from "@/components/toast";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) return null;

  const [account, pendingReplies, activeKeywords, scheduledCount] = await Promise.all([
    prisma.account.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.replyDraft.count({ where: { status: "PENDING" } }),
    prisma.keyword.count({ where: { isActive: true } }),
    prisma.threadPost.count({ where: { status: "SCHEDULED" } }),
  ]);

  let quota: { postsUsed: number; postsTotal: number } | null = null;
  if (account?.accessToken) {
    try {
      const q = await getPublishingQuota(account.threadsUserId, account.accessToken);
      quota = { postsUsed: q.usage.posts, postsTotal: q.totals.posts };
    } catch {
      quota = null;
    }
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-umbra-canvas text-foam-ink">
        <Sidebar
          adminEmail={user.email}
          account={
            account
              ? {
                  username: account.username,
                  name: account.name,
                  profilePictureUrl: account.profilePictureUrl,
                }
              : null
          }
          pendingReplies={pendingReplies}
          activeKeywords={activeKeywords}
          scheduledCount={scheduledCount}
          quota={quota}
        />
        <div className="pl-60 flex flex-col min-h-screen">
          <Topbar adminEmail={user.email} profilePictureUrl={account?.profilePictureUrl ?? null} username={account?.username} />
          <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto space-y-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}