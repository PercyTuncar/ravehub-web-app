export function OrderStatSkeleton() {
  return (
    <div className="min-h-[104px] rounded-lg border bg-card p-6 flex items-center relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
      <div className="space-y-3">
        <div className="h-8 w-14 rounded bg-muted animate-pulse" />
        <div className="h-3 w-20 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export function OrderFiltersSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-10 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          <div className="h-3 w-40 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
          <div className="h-9 w-28 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
