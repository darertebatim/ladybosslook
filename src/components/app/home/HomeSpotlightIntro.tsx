import { AlarmClock } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

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

      {/* Sheet */}
      <div
        className={cn(
          'relative w-full max-w-md mx-auto rounded-t-3xl pointer-events-auto',
          'bg-[#FBF3D8] text-[#1a1a2e]',
          'animate-in slide-in-from-bottom duration-300',
          'shadow-[0_-8px_32px_rgba(0,0,0,0.15)]'
        )}
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        <div className="px-6 pt-7 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-4">
            <AlarmClock className="w-7 h-7 text-indigo-600" />
          </div>

          <h2 className="text-2xl font-bold mb-2">
            Let's take a quick tour!
          </h2>

          <p className="text-base text-[#1a1a2e]/70 leading-relaxed mb-6">
            We'll show you 3 quick things — how to complete a task,
            view its details, and add a new one.
          </p>

          <button
            onClick={handleStart}
            className="w-full bg-[#1a1a2e] text-white font-semibold py-4 rounded-2xl active:scale-[0.98] transition-transform"
          >
            Show me
          </button>

          <button
            onClick={handleSkip}
            className="w-full mt-3 py-2 text-sm font-medium text-[#1a1a2e]/50 active:text-[#1a1a2e]/80 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}