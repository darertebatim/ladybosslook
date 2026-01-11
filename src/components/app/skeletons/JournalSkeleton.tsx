import { Skeleton } from '@/components/ui/skeleton';

export const JournalSkeleton = () => {
  return (
    <div className="p-4 space-y-6">
      {/* Search skeleton */}
      <Skeleton className="h-10 w-full rounded-lg" />
      
      {/* Date group */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-16 mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Another date group */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-3">
          {[1].map((i) => (
            <div key={i} className="bg-card rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-16 mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const JournalEntrySkeleton = () => {
  return (
    <div className="p-4 space-y-6">
      {/* Title input skeleton */}
      <Skeleton className="h-10 w-full rounded-lg" />
      
      {/* Mood selector skeleton */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 w-12 rounded-full" />
        ))}
      </div>
      
      {/* Editor skeleton */}
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
};
