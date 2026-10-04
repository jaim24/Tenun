"use client";

// Error boundary global bergaya Tenun (Bahasa Indonesia).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-umbra-canvas text-foam-ink flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded border border-hairline bg-graphite-panel p-8 text-center space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-coral-alert">Gangguan</p>
        <h1 className="text-xl font-semibold tracking-tight">Terjadi kesalahan</h1>
        <p className="text-sm text-slate-mute">
          Sesuatu gagal dimuat di studio ini. Coba muat ulang halaman.
        </p>
        {error?.digest && (
          <p className="font-mono text-[10px] text-dim-veil">ref: {error.digest}</p>
        )}
        <button
          onClick={() => reset()}
          type="button"
          className="px-4 py-2 rounded bg-ember text-umbra-canvas text-sm font-semibold hover:opacity-95 active:scale-[0.99] transition-all"
        >
          Muat ulang
        </button>
      </div>
    </main>
  );
}
