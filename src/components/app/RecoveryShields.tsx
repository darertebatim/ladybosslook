import { Shield, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

interface RecoveryShieldsProps {
  /** Number of shields already used (0-3) */
  recoveryCount: number;
  className?: string;
}

/**
 * 3 small square recovery shield cards.
 * Shield 1: Free for all users
 * Shield 2-3: Unlocked for subscribers only
 * Shows used/available/locked state based on recoveryCount
 */
export const RecoveryShields = ({ recoveryCount, className }: RecoveryShieldsProps) => {
  const { isSubscribed } = useSubscription();

  const shields = [
    { id: 1, locked: false, used: recoveryCount >= 1 },
    { id: 2, locked: !isSubscribed, used: recoveryCount >= 2 },
    { id: 3, locked: !isSubscribed, used: recoveryCount >= 3 },
  ];

  return (
    <div className={cn('flex gap-2', className)}>
      {shields.map((shield) => (
        <div
          key={shield.id}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-xl w-[100px] h-[80px] border transition-all',
            shield.used
              ? 'bg-muted/60 border-border'
              : shield.locked
              ? 'bg-muted/40 border-border/60'
              : 'bg-gradient-to-b from-orange-50 to-orange-100 border-orange-200'
          )}
        >
          {shield.used ? (
            <>
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mb-1">
                <Check className="w-3 h-3 text-muted-foreground" />
              </div>
              <span className="text-[8px] text-muted-foreground font-medium leading-tight text-center">Recovery<br/>Shield</span>
              <span className="text-[8px] text-muted-foreground/60 mt-0.5">Used</span>
            </>
          ) : shield.locked ? (
            <>
              <div className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center mb-1">
                <Lock className="w-3 h-3 text-muted-foreground/60" />
              </div>
              <span className="text-[8px] text-muted-foreground/60 font-medium leading-tight text-center">Recovery<br/>Shield</span>
              <span className="text-[8px] text-muted-foreground/40 mt-0.5">Pro</span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-orange-200/60 flex items-center justify-center mb-1">
                <Shield className="w-3 h-3 text-orange-600 fill-orange-200" />
              </div>
              <span className="text-[8px] text-orange-700 font-medium leading-tight text-center">Recovery<br/>Shield</span>
              <span className="text-[8px] text-orange-500 mt-0.5">Ready</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
};
