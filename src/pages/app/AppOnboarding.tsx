import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { OnboardingAnswers } from '@/types/onboarding';
import { OnboardingStepRenderer } from '@/components/admin/onboarding/OnboardingStepRenderer';
import { ChevronLeft } from 'lucide-react';
import { dearMeFlow } from '@/data/onboarding-flows/dear-me';
import { mePlusFlow } from '@/data/onboarding-flows/me-plus';
import { quickStartFlow } from '@/data/onboarding-flows/quick-start';
import { weeklyReviewFlow } from '@/data/onboarding-flows/weekly-review';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { getFluentEmojiUrl, getFluentEmojiUrlAlt, isEmoji } from '@/lib/fluentEmoji';
import { AnimatePresence, motion } from 'framer-motion';
import meplusMascotBg from '@/assets/meplus-mascot-bg.png';
import meplusPaywall2 from '@/assets/meplus-paywall-2.png';
import meplusPaywall3 from '@/assets/meplus-paywall-3.png';
import meplusCommunityFooter from '@/assets/onboarding/meplus-community-footer.png';

const allFlows = [dearMeFlow, mePlusFlow, quickStartFlow, weeklyReviewFlow];

function preloadImages(srcs: string[]) {
  srcs.forEach(src => {
    if (src) {
      const img = new Image();
      img.src = src;
    }
  });
}

/**
 * Collect all unique emoji characters used in onboarding steps
 * and return their Fluent Emoji CDN URLs for preloading
 */
function collectEmojiUrls(flow: typeof mePlusFlow): string[] {
  const emojis = new Set<string>();

  for (const step of flow.steps) {
    // Emojis from options
    step.options?.forEach(opt => {
      if (opt.emoji && isEmoji(opt.emoji)) emojis.add(opt.emoji);
    });
    // Emojis from stat badges
    step.statBadges?.forEach(b => {
      if (b.value && isEmoji(b.value)) emojis.add(b.value);
    });
  }

  // Emojis used in personalized plan (all possible ones)
  const planEmojis = ['😴', '🌅', '⚡', '🔋', '📋', '🏃', '🎯', '🧘', '🧠', '🚀', '🤝', '💚', '🏆', '🌈', '📊', '🔔', '✨'];
  planEmojis.forEach(e => emojis.add(e));

  const urls: string[] = [];
  emojis.forEach(emoji => {
    urls.push(getFluentEmojiUrl(emoji));
    urls.push(getFluentEmojiUrlAlt(emoji));
  });
  return urls;
}

export default function AppOnboarding() {
  const { flowId } = useParams<{ flowId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const rawFlow = allFlows.find(f => f.id === flowId);

  // Filter out paywall steps for subscribed users
  const flow = rawFlow ? {
    ...rawFlow,
    steps: isSubscribed ? rawFlow.steps.filter(s => s.type !== 'paywall') : rawFlow.steps,
  } : undefined;

  // Restore progress from localStorage
  const progressKey = `simora_onboarding_progress_${flowId}`;
  const completedKey = `simora_onboarding_completed_${flowId}`;

  const [currentStep, setCurrentStep] = useState(() => {
    // Support ?step=N query param for direct step preview
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const parsed = parseInt(stepParam, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
    try {
      const saved = localStorage.getItem(progressKey);
      return saved ? parseInt(saved, 10) : 0;
    } catch { return 0; }
  });
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Preload images on mount
  useEffect(() => {
    if (!flow) return;
    const stepImages = flow.steps.map(s => s.image).filter(Boolean) as string[];
    const extraImages = [meplusMascotBg, meplusPaywall2, meplusPaywall3, meplusCommunityFooter];
    const emojiUrls = collectEmojiUrls(flow);
    preloadImages([...stepImages, ...extraImages, ...emojiUrls]);
  }, [flow]);

  // Save progress
  useEffect(() => {
    if (flow) {
      localStorage.setItem(progressKey, String(currentStep));
    }
  }, [currentStep, progressKey, flow]);

  const handleAnswer = useCallback((stepId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [stepId]: answer }));

    // Save profile-relevant answers to localStorage for post-signup sync
    if (stepId === 'qs-nickname') {
      localStorage.setItem('simora_onboarding_nickname', typeof answer === 'string' ? answer : answer[0] || '');
    } else if (stepId === 'qs-gender') {
      localStorage.setItem('simora_onboarding_gender', typeof answer === 'string' ? answer : answer[0] || '');
    } else if (stepId === 'qs-age-group') {
      localStorage.setItem('simora_onboarding_age_group', typeof answer === 'string' ? answer : answer[0] || '');
    } else if (stepId === 'qs-second-language') {
      localStorage.setItem('simora_onboarding_language', typeof answer === 'string' ? answer : answer[0] || '');
    }

    // Persist answer to Supabase
    if (user && flowId) {
      supabase.from('onboarding_answers').insert({
        user_id: user.id,
        flow_id: flowId,
        step_id: stepId,
        answer: Array.isArray(answer) ? answer : [answer],
      } as any).then(({ error }) => {
        if (error) console.warn('[Onboarding] Failed to persist answer:', error.message);
      });
    }
  }, [user, flowId]);

  const goNext = useCallback(() => {
    if (!flow) return;
    setDirection(1);
    if (currentStep < flow.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem(completedKey, 'true');
      localStorage.removeItem(progressKey);
      // Weekly review goes back to home; onboarding flows go to signup
      if (flowId === 'weekly-review') {
        navigate('/app/home');
      } else {
        navigate('/auth?mode=signup');
      }
    }
  }, [currentStep, flow, completedKey, progressKey, navigate]);

  const goBack = useCallback(() => {
    setDirection(-1);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate('/app/home');
    }
  }, [currentStep, navigate]);

  const handleClose = () => {
    navigate('/app/home');
  };

  const handleMilestone = useCallback((type: 'review' | 'notification' | 'discount-paywall') => {
    // In the real app, these would trigger native APIs
  }, []);

  if (!flow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Flow not found</p>
      </div>
    );
  }

  const step = flow.steps[currentStep];
  const progress = ((currentStep + 1) / flow.steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Navigation bar — hidden on paywall steps (they have their own controls) */}
      {step.type !== 'paywall' && (
        <div className="shrink-0 px-4 py-2 flex items-center z-20 bg-white" style={{ paddingTop: 'env(safe-area-inset-top, 44px)' }}>
          <button onClick={goBack} className="mr-2 active:opacity-60 p-1">
            <ChevronLeft className="h-5 w-5 text-[#1a1f3d]" />
          </button>
          {/* Slim progress bar */}
          <div className="flex-1 h-[3px] bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1a1f3d] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button onClick={handleClose} className="ml-2 active:opacity-60 p-1 text-xs text-[#1a1f3d] font-medium">
            Skip
          </button>
        </div>
      )}

      {/* Step content - full screen with slide transition */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="h-full"
          >
            <OnboardingStepRenderer
              step={step}
              onNext={goNext}
              onMilestone={handleMilestone}
              onAnswer={handleAnswer}
              answers={answers}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
