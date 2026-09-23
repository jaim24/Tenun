"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export default function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api("/api/auth/login", { method: "POST", body: { email, password } });
      if (res.ok) router.push(next ?? "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <label className="font-mono text-[11px] text-slate-mute uppercase tracking-wider" htmlFor="email">
            Email Admin
          </label>
          <span className="font-mono text-[10px] text-dim-veil tracking-widest">WAJIB</span>
        </div>
        <input
          className="w-full h-11 px-3.5 bg-umbra-canvas text-foam-ink font-body text-sm rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors"
          id="email"
          placeholder="admin@tenun.id"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <label className="font-mono text-[11px] text-slate-mute uppercase tracking-wider" htmlFor="password">
            Kata Sandi
          </label>
        </div>
        <input
          className="w-full h-11 px-3.5 bg-umbra-canvas text-foam-ink font-mono text-xs rounded border border-hairline placeholder:text-dim-veil/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-colors"
          id="password"
          placeholder="••••••••••••"
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-coral-alert/10 border border-coral-alert/20 text-coral-alert font-mono text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-coral-alert" />
          {error}
        </div>
      )}

      <div className="pt-3 space-y-3">
        <button
          className="w-full h-11 bg-ember text-umbra-canvas font-semibold text-sm rounded flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={busy}
        >
          <span>{busy ? "Memverifikasi…" : "Masuk Studio"}</span>
          <span className="font-mono font-bold">→</span>
        </button>
      </div>
    </form>
  );
}