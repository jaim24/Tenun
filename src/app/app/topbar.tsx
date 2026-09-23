"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/icon";

export default function Topbar({
  adminEmail,
  profilePictureUrl,
  username,
}: {
  adminEmail: string;
  profilePictureUrl?: string | null;
  username?: string | null;
}) {
  const [latency, setLatency] = useState<string | null>(null);
  const [logged, setLogged] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let last = 0;
    const tick = async () => {
      try {
        const start = performance.now();
        const res = await fetch("/api/health");
        const took = Math.round(performance.now() - start);
        if (active && res.ok) setLatency(`${took}ms`);
        const now = new Date().toISOString().slice(0, 16).replace("T", " ");
        setLogged(now);
        last = took;
        void last;
      } catch {
        /* diam */
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <header className="h-14 bg-graphite-panel/90 backdrop-blur-md border-b border-hairline sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-mute">
          <span className="w-2 h-2 rounded-full bg-ember animate-breathing-dot" />
          <span className="text-foam-ink font-medium tracking-wide">STUDIO_STABLE</span>
        </div>
        <span className="h-3 w-px bg-hairline" />
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-mute">
          <span>LATENSI:</span>
          <span className={latency && parseInt(latency) > 500 ? "text-caution-amber" : "text-healthy-lime"}>
            {latency ?? "…"}
          </span>
        </div>
        <span className="h-3 w-px bg-hairline" />
        <div className="font-mono text-[11px] text-slate-mute">{logged ?? "…"} UTC · {adminEmail}</div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/app/posts?new=1"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-ember text-umbra-canvas font-semibold text-[12px] hover:opacity-95 active:scale-[0.99] transition-all"
        >
          <Icon name="add" className="text-[16px]" />
          <span>Siaran Baru</span>
        </Link>
        <span className="h-3 w-px bg-hairline" />
        <button className="p-1.5 text-slate-mute hover:text-foam-ink transition-colors" title="Notifikasi" type="button">
          <Icon name="notifications" className="text-[18px]" />
        </button>
        {profilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={username ?? "avatar"} className="w-7 h-7 rounded-full object-cover ring-1 ring-hairline" src={profilePictureUrl} />
        ) : (
          <div className="w-7 h-7 rounded-full bg-ash-rise ring-1 ring-hairline flex items-center justify-center font-mono text-[10px] text-ember">
            @
          </div>
        )}
      </div>
    </header>
  );
}