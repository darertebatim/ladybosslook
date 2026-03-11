import { Flame, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface StreakLostBannerProps {
  open: boolean;
  previousStreak: number;
  hasShieldsRemaining: boolean;
  onRecover: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

/**
 * Banner shown when user lost their regular streak and returns to the app.
 * Offers recovery if shields are available.
 */
export const StreakLostBanner = ({
  open,
  previousStreak,
  hasShieldsRemaining,
  onRecover,
  onDismiss,
  isLoading,
}: StreakLostBannerProps) => {
  if (!open) return null;

  return (
    <div className="mx-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-4 relative overflow-hidden">
      <button
        onClick={() => { haptic.light(); onDismiss(); }}
        className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="font-semibold text-foreground text-sm">
            Your {previousStreak}-day streak was lost
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasShieldsRemaining
              ? "But you can still recover it with a shield!"
              : "Start fresh — every journey begins with day one."
            }
          </p>
        </div>
      </div>

      {hasShieldsRemaining && (
        <Button
          onClick={() => { haptic.success(); onRecover(); }}
          disabled={isLoading}
          size="sm"
          className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold gap-1.5"
        >
          <Shield className="w-3.5 h-3.5" />
          Use Recovery Shield
        </Button>
      )}
    </div>
  );
};
