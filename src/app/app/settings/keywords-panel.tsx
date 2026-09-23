"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/badge";
import Icon from "@/components/icon";
import { api } from "@/lib/client";

type KeywordItem = {
  id: string;
  text: string;
  mode: string;
  isActive: boolean;
  matchCount: number;
};

export default function KeywordsPanel({ keywords }: { keywords: KeywordItem[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"KEYWORD" | "TAG">("KEYWORD");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [replyTemplate, setReplyTemplate] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [templateDraft, setTemplateDraft] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  async function add() {
    if (!text.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      await api("/api/keywords", {
        method: "POST",
        body: { text: text.trim(), mode, autoReplyEnabled, replyTemplate: autoReplyEnabled ? replyTemplate.trim() : null },
      });
      setText("");
      setReplyTemplate("");
      setAutoReplyEnabled(false);
      router.refresh();
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Gagal menambah keyword" });
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      await api(`/api/keywords/${id}`, { method: "PATCH", body });
      router.refresh();
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Gagal memperbarui" });
    }
  }

  async function saveTemplate(id: string) {
    const tpl = (templateDraft[id] ?? "").trim();
    try {
      await api(`/api/keywords/${id}`, { method: "PATCH", body: { replyTemplate: tpl || null, autoReplyEnabled: Boolean(tpl) } });
      setEditing(null);
      router.refresh();
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Gagal menyimpan template" });
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus keyword ini beserta riwayat match-nya?")) return;
    try {
      await api(`/api/keywords/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Gagal menghapus" });
    }
  }

  return (
    <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
        <div className="flex items-center gap-2">
          <Icon name="manage_search" className="text-[16px] text-slate-mute" />
          <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Vektor Keyword</h2>
        </div>
        <span className="font-mono text-[10px] text-slate-mute">{keywords.length} vektor</span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="mis. ekonomi digital Indonesia"
                className="flex-1 h-10 px-3.5 bg-umbra-canvas text-foam-ink text-sm rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember transition-colors"
              />
              <div className="inline-flex rounded border border-hairline overflow-hidden bg-ash-rise shrink-0">
                {(["KEYWORD", "TAG"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 h-10 font-mono text-[11px] transition-colors ${mode === m ? "bg-ember text-umbra-canvas font-semibold" : "text-slate-mute hover:text-foam-ink"}`}
                    type="button"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <ToggleCheck checked={autoReplyEnabled} onChange={setAutoReplyEnabled} />
              <span className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">Auto-reply (draf pending)</span>
            </label>
            {autoReplyEnabled && (
              <input
                value={replyTemplate}
                onChange={(e) => setReplyTemplate(e.target.value)}
                placeholder='Template balasan… gunakan {username} = @akun'
                className="w-full h-10 px-3.5 bg-umbra-canvas text-foam-ink font-mono text-xs rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember transition-colors"
              />
            )}
            <button
              onClick={add}
              disabled={busy || !text.trim()}
              className="inline-flex items-center gap-2 px-4 h-10 rounded bg-ember text-umbra-canvas font-semibold text-[12px] hover:opacity-90 disabled:opacity-50"
              type="button"
            >
              <Icon name="add" className="text-[16px]" />
              Tambah Vektor
            </button>
          </div>

          <div className="space-y-2">
            <p className="font-mono text-[10px] text-dim-veil uppercase tracking-wider">Cara kerja</p>
            <p className="text-[12px] text-slate-mute leading-relaxed">
              Vektor aktif dipindai oleh cron <span className="font-mono text-foam-ink">/api/cron/search</span> secara berkala.
              Match baru dicatat; jika auto-reply aktif, draf balasan dibuat dan masuk antrean persetujuan di Reply Queue.
            </p>
          </div>
        </div>

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

      <div className="border-t border-hairline divide-y divide-hairline">
        {keywords.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">Belum ada vektor</p>
            <p className="text-[12px] text-dim-veil mt-1">Tambahkan keyword pertama di atas untuk mulai memantau percakapan.</p>
          </div>
        )}
        {keywords.map((k) => (
          <div key={k.id} className="px-4 py-3 flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={k.isActive}
                onChange={(e) => patch(k.id, { isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-3.5 after:h-3.5 after:rounded-full after:bg-slate-mute after:transition-all peer-checked:after:translate-x-[14px] peer-checked:after:bg-ember rounded-full bg-ash-rise border border-hairline peer-checked:bg-ember/20 transition-colors" style={{ height: "18px", width: "32px" }} />
            </label>
            <div className="flex flex-col min-w-0 flex-1">
              <span className={`text-[13px] truncate ${k.isActive ? "text-foam-ink" : "text-dim-veil line-through"}`}>
                {k.mode === "TAG" ? "#" : ""}
                {k.text}
              </span>
              <span className="font-mono text-[10px] text-dim-veil">
                {k.matchCount} match
              </span>
            </div>
            <button
              onClick={() => {
                setEditing(k.id);
                setTemplateDraft((d) => ({ ...d, [k.id]: "" }));
              }}
              className="p-1.5 text-slate-mute hover:text-foam-ink transition-colors"
              title="Template auto-reply"
              type="button"
            >
              <Icon name="tune" className="text-[16px]" />
            </button>
            <button
              onClick={() => remove(k.id)}
              className="p-1.5 text-slate-mute hover:text-coral-alert transition-colors"
              title="Hapus"
              type="button"
            >
              <Icon name="delete" className="text-[16px]" />
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="px-4 py-3 border-t border-hairline bg-ash-rise/40 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">Template balasan otomatis</span>
            <span className="font-mono text-[10px] text-dim-veil">{`{username}`} = @nama akun</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={templateDraft[editing] ?? ""}
              onChange={(e) => setTemplateDraft((d) => ({ ...d, [editing]: e.target.value }))}
              placeholder="Setuju dengan sudut pandang ini, {username}. Data sekunder kami menunjukkan pola serupa."
              className="flex-1 h-10 px-3.5 bg-umbra-canvas text-foam-ink font-mono text-xs rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember transition-colors"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="px-3 h-10 rounded bg-ash-rise text-slate-mute font-mono text-[11px] border border-hairline" type="button">
                Batal
              </button>
              <button onClick={() => saveTemplate(editing)} className="px-3 h-10 rounded bg-ember text-umbra-canvas font-semibold text-[11px]" type="button">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ToggleCheck({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      type="button"
      className={`relative w-8 h-[18px] rounded-full border border-hairline transition-colors ${checked ? "bg-ember/20" : "bg-ash-rise"}`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-3.5 h-3.5 rounded-full transition-all ${checked ? "translate-x-[14px] bg-ember" : "bg-slate-mute"}`}
      />
    </button>
  );
}