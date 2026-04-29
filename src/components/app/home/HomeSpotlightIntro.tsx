import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

interface HomeSpotlightIntroProps {
  isOpen: boolean;
  onStart: () => void;
  onSkip: () => void;
}

/**
 * Bottom-sheet intro that bundles the 3 home spotlights (complete a task,
 * tap a task, add a task) behind a single user-initiated action.
 * Inspired by the Dear Me onboarding sheet.
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
    <div className="fixed inset-0 z-[300] flex items-end justify-center pointer-events-none">
      {/* Dim backdrop (non-dismissible, blocks taps under the sheet) */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" />

      {/* Sheet — Rilo onboarding aesthetic */}
      <div
        className={cn(
          'relative w-full max-w-md mx-auto rounded-t-[28px] pointer-events-auto',
          'bg-[#FBF3D8] text-[#1a1a2e]',
          'animate-in slide-in-from-bottom duration-300',
          'shadow-[0_-12px_40px_rgba(0,0,0,0.18)]'
        )}
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-[#1a1a2e]/15" />
        </div>

        <div className="px-6 pt-4 pb-2 text-center">
          {/* Big 3D emoji — matches Rilo onboarding */}
          <div className="flex justify-center mb-5">
            <FluentEmoji emoji="👋" size={84} />
          </div>

          <h2 className="text-[28px] leading-[1.15] font-extrabold tracking-tight mb-3">
            Welcome to your<br />Home planner
          </h2>

          <p className="text-[15px] text-[#1a1a2e]/65 leading-relaxed mb-7 px-2">
            A 20‑second tour. We'll show you how to open a task,
            add a new one, and check it off.
          </p>

          <button
            onClick={handleStart}
            className="w-full bg-[#1a1a2e] text-white text-[16px] font-semibold py-[18px] rounded-2xl active:scale-[0.98] transition-transform"
          >
            Show me around
          </button>

          <button
            onClick={handleSkip}
            className="w-full mt-3 py-2.5 text-[14px] font-medium text-[#1a1a2e]/55 active:text-[#1a1a2e]/80 transition-colors"
          >
            I'll explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}