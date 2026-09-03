export default function EventListSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 relative selection:bg-orange-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-20 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-40 right-20 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 lg:pt-24">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Sidebar Skeleton */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24 h-fit rounded-3xl">
              <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between pb-4 border-b border-white/5">
                  <div className="h-5 bg-zinc-800 rounded w-16 animate-pulse" />
                  <div className="h-6 bg-zinc-800 rounded w-20 animate-pulse" />
                </div>

                {/* Search */}
                <div className="space-y-3 mb-8">
                  <div className="h-3 bg-zinc-800 rounded w-20 animate-pulse mb-3" />
                  <div className="h-12 bg-zinc-900/50 rounded-xl animate-pulse" />
                </div>

                {/* Filter Groups */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3 mb-8">
                    <div className="h-3 bg-zinc-800 rounded w-24 animate-pulse mb-3" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-12 bg-zinc-900/40 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Grid */}
          <div className="flex-1 min-w-0 pt-1">
            {/* Hero Event Skeleton */}
            <section className="mb-24 animate-pulse">
              <div className="relative overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/10">
                <div className="aspect-[21/9] bg-zinc-800" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                  <div className="h-8 bg-zinc-700 rounded w-1/3 mb-4" />
                  <div className="h-12 bg-zinc-700 rounded w-2/3 mb-6" />
                  <div className="flex gap-4">
                    <div className="h-12 bg-zinc-700 rounded w-32" />
                    <div className="h-12 bg-zinc-700 rounded w-32" />
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Events Section */}
            <section className="mb-24">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-2 h-12 bg-orange-500/50 rounded-full animate-pulse" />
                <div>
                  <div className="h-10 bg-zinc-800 rounded w-48 mb-3 animate-pulse" />
                  <div className="h-5 bg-zinc-800 rounded w-64 animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
                {[1, 2, 3].map((i) => (
                  <EventCardSkeleton key={i} />
                ))}
              </div>
            </section>

            {/* This Month Section */}
            <section className="mb-24">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-2 h-12 bg-blue-500/50 rounded-full animate-pulse" />
                <div>
                  <div className="h-10 bg-zinc-800 rounded w-48 mb-3 animate-pulse" />
                  <div className="h-5 bg-zinc-800 rounded w-64 animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                {[1, 2, 3, 4].map((i) => (
                  <EventCardSkeleton key={i} />
                ))}
              </div>
            </section>

            {/* Statistics Skeleton */}
            <div className="mt-12 space-y-8">
              <div className="flex items-center justify-center gap-6 bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-32" />
                <div className="w-1 h-1 rounded-full bg-zinc-600" />
                <div className="h-6 bg-zinc-800 rounded w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <div className="group relative overflow-hidden bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl transition-all duration-300 animate-pulse">
      <div className="relative overflow-hidden">
        <div className="aspect-video bg-zinc-800" />
      </div>
      <div className="p-6">
        <div className="h-4 bg-zinc-800 rounded w-24 mb-4" />
        <div className="h-7 bg-zinc-800 rounded w-full mb-3" />
        <div className="h-7 bg-zinc-800 rounded w-3/4 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-zinc-800 rounded w-1/2" />
          <div className="h-4 bg-zinc-800 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}
