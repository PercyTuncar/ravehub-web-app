import { Skeleton } from "@/components/ui/loading-skeleton";

export default function EventDetailSkeleton() {
    return (
        <div className="relative w-full min-h-[90vh] flex items-end sm:items-center bg-[#0a0a0a] overflow-hidden">
            {/* Background Skeleton */}
            <div className="absolute inset-0 z-0">
                <Skeleton className="w-full h-full bg-zinc-900" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 md:pt-32 md:pb-32 animate-in fade-in duration-1000 slide-in-from-bottom-8">
                <div className="max-w-4xl flex flex-col items-start">
                    {/* Top Badges Skeleton */}
                    <div className="flex flex-wrap items-center justify-start gap-3 mb-6">
                        <Skeleton className="h-6 w-20 rounded-full bg-white/10" />
                        <Skeleton className="h-6 w-12 rounded-full bg-white/10" />
                    </div>

                    {/* Title Skeleton - Smaller */}
                    <div className="space-y-4 mb-6 w-full">
                        <Skeleton className="h-10 sm:h-12 w-3/4 sm:w-2/3 rounded-lg bg-white/10" />
                        <Skeleton className="h-10 sm:h-12 w-1/2 sm:w-1/3 rounded-lg bg-white/10" />
                    </div>

                    {/* Meta Info Grid Skeleton - Smaller */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 w-full">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center sm:justify-start justify-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-xl bg-white/10" />
                                <div className="space-y-1.5 flex flex-col items-start">
                                    <Skeleton className="h-2.5 w-10 bg-white/10" />
                                    <Skeleton className="h-4 w-20 bg-white/10" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Description Skeleton */}
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-8 max-w-2xl w-full">
                        <div className="space-y-2.5">
                            <Skeleton className="h-3.5 w-full bg-white/10" />
                            <Skeleton className="h-3.5 w-full bg-white/10" />
                            <Skeleton className="h-3.5 w-2/3 bg-white/10" />
                        </div>
                        <Skeleton className="h-4 w-32 mt-3 bg-white/10" />
                    </div>

                    {/* Countdown & Buttons Skeleton */}
                    <div className="flex flex-col lg:flex-row items-center gap-6 w-full">
                        {/* Countdown */}
                        <Skeleton className="h-20 w-full sm:w-72 rounded-2xl bg-white/10" />

                        {/* Button */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <Skeleton className="h-14 w-full sm:w-48 rounded-xl bg-white/10" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
