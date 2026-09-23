"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/badge";
import Icon from "@/components/icon";
import { api } from "@/lib/client";

type AffiliateItem = { id: string; label: string; url: string; isActive: boolean };

export default function AffiliatePanel({ links }: { links: AffiliateItem[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, { label?: string; url?: string }>>({});
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  async function add() {
    if (!label.trim() || !url.trim()) {
      setNotice({ kind: "err", msg: "Label dan URL affiliate wajib diisi." });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await api("/api/affiliate", { method: "POST", body: { label: label.trim(), url: url.trim() } });
      setLabel("");
      setUrl("");
      setNotice({ kind: "ok", msg: "Link affiliate tersimpan ✓ (aktif)." });
      router.refresh();
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Gagal menyimpan" });
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      await api(`/api/affiliate/${id}`, { method: "PATCH", body });
      router.refresh();
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Gagal memperbarui" });
    }
  }

  async function saveEdit(id: string) {
    const draft = editDraft[id] ?? {};
    const body: Record<string, unknown> = {};
    if (draft.label !== undefined) body.label = draft.label;
    if (draft.url !== undefined) body.url = draft.url;
    if (Object.keys(body).length === 0) {
      setEditing(null);
      return;
    }
    try {
      await api(`/api/affiliate/${id}`, { method: "PATCH", body });
      setEditing(null);
      router.refresh();
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Gagal menyimpan" });
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Hapus link affiliate "${name}"?`)) return;
    try {
      await api(`/api/affiliate/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setNotice({ kind: "err", msg: err instanceof Error ? err.message : "Gagal menghapus" });
    }
  }

  return (
    <section className="rounded bg-graphite-panel border border-hairline overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-graphite-panel">
        <div className="flex items-center gap-2">
          <Icon name="link" className="text-[16px] text-slate-mute" />
          <h2 className="text-sm font-semibold text-foam-ink tracking-tight uppercase">Affiliate Shopee</h2>
        </div>
        <span className="font-mono text-[10px] text-slate-mute">{links.length} produk</span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label produk mis. Blender Philips"
                className="flex-1 h-10 px-3.5 bg-umbra-canvas text-foam-ink text-sm rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember transition-colors"
              />
            </div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="s.shopee.co.id/… (link affiliate kamu)"
              className="w-full h-10 px-3.5 bg-umbra-canvas text-foam-ink font-mono text-xs mt-2 rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember transition-colors"
            />
            <button
              onClick={add}
              disabled={busy || !label.trim() || !url.trim()}
              className="mt-2 inline-flex items-center gap-2 px-4 h-10 rounded bg-ember text-umbra-canvas font-semibold text-[12px] hover:opacity-90 disabled:opacity-50"
              type="button"
            >
              <Icon name="add" className="text-[16px]" />
              Tambah Produk
            </button>
          </div>
          <div className="space-y-2">
            <p className="font-mono text-[10px] text-dim-veil uppercase tracking-wider">Cara kerja</p>
            <p className="text-[12px] text-slate-mute leading-relaxed">
              Simpan beberapa link affiliate Shopee di sini, lalu pilih produknya di <span className="text-foam-ink font-medium">Composer</span>
              (kotak <span className="font-mono text-foam-ink">Affiliate Shopee</span>) dan sisipkan ke naskah. Link tidak tersimpan ke post — hanya teks naskah yang kamu setujui.
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
        {links.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-mono text-[11px] text-slate-mute uppercase tracking-wider">Belum ada link affiliate</p>
            <p className="text-[12px] text-dim-veil mt-1">Tambahkan produk pertama untuk muncul di pilihan composer.</p>
          </div>
        )}
        {links.map((l) => (
          <div key={l.id} className="px-4 py-3">
            {editing === l.id ? (
              <div className="space-y-2">
                <input
                  value={editDraft[l.id]?.label ?? l.label}
                  onChange={(e) => setEditDraft((d) => ({ ...d, [l.id]: { ...d[l.id], label: e.target.value } }))}
                  placeholder="Label produk"
                  className="w-full h-10 px-3.5 bg-umbra-canvas text-foam-ink text-sm rounded border border-hairline focus:outline-none focus:border-ember transition-colors"
                />
                <input
                  value={editDraft[l.id]?.url ?? l.url}
                  onChange={(e) => setEditDraft((d) => ({ ...d, [l.id]: { ...d[l.id], url: e.target.value } }))}
                  placeholder="URL affiliate"
                  className="w-full h-10 px-3.5 bg-umbra-canvas text-foam-ink font-mono text-xs rounded border border-hairline focus:outline-none focus:border-ember transition-colors"
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditing(null)} className="px-3 h-9 rounded bg-ash-rise text-slate-mute font-mono text-[11px] border border-hairline" type="button">
                    Batal
                  </button>
                  <button onClick={() => saveEdit(l.id)} className="px-3 h-9 rounded bg-ember text-umbra-canvas font-semibold text-[11px]" type="button">
                    Simpan
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => patch(l.id, { isActive: !l.isActive })}
                  type="button"
                  aria-pressed={l.isActive}
                  className={`relative w-8 h-[18px] rounded-full border border-hairline transition-colors shrink-0 ${l.isActive ? "bg-ember/20" : "bg-ash-rise"}`}
                  title={l.isActive ? "Nonaktifkan" : "Aktifkan"}
                >
                  <span className={`absolute top-[2px] left-[2px] w-3.5 h-3.5 rounded-full transition-all ${l.isActive ? "translate-x-[14px] bg-ember" : "bg-slate-mute"}`} />
                </button>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-[13px] truncate ${l.isActive ? "text-foam-ink" : "text-dim-veil line-through"}`}>{l.label}</span>
                  <a href={l.url} target="_blank" rel="noreferrer" className="font-mono text-[10px] text-dim-veil truncate hover:text-ember transition-colors">
                    {l.url}
                  </a>
                </div>
                {l.isActive && <Badge tone="lime">AKTIF</Badge>}
                <button
                  onClick={() => {
                    setEditing(l.id);
                    setEditDraft((d) => ({ ...d, [l.id]: {} }));
                  }}
                  className="p-1.5 text-slate-mute hover:text-foam-ink transition-colors"
                  title="Ubah"
                  type="button"
                >
                  <Icon name="edit" className="text-[16px]" />
                </button>
                <button onClick={() => remove(l.id, l.label)} className="p-1.5 text-slate-mute hover:text-coral-alert transition-colors" title="Hapus" type="button">
                  <Icon name="delete" className="text-[16px]" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}