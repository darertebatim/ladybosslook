import { useState } from 'react';
import { Sunrise, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { subscribeToPushNotifications, requestNotificationPermission } from '@/lib/pushNotifications';
import { toast } from 'sonner';

interface Props {
  userId: string;
  open: boolean;
  onClose: () => void;
  consecutiveDays: number;
}

/**
 * Bottom sheet for users who've returned 3+ days in a row without enabling PN.
 * Warm self-care tone — celebrate consistency, offer to protect it.
 */
export function ReturningUserPushSheet({ userId, open, onClose, consecutiveDays }: Props) {
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        const result = await subscribeToPushNotifications(userId);
        if (result.success) {
          toast.success('🌿 We\'ve got you');
          window.dispatchEvent(new CustomEvent('pushNotificationsEnabled'));
          onClose();
          return;
        }
      }
      toast.error('Enable from iOS Settings to continue');
    } catch {
      toast.error('Could not enable right now');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('returningUserPushDismissed', Date.now().toString());
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl border-0 p-0 max-h-[85vh] overflow-hidden">
        <div className="px-6 pt-8 pb-6">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-200 via-rose-200 to-pink-200 flex items-center justify-center shadow-lg">
                <Sunrise className="h-11 w-11 text-amber-700" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shadow-md">
                <Heart className="h-4 w-4 text-white fill-white" />
              </div>
            </div>
          </div>

          <h2 className="text-center text-2xl font-bold leading-tight mb-2">
            You've shown up {consecutiveDays} days in a row 🌿
          </h2>
          <p className="text-center text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto mb-6">
            That's beautiful consistency. Let us help you protect it with one gentle daily reminder — never spammy, always kind.
          </p>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
              <span className="text-2xl">🌅</span>
              <p className="text-sm">A morning nudge for your routine</p>
            </div>
            <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
              <span className="text-2xl">💗</span>
              <p className="text-sm">A soft reminder to check in on yourself</p>
            </div>
            <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
              <span className="text-2xl">🔥</span>
              <p className="text-sm">Streak alerts before you break it</p>
            </div>
          </div>

          <Button
            onClick={handleEnable}
            disabled={isEnabling}
            className="w-full h-13 rounded-2xl text-base font-semibold"
          >
            {isEnabling ? 'Enabling…' : 'Yes, gently remind me'}
          </Button>
          <button
            onClick={handleSkip}
            className="w-full text-center text-muted-foreground text-sm py-3 mt-1"
          >
            Maybe another day
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}