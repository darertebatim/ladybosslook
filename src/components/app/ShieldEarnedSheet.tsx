import { useEffect, useState } from 'react';
import { Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ShieldEarnedSheetProps {
  open: boolean;
  milestoneDay: number;       // 1, 7, or 30
  totalShields: number;       // 1, 2, or 3
  onClose: () => void;
}

/**
 * Small celebration sheet shown when the user newly unlocks a Recovery Shield
 * by reaching a streak milestone (Day 7 or Day 30). Day 1 is implicit
 * (every user already has it) and does not trigger this sheet.
 */
export const ShieldEarnedSheet = ({
  open,
  milestoneDay,
  totalShields,
  onClose,
}: ShieldEarnedSheetProps) => {
  const { t } = useTranslation();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (open) {
      haptic.success();
      // Tiny tick so transition triggers
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    haptic.light();
    onClose();
  };

  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-[10100] flex items-center justify-center p-4"
        style={{ touchAction: 'manipulation' }}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        <div
          className={cn(
            'relative z-10 bg-gradient-to-b from-orange-400 to-orange-500 rounded-3xl p-8 w-full max-w-[300px] text-center transition-all duration-300',
            animateIn ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          )}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/60 active:text-white transition-colors p-2 -m-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="grid place-items-center size-20 rounded-2xl bg-orange-300/40 text-white shadow-inner">
              <Shield className="h-10 w-10 fill-white/20 stroke-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-2xl font-bold text-white mb-1">
            {t('shieldEarned.title')}
          </div>
          <p className="text-white/80 text-sm mb-4">
            {t('shieldEarned.subtitle', { day: milestoneDay })}
          </p>

          {/* Body */}
          <p className="text-white/90 text-sm mb-6 leading-relaxed">
            {t('shieldEarned.body', { count: totalShields })}
          </p>

          {/* Shield row */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'grid place-items-center size-10 rounded-xl transition-colors',
                  i < totalShields
                    ? 'bg-white/90 text-orange-600'
                    : 'bg-white/15 text-white/40'
                )}
              >
                <Shield className="h-5 w-5" />
              </div>
            ))}
          </div>

          <Button
            onClick={handleClose}
            className="w-full bg-white active:bg-white/90 text-orange-600 font-semibold py-3 rounded-xl"
          >
            {t('shieldEarned.cta')}
          </Button>
        </div>
      </div>
    </OverlayPortal>
  );
};