import Link from "next/link";

// Halaman 404 bergaya Tenun (Bahasa Indonesia).
export default function NotFound() {
  return (
    <main className="min-h-screen bg-umbra-canvas text-foam-ink flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded border border-hairline bg-graphite-panel p-8 text-center space-y-4">
        <p className="font-mono text-5xl text-dim-veil">404</p>
        <h1 className="text-xl font-semibold tracking-tight">Halaman tidak ditemukan</h1>
        <p className="text-sm text-slate-mute">Alamat yang kamu tuju tidak ada di studio ini.</p>
        <Link
          href="/app"
          className="inline-block px-4 py-2 rounded bg-ember text-umbra-canvas text-sm font-semibold hover:opacity-95 active:scale-[0.99] transition-all"
        >
          Kembali ke Overview
        </Link>
      </div>
    </main>
  );
}
