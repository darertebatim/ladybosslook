import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import onboardingBannerImg from '@/assets/onboarding-banner.png';

const ONBOARDING_COMPLETED_KEY = 'simora_onboarding_completed_me-plus-v1';
const ONBOARDING_PROGRESS_KEY = 'simora_onboarding_progress_me-plus-v1';

export function OnboardingBanner() {
  const navigate = useNavigate();
  const isCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';

  if (isCompleted) return null;

  const handleTap = () => {
    haptic.medium();
    navigate('/app/onboarding/me-plus-v1');
  };

  return (
    <button
      onClick={handleTap}
      className={cn(
        "relative w-full rounded-2xl overflow-hidden active:scale-[0.98] transition-all mb-4 animate-fade-in"
      )}
    >
      <img
        src={onboardingBannerImg}
        alt="Start your Simora onboarding"
        className="w-full h-auto block"
      />
    </button>
  );
}
