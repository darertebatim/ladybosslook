import { Shield, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SHIELD_MILESTONES, getEarnedShields } from '@/lib/recoveryShields';

interface RecoveryShieldsProps {
  /** Number of shields already used (0-3) */
  recoveryCount: number;
  /** User's longest streak ever — drives which shields are unlocked */
  longestStreak: number;
  className?: string;
}

/**
 * 3 small square recovery shield cards.
 * Shields are EARNED through streak milestones (Day 1 / 7 / 30) — not gated by Plus.
 * Shows used / available / locked-with-target-day based on recoveryCount + longestStreak.
 */
export const RecoveryShields = ({ recoveryCount, longestStreak, className }: RecoveryShieldsProps) => {
  const earned = getEarnedShields(longestStreak);

  const shields = SHIELD_MILESTONES.map((m, idx) => {
    const id = idx + 1;
    const unlocked = id <= earned;
    const used = recoveryCount >= id;
    return { id, locked: !unlocked, used, milestoneDay: m.day };
  });

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
              <span className="text-[8px] text-muted-foreground/40 mt-0.5">Day {shield.milestoneDay}</span>
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
