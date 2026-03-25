/**
 * Dark immersive breathing circle — the "zen" layout.
 * Uses the exact same scale/transition logic as the classic BreathingCircle.
 */

type BreathPhase = 'inhale' | 'inhale_hold' | 'exhale' | 'exhale_hold' | 'ready';

interface Props {
  phase: BreathPhase;
  phaseDuration: number;
  phaseText: string;
  methodText?: string;
  countdown?: number;
  isCountingDown?: boolean;
  countdownValue?: number;
  phaseSecondsLeft?: number;
}

export function ImmersiveBreathingCircle({
  phase,
  phaseDuration,
  phaseText,
  methodText,
  countdown,
  isCountingDown,
  countdownValue,
  phaseSecondsLeft,
}: Props) {
  const isInhaling = phase === 'inhale';
  const isExhaling = phase === 'exhale';
  const isAnimating = isInhaling || isExhaling;
  const isHolding = phase === 'inhale_hold' || phase === 'exhale_hold';
  const isReady = phase === 'ready';

  // Exact same scale logic as classic BreathingCircle
  let animatedScale = 0.40; // default collapsed (ready, exhale_hold)
  if (phase === 'inhale_hold') {
    animatedScale = 1.0;
  } else if (isInhaling) {
    animatedScale = 1.0; // animating TO expanded
  } else if (isExhaling) {
    animatedScale = 0.40; // animating TO collapsed
  }

  const transitionDuration = isAnimating ? `${phaseDuration}s` : '0.3s';
  const glowOpacity = animatedScale > 0.7 ? 0.5 : isHolding ? 0.4 : 0.2;

  return (
    <>
      <style>{`
        @keyframes imm-pulse-ring { 0%,100% { opacity:0.15; transform:scale(1); } 50% { opacity:0.3; transform:scale(1.05); } }
        @keyframes imm-hold-pulse { 0%,100% { filter:brightness(1); } 50% { filter:brightness(1.15); } }
        @keyframes imm-count-pop { 0% { transform:scale(0.5); opacity:0; } 40% { transform:scale(1.15); opacity:1; } 100% { transform:scale(1); opacity:1; } }
        @keyframes imm-spin-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes imm-spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes imm-ring-glow { 0%,100% { box-shadow: 0 0 24px rgba(139,92,246,0.35), 0 0 4px rgba(196,181,253,0.2); } 50% { box-shadow: 0 0 36px rgba(139,92,246,0.55), 0 0 8px rgba(196,181,253,0.4); } }
      `}</style>

      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        {/* Outer ambient glow ring */}
        <div
          className="absolute rounded-full transition-opacity duration-[2000ms]"
          style={{
            width: '105%', height: '105%',
            background: 'conic-gradient(from 0deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1), rgba(168,85,247,0.15), rgba(139,92,246,0.15))',
            animation: 'imm-pulse-ring 4s ease-in-out infinite',
            filter: 'blur(8px)',
            opacity: glowOpacity,
          }}
        />

        {/* Inner fixed ring - marks the "full exhale" boundary */}
        <div
          className="absolute rounded-full"
          style={{ width: '40%', height: '40%', border: '1.5px solid rgba(167,139,250,0.2)' }}
        />

        {/* Hold direction ring — always rendered, fades in/out smoothly */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '100%', height: '100%',
            transform: `scale(${isHolding ? (phase === 'inhale_hold' ? 1.04 : 0.44) : animatedScale > 0.7 ? 1.04 : 0.44})`,
            opacity: isHolding ? 1 : 0,
            transition: 'transform 0.5s ease-out, opacity 0.8s ease-in-out',
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              border: '2px solid rgba(167,139,250,0.18)',
              borderTopColor: 'rgba(196,181,253,0.85)',
              borderRightColor: 'rgba(196,181,253,0.1)',
              borderBottomColor: 'rgba(167,139,250,0.45)',
              borderLeftColor: 'rgba(196,181,253,0.08)',
              animation: isHolding
                ? `${phase === 'inhale_hold' ? 'imm-spin-cw' : 'imm-spin-ccw'} 6s linear infinite, imm-ring-glow 3s ease-in-out infinite`
                : 'none',
            }}
          />
        </div>

        {/* Animated breathing circle — uses CSS transition like classic */}
        <div
          className="absolute rounded-full"
          style={{
            width: '100%', height: '100%',
            transform: `scale(${animatedScale})`,
            transitionProperty: 'transform',
            transitionTimingFunction: isAnimating ? 'linear' : 'ease-out',
            transitionDuration: transitionDuration,
            background: 'radial-gradient(circle at 40% 35%, rgba(139,92,246,0.25) 0%, rgba(99,102,241,0.15) 50%, rgba(79,70,229,0.08) 100%)',
            boxShadow: `0 0 40px 10px rgba(139,92,246,${glowOpacity * 0.4}), 0 0 80px 30px rgba(99,102,241,${glowOpacity * 0.2}), inset 0 0 30px rgba(167,139,250,0.1)`,
            backdropFilter: 'blur(4px)',
            animation: isHolding ? 'imm-hold-pulse 3s ease-in-out infinite' : 'none',
          }}
        />

        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center z-10" style={{ width: '35%', height: '35%' }}>
          {isCountingDown ? (
            <span
              key={countdownValue}
              className="text-4xl font-light text-white/90"
              style={{ animation: 'imm-count-pop 0.5s ease-out', textShadow: '0 0 20px rgba(139,92,246,0.5)' }}
            >
              {countdownValue}
            </span>
          ) : (
            <>
              <span
                className={`${isHolding ? 'text-2xl' : 'text-xl'} font-light ${isHolding ? 'text-white/95' : 'text-white/90'} tracking-wider transition-all duration-300`}
                style={{ textShadow: isHolding ? '0 0 20px rgba(168,85,247,0.5)' : '0 0 15px rgba(139,92,246,0.3)' }}
              >
                {phaseText}
              </span>
              {!isHolding && methodText ? (
                <span className="text-[10px] text-white/35 mt-1.5 px-2.5 py-0.5 rounded-full border border-white/10 tracking-wider uppercase">
                  {methodText}
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/** Returns the immersive background gradient for a given phase */
export function getImmersiveBgGradient(phase: BreathPhase, isCountingDown?: boolean): string {
  if (isCountingDown) return 'radial-gradient(ellipse at 50% 40%, #1a0e3e 0%, #0d0825 50%, #06050f 100%)';
  switch (phase) {
    case 'inhale': return 'radial-gradient(ellipse at 50% 35%, #1e1155 0%, #120a3a 40%, #080618 100%)';
    case 'inhale_hold': return 'radial-gradient(ellipse at 50% 38%, #251560 0%, #150c45 40%, #0a0720 100%)';
    case 'exhale': return 'radial-gradient(ellipse at 50% 45%, #160d42 0%, #0e0830 40%, #06050f 100%)';
    case 'exhale_hold': return 'radial-gradient(ellipse at 50% 42%, #12103a 0%, #0b0828 40%, #050412 100%)';
    default: return 'radial-gradient(ellipse at 50% 40%, #1a0e3e 0%, #0d0825 50%, #06050f 100%)';
  }
}

/** Floating bokeh particles for the immersive layout */
export function ImmersiveParticles() {
  return (
    <>
      <style>{`
        @keyframes imm-float-1 { 0%,100% { transform: translate(0,0) scale(1); opacity:0.3; } 25% { transform: translate(30px,-40px) scale(1.2); opacity:0.5; } 50% { transform: translate(-20px,-80px) scale(0.8); opacity:0.2; } 75% { transform: translate(40px,-30px) scale(1.1); opacity:0.4; } }
        @keyframes imm-float-2 { 0%,100% { transform: translate(0,0) scale(1); opacity:0.2; } 33% { transform: translate(-40px,30px) scale(1.3); opacity:0.4; } 66% { transform: translate(50px,-20px) scale(0.9); opacity:0.15; } }
        @keyframes imm-float-3 { 0%,100% { transform: translate(0,0); opacity:0.25; } 50% { transform: translate(-30px,-50px); opacity:0.45; } }
      `}</style>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute rounded-full" style={{ width: 6, height: 6, background: 'rgba(167,139,250,0.4)', top: '15%', left: '20%', animation: 'imm-float-1 12s ease-in-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: 4, height: 4, background: 'rgba(129,140,248,0.3)', top: '25%', right: '15%', animation: 'imm-float-2 15s ease-in-out infinite 2s' }} />
        <div className="absolute rounded-full" style={{ width: 8, height: 8, background: 'rgba(192,132,252,0.25)', bottom: '30%', left: '12%', animation: 'imm-float-3 18s ease-in-out infinite 1s' }} />
        <div className="absolute rounded-full" style={{ width: 3, height: 3, background: 'rgba(196,181,253,0.35)', top: '60%', right: '25%', animation: 'imm-float-1 14s ease-in-out infinite 4s' }} />
        <div className="absolute rounded-full" style={{ width: 5, height: 5, background: 'rgba(165,180,252,0.2)', bottom: '20%', right: '35%', animation: 'imm-float-2 16s ease-in-out infinite 3s' }} />
      </div>
    </>
  );
}
