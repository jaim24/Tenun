import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LogoMark, MotifLines } from "@/components/decor";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/app");

  const { next } = await searchParams;

  return (
    <main className="w-full min-h-screen bg-umbra-canvas flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-[1240px] flex flex-col lg:flex-row items-stretch justify-center rounded-xl overflow-hidden border border-hairline bg-graphite-panel">
        {/* Panel brand kirim */}
        <div className="w-full lg:w-[58%] p-8 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-hairline bg-graphite-panel">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-80 lg:w-96 h-[460px] opacity-25 pointer-events-none flex items-center justify-end pr-4">
            <MotifLines className="text-foam-ink w-full h-full" />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoMark className="w-8 h-8" />
              <span className="font-mono text-lg font-semibold tracking-[0.2em] text-foam-ink uppercase">
                Tenun
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-healthy-lime/10 border border-healthy-lime/20">
              <span className="w-1.5 h-1.5 rounded-full bg-healthy-lime animate-pulse" />
              <span className="font-mono text-[11px] font-medium text-healthy-lime uppercase tracking-wider">
                Studio Aktif
              </span>
            </div>
          </div>

          <div className="relative z-10 my-12 lg:my-16 max-w-xl">
            <div className="inline-flex items-center gap-2.5 mb-4">
              <span className="w-3.5 h-[2px] bg-ember" />
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-slate-mute font-medium">
                Mesin Wacana
              </span>
            </div>
            <h1 className="font-headline-xl text-foam-ink tracking-tight mb-5">
              Menjalin irama unggahan Threads.
            </h1>
            <p className="font-body-editorial text-slate-mute max-w-lg mb-10">
              Jadwalkan post, tangkap percakapan, dan balas dengan presisi editorial — tanpa terasa
              otomatis. Tenun menata ritme kehadiran Anda di Threads dari satu studio.
            </p>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-lg bg-ash-rise/50 border border-hairline backdrop-blur-sm max-w-lg">
              <div>
                <span className="font-mono text-[10px] sm:text-[11px] text-dim-veil block uppercase tracking-wider">
                  Terdispat
                </span>
                <span className="font-mono text-base sm:text-lg font-medium text-foam-ink mt-0.5 block">
                  —
                </span>
              </div>
              <div className="border-l border-hairline pl-3">
                <span className="font-mono text-[10px] sm:text-[11px] text-dim-veil block uppercase tracking-wider">
                  Kuota
                </span>
                <span className="font-mono text-base sm:text-lg font-medium text-foam-ink mt-0.5 block">
                  —
                </span>
              </div>
              <div className="border-l border-hairline pl-3">
                <span className="font-mono text-[10px] sm:text-[11px] text-dim-veil block uppercase tracking-wider">
                  Mode
                </span>
                <span className="font-mono text-base sm:text-lg font-medium text-healthy-lime mt-0.5 block">
                  AJUKAN
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-xs border-t border-hairline">
            <p className="font-body text-dim-veil italic max-w-sm">
              &ldquo;Distribusi yang disengaja menjaga bobot sebuah pemikiran tetap hidup di arus.&rdquo;
            </p>
            <span className="font-mono text-[11px] text-dim-veil tracking-wider uppercase whitespace-nowrap">
              TENUN-CORE // PRODUK.ARUS
            </span>
          </div>
        </div>

        {/* Panel autentikasi kanan */}
        <div className="w-full lg:w-[42%] bg-ash-rise p-8 sm:p-10 lg:p-14 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-hairline">
              <span className="font-mono text-xs text-ember font-medium uppercase tracking-widest">
                Jalur Masuk
              </span>
              <span className="font-mono text-xs text-dim-veil tracking-wider uppercase">
                Kunci Terenkripsi
              </span>
            </div>

            <h2 className="text-headline-lg font-semibold text-foam-ink tracking-tight mb-2">
              Masuk ke Studio
            </h2>
            <p className="font-body-dense text-slate-mute mb-8 leading-relaxed">
              Gunakan kredensial admin workspace untuk masuk. Hubungkan akun Threads Anda di menu
              Settings sesudahnya.
            </p>

            <LoginForm next={next} />
          </div>

          <div className="mt-8 pt-5 border-t border-hairline flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-foam-ink uppercase tracking-wider">
                Sesi Terbatas · 7 Hari
              </span>
            </div>
            <span className="font-mono text-[11px] text-dim-veil uppercase tracking-widest">
              SELALU HTTPS
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}