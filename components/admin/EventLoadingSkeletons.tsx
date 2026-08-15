export function EventStatSkeleton() {
  return (
    <div className="min-h-[120px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex items-center relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="flex w-full items-center justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
          <div className="h-9 w-16 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export function EventFiltersSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-4 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_44px]">
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden relative">
      <div className="absolute inset-0 z-10 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="h-48 bg-white/10 animate-pulse" />
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="h-6 w-3/5 rounded bg-white/10 animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-white/10 animate-pulse" />
        </div>
        <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
          <div className="h-4 rounded bg-white/10 animate-pulse" />
          <div className="h-4 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}
