export function TicketStatSkeleton() {
  return (
    <div className="min-h-[120px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6 flex items-center relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="flex w-full items-center justify-between">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded bg-white/10 animate-pulse" />
          <div className="h-9 w-20 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export function TicketFiltersSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_200px_44px]">
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
        <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export function TicketRowSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-white/10 animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-2/3 rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="space-y-2 text-right">
            <div className="ml-auto h-6 w-24 rounded bg-white/10 animate-pulse" />
            <div className="ml-auto h-3 w-16 rounded bg-white/10 animate-pulse" />
          </div>
          <div className="h-6 w-20 rounded-full bg-white/10 animate-pulse" />
          <div className="h-6 w-16 rounded-full bg-white/10 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-md bg-white/10 animate-pulse" />
          <div className="h-9 w-9 rounded-md bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
