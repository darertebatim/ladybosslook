import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import { useSpecialBannerSettings } from '@/hooks/useSpecialBannerSettings';

const SELFCARE_QUIZ_COMPLETED_KEY = 'simora_onboarding_completed_selfcare-quiz';
const SELFCARE_QUIZ_DISMISSED_KEY = 'simora_selfcare_quiz_banner_dismissed';

interface SelfCareQuizBannerProps {
  className?: string;
  onVisibilityChange?: (visible: boolean) => void;
}

export function SelfCareQuizBanner({ className, onVisibilityChange }: SelfCareQuizBannerProps) {
  const navigate = useNavigate();
  const isCompleted = localStorage.getItem(SELFCARE_QUIZ_COMPLETED_KEY) === 'true';
  const { data: disabledMap, isLoading } = useSpecialBannerSettings();
  const isAdminDisabled = disabledMap?.['SelfCareQuizBanner'] === true;
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(SELFCARE_QUIZ_DISMISSED_KEY) === 'true'
  );

  // Hide while we're still resolving the admin disable flag — prevents a
  // flash of a banner the admin has switched off.
  const isVisible = !isLoading && !isCompleted && !isDismissed && !isAdminDisabled;

  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible, onVisibilityChange]);

  if (!isVisible) return null;

  const handleTap = () => {
    haptic.medium();
    navigate('/app/onboarding/selfcare-quiz');
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    localStorage.setItem(SELFCARE_QUIZ_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  return (
    <div
      role="button"
      onClick={handleTap}
      className={cn(
        "relative w-full bg-white dark:bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden",
        "active:scale-[0.98] transition-transform cursor-pointer animate-fade-in",
        className
      )}
    >
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 active:bg-black/60 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-white" />
      </button>

      {/* Content — same writings as the previous image */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D94B2B]/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-[#D94B2B]" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-semibold text-foreground leading-snug">
              Discover your <span className="text-[#D94B2B]">self-care gaps</span> in 1 min
            </h3>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D94B2B]/10">
              <Sparkles className="h-3 w-3 text-[#D94B2B]" />
              <span className="text-[11px] font-semibold text-[#D94B2B] tracking-wide">
                AI Powered Analyze
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
        </div>
      </div>
    </div>
  );
}
