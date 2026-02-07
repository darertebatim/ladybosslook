import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy } from 'lucide-react';

import badgeGold from '@/assets/badge-gold.png';
import badgeSilver from '@/assets/badge-silver.png';
import badgeBronze from '@/assets/badge-bronze.png';

export type BadgeCelebrationLevel = 'silver' | 'gold' | 'almostGold';

const BADGE_IMAGES = {
  bronze: badgeBronze,
  silver: badgeSilver,
  gold: badgeGold,
};

interface BadgeCelebrationProps {
  type: BadgeCelebrationLevel | null;
  onClose: () => void;
  onCollectGold?: () => void; // Callback when gold badge is collected (for fly animation)
  completedCount?: number;
  totalCount?: number;
}

/**
 * Badge Celebration Component
 * 
 * Handles 3 types of celebrations:
 * 1. Silver badge toast (50% progress)
 * 2. Almost there toast (1 task before gold)
 * 3. Gold celebration modal (100% with fly animation)
 */
export function BadgeCelebration({
  type,
  onClose,
  onCollectGold,
  completedCount = 0,
  totalCount = 0,
}: BadgeCelebrationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [flyingBadge, setFlyingBadge] = useState(false);
  const badgeRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (type) {
      setIsAnimating(true);
      haptic.success();

      // Auto-dismiss toasts after delay
      if (type === 'silver' || type === 'almostGold') {
        const timer = setTimeout(() => {
          onClose();
        }, 4000);
        return () => clearTimeout(timer);
      }

      // Gold celebration confetti
      if (type === 'gold') {
        const duration = 2500;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: ['#FFD700', '#FFA500', '#FFEC8B', '#DAA520'],
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: ['#FFD700', '#FFA500', '#FFEC8B', '#DAA520'],
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };

        frame();
      }
    } else {
      setIsAnimating(false);
      setFlyingBadge(false);
    }
  }, [type, onClose]);

  const handleCollectGold = () => {
    if (!badgeRef.current) {
      onCollectGold?.();
      onClose();
      return;
    }

    haptic.medium();
    setFlyingBadge(true);

    // Get badge position
    const badgeRect = badgeRef.current.getBoundingClientRect();
    const badgeCenterX = badgeRect.left + badgeRect.width / 2;
    const badgeCenterY = badgeRect.top + badgeRect.height / 2;

    // Target position (header streak badge area - top right)
    const targetX = window.innerWidth - 60;
    const targetY = 40;

    // Calculate translation
    const translateX = targetX - badgeCenterX;
    const translateY = targetY - badgeCenterY;

    // Apply animation via CSS custom properties
    badgeRef.current.style.setProperty('--fly-x', `${translateX}px`);
    badgeRef.current.style.setProperty('--fly-y', `${translateY}px`);

    // Wait for animation to complete
    setTimeout(() => {
      onCollectGold?.();
      onClose();
    }, 600);
  };

  if (!type) return null;

  // Toast style for silver and almost-there
  if (type === 'silver' || type === 'almostGold') {
    return (
      <div 
        className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-4 duration-300"
        onClick={onClose}
      >
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-4 shadow-xl flex items-center gap-3">
          {/* Left icon/badge */}
          <div className="relative shrink-0">
            {type === 'silver' ? (
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                <img 
                  src={BADGE_IMAGES.silver} 
                  alt="Silver badge" 
                  className="w-[120%] h-[120%] object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <span className="text-3xl">🐥</span>
              </div>
            )}
            {/* Sparkle decorations */}
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-white/80 animate-pulse" />
            <Sparkles className="absolute -bottom-0.5 -left-1 h-3 w-3 text-amber-200 animate-pulse delay-150" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-base">
              {type === 'silver' 
                ? 'Celebrate hitting 50% progress!' 
                : 'Almost there! Gold Badge next!'
              }
            </p>
            {type === 'silver' ? (
              <p className="text-white/70 text-sm">Silver Badge collected!</p>
            ) : (
              <div className="mt-1.5">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '90%',
                      background: 'repeating-linear-gradient(45deg, #FCD34D, #FCD34D 10px, #FBBF24 10px, #FBBF24 20px)'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full-screen Gold celebration modal
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Dark overlay with rays effect */}
      <div className="absolute inset-0 bg-black/80">
        {/* Radial rays background */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'repeating-conic-gradient(from 0deg, rgba(251, 146, 60, 0.3) 0deg 10deg, transparent 10deg 20deg)',
            transformOrigin: 'center 60%',
          }}
        />
      </div>

      {/* Celebration content */}
      <div 
        className={cn(
          'relative w-full max-w-md mx-4 bg-gradient-to-t from-orange-400 via-orange-500 to-orange-600 rounded-t-[40px] pt-8 pb-8 px-6 transition-all duration-500',
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        )}
      >
        {/* Large centered badge with glow */}
        <div className="flex flex-col items-center -mt-28 mb-4">
          {/* Sparkle decorations around badge */}
          <div className="relative">
            <Sparkles className="absolute -left-8 top-1/4 h-6 w-6 text-white/80 animate-pulse" />
            <Sparkles className="absolute -right-8 top-1/4 h-6 w-6 text-white/80 animate-pulse delay-100" />
            <Sparkles className="absolute left-0 bottom-0 h-5 w-5 text-white/60 animate-pulse delay-200" />
            <Sparkles className="absolute right-0 bottom-0 h-5 w-5 text-white/60 animate-pulse delay-300" />
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-amber-400/30 blur-3xl rounded-full scale-150" />
            
            {/* Badge image */}
            <img 
              ref={badgeRef}
              src={BADGE_IMAGES.gold} 
              alt="Gold badge" 
              className={cn(
                'w-40 h-40 object-contain relative z-10 drop-shadow-2xl transition-all',
                flyingBadge && 'animate-fly-to-header'
              )}
              style={{
                filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.5))',
              }}
            />
          </div>
        </div>

        {/* Text content */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Legendary day!
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Every task completed today is a{'\n'}testament to your dedication.
          </p>
        </div>

        {/* Collect button */}
        <Button
          onClick={handleCollectGold}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl text-base h-auto"
        >
          Collect my Gold Badge
        </Button>
      </div>
    </div>
  );
}
