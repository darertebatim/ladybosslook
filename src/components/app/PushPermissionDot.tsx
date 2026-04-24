import { usePushPermission } from '@/hooks/usePushPermission';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  /** Force show even if permission already granted (for testing in /admin/app) */
  forceShow?: boolean;
}

/**
 * Subtle red dot indicator. Drop inside any nav/profile/menu icon container
 * (with `relative`) to surface that PN permission is missing.
 *
 * Example:
 *   <div className="relative">
 *     <Menu />
 *     <PushPermissionDot />
 *   </div>
 */
export function PushPermissionDot({ className, forceShow }: Props) {
  const { needsAttention } = usePushPermission();
  if (!forceShow && !needsAttention) return null;

  return (
    <span
      className={cn(
        'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse',
        className
      )}
      aria-label="Notifications disabled"
    />
  );
}