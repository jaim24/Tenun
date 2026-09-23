"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/icon";
import { api } from "@/lib/client";
import { useToast } from "@/components/toast";

export type ConfigPanelItem = {
  key: string;
  label: string;
  hint: string;
  secret: boolean;
  source: "db" | "env" | null;
  value: string;
};

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  db: { label: "TERSIMPAN", cls: "bg-healthy-lime/10 border-healthy-lime/20 text-healthy-lime" },
  env: { label: "DARI .ENV", cls: "bg-caution-amber/10 border-caution-amber/20 text-caution-amber" },
  default: { label: "DEFAULT", cls: "bg-dim-veil/10 border-hairline text-dim-veil" },
};

export default function ConfigPanel({ configs }: { configs: ConfigPanelItem[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [aiTest, setAiTest] = useState<{ busy: boolean; result: string; kind: "ok" | "err" | null }>({
    busy: false,
    result: "",
    kind: null,
  });
  const toast = useToast();

  async function testAi() {
    setAiTest((s) => ({ ...s, busy: true, result: "" }));
    try {
      const res = await api<{ connected: boolean; provider: string | null; model: string; latencyMs: number }>(
        "/api/ai/test",
        { method: "POST", body: {} }
      );
      setAiTest({
        busy: false,
        kind: "ok",
        result: `Terkoneksi ✓ ${res.provider ? `${res.provider} · ` : ""}model ${res.model} · ${res.latencyMs} ms`,
      });
      toast.ok("Koneksi AI berhasil — siap dipakai Generate.");
    } catch (err) {
      setAiTest({ busy: false, kind: "err", result: err instanceof Error ? err.message : "Gagal menguji koneksi" });
    }
  }

  async function save(item: ConfigPanelItem) {
    const value = (drafts[item.key] ?? "").trim();
    if (!value && !confirm(`Kosongkan "${item.label}"? Nilai akan kembali ke default (env/fallback).`)) return;
    setBusyKey(item.key);
    setNotice(null);
    try {
      await api("/api/config", { method: "PUT", body: { key: item.key, value } });
      setDrafts((d) => ({ ...d, [item.key]: "" }));
      setShow((s) => ({ ...s, [item.key]: false }));
      setNotice({ kind: "ok", msg: `"${item.label}" disimpan — berlaku langsung.` });
      router.refresh();
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Gagal menyimpan" });
    } finally {
      setBusyKey(null);
    }
  }

  async function reset(item: ConfigPanelItem) {
    setBusyKey(item.key);
    setNotice(null);
    try {
      await api(`/api/config?key=${encodeURIComponent(item.key)}`, { method: "DELETE" });
      setNotice({ kind: "ok", msg: `"${item.label}" direset ke default.` });
      router.refresh();
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Gagal mereset" });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
        <div className="flex items-center gap-2">
          <Icon name="tune" className="text-[16px] text-slate-mute" />
          <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Lingkungan</h2>
        </div>
        <span className="font-mono text-[10px] text-slate-mute">KELOLA VIA UI · TERSIMPAN DB</span>
      </div>

      <div className="px-4 py-3 bg-ash-rise/40 border-b border-hairline">
        <div className="flex gap-2 items-start">
          <Icon name="verified_user" className="text-[14px] text-slate-mute mt-0.5" />
          <p className="text-[12px] text-slate-mute leading-relaxed">
            Atur kredensial langsung di sini — tersimpan <span className="text-foam-ink font-medium">terenkripsi AES-256-GCM</span> di database
            dan berlaku tanpa restart. Nilai dari database menimpa .env. Rahasia hanya ditampilkan sebagian.
            <span className="block mt-1 text-dim-veil">
              Catatan: <span className="font-mono text-[11px]">AUTH_SECRET</span> tidak dikelola di sini — wajib identik di semua instance (tetap di env deploy).
            </span>
          </p>
        </div>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 px-4 py-2.5 border-b font-mono text-[11px] ${
            notice.kind === "ok"
              ? "bg-healthy-lime/10 border-healthy-lime/20 text-healthy-lime"
              : "bg-coral-alert/10 border-coral-alert/20 text-coral-alert"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${notice.kind === "ok" ? "bg-healthy-lime" : "bg-coral-alert"}`} />
          {notice.msg}
        </div>
      )}

      <div className="divide-y divide-hairline">
        {configs.map((item) => {
          const badge = SOURCE_BADGE[item.source ?? "default"];
          const inDraft = (drafts[item.key] ?? "").length > 0;
          const shown = item.secret ? show[item.key] : true;
          const currentValue = inDraft ? drafts[item.key]! : item.value;
          return (
            <div key={item.key} className="px-4 py-3 hover:bg-ash-rise/40 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-mono text-[12px] text-foam-ink font-medium">{item.key}</span>
                  <span className={`ml-2 inline-block px-1.5 py-0.5 rounded border font-mono text-[9px] uppercase tracking-wider ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <p className="text-[12px] text-dim-veil mt-1 leading-relaxed">{item.hint}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-2.5">
                <div className="flex-1 relative">
                  <input
                    type={item.secret && !shown ? "password" : "text"}
                    value={currentValue}
                    onChange={(e) => setDrafts((d) => ({ ...d, [item.key]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && save(item)}
                    spellCheck={false}
                    autoComplete="off"
                    placeholder={item.secret ? "••••••••" : "kosongkan = pakai default"}
                    className={`w-full h-10 px-3.5 pr-10 bg-umbra-canvas text-foam-ink font-mono text-xs rounded border focus:outline-none focus:border-ember transition-colors ${
                      inDraft ? "border-ember/60" : "border-hairline"
                    }`}
                  />
                  {item.secret && (
                    <button
                      onClick={() => setShow((s) => ({ ...s, [item.key]: !s[item.key] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-mute hover:text-foam-ink transition-colors"
                      type="button"
                      title={shown ? "Sembunyikan" : "Tampilkan"}
                    >
                      <Icon name={shown ? "close" : "check_circle"} className="text-[16px]" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => save(item)}
                    disabled={busyKey === item.key}
                    className="px-3.5 h-10 rounded bg-ember text-umbra-canvas font-semibold text-[11px] disabled:opacity-50 hover:opacity-90 transition-all"
                    type="button"
                  >
                    {busyKey === item.key ? "Menyimpan…" : inDraft ? "Simpan" : "Pakai"}
                  </button>
                  {item.source === "db" && (
                    <button
                      onClick={() => reset(item)}
                      disabled={busyKey === item.key}
                      className="px-3 h-10 rounded bg-ash-rise text-slate-mute font-mono text-[11px] border border-hairline hover:text-coral-alert hover:border-coral-alert/30 transition-colors disabled:opacity-50"
                      type="button"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3.5 border-t border-hairline bg-ash-rise/30">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[11px] text-foam-ink font-semibold uppercase tracking-wider">
              Tes Koneksi AI
            </span>
            <p className="text-[12px] text-dim-veil mt-0.5 leading-relaxed">
              Kirim chat 1 token ke AI_BASE_URL dengan kunci AI_API_KEY. Valid untuk provider mana pun (Gemini/Groq/Mistral/dll).
            </p>
          </div>
          <button
            onClick={testAi}
            disabled={aiTest.busy || busyKey !== null}
            className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded bg-ember text-umbra-canvas font-semibold text-[12px] hover:opacity-90 disabled:opacity-50 transition-opacity"
            type="button"
          >
            <Icon name={aiTest.busy ? "loader" : "token"} className={aiTest.busy ? "animate-spin text-[16px]" : "text-[16px]"} />
            {aiTest.busy ? "Menguji…" : "Tes Koneksi AI"}
          </button>
        </div>
        {aiTest.result && (
          <div
            className={`mt-3 flex items-start gap-2 px-3 py-2 rounded border font-mono text-[11px] ${
              aiTest.kind === "ok"
                ? "bg-healthy-lime/10 border-healthy-lime/20 text-healthy-lime"
                : "bg-coral-alert/10 border-coral-alert/20 text-coral-alert"
            }`}
          >
            <Icon name={aiTest.kind === "ok" ? "check_circle" : "error"} className="text-[14px] mt-0.5" />
            <span className="break-words">{aiTest.result}</span>
          </div>
        )}
      </div>
    </section>
  );
}