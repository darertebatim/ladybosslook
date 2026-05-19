import { useEffect, useState } from 'react';
import { Sparkles, X, Heart, RotateCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import confetti from 'canvas-confetti';

interface RoutineEndedCelebrationProps {
  open: boolean;
  onClose: () => void;
  routineTitle: string;
  routineEmoji: string;
  totalDays?: number | null;
  badgeImageUrl?: string | null;
  onAddAgain: () => void | Promise<void>;
  isAddingAgain?: boolean;
}

const CONFETTI_COLORS = ['#a78bfa', '#c4b5fd', '#67e8f9', '#5eead4', '#f0abfc', '#fbcfe8'];

/**
 * Shown when a user's routine reaches its end date / last day.
 * Asks the user whether they want to add the routine to their planner again.
 */
export const RoutineEndedCelebration = ({
  open,
  onClose,
  routineTitle,
  routineEmoji,
  totalDays,
  badgeImageUrl,
  onAddAgain,
  isAddingAgain,
}: RoutineEndedCelebrationProps) => {
  const [showContent, setShowContent] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowContent(false);
      setShowStats(false);
      return;
    }

    haptic.success();

    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.3, x: 0.5 },
      colors: CONFETTI_COLORS,
      scalar: 1.15,
      ticks: 280,
      zIndex: 10001,
    });

    setTimeout(() => {
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.25, x: 0.2 }, colors: CONFETTI_COLORS, zIndex: 10001 });
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.25, x: 0.8 }, colors: CONFETTI_COLORS, zIndex: 10001 });
    }, 200);

    const t0 = setTimeout(() => setShowContent(true), 350);
    const t1 = setTimeout(() => setShowStats(true), 800);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, [open]);

  if (!open) return null;

  const bgStyle = {
    background:
      'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 18%, #ddd6fe 36%, #c4b5fd 56%, #a78bfa 78%, #8b5cf6 100%)',
  };
  const glowStyle = {
    background:
      'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255, 255, 255, 0.5) 0%, transparent 65%)',
  };

  return (
    <OverlayPortal>
      <div className="fixed inset-0 z-[10100] flex flex-col" onClick={onClose}>
        <div className="absolute inset-0" style={bgStyle} />
        <div className="absolute inset-0" style={glowStyle} />

        {/* Decorations */}
        <div className="absolute top-16 left-6 w-3 h-3 rounded-full bg-white/55 animate-pulse" />
        <div className="absolute top-24 right-8 w-2 h-2 rounded-full bg-white/45 animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-40 left-12 w-2 h-2 rounded-full bg-white/35 animate-pulse" style={{ animationDelay: '0.6s' }} />
        <Sparkles className="absolute top-20 right-10 w-5 h-5 text-white/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
        <Sparkles className="absolute top-52 left-8 w-4 h-4 text-white/30 animate-pulse" style={{ animationDelay: '0.7s' }} />
        <Heart className="absolute top-44 right-6 w-5 h-5 text-pink-300/50 animate-pulse" style={{ animationDelay: '0.4s' }} />

        {/* Close */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute z-20 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center right-4"
          style={{ top: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
        >
          <X className="w-4 h-4 text-black/40" />
        </button>

        <div
          className={cn(
            'relative z-10 flex-1 flex flex-col items-center justify-center px-6 transition-all duration-700',
            showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-6'
          )}
          onClick={(e) => e.stopPropagation()}
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex-1 min-h-4" />
          {/* Badge / Emoji */}
          <div className="relative mb-6">
            <div
              className="absolute inset-0 rounded-full scale-[2.5] animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, transparent 60%)',
              }}
            />
            {badgeImageUrl ? (
              <div
                className="relative w-32 h-32 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  boxShadow: '0 0 50px rgba(167, 139, 250, 0.4), 0 12px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                <img src={badgeImageUrl} alt="Routine badge" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="relative w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 100%)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 0 40px rgba(167, 139, 250, 0.25), 0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                <span className="text-5xl">{routineEmoji || '✨'}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-violet-950 mb-1 text-center" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
            Routine Complete!
          </h2>
          <p className="text-base font-medium text-violet-900/70 mb-4 text-center px-4 line-clamp-2">
            {routineTitle}
          </p>

          <Sparkles className="w-6 h-6 text-violet-400/60 my-2" />

          {/* Stats card */}
          <div
            className={cn(
              'backdrop-blur-sm rounded-2xl px-5 py-4 max-w-[320px] w-full mb-6 border bg-white/45 border-white/50 transition-all duration-700',
              showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-violet-700" />
              <span className="text-sm font-semibold text-violet-900">
                {totalDays ? `You showed up for ${totalDays} day${totalDays === 1 ? '' : 's'}` : 'You finished this routine'}
              </span>
            </div>
            <p className="text-center text-sm text-violet-900/75 leading-snug">
              Loved this rhythm? Add it to your planner again and keep the momentum going.
            </p>
          </div>

          {/* CTAs */}
          <div
            className="w-full flex flex-col items-center gap-2"
            style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <Button
              onClick={async (e) => { e.stopPropagation(); await onAddAgain(); }}
              disabled={isAddingAgain}
              className="w-full max-w-[320px] h-14 font-bold text-base rounded-2xl shadow-xl border-0 bg-violet-900 text-violet-50 active:bg-violet-950"
              style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.35), 0 8px 32px rgba(0, 0, 0, 0.1)' }}
            >
              <RotateCw className={cn('w-4 h-4 mr-2', isAddingAgain && 'animate-spin')} />
              {isAddingAgain ? 'Adding…' : 'Add it again'}
            </Button>
            <Button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              variant="ghost"
              className="w-full max-w-[320px] h-12 font-medium text-sm rounded-2xl text-violet-950/70 active:bg-white/30"
            >
              Maybe later
            </Button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
};