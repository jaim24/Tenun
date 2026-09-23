import { prisma } from "@/lib/db";
import Badge from "@/components/badge";
import Icon from "@/components/icon";
import QueueRow from "./queue-row";

export const dynamic = "force-dynamic";

export default async function RepliesPage() {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });

  const [pending, recentLogs] = await Promise.all([
    prisma.replyDraft.findMany({
      where: { status: { in: ["PENDING", "APPROVED", "FAILED"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        match: {
          select: {
            username: true,
            text: true,
            permalink: true,
            postedAt: true,
            keyword: { select: { text: true } },
          },
        },
      },
    }),
    prisma.replyDraft.findMany({
      where: { status: "SENT" },
      orderBy: { repliedAt: "desc" },
      take: 30,
      select: {
        id: true,
        targetThreadId: true,
        targetUsername: true,
        targetText: true,
        suggestedText: true,
        status: true,
        repliedAt: true,
        createdAt: true,
      },
    }),
    prisma.replyLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <>
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-hairline">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-mute uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span className="text-dim-veil">/</span>
            <span className="text-foam-ink">Kendali Balasan</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foam-ink">Reply Queue</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-ash-rise border border-hairline text-slate-mute">
            <span className="w-1.5 h-1.5 rounded-full bg-caution-amber animate-breathing-dot" />
            <span className="text-foam-ink">{pending.length} menunggu persetujuan</span>
          </div>
        </div>
      </section>

      <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-[2px] bg-ember" />
            <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Antrean Persetujuan</h2>
          </div>
          <span className="font-mono text-[10px] text-slate-mute">Draf otomatis + manual</span>
        </div>
        {pending.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">Antrean bersih</p>
            <p className="text-[13px] text-dim-veil">
              Ketika keyword menemukan percakapan (dan auto-reply aktif), draf muncul di sini untuk Anda tinjau sebelum terkirim.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {pending.map((d) => (
              <QueueRow key={d.id} draft={d} connected={Boolean(account)} />
            ))}
          </div>
        )}
      </section>

      {(recentLogs.length > 0) && (
        <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-healthy-lime" />
              <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Balasan Terkirim</h2>
            </div>
            <span className="font-mono text-[10px] text-slate-mute">{recentLogs.length} riwayat</span>
          </div>
          <div className="divide-y divide-hairline">
            {recentLogs.slice(0, 20).map((l: { id: string; text?: string; suggestedText?: string; permalink?: string | null; createdAt: Date | string; targetUsername?: string | null }) => (
              <div key={l.id} className="p-4 hover:bg-ash-rise/40 transition-colors flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-mute">
                  <span className="text-foam-ink font-medium">
                    REPLY <span className="text-dim-veil">ke @{l.targetUsername ?? "thread"}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone="lime">TERKIRIM</Badge>
                    <span>{timeAgoLocal(l.createdAt)}</span>
                  </span>
                </div>
                <p className="text-[12px] text-foam-ink whitespace-pre-wrap">{l.text ?? l.suggestedText ?? ""}</p>
                {l.permalink && (
                  <a href={l.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-mute hover:text-foam-ink">
                    Buka balasan → <Icon name="north_east" className="text-[11px]" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function timeAgoLocal(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  return `${Math.floor(hrs / 24)}h lalu`;
}