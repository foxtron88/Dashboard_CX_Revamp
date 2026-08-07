export default function Loading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* Top metrics skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card h-24 rounded-xl bg-[var(--glass-bg)]" />
        ))}
      </div>

      {/* CSAT member cards skeleton */}
      <div className="glass-card h-40 rounded-xl bg-[var(--glass-bg)]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card h-72 rounded-xl bg-[var(--glass-bg)]" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="glass-card h-56 rounded-xl bg-[var(--glass-bg)]" />
    </div>
  );
}
