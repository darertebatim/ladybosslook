import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="container max-w-7xl py-4 px-4">
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>

        {/* Active Round Card Skeleton */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Support Banner Skeleton */}
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
        </div>

        {/* Support Buttons Skeleton */}
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-11 w-full max-w-xs" />
          <Skeleton className="h-11 w-full max-w-xs" />
        </div>
      </div>
    </div>
  );
}
