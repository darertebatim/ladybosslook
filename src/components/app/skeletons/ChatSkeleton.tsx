import { Skeleton } from "@/components/ui/skeleton";

export const ChatSkeleton = () => {
  return (
    <div className="p-4 space-y-4">
      {/* Date separator skeleton */}
      <div className="flex items-center justify-center my-4">
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      
      {/* Admin message group */}
      <div className="flex items-end gap-2 max-w-[85%]">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="space-y-1">
          <Skeleton className="h-16 w-56 rounded-2xl rounded-bl-md" />
          <Skeleton className="h-12 w-44 rounded-2xl rounded-tl-md rounded-bl-md" />
        </div>
      </div>
      
      {/* User message */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40 rounded-2xl" />
      </div>
      
      {/* Admin message */}
      <div className="flex items-end gap-2 max-w-[85%]">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <Skeleton className="h-20 w-64 rounded-2xl rounded-bl-md" />
      </div>
      
      {/* User message group */}
      <div className="flex flex-col items-end space-y-1">
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <Skeleton className="h-14 w-56 rounded-2xl" />
      </div>
      
      {/* Admin message */}
      <div className="flex items-end gap-2 max-w-[85%]">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <Skeleton className="h-12 w-52 rounded-2xl rounded-bl-md" />
      </div>
    </div>
  );
};
