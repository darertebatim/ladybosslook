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
  // Determine if circle should be expanded (at max) or collapsed (at min)
  const isExpanded = phase === 'inhale' || phase === 'inhale_hold';
  const isAnimating = phase === 'inhale' || phase === 'exhale';

  // Calculate the animated circle scale (moves between inner and outer fixed rings)
  // Inner ring is at ~40% size, outer ring is at 100% size
  // Animated circle moves between 45% (collapsed) and 95% (expanded)
  const animatedScale = isExpanded ? 0.95 : 0.45;

  return (
    <div className="relative flex items-center justify-center w-72 h-72">
      {/* Outer fixed ring - marks the "full inhale" boundary */}
      <div 
        className="absolute rounded-full border-2 border-primary/30"
        style={{
          width: '100%',
          height: '100%',
        }}
      />

      {/* Inner fixed ring - marks the "full exhale" boundary */}
      <div 
        className="absolute rounded-full border-2 border-primary/30"
        style={{
          width: '40%',
          height: '40%',
        }}
      />

      {/* Animated circle - expands/contracts between the two fixed rings */}
      <div
        className={cn(
          'absolute rounded-full bg-gradient-to-br from-primary/60 to-primary/40 backdrop-blur-sm shadow-lg transition-transform',
          isAnimating ? 'ease-linear' : 'ease-out'
        )}
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${animatedScale})`,
          transitionDuration: isAnimating ? `${phaseDuration}s` : '0.3s',
        }}
      />

      {/* Center content circle with text */}
      <div 
        className="absolute rounded-full bg-primary/80 backdrop-blur-md flex flex-col items-center justify-center shadow-xl"
        style={{
          width: '35%',
          height: '35%',
        }}
      >
        {/* Phase text */}
        <span className="text-xl font-semibold text-primary-foreground drop-shadow-sm">
          {phaseText}
        </span>
        
        {/* Method text (Nose/Mouth) or countdown */}
        {countdown !== undefined && phase.includes('hold') ? (
          <span className="text-base text-primary-foreground/80 mt-0.5">{countdown}</span>
        ) : methodText ? (
          <span className="text-xs text-primary-foreground/70 mt-0.5">{methodText}</span>
        ) : null}
      </div>
    </div>
  );
}
