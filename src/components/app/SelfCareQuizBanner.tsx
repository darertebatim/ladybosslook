import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { X } from 'lucide-react';
import selfcareQuizBannerImg from '@/assets/selfcare-quiz-banner.jpg';
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
  const { data: disabledMap = {} } = useSpecialBannerSettings();
  const isAdminDisabled = disabledMap['SelfCareQuizBanner'] === true;
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(SELFCARE_QUIZ_DISMISSED_KEY) === 'true'
  );

  const isVisible = !isCompleted && !isDismissed && !isAdminDisabled;

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
    <button
      onClick={handleTap}
      className={cn(
        "relative w-full rounded-2xl overflow-hidden active:scale-[0.98] transition-all animate-fade-in",
        className
      )}
    >
      <div
        onClick={handleDismiss}
        className="absolute top-2 right-2 z-10 bg-black/40 rounded-full p-1 active:bg-black/60"
      >
        <X className="h-4 w-4 text-white" />
      </div>
      <img
        src={selfcareQuizBannerImg}
        alt="Take the Self-Care Quiz"
        className="w-full h-auto block"
      />
    </button>
  );
}
