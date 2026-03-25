import { useEffect, useState } from 'react';
import { Sparkles, Trophy, X, Crown, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import confetti from 'canvas-confetti';

interface ChallengeDayCelebrationProps {
  open: boolean;
  onClose: () => void;
  challengeTitle: string;
  challengeEmoji: string;
  currentDay: number;
  totalDays: number;
  badgeImageUrl?: string | null;
}

const CONFETTI_COLORS = ['#f97316', '#fb923c', '#fbbf24', '#fdba74', '#ef4444', '#34d399'];
const COMPLETE_CONFETTI_COLORS = ['#fbbf24', '#f59e0b', '#eab308', '#fde047', '#facc15', '#fef08a'];

/**
 * Full-page celebration when user completes all challenge tasks for the day.
 * Bright, warm, celebrational design with soft gradients.
 */
export const ChallengeDayCelebration = ({
  open,
  onClose,
  challengeTitle,
  challengeEmoji,
  currentDay,
  totalDays,
  badgeImageUrl,
}: ChallengeDayCelebrationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const progress = Math.round((currentDay / totalDays) * 100);
  const isHalfway = currentDay === Math.ceil(totalDays / 2);
  const isAlmostDone = currentDay >= totalDays - 3 && currentDay < totalDays;
  const isComplete = currentDay >= totalDays;

  useEffect(() => {
    if (!open) {
      setIsAnimating(false);
      setShowContent(false);
      setShowStats(false);
      return;
    }

    haptic.success();

    // Fire confetti FIRST, before showing content
    const colors = isComplete ? COMPLETE_CONFETTI_COLORS : CONFETTI_COLORS;

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.3, x: 0.5 },
      colors,
      scalar: 1.2,
      ticks: 300,
      zIndex: 10001,
    });

    // Side bursts
    setTimeout(() => {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.25, x: 0.2 }, colors, scalar: 1, zIndex: 10001 });
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.25, x: 0.8 }, colors, scalar: 1, zIndex: 10001 });
    }, 200);

    // Show content after confetti starts
    const t0 = setTimeout(() => {
      setIsAnimating(true);
      setShowContent(true);
    }, 400);

    const t1 = setTimeout(() => setShowStats(true), 900);

    // Extra confetti for complete
    let t3: ReturnType<typeof setTimeout> | null = null;
    if (isComplete) {
      t3 = setTimeout(() => {
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.4, x: 0.5 }, colors: COMPLETE_CONFETTI_COLORS, scalar: 1.3, zIndex: 10001 });
      }, 800);
    }

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      if (t3) clearTimeout(t3);
    };
  }, [open, isComplete]);

  if (!open) return null;

  // Motivational messages
  let motivationText = 'Great work! Keep showing up 💪';
  if (isComplete) {
    motivationText = 'You conquered the entire challenge! 🏆';
  } else if (isAlmostDone) {
    motivationText = "So close to the finish line! Don't stop now! 🏁";
  } else if (isHalfway) {
    motivationText = "Halfway there! You're unstoppable! ⚡";
  } else if (currentDay <= 3) {
    motivationText = 'Amazing start! Momentum is building! 🚀';
  } else if (currentDay >= 7) {
    motivationText = 'A full week in! Real discipline 💪';
  }

  // Theme: warm orange for normal, golden for complete
  const bgStyle = isComplete
    ? {
        background:
          'linear-gradient(160deg, #fef3c7 0%, #fde68a 20%, #fbbf24 50%, #f59e0b 75%, #d97706 100%)',
      }
    : {
        background:
          'linear-gradient(160deg, #fff7ed 0%, #fed7aa 18%, #fdba74 38%, #fb923c 58%, #f97316 78%, #ea580c 100%)',
      };

  const glowStyle = isComplete
    ? {
        background:
          'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(251, 191, 36, 0.4) 0%, transparent 60%)',
      }
    : {
        background:
          'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255, 255, 255, 0.45) 0%, transparent 65%)',
      };

  const textColor = isComplete ? 'text-amber-900' : 'text-orange-900';
  const subTextColor = isComplete ? 'text-amber-800/70' : 'text-orange-800/70';
  const progressBarBg = isComplete ? 'bg-amber-900/15' : 'bg-white/25';
  const progressBarFill = isComplete
    ? 'linear-gradient(90deg, #d97706 0%, #fbbf24 50%, #fef08a 100%)'
    : 'linear-gradient(90deg, #ea580c 0%, #f97316 40%, #fbbf24 100%)';
  const cardBg = isComplete ? 'bg-amber-800/10 border-amber-600/20' : 'bg-white/35 border-white/40';
  const btnClass = isComplete
    ? 'bg-amber-900 hover:bg-amber-800 text-amber-50'
    : 'bg-white hover:bg-white/90 text-orange-700';

  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-[10100] flex flex-col"
        onClick={onClose}
      >
        {/* Background */}
        <div className="absolute inset-0" style={bgStyle} />
        <div className="absolute inset-0" style={glowStyle} />

        {/* Floating decorations */}
        <div className="absolute top-16 left-6 w-3 h-3 rounded-full bg-white/50 animate-pulse" />
        <div className="absolute top-24 right-8 w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-40 left-12 w-2 h-2 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '0.6s' }} />
        <div className="absolute top-36 right-16 w-3 h-3 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.9s' }} />
        <Sparkles className="absolute top-20 right-10 w-5 h-5 text-white/30 animate-pulse" style={{ animationDelay: '0.2s' }} />
        <Sparkles className="absolute top-52 left-8 w-4 h-4 text-white/25 animate-pulse" style={{ animationDelay: '0.7s' }} />

        {isComplete && (
          <>
            <Sparkles className="absolute top-28 left-6 w-6 h-6 text-amber-500/40 animate-pulse" />
            <Crown className="absolute top-44 right-6 w-5 h-5 text-amber-600/30 animate-pulse" style={{ animationDelay: '0.4s' }} />
            <PartyPopper className="absolute top-60 left-10 w-5 h-5 text-amber-500/25 animate-pulse" style={{ animationDelay: '0.8s' }} />
          </>
        )}

        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute z-20 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center right-4"
          style={{ top: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
        >
          <X className="w-4 h-4 text-black/40" />
        </button>

        {/* Content */}
        <div
          className={cn(
            'relative z-10 flex-1 flex flex-col items-center justify-center px-6 transition-all duration-700',
            showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-6'
          )}
          onClick={(e) => e.stopPropagation()}
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          {/* Badge / Emoji */}
          <div className="relative mb-6">
            <div
              className="absolute inset-0 rounded-full scale-[2.5] animate-pulse"
              style={{
                background: isComplete
                  ? 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 60%)'
                  : 'radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, transparent 60%)',
              }}
            />
            {isComplete && badgeImageUrl ? (
              <div
                className="relative w-32 h-32 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  boxShadow: '0 0 50px rgba(251, 191, 36, 0.4), 0 12px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                <img
                  src={badgeImageUrl}
                  alt="Challenge Badge"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="relative w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background: isComplete
                    ? 'linear-gradient(180deg, rgba(251, 191, 36, 0.4) 0%, rgba(217, 119, 6, 0.2) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: isComplete
                    ? '0 0 50px rgba(251, 191, 36, 0.3), 0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)'
                    : '0 0 40px rgba(249, 115, 22, 0.2), 0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                <span className="text-5xl">{isComplete ? '🏆' : challengeEmoji}</span>
              </div>
            )}
          </div>

          {/* Day counter */}
          <div className="mb-2">
            <span
              className={cn('text-6xl font-bold', textColor)}
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.08)' }}
            >
              {isComplete ? '🎉' : `Day ${currentDay}`}
            </span>
          </div>

          {isComplete ? (
            <p className={cn('text-xl font-bold mb-1', textColor)}>Challenge Complete!</p>
          ) : null}

          <p className={cn('text-base font-medium mb-1', subTextColor)}>
            {isComplete
              ? `${totalDays} days — ${challengeTitle}`
              : `of ${totalDays} — ${challengeTitle}`}
          </p>

          {/* Divider icon */}
          {isComplete ? (
            <Crown className="w-6 h-6 text-amber-500/60 my-4" />
          ) : (
            <Sparkles className="w-6 h-6 text-pink-400/50 my-4" />
          )}

          {/* Progress bar */}
          <div
            className={cn(
              'w-full max-w-[300px] mb-6 transition-all duration-700',
              showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className={cn('flex justify-between text-xs font-medium mb-2', subTextColor)}>
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className={cn('h-3 rounded-full overflow-hidden backdrop-blur-sm', progressBarBg)}>
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${progress}%`,
                  background: progressBarFill,
                  boxShadow: isComplete
                    ? '0 0 16px rgba(251, 191, 36, 0.5)'
                    : '0 0 12px rgba(236, 72, 153, 0.3)',
                }}
              />
            </div>
            <div className={cn('flex justify-between text-xs mt-1.5', subTextColor, 'opacity-50')}>
              <span>Day 1</span>
              <span>Day {totalDays}</span>
            </div>
          </div>

          {/* Motivation message */}
          <div
            className={cn(
              'backdrop-blur-sm rounded-2xl px-5 py-3.5 max-w-[300px] mb-8 border transition-all duration-700',
              cardBg,
              showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <p className={cn('text-center text-sm font-medium', textColor, 'opacity-90')}>
              {motivationText}
            </p>
          </div>

          {/* Milestone badges */}
          {(isComplete || isHalfway || isAlmostDone || currentDay === 7 || currentDay === 1) && (
            <div
              className={cn(
                'flex items-center gap-2 mb-6 transition-all duration-700',
                showStats ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              )}
            >
              <div className={cn(
                'flex items-center gap-1.5 backdrop-blur-sm rounded-full px-3 py-1.5 border',
                isComplete ? 'bg-amber-800/15 border-amber-600/20' : 'bg-white/40 border-white/50'
              )}>
                <Trophy className={cn('w-3.5 h-3.5', isComplete ? 'text-amber-600' : 'text-orange-600')} />
                <span className={cn('text-xs font-semibold', textColor, 'opacity-90')}>
                  {isComplete ? '🏆 Challenge Champion!' :
                   isHalfway ? '⚡ Halfway Milestone' :
                   isAlmostDone ? '🏁 Almost There!' :
                   currentDay === 7 ? '🔥 1 Week Strong' :
                   '🚀 Day 1 Unlocked'}
                </span>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-4" />

          {/* CTA Button */}
          <div
            className="w-full flex justify-center"
            style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <Button
              onClick={onClose}
              className={cn(
                'w-full max-w-[320px] h-14 font-bold text-base rounded-2xl shadow-xl border-0',
                btnClass,
              )}
              style={{
                boxShadow: isComplete
                  ? '0 4px 24px rgba(217, 119, 6, 0.3), 0 8px 32px rgba(0, 0, 0, 0.1)'
                  : '0 4px 24px rgba(255, 255, 255, 0.25), 0 8px 32px rgba(0, 0, 0, 0.08)',
              }}
            >
              {isComplete ? "I'm a Champion! 🏆" : 'Keep Going! 🔥'}
            </Button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
};
