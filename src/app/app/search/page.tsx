import { prisma } from "@/lib/db";
import SearchConsole from "./search-console";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  const keywords = await prisma.keyword.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <>
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-hairline">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-mute uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span className="text-dim-veil">/</span>
            <span className="text-foam-ink">Radar Percakapan</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foam-ink">Keyword Search</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-ash-rise border border-hairline text-slate-mute">
            <span className="w-1.5 h-1.5 rounded-full bg-healthy-lime animate-breathing-dot" />
            <span className="text-foam-ink">{account ? "Akses pencarian aktif" : "Belum terhubung akun"}</span>
          </div>
        </div>
      </section>

      <SearchConsole connected={Boolean(account)} keywords={keywords.map((k) => k.text)} />
    </>
  );
}