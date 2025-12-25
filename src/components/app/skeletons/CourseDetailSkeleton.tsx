import { Skeleton } from "@/components/ui/skeleton";

export function CourseDetailSkeleton() {
  return (
    <div className="container max-w-4xl py-4 px-4">
      <div className="space-y-6">
        {/* Course Info Card */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        {/* Round Info */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>

        {/* Materials Section */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
