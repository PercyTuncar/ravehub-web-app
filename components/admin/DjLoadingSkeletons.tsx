export function DjStatSkeleton() {
  return (
    <div className="min-h-[104px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6 flex items-center relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="flex w-full items-center justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
          <div className="h-8 w-14 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="h-8 w-8 rounded bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export function DjFiltersSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px_200px_44px]">
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export function DjCardSkeleton() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden relative">
      <div className="absolute inset-0 z-10 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="aspect-[16/7] bg-white/10 animate-pulse" />
      <div className="relative px-5 pb-5">
        <div className="-mt-11 mb-4 flex items-end justify-between">
          <div className="h-[5.5rem] w-[5.5rem] rounded-2xl border-4 border-[#141618] bg-white/10 animate-pulse" />
          <div className="mb-1 h-3 w-24 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="min-h-[4.5rem] space-y-2">
          <div className="h-6 w-3/5 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-2/5 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="mt-4 flex min-h-6 gap-1.5">
          <div className="h-5 w-14 rounded-full bg-white/10 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-white/10 animate-pulse" />
          <div className="h-5 w-10 rounded-full bg-white/10 animate-pulse" />
        </div>
        <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
          <div className="h-9 flex-1 rounded bg-white/10 animate-pulse" />
          <div className="h-9 w-9 rounded bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
