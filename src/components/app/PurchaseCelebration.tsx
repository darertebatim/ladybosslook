import { useEffect, useRef } from 'react';
import { Crown, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface PurchaseCelebrationProps {
  open: boolean;
  onClose: () => void;
  plan?: 'monthly' | 'annual';
}

export function PurchaseCelebration({ open, onClose, plan }: PurchaseCelebrationProps) {
  const hasConfettiFired = useRef(false);

  useEffect(() => {
    if (!open || hasConfettiFired.current) return;
    hasConfettiFired.current = true;

    // Fire confetti burst
    const fireConfetti = () => {
      const colors = ['#f59e0b', '#d97706', '#fbbf24', '#fcd34d', '#ffffff'];

      // Center burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
        colors,
        zIndex: 10000,
      });

      // Left side
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors,
          zIndex: 10000,
        });
      }, 200);

      // Right side
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors,
          zIndex: 10000,
        });
      }, 400);
    };

    const timer = setTimeout(fireConfetti, 300);
    return () => clearTimeout(timer);
  }, [open]);

  // Reset ref when closed
  useEffect(() => {
    if (!open) {
      hasConfettiFired.current = false;
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/95 via-zinc-900/98 to-black/95 backdrop-blur-sm" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full text-white/60 hover:text-white/90 transition-colors"
        style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
      >
        <X className="h-6 w-6" />
      </button>

      {/* Content */}
      <div className="relative flex flex-col items-center text-center px-8 animate-scale-in">
        {/* Glowing crown */}
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-2xl rounded-full bg-amber-400/30 scale-150" />
          <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Crown className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Sparkle accents */}
        <div className="absolute top-8 left-12">
          <Sparkles className="h-5 w-5 text-amber-300/60 animate-pulse" />
        </div>
        <div className="absolute top-16 right-10">
          <Sparkles className="h-4 w-4 text-amber-200/50 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to simora+
        </h1>
        <p className="text-amber-300 text-lg font-medium mb-4">
          🎉 You're all set!
        </p>

        {/* Description */}
        <p className="text-white/70 text-sm max-w-xs mb-2">
          All premium features are now unlocked. Enjoy your{' '}
          {plan === 'annual' ? 'annual' : 'monthly'} membership.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-3 mt-4 mb-8 w-full max-w-xs">
          {[
            '🧘 Premium Breathing',
            '🎵 All Soundscapes',
            '📋 Unlimited Planner',
            '💎 Exclusive Content',
          ].map((feature) => (
            <div
              key={feature}
              className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white/80"
            >
              {feature}
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          size="lg"
          onClick={onClose}
          className="w-full max-w-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25"
        >
          Start Exploring ✨
        </Button>
      </div>
    </div>
  );
}
