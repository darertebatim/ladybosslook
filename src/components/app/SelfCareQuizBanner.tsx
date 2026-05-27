import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { X, ChevronRight, Sparkles, Wand2 } from 'lucide-react';
import { useSpecialBannerSettings } from '@/hooks/useSpecialBannerSettings';
import { useTranslation } from 'react-i18next';

const SELFCARE_QUIZ_COMPLETED_KEY = 'simora_onboarding_completed_selfcare-personality-quiz';
const SELFCARE_QUIZ_DISMISSED_KEY = 'simora_selfcare_personality_quiz_banner_dismissed';

interface SelfCareQuizBannerProps {
  className?: string;
  onVisibilityChange?: (visible: boolean) => void;
}

export function SelfCareQuizBanner({ className, onVisibilityChange }: SelfCareQuizBannerProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    navigate('/app/onboarding/selfcare-personality-quiz');
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
          "relative w-full rounded-3xl overflow-hidden shadow-ios",
          "active:scale-[0.98] transition-transform cursor-pointer animate-fade-in",
          className
        )}
        style={{
          background:
            'linear-gradient(120deg, #C8421F 0%, #EB5E33 45%, #F5A623 100%)',
        }}
      >
        {/* Shimmer sweep */}
        <motion.div
          aria-hidden
          initial={{ x: '-120%' }}
          animate={{ x: '220%' }}
          transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-y-0 w-1/3"
          style={{
            background:
              'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)',
          }}
        />

        {/* Warm glow blob top-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-8 h-32 w-32 rounded-full opacity-70 blur-2xl"
          style={{ background: 'radial-gradient(circle, #FFD27A 0%, transparent 70%)' }}
        />
        {/* Soft blob bottom-left for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full opacity-40 blur-2xl"
          style={{ background: 'radial-gradient(circle, #FF8A5C 0%, transparent 70%)' }}
        />

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-white active:bg-white/80 transition-colors"
          aria-label={t('homePlanner.dismiss')}
        >
          <X className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
        </button>

        <div className="relative z-[1] flex items-center gap-3 p-3.5 pr-5">
          {/* Gradient icon tile with pulsing ring */}
          <div className="relative shrink-0">
            <motion.div
              aria-hidden
              className="absolute inset-0 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.35)' }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            />
            <div
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FFE7B3 0%, #FFB37A 100%)',
                boxShadow: '0 6px 16px -6px rgba(255,138,92,0.7)',
              }}
            >
              <Wand2 className="w-5 h-5 text-[#7A2E0E]" strokeWidth={2.4} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white text-[14px] font-bold leading-tight">
              Discover your self-care Personalities
            </p>
            <p className="text-white/85 text-[11px] leading-tight mt-0.5">
              60-second AI check-in, tailored just for you
            </p>
            <div
              className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full backdrop-blur"
              style={{ background: 'rgba(255,255,255,0.22)' }}
            >
              <Sparkles className="w-2.5 h-2.5" style={{ color: '#FFE7B3' }} />
              <span className="text-white text-[9px] font-bold tracking-wider uppercase">
                AI Powered
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white shrink-0" />
        </div>
      </div>
  );
}
