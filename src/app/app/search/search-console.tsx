"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/icon";
import { api } from "@/lib/client";
import { timeAgo } from "@/lib/format";

type ThreadResult = {
  id: string;
  media_product_type?: string;
  permalink?: string;
  username?: string;
  text?: string;
  timestamp?: string;
};

export default function SearchConsole({
  connected,
  keywords,
}: {
  connected: boolean;
  keywords: string[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"KEYWORD" | "TAG">("KEYWORD");
  const [results, setResults] = useState<ThreadResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function run() {
    setNotice(null);
    if (!q.trim()) {
      setNotice({ kind: "err", msg: "Kata kunci pencarian wajib diisi." });
      return;
    }
    if (!connected) {
      setNotice({ kind: "err", msg: "Belum ada akun Threads. Sambungkan dulu di Settings." });
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ posts: ThreadResult[] }>("/api/search", {
        method: "POST",
        body: { q: q.trim(), mode },
      });
      setResults(res.posts);
      setNotice({
        kind: "ok",
        msg: `${res.posts.length} hasil untuk "${q.trim()}" · search quota 500/7 hari`,
      });
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Pencarian gagal" });
      setResults(null);
    } finally {
      setBusy(false);
    }
  }

  async function queue(thread: ThreadResult) {
    const replyText = (drafts[thread.id] ?? "").trim();
    setBusy(true);
    setNotice(null);
    try {
      const res = await api("/api/search/queue", {
        method: "POST",
        body: {
          q: q.trim(),
          mode,
          thread: {
            id: thread.id,
            username: thread.username,
            text: thread.text,
            permalink: thread.permalink,
            timestamp: thread.timestamp,
          },
          replyText: replyText || undefined,
        },
      });
      setNotice({
        kind: "ok",
        msg: res.draft ? "Draf balasan masuk antrean persetujuan ✓" : "Match dicatat (buka Replies untuk draf balasan) ✓",
      });
      router.refresh();
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Gagal mengantre" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-[2px] bg-ember" />
            <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Pemindai Percakapan</h2>
          </div>
          <span className="font-mono text-[10px] text-slate-mute">SEARCH_TYPE · KEYWORD/TAG</span>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 w-full">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run()}
                placeholder="ekonomi digital Indonesia UMKM"
                className="w-full h-10 px-3.5 bg-umbra-canvas text-foam-ink text-sm rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded border border-hairline overflow-hidden bg-ash-rise">
                {(["KEYWORD", "TAG"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 h-10 font-mono text-[11px] transition-colors ${
                      mode === m ? "bg-ember text-umbra-canvas font-semibold" : "text-slate-mute hover:text-foam-ink"
                    }`}
                    type="button"
                  >
                    {m === "KEYWORD" ? "# KEYWORD" : "# TAG"}
                  </button>
                ))}
              </div>
              <button
                onClick={run}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 h-10 rounded bg-ember text-umbra-canvas font-semibold text-[12px] hover:opacity-90 disabled:opacity-50"
                type="button"
              >
                <Icon name="search" className="text-[16px]" />
                {busy ? "…" : "Scan"}
              </button>
            </div>
          </div>

          {keywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] text-dim-veil uppercase tracking-wider">Vektor tersimpan:</span>
              {keywords.slice(0, 10).map((k) => (
                <button
                  key={k}
                  onClick={() => setQ(k)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ash-rise text-foam-ink font-mono text-[11px] border border-hairline hover:border-ember/40 transition-colors"
                  type="button"
                >
                  <span className="text-ember font-bold">#</span>
                  {k}
                </button>
              ))}
            </div>
          )}

          {notice && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded border font-mono text-[11px] ${
                notice.kind === "ok"
                  ? "bg-healthy-lime/10 border-healthy-lime/20 text-healthy-lime"
                  : "bg-coral-alert/10 border-coral-alert/20 text-coral-alert"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${notice.kind === "ok" ? "bg-healthy-lime" : "bg-coral-alert"}`} />
              {notice.msg}
            </div>
          )}
        </div>
      </section>

      {results === null ? null : results.length === 0 ? (
        <section className="rounded bg-graphite-panel border border-hairline p-8 text-center space-y-2">
          <p className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">Tidak ada hasil</p>
          <p className="text-[13px] text-dim-veil">Coba keyword berbeda atau ganti mode TAG/KEYWORD.</p>
        </section>
      ) : (
        <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
            <div className="flex items-center gap-2">
              <Icon name="manage_search" className="text-[16px] text-slate-mute" />
              <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Hasil Pindai</h2>
            </div>
            <span className="font-mono text-[10px] text-slate-mute">{results.length} item</span>
          </div>
          <div className="divide-y divide-hairline">
            {results.map((r) => (
              <div key={r.id} className="p-4 hover:bg-ash-rise/40 transition-colors flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-mute">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-foam-ink font-medium">@{r.username ?? "akun"}</span>
                    {r.timestamp && <span className="text-dim-veil">· {timeAgo(r.timestamp)}</span>}
                  </span>
                  {r.permalink && (
                    <a href={r.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-mute hover:text-foam-ink transition-colors">
                      Lihat <Icon name="north_east" className="text-[11px]" />
                    </a>
                  )}
                </div>
                <p className="text-[13px] text-foam-ink leading-normal whitespace-pre-wrap">{r.text ?? "(tanpa teks)"}</p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-hairline">
                  <textarea
                    value={drafts[r.id] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value.slice(0, 500) }))}
                    placeholder="Tulis draf balasan… (opsional, maks 500)"
                    rows={2}
                    className="flex-1 w-full bg-umbra-canvas text-foam-ink text-[12px] rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember p-2.5 resize-y"
                  />
                  <div className="flex sm:flex-col gap-2 sm:self-center">
                    <button
                      onClick={() =>
                        router.push(
                          `/app/posts?topic=${encodeURIComponent(q.trim().slice(0, 120))}&context=${encodeURIComponent(
                            (r.text ?? "").slice(0, 300)
                          )}`
                        )
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 h-9 rounded bg-graphite-panel text-foam-ink font-semibold text-[11px] border border-hairline hover:border-ember/40 transition-colors"
                      type="button"
                    >
                      <Icon name="auto_awesome" className="text-[13px] text-ember" />
                      Jadikan Post
                    </button>
                    <button
                      onClick={() => queue(r)}
                      disabled={busy}
                      className="sm:self-center px-3.5 h-9 rounded bg-ash-rise text-foam-ink font-semibold text-[11px] border border-hairline hover:border-ember/40 transition-colors disabled:opacity-50"
                      type="button"
                    >
                      Antre sebagai Balasan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}