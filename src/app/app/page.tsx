import Link from "next/link";
import { prisma } from "@/lib/db";
import Badge from "@/components/badge";
import Icon from "@/components/icon";
import { PUBLISHING_LIMIT, getPublishingQuota } from "@/lib/threads";
import { clockUtc, formatUtc, inHumanized, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const todayStart = new Date();
todayStart.setUTCHours(0, 0, 0, 0);
const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);

export default async function DashboardPage() {
  const [
    account,
    postsToday,
    repliesToday,
    repliesTotal,
    matches24h,
    pendingReplies,
    activities,
    scheduled,
    keywords,
    drafts,
  ] = await Promise.all([
    prisma.account.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.threadPost.count({ where: { status: "PUBLISHED", publishedAt: { gte: todayStart } } }),
    prisma.replyLog.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.replyLog.count(),
    prisma.searchMatch.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.replyDraft.count({ where: { status: "PENDING" } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.threadPost.findMany({ where: { status: "SCHEDULED" }, orderBy: { scheduledFor: "asc" }, take: 3 }),
    prisma.keyword.findMany({ where: { isActive: true }, take: 30 }),
    prisma.replyDraft.count({ where: { createdAt: { gte: dayAgo } } }),
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

  const used = Math.min(quota?.postsUsed ?? 0, quota?.postsTotal ?? PUBLISHING_LIMIT);
  const totalQ = quota?.postsTotal ?? PUBLISHING_LIMIT;
  const pct = quota ? Math.round((used / totalQ) * 1000) / 10 : 0;

  return (
    <>
      {/* Kumbah & sub-bar */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-hairline">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-mute uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span className="text-dim-veil">/</span>
            <span className="text-foam-ink">Operasi Otonom</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foam-ink">Studio Overview</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-ash-rise border border-hairline text-slate-mute">
            <span className="w-1.5 h-1.5 rounded-full bg-ember animate-breathing-dot" />
            <span className="text-foam-ink">
              Mendengarkan {keywords.length} vektor aktif
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-mute">
            <Icon name="schedule" className="text-[14px]" />
            <span className="font-mono text-foam-ink uppercase">{formatUtc(new Date())}</span>
          </div>
        </div>
      </section>

      {/* Kartu metrik */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded bg-graphite-panel border border-hairline flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-mute uppercase tracking-wider">
            <span>Post Hari Ini</span>
            <span className="text-dim-veil">{drafts} draf baru</span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold text-foam-ink tracking-tight">{postsToday}</span>
            <span className="font-mono text-xs text-slate-mute">/ {totalQ} limit</span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-1 bg-ash-rise rounded-full overflow-hidden">
              <div className={`h-full ${pct >= 90 ? "bg-coral-alert" : pct >= 70 ? "bg-caution-amber" : "bg-foam-ink"}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-slate-mute">
              <span>{pct}% dari kuota</span>
              <span>{Math.max(0, totalQ - used)} tersisa</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded bg-graphite-panel border border-hairline flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-mute uppercase tracking-wider">
            <span>Balasan Terkirim</span>
            <Badge tone="lime">TODAY {repliesToday}</Badge>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold text-foam-ink tracking-tight">{repliesTotal}</span>
            <span className="font-mono text-xs text-slate-mute">dispatches</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-mute">
            <Icon name="arrow_upward" className="text-[14px] text-healthy-lime" />
            <span className="text-healthy-lime font-medium">{pendingReplies} antre</span>
            <span>menunggu persetujuan</span>
          </div>
        </div>

        <div className="p-4 rounded bg-graphite-panel border border-hairline flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-mute uppercase tracking-wider">
            <span>Kecocokan Keyword</span>
            <Badge>24H CYCLE</Badge>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold text-foam-ink tracking-tight">{matches24h}</span>
            <span className="font-mono text-xs text-slate-mute">terscan</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-mute">
            <span>Antrean Review</span>
            <span className={pendingReplies ? "text-caution-amber font-medium" : "text-healthy-lime"}>
              {pendingReplies} pending
            </span>
          </div>
        </div>

        <div className="p-4 rounded bg-graphite-panel border border-hairline flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-mute uppercase tracking-wider">
            <span>Threads Graph API</span>
            {pct >= 90 ? <Badge tone="coral">HAMPIR PENUH</Badge> : <Badge tone="amber">TIER 1 QUOTA</Badge>}
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className={`font-mono text-3xl font-semibold tracking-tight ${pct >= 70 ? "text-caution-amber" : "text-foam-ink"}`}>
                {quota ? used : "—"}
              </span>
              <span className="font-mono text-xs text-slate-mute">/ {totalQ}</span>
            </div>
            <span className={`font-mono text-xs font-medium ${pct >= 70 ? "text-caution-amber" : "text-slate-mute"}`}>
              {quota ? `${pct}%` : "BELUM TERHUBUNG"}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-1 bg-ash-rise rounded-full overflow-hidden">
              <div className={`h-full ${pct >= 90 ? "bg-coral-alert" : "bg-caution-amber"}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-slate-mute">
              <span>Jendela reset 24 jam</span>
              <Link href="/app/settings" className="font-mono text-healthy-lime hover:underline">Kelola akun →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grid 65/35 */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
            <div className="flex items-center gap-2">
              <Icon name="stream" className="text-[18px] text-ember" />
              <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Feed Aktivitas Live</h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-mute">
              <span className="w-1.5 h-1.5 rounded-full bg-healthy-lime" />
              <span>STREAM_INGEST_OK</span>
            </div>
          </div>

          <div className="divide-y divide-hairline">
            {activities.length === 0 && (
              <div className="p-8 text-center space-y-2">
                <p className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">Belum ada aktivitas</p>
                <p className="text-[13px] text-dim-veil">Susun naskah perdana di Compose Post untuk memulai alur.</p>
              </div>
            )}
            {activities.map((a) => {
              const tone =
                a.type === "ERROR"
                  ? { badge: "coral", label: "MENGALAMI GANGGUAN", text: "text-coral-alert" }
                  : a.type === "DISPATCH"
                  ? { badge: "lime", label: "THREAD DISPATCH", text: "text-foam-ink" }
                  : a.type === "REPLY"
                  ? { badge: "lime", label: "AUTOMATED REPLY", text: "text-foam-ink" }
                  : a.type === "KEYWORD" || a.type === "SEARCH"
                  ? { badge: "amber", label: "KEYWORD SCANNER", text: "text-ember" }
                  : a.type === "CRON"
                  ? { badge: "amber", label: "SCHEDULED SEQUENCE", text: "text-foam-ink" }
                  : a.type === "AUTH"
                  ? { badge: "slate", label: "AUTENTIKASI", text: "text-foam-ink" }
                  : { badge: "slate", label: "SISTEM", text: "text-foam-ink" };
              return (
                <article key={a.id} className="p-4 hover:bg-ash-rise/40 transition-colors flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-mute">
                      <span className={tone.text + " font-medium"}>{tone.label}</span>
                      <span className="text-dim-veil">·</span>
                      <span>{timeAgo(a.createdAt)}</span>
                    </div>
                    <Badge tone={tone.badge as any}>{a.type}</Badge>
                  </div>
                  <p className="text-[13px] text-foam-ink leading-normal">{a.message}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="p-4 rounded bg-graphite-panel border border-hairline space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-mute">Dispatch Instan</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-ash-rise text-slate-mute border border-hairline">⌘N</span>
            </div>
            <p className="text-[12px] text-foam-ink leading-relaxed">
              Susun thread, atur jadwal, lalu kirim ke jaringan produksi dalam satu gerakan.
            </p>
            <Link
              href="/app/posts?new=1"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-ember text-umbra-canvas font-semibold text-[12px] hover:opacity-95 active:scale-[0.99] transition-all"
            >
              <Icon name="edit_note" className="text-[16px]" />
              <span>Buka Studio Composer</span>
            </Link>
          </div>

          <div className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="schedule" className="text-[16px] text-slate-mute" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foam-ink">Post Terjadwal Berikut</h3>
              </div>
              <span className="font-mono text-[10px] text-slate-mute">{scheduled.length} Antre</span>
            </div>
            <div className="divide-y divide-hairline">
              {scheduled.length === 0 && (
                <div className="p-4 text-center">
                  <p className="font-mono text-[10px] text-slate-mute uppercase tracking-wider">Kosong</p>
                  <p className="text-[12px] text-dim-veil mt-1">Tidak ada post terjadwal.</p>
                </div>
              )}
              {scheduled.map((p) => (
                <Link href="/app/posts" key={p.id} className="p-3.5 hover:bg-ash-rise/40 transition-colors block space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-ember font-medium tracking-wide">
                      {clockUtc(p.scheduledFor)} UTC (DALAM {inHumanized(p.scheduledFor)})
                    </span>
                    <span className="text-slate-mute">Post</span>
                  </div>
                  <p className="text-[12px] text-foam-ink line-clamp-2">{p.text}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-4 rounded bg-graphite-panel border border-hairline space-y-3">
            <div className="flex items-center justify-between border-b border-hairline pb-2.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-mute">Vektor Yang Dipantau</span>
              <span className="font-mono text-[10px] text-healthy-lime flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-healthy-lime animate-breathing-dot" />
                STREAM_STABLE
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {keywords.length === 0 && (
                <span className="font-mono text-[11px] text-dim-veil">Belum ada keyword aktif — konfigurasi di Settings.</span>
              )}
              {keywords.slice(0, 8).map((k) => (
                <span key={k.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ash-rise text-foam-ink font-mono text-[11px] border border-hairline">
                  <span className="text-ember font-bold">{k.mode === "TAG" ? "#" : "#"}</span>
                  {k.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}