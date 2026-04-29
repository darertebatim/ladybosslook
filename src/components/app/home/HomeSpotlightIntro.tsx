import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
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
    <div className="fixed inset-0 z-[10010] flex items-stretch justify-center bg-[#FBF3D8] text-[#1a1a2e] animate-in fade-in duration-200">
      {/* Decorative blurred blobs — same family as rilo-teach */}
      <div
        aria-hidden
        className="absolute -top-24 -left-16 w-72 h-72 rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, #FFD9A8 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-20 -right-16 w-80 h-80 rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, #FFB8E0 0%, transparent 70%)' }}
      />

      <div
        className="relative z-10 w-full max-w-md mx-auto flex flex-col px-6"
        style={{
          paddingTop: 'max(28px, env(safe-area-inset-top))',
          paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Tiny step pill — anchors this as a continuation of onboarding */}
        <div className="flex justify-center pt-4">
          <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#1a1a2e]/55 px-3 py-1.5 rounded-full bg-[#1a1a2e]/[0.06]">
            Last step · Quick tour
          </span>
        </div>

        {/* Hero illustration: emoji inside a soft ringed plate */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 -m-8 rounded-full"
              style={{
                background:
                  'conic-gradient(from 140deg, #FFD9A8, #FFB8E0, #C9E5FF, #FFE7A8, #FFD9A8)',
                filter: 'blur(22px)',
                opacity: 0.55,
              }}
            />
            <div
              className="relative w-[180px] h-[180px] rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-[0_18px_50px_rgba(26,26,46,0.12)]"
              style={{ animation: 'riloFloat 3.2s ease-in-out infinite' }}
            >
              <FluentEmoji emoji="✨" size={110} />
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="text-center px-1">
          <h2 className="text-[30px] leading-[1.1] font-extrabold tracking-tight mb-3">
            Your planner<br />is ready.
          </h2>
          <p className="text-[15.5px] text-[#1a1a2e]/65 leading-relaxed mb-8">
            A quick 20‑second tour so you know
            <br />
            where the magic lives.
          </p>
        </div>

        {/* CTAs */}
        <div className="pb-2">
          <button
            onClick={handleStart}
            className="w-full bg-[#1a1a2e] text-white text-[16px] font-semibold py-[18px] rounded-2xl active:scale-[0.98] transition-transform shadow-[0_8px_24px_rgba(26,26,46,0.25)]"
          >
            Show me around →
          </button>
          <button
            onClick={handleSkip}
            className="w-full mt-3 py-3 text-[14px] font-medium text-[#1a1a2e]/55 active:text-[#1a1a2e]/80 transition-colors"
          >
            Skip — I'll explore on my own
          </button>
        </div>
      </div>

      <style>{`
        @keyframes riloFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}