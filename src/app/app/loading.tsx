// Skeleton loading untuk /app — tampil seketika saat navigasi,
// menggantikan layar kosong selagi data di-fetch (aturan DESIGN.md:
// "Skeletal shimmer replicating the exact layout shape").
function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-ash-rise ${className}`} />;
}

export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat dashboard">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-hairline">
        <div className="space-y-2">
          <Bar className="h-3 w-40" />
          <Bar className="h-6 w-56" />
        </div>
        <div className="flex gap-3">
          <Bar className="h-7 w-44" />
          <Bar className="h-7 w-28" />
        </div>
      </section>

      {/* Kartu metrik */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded bg-graphite-panel border border-hairline space-y-3">
            <div className="flex items-center justify-between">
              <Bar className="h-3 w-24" />
              <Bar className="h-5 w-16" />
            </div>
            <Bar className="h-9 w-28" />
            <Bar className="h-1.5 w-full" />
            <div className="flex justify-between">
              <Bar className="h-3 w-20" />
              <Bar className="h-3 w-16" />
            </div>
          </div>
        ))}
      </section>

      {/* Grid konten */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 rounded bg-graphite-panel border border-hairline overflow-hidden">
          <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
            <Bar className="h-4 w-40" />
            <Bar className="h-3 w-24" />
          </div>
          <div className="divide-y divide-hairline">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Bar className="h-3 w-48" />
                  <Bar className="h-5 w-14" />
                </div>
                <Bar className="h-4 w-full" />
                <Bar className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="p-4 rounded bg-graphite-panel border border-hairline space-y-3">
              <div className="flex items-center justify-between">
                <Bar className="h-3 w-32" />
                <Bar className="h-5 w-12" />
              </div>
              <Bar className="h-4 w-full" />
              <Bar className="h-9 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
