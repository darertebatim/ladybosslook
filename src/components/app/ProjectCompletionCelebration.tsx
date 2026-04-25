import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, X } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import confetti from 'canvas-confetti';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import { useShareContent } from '@/hooks/useShareContent';

interface ProjectCompletionCelebrationProps {
  open: boolean;
  onClose: () => void;
  projectTitle: string;
  projectEmoji: string;
  totalSteps: number;
  totalTasks: number;
  badgeImageUrl?: string | null;
}

const CONFETTI_COLORS = ['#8b5cf6', '#a78bfa', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'];

export const ProjectCompletionCelebration = ({
  open,
  onClose,
  projectTitle,
  projectEmoji,
  totalSteps,
  totalTasks,
  badgeImageUrl,
}: ProjectCompletionCelebrationProps) => {
  const [showBadge, setShowBadge] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const { handleShare: triggerShare } = useShareContent({
    title: 'Project Complete!',
    text: `🎯 I just completed the "${projectTitle}" project! ${totalTasks} tasks across ${totalSteps} steps. #SelfGrowth`,
    source: 'project_complete',
    contentId: projectTitle,
    imageUrl: badgeImageUrl,
  });
  const handleShare = () => { haptic.light(); triggerShare(); };

  useEffect(() => {
    if (!open) {
      setShowBadge(false);
      setShowStats(false);
      return;
    }
    haptic.success();

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.35 },
      colors: CONFETTI_COLORS,
      scalar: 1,
      ticks: 250,
    });

    const t1 = setTimeout(() => setShowBadge(true), 400);
    const t2 = setTimeout(() => setShowStats(true), 800);
    const t3 = setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.3, x: 0.5 },
        colors: CONFETTI_COLORS,
      });
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [open]);

  if (!open) return null;

  const stats = [
    { label: 'Steps Done', value: totalSteps, icon: '📋' },
    { label: 'Tasks Done', value: totalTasks, icon: '✅' },
  ];

  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)',
        }}
      >
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-12 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center z-20"
          style={{ top: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
        >
          <X className="w-4 h-4 text-white/60" />
        </button>

        {/* Sparkle dots */}
        <div className="absolute top-24 left-10 w-1.5 h-1.5 rounded-full bg-violet-400/40 animate-pulse" />
        <div className="absolute top-36 right-14 w-1 h-1 rounded-full bg-emerald-400/30 animate-pulse" />
        <div className="absolute bottom-48 left-8 w-2 h-2 rounded-full bg-violet-300/25 animate-pulse" />

        <div className="relative z-10 flex flex-col items-center px-6 text-center w-full max-w-sm">
          {/* Badge */}
          <div className={`relative mb-6 transition-all duration-700 ${showBadge ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <div className="absolute inset-0 w-28 h-28 rounded-full bg-violet-400/20 blur-2xl mx-auto" />
            {badgeImageUrl ? (
              <img src={badgeImageUrl} alt="Project badge" className="relative w-24 h-24 rounded-full mx-auto object-cover shadow-2xl" />
            ) : (
              <div
                className="relative w-24 h-24 rounded-full flex flex-col items-center justify-center mx-auto"
                style={{
                  background: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 50%, #4c1d95 100%)',
                  boxShadow: '0 0 40px rgba(139, 92, 246, 0.4), 0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <FluentEmoji emoji={projectEmoji || '🎯'} size={40} />
              </div>
            )}
            <p className="mt-2 text-violet-300 text-xs font-semibold tracking-widest uppercase">
              Project Complete
            </p>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-1">{projectTitle}</h1>
          <p className="text-white/60 text-sm mb-6">
            You've completed every step! Amazing work 🎉
          </p>

          {/* Stats */}
          <div className={`w-full grid grid-cols-2 gap-3 mb-8 transition-all duration-700 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-4 text-center"
                style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}
              >
                <div className="mb-1 flex justify-center"><FluentEmoji emoji={stat.icon} size={28} /></div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/50 text-[10px] leading-tight mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="w-full space-y-3" style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}>
            <Button
              onClick={handleShare}
              className="w-full h-13 rounded-2xl font-semibold text-base gap-2"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: '#fff',
              }}
            >
              <Share2 className="w-4 h-4" />
              Share Achievement
            </Button>
            <Button
              variant="ghost"
              onClick={() => { haptic.light(); onClose(); }}
              className="w-full h-11 text-white/50 hover:text-white/80 hover:bg-white/5 font-medium text-sm rounded-2xl"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
};
