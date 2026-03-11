import { Shield, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

interface RecoveryShieldsProps {
  recoveryUsed: boolean;
  className?: string;
}

/**
 * 3 small square recovery shield cards shown under Streak Challenge.
 * Shield 1: Free for all users (used/available)
 * Shield 2-3: Locked for non-subscribers
 */
export const RecoveryShields = ({ recoveryUsed, className }: RecoveryShieldsProps) => {
  const { hasAccess } = useSubscription();

  const shields = [
    { id: 1, locked: false, used: recoveryUsed },
    { id: 2, locked: !hasAccess, used: false },
    { id: 3, locked: !hasAccess, used: false },
  ];

  return (
    <div className={cn('flex gap-2', className)}>
      {shields.map((shield) => (
        <div
          key={shield.id}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-xl w-[72px] h-[72px] border transition-all',
            shield.used
              ? 'bg-muted/60 border-border'
              : shield.locked
              ? 'bg-muted/40 border-border/60'
              : 'bg-gradient-to-b from-orange-50 to-orange-100 border-orange-200'
          )}
        >
          {/* Icon */}
          {shield.used ? (
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-[9px] text-muted-foreground font-medium">Used</span>
            </div>
          ) : shield.locked ? (
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
              </div>
              <span className="text-[9px] text-muted-foreground/60 font-medium">Pro</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-orange-200/60 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-orange-600 fill-orange-200" />
              </div>
              <span className="text-[9px] text-orange-600 font-medium">Ready</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
