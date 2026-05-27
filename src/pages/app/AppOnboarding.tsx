import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { OnboardingAnswers } from '@/types/onboarding';
import { OnboardingStepRenderer } from '@/components/admin/onboarding/OnboardingStepRenderer';
import { ChevronLeft } from 'lucide-react';
import { dearMeFlow } from '@/data/onboarding-flows/dear-me';
import { mePlusFlow } from '@/data/onboarding-flows/me-plus';
import { quickStartFlow } from '@/data/onboarding-flows/quick-start';
import { preAuthWelcomeFlow } from '@/data/onboarding-flows/pre-auth-welcome';
import { weeklyReviewFlow } from '@/data/onboarding-flows/weekly-review';
import { selfcareQuizFlow } from '@/data/onboarding-flows/selfcare-quiz';
import { selfcarePersonalityQuizFlow } from '@/data/onboarding-flows/selfcare-personality-quiz';
import { selfcareWeeklyReviewFlow } from '@/data/onboarding-flows/selfcare-weekly-review';
import { whatIsRiloFlow } from '@/data/onboarding-flows/what-is-rilo';
import { riloDoorsFlow } from '@/data/onboarding-flows/rilo-doors';
import { LANG_LABEL_TO_ISO } from '@/components/admin/onboarding/RiloDoorsScreens';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { getFluentEmojiUrl, getFluentEmojiUrlAlt, isEmoji } from '@/lib/fluentEmoji';
import { AnimatePresence, motion } from 'framer-motion';
import meplusMascotBg from '@/assets/meplus-mascot-bg.png';
import meplusPaywall2 from '@/assets/meplus-paywall-2.png';
import meplusPaywall3 from '@/assets/meplus-paywall-3.png';
import meplusCommunityFooter from '@/assets/onboarding/meplus-community-footer.png';
import { Analytics } from '@/lib/firebaseAnalytics';
import { provisionRiloPicks } from '@/lib/onboarding/provisionRiloPicks';
const allFlows = [dearMeFlow, mePlusFlow, quickStartFlow, preAuthWelcomeFlow, weeklyReviewFlow, selfcareQuizFlow, selfcarePersonalityQuizFlow, selfcareWeeklyReviewFlow, whatIsRiloFlow, riloDoorsFlow];

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

  // Filter steps based on subscription + Rilo Doors branching (uses live answers)
  const flow = (() => {
    if (!rawFlow) return undefined;
    let steps = isSubscribed ? rawFlow.steps.filter(s => s.type !== 'paywall') : rawFlow.steps;
    if (rawFlow.id === 'rilo-doors') {
      const lang = answers['rd-language'];
      const langStr = Array.isArray(lang) ? lang[0] : lang;
      const langIso = langStr ? (LANG_LABEL_TO_ISO[langStr] || String(langStr).toLowerCase()) : '';
      const primary = answers['rd-door-primary'];
      const primaryStr = Array.isArray(primary) ? primary[0] : primary;
      steps = steps.filter(s => {
        // Hide language-switch step if user picked English (or hasn't picked yet)
        if (s.id === 'rd-language-switch') {
          return !!langIso && langIso !== 'en';
        }
        // Hide non-matching sharpener branches
        if (s.doorBranch) return s.doorBranch === primaryStr;
        return true;
      });
    }
    return { ...rawFlow, steps };
  })();

  // Preload images on mount + fire onboarding_started (once per flow)
  useEffect(() => {
    if (!flow) return;
    const stepImages = flow.steps.map(s => s.image).filter(Boolean) as string[];
    const extraImages = [meplusMascotBg, meplusPaywall2, meplusPaywall3, meplusCommunityFooter];
    const emojiUrls = collectEmojiUrls(flow);
    preloadImages([...stepImages, ...extraImages, ...emojiUrls]);

    if (flowId) {
      const startedKey = `rilo_onboarding_started_${flowId}`;
      try {
        if (!sessionStorage.getItem(startedKey)) {
          Analytics.onboardingStarted(flowId);
          sessionStorage.setItem(startedKey, '1');
        }
      } catch { /* ignore */ }
      // Fire quiz_started for the self-care quiz flow
      if (flowId === 'selfcare-quiz') {
        try {
          const quizKey = `rilo_quiz_started_${flowId}`;
          if (!sessionStorage.getItem(quizKey)) {
            Analytics.quizStarted(flowId);
            sessionStorage.setItem(quizKey, '1');
          }
        } catch { /* ignore */ }
      }
    }
  }, [flow, flowId]);

  // Fire step_viewed on every step change
  useEffect(() => {
    if (!flow || !flowId) return;
    const step = flow.steps[currentStep];
    if (!step) return;
    Analytics.onboardingStepViewed(flowId, step.id, currentStep);

    // Self-care quiz milestone events
    if (flowId === 'selfcare-quiz') {
      if (step.id === 'sc-diagnosis') Analytics.selfcareQuizDiagnosisViewed('mixed');
      else if (step.id === 'sc-suggestions') Analytics.selfcareQuizSuggestionsViewed(0);
      else if (step.id === 'sc-commitment') Analytics.selfcareQuizCommitment('viewed');
    }
  }, [currentStep, flow, flowId]);

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
    } else if (stepId === 'qs-second-language' || stepId === 'wir-second-language') {
      localStorage.setItem('simora_onboarding_language', typeof answer === 'string' ? answer : answer[0] || '');
    }

    if (flowId) Analytics.onboardingAnswered(flowId, stepId);

    // Self-care quiz: emit a richer event with the actual answer payload
    if (flowId === 'selfcare-quiz') {
      const answerStr = Array.isArray(answer) ? answer.join('|') : String(answer);
      // Heuristic cluster tag based on step id
      const cluster =
        stepId === 'sc-deeper' ? 'deeper'
        : stepId === 'sc-neglecting' ? 'neglecting'
        : stepId === 'sc-weighing' ? 'weighing'
        : stepId === 'sc-win' ? 'win'
        : 'other';
      Analytics.selfcareQuizAnswer(stepId, cluster, answerStr.slice(0, 100));
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
      if (flowId) {
        Analytics.onboardingCompleted(flowId, flow.steps.length);
        if (flowId === 'selfcare-quiz') Analytics.quizCompleted(flowId);
      }
      // Weekly review goes back to home; onboarding flows go to signup
      if (flowId === 'weekly-review') {
        navigate('/app/home');
      } else if (flowId === 'selfcare-quiz') {
        const plusChoice = answers?.['sc-plus-intro'];
        const fromState = Array.isArray(plusChoice) ? plusChoice[0] : plusChoice;
        let choice = fromState;
        if (!choice) {
          try { choice = localStorage.getItem('simora_selfcare_plus_choice') || undefined; } catch {}
        }
        try { localStorage.removeItem('simora_selfcare_plus_choice'); } catch {}
        navigate(choice === 'accepted' ? '/app/home?paywall=1' : '/app/home');
      } else if (flowId === 'selfcare-personality-quiz') {
        navigate('/app/home');
      } else if (flowId === 'what-is-rilo') {
        // Persist the user's morning / afternoon / evening picks as real
        // recurring tasks on their planner. Fire-and-forget so navigation
        // is never blocked.
        if (user?.id) {
          provisionRiloPicks(user.id, answers).catch((err) =>
            console.warn('[Onboarding] provisionRiloPicks failed:', err)
          );
        }
        navigate('/app/home');
      } else if (flowId === 'rilo-doors') {
        // Persist preferred language + (optional) UI language switch
        try {
          const lang = answers['rd-language'];
          const langStr = Array.isArray(lang) ? lang[0] : lang;
          const langIso = langStr ? (LANG_LABEL_TO_ISO[String(langStr)] || String(langStr).toLowerCase()) : '';
          if (langIso) {
            localStorage.setItem('simora_onboarding_language', langIso);
            const switchChoice = answers['rd-language-switch'];
            const switchStr = Array.isArray(switchChoice) ? switchChoice[0] : switchChoice;
            if (switchStr === 'yes') {
              localStorage.setItem('i18nextLng', langIso);
            }
          }
          const nickname = answers['rd-nickname'];
          if (nickname) {
            localStorage.setItem('simora_onboarding_nickname', typeof nickname === 'string' ? nickname : nickname[0] || '');
          }
        } catch {}
        navigate('/app/my-rilo');
      } else {
        navigate('/auth?mode=signup');
      }
    }
  }, [currentStep, flow, flowId, completedKey, progressKey, navigate, user, answers]);

  const goBack = useCallback(() => {
    setDirection(-1);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate('/app/home');
    }
  }, [currentStep, navigate]);

  const handleClose = () => {
    if (flowId) Analytics.onboardingSkipped(flowId, currentStep);
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
  const isRiloDoors = flowId === 'rilo-doors';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isRiloDoors ? 'bg-[#FFF8F2]' : 'bg-white'}`}>
      {/* Navigation bar — hidden on paywall steps (they have their own controls).
          On AI screens (rilo-week-plans) we show only the back button — no progress bar, no top Skip. */}
      {step.type !== 'paywall' && (
        step.type === 'rilo-week-plans' ? (
          <div
            className="absolute left-0 top-0 z-30 px-4 py-2 flex items-center"
            style={{ paddingTop: 'env(safe-area-inset-top, 44px)' }}
          >
            <button onClick={goBack} className="active:opacity-60 p-1">
              <ChevronLeft className="h-5 w-5 text-[#1a1f3d]" />
            </button>
          </div>
        ) : isRiloDoors ? (
          <div
            className="absolute left-0 right-0 top-0 z-30 px-4 py-2 flex items-center"
            style={{ paddingTop: 'env(safe-area-inset-top, 44px)' }}
          >
            <button onClick={goBack} className="mr-2 active:opacity-60 p-1">
              <ChevronLeft className="h-5 w-5 text-[#2A1810]" />
            </button>
            <div className="flex-1 h-[3px] bg-[#2A1810]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#EB5E33] to-[#F5A623] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <button onClick={handleClose} className="ml-2 active:opacity-60 p-1 text-xs text-[#2A1810]/70 font-medium">
              Skip
            </button>
          </div>
        ) : (
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
        )
      )}

      {/* Step content - full screen with slide transition */}
      <div className={`flex-1 overflow-hidden relative ${isRiloDoors ? 'bg-[#FFF8F2]' : 'bg-black'}`}>
        <AnimatePresence mode="wait" custom={direction}>
          {step.type === 'rilo-week-plans' ? (
            <motion.div
              key={step.id}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 h-full"
            >
              <OnboardingStepRenderer
                step={step}
                onNext={goNext}
                onMilestone={handleMilestone}
                onAnswer={handleAnswer}
                answers={answers}
              />
            </motion.div>
          ) : (
            <motion.div
              key={step.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute inset-0 h-full"
            >
              <OnboardingStepRenderer
                step={step}
                onNext={goNext}
                onMilestone={handleMilestone}
                onAnswer={handleAnswer}
                answers={answers}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
