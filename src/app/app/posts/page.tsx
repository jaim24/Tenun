import { prisma } from "@/lib/db";
import ComposeForm from "./compose-form";
import PostRow from "./post-row";

export const dynamic = "force-dynamic";

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ new?: string; topic?: string; context?: string }> }) {
  const { new: isNew, topic, context } = await searchParams;
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  const affiliates = await prisma.affiliateLink.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });

  const [scheduled, drafts, published, failed] = await Promise.all([
    prisma.threadPost.findMany({ where: { status: "SCHEDULED" }, orderBy: { scheduledFor: "asc" }, take: 100 }),
    prisma.threadPost.findMany({ where: { status: "DRAFT" }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.threadPost.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 30 }),
    prisma.threadPost.findMany({ where: { status: { in: ["FAILED", "PROCESSING"] } }, orderBy: { updatedAt: "desc" }, take: 20 }),
  ]);

  return (
    <>
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-hairline">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-mute uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span className="text-dim-veil">/</span>
            <span className="text-foam-ink">Studio</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foam-ink">Compose Post</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-ash-rise border border-hairline text-slate-mute">
            <span className="w-1.5 h-1.5 rounded-full bg-ember animate-breathing-dot" />
            <span className="text-foam-ink">Threads post · maks 500 karakter</span>
          </div>
        </div>
      </section>

      <ComposeForm
        focusOnMount={Boolean(isNew)}
        connected={Boolean(account)}
        initTopic={topic ?? ""}
        initContext={context ?? ""}
        affiliates={affiliates.map((a) => ({ id: a.id, label: a.label, url: a.url }))}
      />

      {failed.length > 0 && (
        <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
            <div className="flex items-center gap-2">
              <IconDot tone="coral" />
              <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Perlu Perhatian</h2>
            </div>
            <span className="font-mono text-[10px] text-slate-mute">{failed.length} item</span>
          </div>
          <div className="divide-y divide-hairline">
            {failed.map((p) => (
              <PostRow key={p.id} post={p} accountUsername={account?.username ?? null} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
          <div className="flex items-center gap-2">
            <IconDot tone="amber" />
            <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Jadwal &amp; Antrean</h2>
          </div>
          <span className="font-mono text-[10px] text-slate-mute">{scheduled.length + drafts.length} item</span>
        </div>
        {scheduled.length + drafts.length === 0 && (
          <div className="p-8 text-center space-y-2">
            <p className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">Antrean kosong</p>
            <p className="text-[13px] text-dim-veil">Naskah pertama Anda menunggu di composer di atas.</p>
          </div>
        )}
        <div className="divide-y divide-hairline">
          {scheduled.map((p) => <PostRow key={p.id} post={p} accountUsername={account?.username ?? null} />)}
          {drafts.map((p) => <PostRow key={p.id} post={p} accountUsername={account?.username ?? null} />)}
        </div>
      </section>

      <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
          <div className="flex items-center gap-2">
            <IconDot tone="lime" />
            <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Arsip Terbit</h2>
          </div>
          <span className="font-mono text-[10px] text-slate-mute">{published.length} item</span>
        </div>
        {published.length === 0 && (
          <div className="p-8 text-center space-y-2">
            <p className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">Belum ada yang terbit</p>
            <p className="text-[13px] text-dim-veil">Post perdana akan muncul di sini setelah dipublikasikan.</p>
          </div>
        )}
        <div className="divide-y divide-hairline">
          {published.map((p) => <PostRow key={p.id} post={p} accountUsername={account?.username ?? null} />)}
        </div>
      </section>
    </>
  );
}

function IconDot({ tone }: { tone: "coral" | "amber" | "lime" }) {
  const map = { coral: "bg-coral-alert", amber: "bg-caution-amber", lime: "bg-healthy-lime" };
  return <span className={`w-2 h-2 rounded-full ${map[tone]}`} />;
}