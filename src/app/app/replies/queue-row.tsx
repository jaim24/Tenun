"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge, { replyStatusTone } from "@/components/badge";
import Icon from "@/components/icon";
import { api } from "@/lib/client";
import { timeAgo } from "@/lib/format";

type Draft = {
  id: string;
  targetThreadId: string;
  targetUsername: string | null;
  targetText: string | null;
  targetPermalink: string | null;
  suggestedText: string;
  status: string;
  error: string | null;
  createdAt: Date;
  repliedAt: Date | null;
  replyTemplate?: string | null;
  keyword?: { text: string } | null;
  match?: { username: string | null; text: string | null; permalink: string | null; keyword?: { text: string } | null } | null;
};

export default function QueueRow({ draft, connected }: { draft: Draft; connected: boolean }) {
  const router = useRouter();
  const [text, setText] = useState(draft.suggestedText);
  const [busy, setBusy] = useState<"send" | "skip" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const username = draft.targetUsername ?? draft.match?.username;
  const originalText = draft.targetText ?? draft.match?.text;
  const permalink = draft.targetPermalink ?? draft.match?.permalink;

  async function act(action: "send" | "skip") {
    setBusy(action);
    setError(null);
    try {
      if (action === "send") {
        if (!text.trim()) throw new Error("Naskah balasan wajib diisi");
        if (!connected) throw new Error("Belum ada akun Threads terhubung — cek Settings");
        await api(`/api/replies/${draft.id}`, { method: "PATCH", body: { suggestedText: text } });
        await api(`/api/replies/${draft.id}`, { method: "POST" });
        setSent(true);
      } else {
        await api(`/api/replies/${draft.id}`, { method: "DELETE" });
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(null);
    }
  }

  if (sent) return null;

  return (
    <article className="p-4 hover:bg-ash-rise/40 transition-colors flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-mute">
          <span className="text-foam-ink font-medium">BALASAN</span>
          <span className="text-dim-veil">·</span>
          <span>
            ke <span className="text-foam-ink">@{username ?? "thread"}</span>
          </span>
          <span className="text-dim-veil">·</span>
          <span>{timeAgo(draft.createdAt)}</span>
        </div>
        <Badge tone={replyStatusTone(draft.status)} pulse={draft.status === "APPROVED"}>
          {draft.status === "APPROVED" ? "MENGIRIM…" : draft.status === "FAILED" ? "GAGAL" : "MENUNGGU REVIEW"}
        </Badge>
      </div>

      {permalink && (
        <div className="font-mono text-[10px] text-slate-mute flex items-center gap-2">
          <span className="text-dim-veil">Sumber thread:</span>
          <a href={permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foam-ink transition-colors">
            buka di Threads <Icon name="north_east" className="text-[11px]" />
          </a>
        </div>
      )}

      <div className="p-3 rounded bg-ash-rise border border-hairline space-y-1">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-dim-veil uppercase tracking-wide">
          <Icon name="format_quote" className="text-[12px]" />
          {draft.keyword ? `vektor "${draft.keyword.text}"` : draft.match?.keyword ? `vektor "${draft.match.keyword.text}"` : "konteks thread"}
        </div>
        <p className="text-[12px] text-foam-ink whitespace-pre-wrap">{originalText ?? "(tanpa teks)"}</p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs mb-1">
          <label className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">Naskah Balasan</label>
          <span className={`font-mono text-[10px] ${text.length > 500 ? "text-coral-alert" : "text-dim-veil"}`}>
            {text.length} / 500
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          rows={2}
          className="w-full bg-umbra-canvas text-foam-ink text-[12px] rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember p-2.5 resize-y"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-coral-alert/10 border border-coral-alert/20 text-coral-alert font-mono text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-coral-alert" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-hairline">
        <span className="font-mono text-[10px] text-dim-veil">
          {draft.status === "FAILED" ? "Coba lagi setelah memperbaiki." : "Persetujuan manual — Anda yang menekan kirim."}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => act("skip")}
            disabled={busy !== null}
            className="px-2.5 py-1.5 rounded bg-ash-rise text-slate-mute font-mono text-[11px] border border-hairline hover:text-foam-ink transition-colors disabled:opacity-50"
            type="button"
          >
            Lewati
          </button>
          <button
            onClick={() => act("send")}
            disabled={busy !== null}
            className="px-3.5 py-1.5 rounded bg-ember text-umbra-canvas font-semibold text-[11px] hover:opacity-90 disabled:opacity-50"
            type="button"
          >
            {busy === "send" ? "Mengirim…" : "Kirim Balasan"}
          </button>
        </div>
      </div>
    </article>
  );
}