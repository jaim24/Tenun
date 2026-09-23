"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, toLocalInputValue } from "@/lib/client";
import Icon from "@/components/icon";

type AiTone = "data" | "opini" | "tips" | "tanya";

const AI_TONE_OPTIONS: { key: AiTone; label: string }[] = [
  { key: "data", label: "Data / Berita" },
  { key: "opini", label: "Opini" },
  { key: "tips", label: "Tips" },
  { key: "tanya", label: "Pertanyaan" },
];

const AI_PRESETS: { key: string; label: string; note: string }[] = [
  { key: "gemini", label: "Gemini", note: "kuota gratis terbesar" },
  { key: "groq", label: "Groq", note: "paling cepat" },
  { key: "mistral", label: "Mistral", note: "open-weight solid" },
  { key: "openrouter", label: "OpenRouter", note: "satu kunci banyak model" },
];

export default function ComposeForm({
  focusOnMount = false,
  connected,
  initTopic = "",
  initContext = "",
  affiliates = [],
}: {
  focusOnMount?: boolean;
  connected: boolean;
  initTopic?: string;
  initContext?: string;
  affiliates?: { id: string; label: string; url: string }[];
}) {
  const router = useRouter();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [busy, setBusy] = useState<"draft" | "schedule" | "now" | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const [aiTopic, setAiTopic] = useState(initTopic);
  const [aiContext, setAiContext] = useState(initContext);
  const [aiTone, setAiTone] = useState<AiTone>("data");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNotice, setAiNotice] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const [affSelection, setAffSelection] = useState<string>("none");
  const [affCustom, setAffCustom] = useState("");
  const [affCaption, setAffCaption] = useState("Beli di sini:");
  const [affNotice, setAffNotice] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const selectedAffUrl = affSelection === "custom" ? affCustom : affiliates.find((a) => a.id === affSelection)?.url ?? "";

  useEffect(() => {
    if (focusOnMount) textRef.current?.focus();
  }, [focusOnMount]);

  async function uploadFile(file: File) {
    if (file && !file.type.startsWith("image/")) {
      setNotice({ kind: "err", msg: "Hanya file gambar yang didukung." });
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      setNotice({ kind: "err", msg: "Ukuran gambar maksimal 10MB." });
      return;
    }
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api<any>("/api/upload", { method: "POST", form });
      setImageUrl(res.url);
      setNotice({ kind: "ok", msg: "Gambar terlampir." });
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Upload gagal" });
    }
  }

  async function generate() {
    setAiNotice(null);
    if (!aiTopic.trim()) {
      setAiNotice({ kind: "err", msg: "Isi topik dulu (bisa isi otomatis dari hasil pindai)." });
      return;
    }
    setAiBusy(true);
    try {
      const res = await api<{ text: string; model: string }>("/api/ai/generate", {
        method: "POST",
        body: { topic: aiTopic, context: aiContext || undefined, tone: aiTone },
      });
      setText(res.text.slice(0, 500));
      setNotice(null);
      setAiNotice({ kind: "ok", msg: `Naskah siap (${res.model}). Sesuaikan sebelum terbit.` });
      textRef.current?.focus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memanggil AI";
      const missingConfig = /belum dikonfigurasi|belum lengkap|AI_API_KEY|AI_BASE_URL|AI_MODEL/.test(msg);
      if (missingConfig) setShowPresets(true);
      setAiNotice({ kind: "err", msg });
    } finally {
      setAiBusy(false);
    }
  }

  async function applyPreset(provider: string) {
    setAiBusy(true);
    setAiNotice(null);
    try {
      const res = await api<{ provider: string; model: string; keyUrl: string; note: string }>("/api/ai/preset", {
        method: "POST",
        body: { provider },
      });
      setAiNotice({
        kind: "ok",
        msg: `Preset ${res.provider} diterapkan (${res.model}). Ambil API key di ${res.keyUrl}, lalu tempel ke Settings → Lingkungan → AI API Key.`,
      });
    } catch (err) {
      setAiNotice({ kind: "err", msg: err instanceof Error ? err.message : "Gagal menerapkan preset" });
    } finally {
      setAiBusy(false);
    }
  }

  function insertAffiliate() {
    setAffNotice(null);
    const url = selectedAffUrl.trim();
    if (!url) {
      setAffNotice({ kind: "err", msg: "Pilih produk atau isi link custom dulu." });
      return;
    }
    const block = [affCaption.trim(), url].filter(Boolean).join(" ");
    const next = text.trim() ? `${text.trim()}\n\n${block}` : block;
    setText(next.slice(0, 500));
    setAffSelection("none");
    setAffCustom("");
    setAffNotice({ kind: "ok", msg: "Link affiliate disisipkan ke naskah ✓ Sesuaikan & periksa karakter." });
    textRef.current?.focus();
  }

  async function submit(kind: "draft" | "schedule" | "now") {
    setNotice(null);
    if (!text.trim()) {
      setNotice({ kind: "err", msg: "Naskah post wajib diisi (maks 500 karakter)." });
      return;
    }
    if (kind === "schedule" && !scheduleAt) {
      setNotice({ kind: "err", msg: "Pilih waktu jadwal dulu, atau gunakan Simpan Draf." });
      return;
    }
    setBusy(kind);
    try {
      const body: Record<string, unknown> = {
        text,
        imageUrl: imageUrl.trim() || null,
      };
      if (kind === "schedule") {
        body.scheduledFor = new Date(scheduleAt).toISOString();
      }
      const res = await api("/api/posts", { method: "POST", body });

      if (kind === "now") {
        await api(`/api/posts/${res.post.id}/publish`, { method: "POST" });
      }

      setText("");
      setImageUrl("");
      setScheduleAt("");
      setNotice({
        kind: "ok",
        msg:
          kind === "now"
            ? "Thread terbit sekarang ✓"
            : kind === "schedule"
            ? "Post dijadwalkan ✓"
            : "Draf tersimpan ✓",
      });
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memproses";
      setNotice({
        kind: "err",
        msg: kind === "now" && msg.includes("Belum ada akun") ? `${msg} — hubungkan di Settings.` : msg,
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-[2px] bg-ember" />
          <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Composer</h2>
        </div>
        <span className={`font-mono text-[10px] ${text.length > 500 ? "text-coral-alert" : "text-slate-mute"}`}>
          {text.length} / 500
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="rounded border border-hairline overflow-hidden">
          <div className="px-3 py-2 border-b border-hairline bg-ash-rise/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon name="auto_awesome" className="text-[15px] text-ember" />
              <h3 className="font-mono text-[11px] font-semibold text-foam-ink uppercase tracking-wider">
                Generate dengan AI
              </h3>
            </div>
            <span className="font-mono text-[10px] text-dim-veil tracking-widest">TEXT DRAFT · ≤500 KARAKTER</span>
          </div>

          <div className="p-3 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={aiTopic}
                onChange={(e) => {
                  setAiTopic(e.target.value);
                  if (aiNotice?.kind === "err") setAiNotice(null);
                }}
                placeholder="Topik mis. ekonomi digital Indonesia UMKM "
                className="flex-1 w-full h-10 px-3.5 bg-umbra-canvas text-foam-ink text-sm rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors"
              />
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value as AiTone)}
                disabled={aiBusy}
                className="w-full sm:w-44 h-10 px-3 bg-umbra-canvas text-foam-ink font-mono text-[11px] rounded border border-hairline focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors disabled:opacity-50"
                aria-label="Sasaran nada"
              >
                {AI_TONE_OPTIONS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                onClick={generate}
                disabled={aiBusy || busy !== null}
                className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded bg-ember text-umbra-canvas font-semibold text-[12px] hover:opacity-90 disabled:opacity-50 transition-opacity"
                type="button"
              >
                <Icon name={aiBusy ? "loader" : "sparkles"} className={aiBusy ? "animate-spin text-[16px]" : "text-[16px]"} />
                {aiBusy ? "Menulis…" : "Generate"}
              </button>
            </div>

            <textarea
              value={aiContext}
              onChange={(e) => setAiContext(e.target.value.slice(0, 2000))}
              placeholder="Konteks (opsional): tempel hasil pindai/thread inspirasi — AI menjadikannya inspirasi, bukan salinan."
              rows={2}
              className="w-full bg-umbra-canvas text-foam-ink text-[12px] rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors p-2.5 resize-y"
            />

            {showPresets && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] text-dim-veil uppercase tracking-wider">Belum punya key? Isi preset gratis:</span>
                {AI_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(p.key)}
                    disabled={aiBusy}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ash-rise text-foam-ink font-mono text-[11px] border border-hairline hover:border-ember/40 transition-colors disabled:opacity-50"
                    type="button"
                  >
                    <span className="text-ember">✦</span>
                    {p.label}
                    <span className="text-dim-veil normal-case">— {p.note}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <Link href="/app/settings" className="text-caution-amber hover:underline">
                ⚙ Atur AI (API key) di Settings → Lingkungan
              </Link>
            </div>

            {aiNotice && (
              <div
                className={`flex items-start gap-2 px-3 py-2 rounded border font-mono text-[11px] ${
                  aiNotice.kind === "ok"
                    ? "bg-healthy-lime/10 border-healthy-lime/20 text-healthy-lime"
                    : "bg-coral-alert/10 border-coral-alert/20 text-coral-alert"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    aiNotice.kind === "ok" ? "bg-healthy-lime" : "bg-coral-alert"
                  }`}
                />
                <span className="break-words">{aiNotice.msg}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded border border-hairline overflow-hidden">
          <div className="px-3 py-2 border-b border-hairline bg-ash-rise/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon name="link" className="text-[15px] text-ember" />
              <h3 className="font-mono text-[11px] font-semibold text-foam-ink uppercase tracking-wider">
                Affiliate Shopee
              </h3>
            </div>
            <span className="font-mono text-[10px] text-dim-veil tracking-widest">OPSIONAL · SISIPKAN KE NASKAH</span>
          </div>

          <div className="p-3 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={affSelection}
                onChange={(e) => {
                  setAffSelection(e.target.value);
                  if (affNotice?.kind === "err") setAffNotice(null);
                }}
                className="flex-1 w-full h-10 px-3 bg-umbra-canvas text-foam-ink font-mono text-[11px] rounded border border-hairline focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors"
                aria-label="Pilih link affiliate"
              >
                <option value="none">— Tanpa link affiliate —</option>
                {affiliates.length > 0 && (
                  <optgroup label="Produk tersimpan">
                    {affiliates.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label} · {a.url}
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value="custom">Custom link…</option>
              </select>
              <button
                onClick={insertAffiliate}
                disabled={!selectedAffUrl.trim()}
                className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded bg-ember text-umbra-canvas font-semibold text-[12px] hover:opacity-90 disabled:opacity-50 transition-opacity"
                type="button"
              >
                <Icon name="arrow_forward" className="text-[16px]" />
                Sisipkan
              </button>
            </div>

            {affSelection === "custom" && (
              <input
                value={affCustom}
                onChange={(e) => setAffCustom(e.target.value)}
                placeholder="s.shopee.co.id/… atau https://… (link per post ini)"
                className="w-full h-10 px-3.5 bg-umbra-canvas text-foam-ink font-mono text-xs rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors"
              />
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={affCaption}
                onChange={(e) => setAffCaption(e.target.value)}
                placeholder="Kata sebelum link (kosongkan = tanpa caption)"
                className="flex-1 w-full h-10 px-3.5 bg-umbra-canvas text-foam-ink text-sm rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors"
              />
              <Link
                href="/app/settings"
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded bg-ash-rise text-slate-mute hover:text-foam-ink font-mono text-[11px] border border-hairline transition-colors sm:self-center"
              >
                <Icon name="tune" className="text-[14px]" />
                Kelola Produk
              </Link>
            </div>

            {affNotice && (
              <div
                className={`flex items-start gap-2 px-3 py-2 rounded border font-mono text-[11px] ${
                  affNotice.kind === "ok"
                    ? "bg-healthy-lime/10 border-healthy-lime/20 text-healthy-lime"
                    : "bg-coral-alert/10 border-coral-alert/20 text-coral-alert"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${affNotice.kind === "ok" ? "bg-healthy-lime" : "bg-coral-alert"}`} />
                <span className="break-words">{affNotice.msg}</span>
              </div>
            )}
          </div>
        </div>

        <textarea
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 501))}
          placeholder="Mengurai pola thread viral tanpa clickbait — data dulu, opini kemudian. 1/3"
          rows={4}
          className="w-full bg-ash-rise text-foam-ink text-body-editorial rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors p-3 resize-y"
          maxLength={500}
        />

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">
                URL Gambar (opsional)
              </label>
              <span className="font-mono text-[10px] text-dim-veil tracking-widest">IMAGE MEDIA</span>
            </div>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…/foto.jpg"
              className="w-full h-10 px-3.5 bg-umbra-canvas text-foam-ink text-sm rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors"
            />
            <label className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-mute hover:text-foam-ink cursor-pointer border border-hairline rounded px-2.5 py-1.5 bg-ash-rise transition-colors">
              <span>Unggah dari folder</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f);
                }}
              />
            </label>
          </div>
          <div className="w-full sm:w-60">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">Jadwal</label>
              <span className="font-mono text-[10px] text-dim-veil tracking-widest">UTC→LOKAL</span>
            </div>
            <input
              type="datetime-local"
              value={scheduleAt}
              min={toLocalInputValue(new Date(Date.now() + 60000))}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="w-full h-10 px-3.5 bg-umbra-canvas text-foam-ink font-mono text-xs rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors"
            />
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

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-hairline">
          {!connected && (
            <Link href="/app/settings" className="font-mono text-[11px] text-caution-amber hover:underline">
              ⚠ Belum ada akun Threads terhubung — klik untuk menyambung.
            </Link>
          )}
          <div className="flex ml-auto gap-2">
            <button
              onClick={() => submit("draft")}
              disabled={busy !== null}
              className="px-3.5 h-9 rounded bg-ash-rise text-slate-mute hover:text-foam-ink font-mono text-[11px] border border-hairline transition-colors disabled:opacity-50"
              type="button"
            >
              Simpan Draf
            </button>
            <button
              onClick={() => submit("schedule")}
              disabled={busy !== null}
              className="px-3.5 h-9 rounded bg-graphite-panel text-foam-ink font-semibold text-[11px] border border-hairline hover:border-slate-mute/30 transition-colors disabled:opacity-50"
              type="button"
            >
              {busy === "schedule" ? "Menjadwalkan…" : "Jadwalkan"}
            </button>
            <button
              onClick={() => submit("now")}
              disabled={busy !== null}
              className="px-3.5 h-9 rounded bg-ember text-umbra-canvas font-semibold text-[11px] hover:opacity-90 transition-opacity disabled:opacity-50"
              type="button"
            >
              {busy === "now" ? "Menerbitkan…" : "Terbitkan Sekarang"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}