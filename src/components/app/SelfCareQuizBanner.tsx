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
          "relative w-full rounded-3xl p-3.5 overflow-hidden",
          "active:scale-[0.98] transition-transform cursor-pointer animate-fade-in",
          className
        )}
        style={{
          background: 'linear-gradient(135deg, #EB5E33 0%, #F5A623 100%)',
          boxShadow: '0 4px 14px rgba(235,94,51,0.25)',
        }}
      >
        {/* Decorative bubble */}
        <div
          className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 pointer-events-none"
          style={{ background: '#fff' }}
        />

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-black/25 active:bg-black/40 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5 text-white" />
        </button>

        <div className="relative z-[1] flex items-center gap-3 pr-5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-bold leading-tight">
              What's missing in your self-care?
            </p>
            <p className="text-white/80 text-[10px] mt-0.5">
              Take the 2-min Self-Care Quiz
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/90 shrink-0" />
        </div>
      </div>
  );
}
