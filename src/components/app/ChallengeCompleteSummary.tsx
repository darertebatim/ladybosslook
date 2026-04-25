import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, X } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import confetti from 'canvas-confetti';
import { useShareContent } from '@/hooks/useShareContent';

interface ChallengeCompleteSummaryProps {
  open: boolean;
  streakGoal: number;
  totalActions: number;
  perfectDays: number;
  onClose: () => void;
}

/**
 * Victory summary screen shown when user wraps up a completed streak challenge
 * without leveling up. Shows stats, awards a badge, and offers sharing.
 */
export const ChallengeCompleteSummary = ({
  open,
  streakGoal,
  totalActions,
  perfectDays,
  onClose,
}: ChallengeCompleteSummaryProps) => {
  const [showStats, setShowStats] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowStats(false);
      setShowBadge(false);
      return;
    }
    haptic.success();

    // Celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.4 },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#f97316', '#8b5cf6'],
    });

    // Stagger animations
    const t1 = setTimeout(() => setShowBadge(true), 400);
    const t2 = setTimeout(() => setShowStats(true), 800);
    const t3 = setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.3, x: 0.5 },
        colors: ['#fbbf24', '#f59e0b'],
      });
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [open]);

  if (!open) return null;

  const badgeLabel = streakGoal >= 50 ? 'Legend' : streakGoal >= 30 ? 'Master' : streakGoal >= 14 ? 'Warrior' : 'Champion';
  const badgeEmoji = streakGoal >= 50 ? '👑' : streakGoal >= 30 ? '🔥' : streakGoal >= 14 ? '⚔️' : '🏆';

  const { handleShare: triggerShare } = useShareContent({
    title: 'Challenge Complete!',
    text: `${badgeEmoji} I just completed a ${streakGoal}-day streak challenge! ${totalActions} tasks done across ${perfectDays} perfect days. #SelfGrowth`,
    source: 'challenge_complete',
    contentId: `${streakGoal}d`,
  });
  const handleShare = () => { haptic.light(); triggerShare(); };

  const stats = [
    { label: 'Days Completed', value: streakGoal, icon: '🔥' },
    { label: 'Tasks Done', value: totalActions, icon: '✅' },
    { label: 'Perfect Days', value: perfectDays, icon: '⭐' },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-12 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center z-20"
        style={{ top: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
      >
        <X className="w-4 h-4 text-white/60" />
      </button>

      {/* Sparkle dots */}
      <div className="absolute top-24 left-10 w-1.5 h-1.5 rounded-full bg-amber-400/40 animate-pulse" />
      <div className="absolute top-36 right-14 w-1 h-1 rounded-full bg-purple-400/30 animate-pulse" />
      <div className="absolute bottom-48 left-8 w-2 h-2 rounded-full bg-amber-300/25 animate-pulse" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center w-full max-w-sm">
        {/* Badge */}
        <div
          className={`relative mb-6 transition-all duration-700 ${showBadge ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
        >
          <div className="absolute inset-0 w-28 h-28 rounded-full bg-amber-400/20 blur-2xl mx-auto" />
          <div
            className="relative w-24 h-24 rounded-full flex flex-col items-center justify-center mx-auto"
            style={{
              background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #b45309 100%)',
              boxShadow: '0 0 40px rgba(251, 191, 36, 0.4), 0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            <FluentEmoji emoji={badgeEmoji} size={40} />
          </div>
          <p className="mt-2 text-amber-400 text-xs font-semibold tracking-widest uppercase">
            {badgeLabel}
          </p>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-1">
          Challenge Complete
        </h1>
        <p className="text-white/60 text-sm mb-6">
          You've earned the {badgeLabel} badge
        </p>

        {/* Stats cards */}
        <div
          className={`w-full grid grid-cols-3 gap-2 mb-8 transition-all duration-700 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}
            >
              <div className="mb-1 flex justify-center"><FluentEmoji emoji={stat.icon} size={28} /></div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-white/50 text-[10px] leading-tight mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div
          className="w-full space-y-3"
          style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}
        >
          <Button
            onClick={handleShare}
            className="w-full h-13 rounded-2xl font-semibold text-base gap-2"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#1a1a2e',
            }}
          >
            <Share2 className="w-4 h-4" />
            Share Achievement
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              haptic.light();
              onClose();
            }}
            className="w-full h-11 text-white/50 hover:text-white/80 hover:bg-white/5 font-medium text-sm rounded-2xl"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
