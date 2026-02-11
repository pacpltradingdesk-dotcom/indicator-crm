export default function DashboardPageLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4 border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg shimmer-bg" />
              <div className="space-y-2">
                <div className="h-3 shimmer-bg rounded w-16" />
                <div className="h-6 shimmer-bg rounded w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-4 h-64" />
        <div className="bg-card rounded-xl border border-border p-4 h-64" />
      </div>
    </div>
  )
}
