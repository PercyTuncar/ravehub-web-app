export function ProductStatSkeleton() {
  return (
    <div className="min-h-[120px] rounded-lg border border-white/10 bg-white/5 p-6 flex items-center relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="flex w-full items-center justify-between">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded bg-white/10 animate-pulse" />
          <div className="h-9 w-16 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export function ProductFiltersSkeleton() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="h-10 flex-1 rounded-lg bg-white/10 animate-pulse" />
        <div className="h-10 w-full lg:w-24 rounded-lg bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden relative">
      <div className="absolute inset-0 z-10 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="h-48 bg-white/10 animate-pulse" />
      <div className="p-4 space-y-4">
        <div className="h-6 w-3/4 rounded bg-white/10 animate-pulse" />
        <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 rounded bg-white/10 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-white/10 animate-pulse" />
        </div>
        <div className="flex gap-2 border-t border-white/5 pt-4">
          <div className="h-9 flex-1 rounded bg-white/10 animate-pulse" />
          <div className="h-9 w-9 rounded bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
