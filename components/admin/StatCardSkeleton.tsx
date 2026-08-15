export function StatCardSkeleton() {
  return (
    <div className="bg-[#141618] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Title skeleton */}
          <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-2" />
          {/* Value skeleton */}
          <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
        </div>
        {/* Icon skeleton */}
        <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
      </div>

      {/* Trend skeleton (optional) */}
      <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-[#141618] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="mb-6">
        <div className="h-5 w-40 bg-white/10 rounded animate-pulse mb-2" />
        <div className="h-3 w-56 bg-white/10 rounded animate-pulse" />
      </div>

      <div className="h-[300px] w-full flex items-end justify-around gap-4">
        {[40, 60, 45, 80, 55, 70, 50].map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-white/10 rounded-t animate-pulse"
            style={{
              height: `${height}%`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="bg-[#141618] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="h-5 w-32 bg-white/10 rounded animate-pulse mb-6" />

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-2 w-1/4 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
