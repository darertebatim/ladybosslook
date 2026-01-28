import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BreathingCircleProps {
  phase: 'inhale' | 'inhale_hold' | 'exhale' | 'exhale_hold' | 'ready';
  phaseDuration: number;
  phaseText: string;
  methodText?: string;
  countdown?: number;
}

export function BreathingCircle({
  phase,
  phaseDuration,
  phaseText,
  methodText,
  countdown,
}: BreathingCircleProps) {
  // Start collapsed, then animate to the actual phase state
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Small delay to ensure CSS transition works from collapsed to expanded
    const timer = setTimeout(() => setHasInitialized(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const shouldBeExpanded = phase === 'inhale' || phase === 'inhale_hold';
  // Only expand after initialization to allow the transition animation to play
  const isExpanded = hasInitialized && shouldBeExpanded;
  const isAnimating = phase === 'inhale' || phase === 'exhale';

  return (
    <div className="relative flex items-center justify-center w-72 h-72">
      {/* Outer ring - subtle glow */}
      <div
        className={cn(
          'absolute rounded-full bg-white/10 transition-transform',
          isAnimating ? 'ease-linear' : 'ease-out'
        )}
        style={{
          width: '100%',
          height: '100%',
          transform: isExpanded ? 'scale(1)' : 'scale(0.65)',
          transitionDuration: isAnimating ? `${phaseDuration}s` : '0.3s',
        }}
      />

      {/* Middle circle - follows breathing */}
      <div
        className={cn(
          'absolute rounded-full bg-white/20 backdrop-blur-sm transition-transform',
          isAnimating ? 'ease-linear' : 'ease-out'
        )}
        style={{
          width: '80%',
          height: '80%',
          transform: isExpanded ? 'scale(1)' : 'scale(0.55)',
          transitionDuration: isAnimating ? `${phaseDuration}s` : '0.3s',
        }}
      />

      {/* Inner circle - contains text */}
      <div
        className={cn(
          'absolute rounded-full bg-white/30 backdrop-blur-md flex flex-col items-center justify-center transition-transform',
          isAnimating ? 'ease-linear' : 'ease-out'
        )}
        style={{
          width: '55%',
          height: '55%',
          transform: isExpanded ? 'scale(1)' : 'scale(0.7)',
          transitionDuration: isAnimating ? `${phaseDuration}s` : '0.3s',
        }}
      >
        {/* Phase text */}
        <span className="text-2xl font-semibold text-white drop-shadow-sm">
          {phaseText}
        </span>
        
        {/* Method text (Nose/Mouth) or countdown */}
        {countdown !== undefined && phase.includes('hold') ? (
          <span className="text-lg text-white/80 mt-1">{countdown}</span>
        ) : methodText ? (
          <span className="text-sm text-white/70 mt-1">{methodText}</span>
        ) : null}
      </div>

      {/* Decorative dots around the circle */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white/30"
          style={{
            transform: `rotate(${i * 45}deg) translateY(-140px)`,
          }}
        />
      ))}
    </div>
  );
}
