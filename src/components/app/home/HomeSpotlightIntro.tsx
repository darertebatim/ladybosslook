import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

interface HomeSpotlightIntroProps {
  isOpen: boolean;
  onStart: () => void;
  onSkip: () => void;
}

/**
 * Full-screen intro framed as the next step of the "What is Rilo?" onboarding.
 * Cream background, big 3D illustration, decorative ring, supporting copy and
 * a clear primary CTA — visually consistent with rilo-teach screens.
 */
export function HomeSpotlightIntro({ isOpen, onStart, onSkip }: HomeSpotlightIntroProps) {
  if (!isOpen) return null;

  const handleStart = () => {
    haptic.success();
    onStart();
  };

  const handleSkip = () => {
    haptic.light();
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-[10010] flex items-end justify-center pointer-events-none">
      {/* Soft scrim above the sheet — taps close nothing, but dims content */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px] animate-in fade-in duration-200 pointer-events-auto"
      />

      {/* Half-page sheet, lifted above the bottom nav */}
      <div
        className="relative w-full max-w-md mx-auto bg-[#FBF3D8] text-[#1a1a2e] rounded-t-[28px] overflow-hidden shadow-[0_-12px_40px_rgba(0,0,0,0.25)] animate-in slide-in-from-bottom duration-300 pointer-events-auto"
        style={{
          marginBottom: 'calc(env(safe-area-inset-bottom) + 84px)',
          paddingBottom: '20px',
        }}
      >
        {/* Decorative blurred blobs */}
        <div
          aria-hidden
          className="absolute -top-16 -left-10 w-56 h-56 rounded-full opacity-60 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FFD9A8 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-16 -right-10 w-60 h-60 rounded-full opacity-60 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FFB8E0 0%, transparent 70%)' }}
        />

        {/* Grabber */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-[5px] rounded-full bg-[#1a1a2e]/15" />
        </div>

        <div className="relative z-10 px-6 pt-4">
          {/* Step pill */}
          <div className="flex justify-center mb-4">
            <span className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-[#1a1a2e]/55 px-3 py-1.5 rounded-full bg-[#1a1a2e]/[0.06]">
              Last step · Quick tour
            </span>
          </div>

          {/* Hero illustration */}
          <div className="flex items-center justify-center mb-5">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -m-6 rounded-full"
                style={{
                  background:
                    'conic-gradient(from 140deg, #FFD9A8, #FFB8E0, #C9E5FF, #FFE7A8, #FFD9A8)',
                  filter: 'blur(18px)',
                  opacity: 0.55,
                }}
              />
              <div
                className="relative w-[112px] h-[112px] rounded-full bg-white/75 backdrop-blur-sm flex items-center justify-center shadow-[0_14px_36px_rgba(26,26,46,0.12)]"
                style={{ animation: 'riloFloat 3.2s ease-in-out infinite' }}
              >
                <FluentEmoji emoji="✨" size={68} />
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="text-center px-1 mb-5">
            <h2 className="text-[24px] leading-[1.15] font-extrabold tracking-tight mb-2">
              Your planner is ready.
            </h2>
            <p className="text-[14px] text-[#1a1a2e]/65 leading-relaxed">
              A quick 20‑second tour so you know where the magic lives.
            </p>
          </div>

          {/* CTAs */}
          <button
            onClick={handleStart}
            className="w-full bg-[#1a1a2e] text-white text-[15.5px] font-semibold py-[15px] rounded-2xl active:scale-[0.98] transition-transform shadow-[0_8px_24px_rgba(26,26,46,0.25)]"
          >
            Show me around →
          </button>
          <button
            onClick={handleSkip}
            className="w-full mt-2 py-2.5 text-[13px] font-medium text-[#1a1a2e]/55 active:text-[#1a1a2e]/80 transition-colors"
          >
            Skip — I'll explore on my own
          </button>
        </div>
      </div>

      <style>{`
        @keyframes riloFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}