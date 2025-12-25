import { Skeleton } from "@/components/ui/skeleton";

export function PlayerSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Continue Learning Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>

      {/* Category Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
