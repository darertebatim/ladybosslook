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
          "relative w-full rounded-3xl overflow-hidden",
          "active:scale-[0.98] transition-transform cursor-pointer animate-fade-in",
          className
        )}
        style={{
          aspectRatio: '3 / 1',
          background: 'linear-gradient(135deg, #EB5E33 0%, #F5A623 100%)',
          boxShadow: '0 4px 14px rgba(235,94,51,0.25)',
        }}
      >
        {/* Decorative bubbles */}
        <div
          className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20 pointer-events-none"
          style={{ background: '#fff' }}
        />
        <div
          className="absolute -bottom-8 right-10 w-20 h-20 rounded-full opacity-10 pointer-events-none"
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

        <div className="absolute inset-0 z-[1] flex items-center gap-3 px-4 pr-5">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <p className="text-white text-[14px] font-bold leading-[1.15]">
              Discover your self-care gaps in 1 min
            </p>
            <span
              className="inline-flex items-center gap-1 self-start px-2.5 py-1 rounded-full bg-white text-[10.5px] font-bold text-[#EB5E33]"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}
            >
              <Sparkles className="w-3 h-3" />
              AI Powered Analyze
            </span>
          </div>
        </div>
      </div>
  );
}
