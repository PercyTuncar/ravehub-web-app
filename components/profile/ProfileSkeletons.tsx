export function ProfileCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-white/10 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function TicketCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative overflow-hidden min-h-[320px]">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-8 w-2/3 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-white/10 rounded-full animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-1/3 bg-white/10 rounded animate-pulse" />
          <div className="h-3 w-1/4 bg-white/10 rounded animate-pulse" />
        </div>

        <div className="pt-4 border-t border-white/5">
          <div className="h-12 w-full bg-white/10 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden relative">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-56 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      {/* Items */}
      <div className="p-6 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 pb-4 border-b border-white/5 last:border-0">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-1/4 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-6 bg-black/20 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
