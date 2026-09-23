"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/icon";
import { LogoMark } from "@/components/decor";

type Quota = { postsUsed: number; postsTotal: number };

export default function Sidebar({
  adminEmail,
  account,
  pendingReplies,
  activeKeywords,
  scheduledCount,
  quota,
}: {
  adminEmail: string;
  account: { username: string; name: string | null; profilePictureUrl: string | null } | null;
  pendingReplies: number;
  activeKeywords: number;
  scheduledCount: number;
  quota: Quota | null;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/app", label: "Overview", icon: "dashboard" as const },
    { href: "/app/posts", label: "Compose Post", icon: "edit_note" as const },
    { href: "/app/replies", label: "Reply Queue", icon: "forum" as const, count: pendingReplies },
    { href: "/app/search", label: "Keyword Search", icon: "manage_search" as const },
    { href: "/app/settings", label: "Settings / Accounts", icon: "tune" as const },
  ];

  const used = quota ? Math.min(quota.postsUsed, quota.postsTotal) : 0;
  const total = quota?.postsTotal ?? 250;
  const pct = quota ? Math.round((used / total) * 1000) / 10 : 0;
  const barColor = !quota ? "" : pct >= 90 ? "bg-coral-alert" : pct >= 70 ? "bg-caution-amber" : "bg-foam-ink";

  function isActive(href: string) {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-graphite-panel border-r border-hairline z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col min-h-0">
        <div className="h-14 px-4 flex items-center justify-between border-b border-hairline shrink-0">
          <Link href="/app" className="flex items-center gap-2.5">
            <LogoMark className="w-7 h-7 rounded-md" />
            <span className="font-mono text-sm font-semibold tracking-tight text-foam-ink uppercase">Tenun</span>
          </Link>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-ash-rise border border-hairline">
            <span className="w-1.5 h-1.5 rounded-full bg-ember animate-breathing-dot" />
            <span className="font-mono text-[10px] tracking-wider text-slate-mute uppercase">Live</span>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-hairline bg-graphite-panel shrink-0">
          <div className="flex items-center justify-between font-mono text-[11px] mb-1.5">
            <span className="text-slate-mute uppercase tracking-wider">Rate Quota</span>
            <span className="text-foam-ink font-medium">
              {quota ? used : "—"} <span className="text-dim-veil">/ {total}</span>
            </span>
          </div>
          <div className="w-full h-1 bg-ash-rise rounded-full overflow-hidden">
            <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: quota ? `${pct}%` : "0%" }} />
          </div>
          {!quota && (
            <p className="font-mono text-[10px] text-dim-veil mt-1.5">
              Hubungkan akun di Settings untuk kuota live.
            </p>
          )}
        </div>

        <nav className="flex flex-col p-2 space-y-0.5 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${
                isActive(link.href)
                  ? "text-foam-ink bg-ash-rise border-l-2 border-ember font-medium"
                  : "text-slate-mute hover:text-foam-ink hover:bg-ash-rise/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name={link.icon} className="text-[18px]" />
                <span>{link.label}</span>
              </div>
              {"count" in link && link.count ? (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-ash-rise text-slate-mute border border-hairline">
                  {link.count}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-3 border-t border-hairline bg-graphite-panel shrink-0">
        {account ? (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded">
            {account.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={account.username}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-hairline"
                src={account.profilePictureUrl}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-ash-rise ring-1 ring-hairline flex items-center justify-center font-mono text-[11px] text-ember">
                @
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[12px] font-medium text-foam-ink truncate leading-tight">
                {account.name ?? "Akun Threads"}
              </span>
              <span className="font-mono text-[10px] text-slate-mute truncate">@{account.username}</span>
            </div>
            <button className="text-slate-mute hover:text-foam-ink transition-colors p-1" title="Keluar" onClick={logout} type="button">
              <Icon name="logout" className="text-[16px]" />
            </button>
          </div>
        ) : (
          <div className="px-2 py-1.5 flex items-center justify-between">
            <span className="font-mono text-[10px] text-dim-veil uppercase tracking-wider">
              {adminEmail}
            </span>
            <button className="text-slate-mute hover:text-foam-ink transition-colors p-1" title="Keluar" onClick={logout} type="button">
              <Icon name="logout" className="text-[16px]" />
            </button>
          </div>
        )}
        <div className="px-2 pt-1.5 flex items-center gap-2 font-mono text-[10px] text-dim-veil">
          <span className="w-1.5 h-1.5 rounded-full bg-healthy-lime" />
          <span>{activeKeywords} vektor · {scheduledCount} terjadwal</span>
        </div>
      </div>
    </aside>
  );
}