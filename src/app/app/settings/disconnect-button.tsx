"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DisconnectButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disconnect() {
    if (!confirm("Putuskan akun Threads dari studio? Data riwayat tetap tersimpan.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memutus akun");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      {error && <span className="font-mono text-[11px] text-coral-alert">{error}</span>}
      <button
        onClick={disconnect}
        disabled={busy}
        className="px-3.5 h-9 rounded bg-ash-rise text-coral-alert font-mono text-[11px] border border-coral-alert/30 hover:bg-coral-alert/10 transition-colors disabled:opacity-50"
        type="button"
      >
        {busy ? "Memutus…" : "Putuskan Akun"}
      </button>
    </div>
  );
}