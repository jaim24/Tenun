import { prisma } from "@/lib/db";
import Link from "next/link";
import Badge from "@/components/badge";
import Icon from "@/components/icon";
import { getPublishingQuota } from "@/lib/threads";
import { getThreadsConfig, getEffectiveScopes, listConfigManifest } from "@/lib/config";
import { formatUtc } from "@/lib/format";
import DisconnectButton from "./disconnect-button";
import KeywordsPanel from "./keywords-panel";
import ConfigPanel from "./config-panel";
import AffiliatePanel from "./affiliate-panel";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ connected?: string; reason?: string }> }) {
  const params = await searchParams;
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });

  let quota: { postsUsed: number; postsTotal: number; repliesUsed: number; repliesTotal: number } | null = null;
  if (account?.accessToken) {
    try {
      const q = await getPublishingQuota(account.threadsUserId, account.accessToken);
      quota = { postsUsed: q.usage.posts, postsTotal: q.totals.posts, repliesUsed: q.usage.replies, repliesTotal: q.totals.replies };
    } catch {
      quota = null;
    }
  }

  let threadsConfigured = false;
  let scopes: string[] = [];
  try {
    await getThreadsConfig();
    threadsConfigured = true;
    scopes = (await getEffectiveScopes()).split(" ");
  } catch {
    threadsConfigured = false;
  }

  const keywords = await prisma.keyword.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { matches: true } } },
  });

  const configManifest = await listConfigManifest();

  const affiliates = await prisma.affiliateLink.findMany({ orderBy: { createdAt: "asc" } });

  const banner =
    params.connected === "ok"
      ? { kind: "ok", msg: "Akun Threads berhasil terhubung ✓" }
      : params.connected === "denied"
      ? { kind: "err", msg: "Koneksi dibatalkan di Meta." }
      : params.connected === "error"
      ? { kind: "err", msg: params.reason ? decodeURIComponent(params.reason) : "Gagal menghubungkan akun." }
      : null;

  return (
    <>
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-hairline">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-mute uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span className="text-dim-veil">/</span>
            <span className="text-foam-ink">Konfigurasi</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foam-ink">Settings / Accounts</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-ash-rise border border-hairline text-slate-mute">
            <span className={`w-1.5 h-1.5 rounded-full ${account ? "bg-healthy-lime" : "bg-caution-amber"} animate-breathing-dot`} />
            <span className="text-foam-ink">{account ? `@${account.username} aktif` : "Belum terhubung"}</span>
          </div>
        </div>
      </section>

      {banner && (
        <div
          className={`flex items-center gap-2 px-3 py-2.5 rounded border font-mono text-[11px] ${
            banner.kind === "ok"
              ? "bg-healthy-lime/10 border-healthy-lime/20 text-healthy-lime"
              : "bg-coral-alert/10 border-coral-alert/20 text-coral-alert"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${banner.kind === "ok" ? "bg-healthy-lime" : "bg-coral-alert"}`} />
          {banner.msg}
        </div>
      )}

      {/* Akun Threads */}
      <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-[2px] bg-ember" />
            <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Akun Threads</h2>
          </div>
          {account && <Badge tone="lime" pulse>T OKEN AKTIF</Badge>}
        </div>
        <div className="p-4 sm:p-5">
          {account ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                {account.profilePictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={account.profilePictureUrl} alt={account.username} className="w-12 h-12 rounded-full object-cover ring-1 ring-hairline" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-ash-rise ring-1 ring-hairline flex items-center justify-center font-mono text-ember">@</div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-medium text-foam-ink truncate">{account.name ?? account.username}</span>
                  <span className="font-mono text-[11px] text-slate-mute">@{account.username}</span>
                  <span className="font-mono text-[10px] text-dim-veil">
                    expired dalam {Math.max(0, Math.round((account.tokenExpiresAt.getTime() - Date.now()) / 86400000))} hari · {formatUtc(account.tokenExpiresAt)}
                  </span>
                </div>
              </div>

              {quota && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(
                    [
                      { label: "Kuota Posting", used: quota.postsUsed, total: quota.postsTotal },
                      { label: "Kuota Balasan", used: quota.repliesUsed, total: quota.repliesTotal },
                    ] as const
                  ).map((row) => {
                    const pct = Math.round((Math.min(row.used, row.total) / row.total) * 100);
                    return (
                      <div key={row.label} className="p-3 rounded bg-ash-rise border border-hairline">
                        <div className="flex items-center justify-between font-mono text-[11px] text-slate-mute uppercase tracking-wider mb-2">
                          <span>{row.label}</span>
                          <span className="text-foam-ink font-medium">
                            {row.used} <span className="text-dim-veil">/ {row.total}</span>
                          </span>
                        </div>
                        <div className="w-full h-1 bg-umbra-canvas rounded-full overflow-hidden">
                          <div className={`h-full ${pct >= 90 ? "bg-coral-alert" : pct >= 70 ? "bg-caution-amber" : "bg-healthy-lime"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-hairline pt-4">
                <span className="font-mono text-[10px] text-dim-veil">
                  Akses publish, reply, read, mentions, keyword search, insights.
                </span>
                <DisconnectButton />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-start">
              <p className="text-[13px] text-slate-mute">
                Sambungkan identitas Threads untuk mengaktifkan jadwal, balasan, dan pemantauan keyword.
              </p>
              {threadsConfigured ? (
                <>
                  <a
                    href="/api/threads/auth"
                    className="inline-flex items-center gap-2 px-4 h-10 rounded bg-ember text-umbra-canvas font-semibold text-[12px] hover:opacity-90 transition-all"
                  >
                    <Icon name="lock_open" className="text-[16px]" />
                    Sambungkan via Meta OAuth
                  </a>
                  <span className="font-mono text-[10px] text-dim-veil">
                    Scope yang diminta: {scopes.join(", ")}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded bg-caution-amber/10 border border-caution-amber/20 text-caution-amber font-mono text-[11px]">
                  ⚙ Kredensial Meta belum diatur: isi THREADS_CLIENT_ID, THREADS_CLIENT_SECRET, THREADS_REDIRECT_URI di .env dan daftarkan Redirect URI yang sama di Meta App.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <ConfigPanel
        configs={configManifest.map((c) => ({
          key: c.key,
          label: c.label,
          hint: c.hint,
          secret: c.secret,
          source: c.source,
          value: c.value,
        }))}
      />

      <KeywordsPanel keywords={keywords.map((k) => ({ id: k.id, text: k.text, mode: k.mode, isActive: k.isActive, matchCount: k._count.matches }))} />

      <AffiliatePanel links={affiliates.map((a) => ({ id: a.id, label: a.label, url: a.url, isActive: a.isActive }))} />

      {/* Batas & scope */}
      <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
          <div className="flex items-center gap-2">
            <Icon name="tune" className="text-[16px] text-slate-mute" />
            <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Batas Platform</h2>
          </div>
          <span className="font-mono text-[10px] text-slate-mute">META THREADS GRAPH API</span>
        </div>
        <div className="divide-y divide-hairline">
          {(
            [
              ["Posting", "250 post / 24 jam"],
              ["Balasan", "1.000 reply / 24 jam"],
              ["Pencarian", "500 permintaan search / 7 hari"],
              ["Token", "Long-lived ±60 hari (refresh otomatis saat koneksi ulang)"],
              ["App Review", "Reply ke akun lain & keyword search butuh Advanced Access di Meta App"],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">{k}</span>
              <span className="font-mono text-[11px] text-foam-ink text-right">{v}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-hairline bg-ash-rise/40">
          <Link href="/app/posts" className="font-mono text-[11px] text-ember hover:underline">
            Buka composer → Kembali ke menenun.
          </Link>
        </div>
      </section>
    </>
  );
}