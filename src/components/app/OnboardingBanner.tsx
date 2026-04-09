import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { X } from 'lucide-react';
import onboardingBannerImg from '@/assets/onboarding-banner.png';
import { useSpecialBannerSettings } from '@/hooks/useSpecialBannerSettings';

const ONBOARDING_COMPLETED_KEY = 'simora_onboarding_completed_me-plus-v1';
const ONBOARDING_PROGRESS_KEY = 'simora_onboarding_progress_me-plus-v1';
const ONBOARDING_DISMISSED_KEY = 'simora_onboarding_banner_dismissed';

export function OnboardingBanner() {
  const navigate = useNavigate();
  const isCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
  const { data: disabledMap = {} } = useSpecialBannerSettings();
  const isAdminDisabled = disabledMap['OnboardingBanner'] === true;
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(ONBOARDING_DISMISSED_KEY) === 'true'
  );

  if (isCompleted || isDismissed || isAdminDisabled) return null;

  const handleTap = () => {
    haptic.medium();
    localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
    navigate('/app/onboarding/me-plus-v1');
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  return (
    <button
      onClick={handleTap}
      className={cn(
        "relative w-full rounded-2xl overflow-hidden active:scale-[0.98] transition-all mt-5 mb-4 animate-fade-in"
      )}
    >
      <div
        onClick={handleDismiss}
        className="absolute top-2 right-2 z-10 bg-black/40 rounded-full p-1 active:bg-black/60"
      >
        <X className="h-4 w-4 text-white" />
      </div>
      <img
        src={onboardingBannerImg}
        alt="Start your Ladybosslook onboarding"
        className="w-full h-auto block"
      />
    </button>
  );
}
