import { Crown, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';

interface GoldStreakLostBannerProps {
  open: boolean;
  previousGoldStreak: number;
  hasShieldsRemaining: boolean;
  onRecover: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

/**
 * Banner shown when user lost their gold streak (100% completion streak).
 * Offers recovery if shields are available.
 */
export const GoldStreakLostBanner = ({
  open,
  previousGoldStreak,
  hasShieldsRemaining,
  onRecover,
  onDismiss,
  isLoading,
}: GoldStreakLostBannerProps) => {
  if (!open) return null;

  return (
    <div className="mx-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-4 relative overflow-hidden">
      <button
        onClick={() => { haptic.light(); onDismiss(); }}
        className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Crown className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="font-semibold text-foreground text-sm">
            Your {previousGoldStreak}-day gold streak was lost
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasShieldsRemaining
              ? "Use a recovery shield to restore your perfect streak!"
              : "You didn't complete all tasks yesterday. Start a new gold run!"
            }
          </p>
        </div>
      </div>

      {hasShieldsRemaining && (
        <Button
          onClick={() => { haptic.success(); onRecover(); }}
          disabled={isLoading}
          size="sm"
          className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold gap-1.5"
        >
          <Shield className="w-3.5 h-3.5" />
          Use Recovery Shield
        </Button>
      )}
    </div>
  );
};
