import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OnboardingAnswers } from '@/types/onboarding';
import { OnboardingStepRenderer } from '@/components/admin/onboarding/OnboardingStepRenderer';
import { ChevronLeft } from 'lucide-react';
import { dearMeFlow } from '@/data/onboarding-flows/dear-me';
import { mePlusFlow } from '@/data/onboarding-flows/me-plus';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import meplusMascotBg from '@/assets/meplus-mascot-bg.png';
import meplusPaywall2 from '@/assets/meplus-paywall-2.png';
import meplusPaywall3 from '@/assets/meplus-paywall-3.png';
import meplusCommunityFooter from '@/assets/onboarding/meplus-community-footer.png';

const allFlows = [dearMeFlow, mePlusFlow];

function preloadImages(srcs: string[]) {
  srcs.forEach(src => {
    if (src) {
      const img = new Image();
      img.src = src;
    }
  });
}

export default function AppOnboarding() {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const flow = allFlows.find(f => f.id === flowId);

  // Restore progress from localStorage
  const progressKey = `simora_onboarding_progress_${flowId}`;
  const completedKey = `simora_onboarding_completed_${flowId}`;

  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = localStorage.getItem(progressKey);
      return saved ? parseInt(saved, 10) : 0;
    } catch { return 0; }
  });
  const [answers, setAnswers] = useState<OnboardingAnswers>({});

  // Preload images on mount
  useEffect(() => {
    if (!flow) return;
    const stepImages = flow.steps.map(s => s.image).filter(Boolean) as string[];
    const extraImages = [meplusMascotBg, meplusPaywall2, meplusPaywall3, meplusCommunityFooter];
    preloadImages([...stepImages, ...extraImages]);
  }, [flow]);

  // Save progress
  useEffect(() => {
    if (flow) {
      localStorage.setItem(progressKey, String(currentStep));
    }
  }, [currentStep, progressKey, flow]);

  const handleAnswer = useCallback((stepId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [stepId]: answer }));
  }, []);

  const goNext = useCallback(() => {
    if (!flow) return;
    if (currentStep < flow.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Completed
      localStorage.setItem(completedKey, 'true');
      localStorage.removeItem(progressKey);
      navigate('/app/home');
    }
  }, [currentStep, flow, completedKey, progressKey, navigate]);

  const goBack = useCallback(() => {
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
      {/* Navigation bar */}
      <div className="shrink-0 px-4 py-2 flex items-center absolute top-[env(safe-area-inset-top,44px)] left-0 right-0 z-20">
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
        <button onClick={handleClose} className="ml-2 active:opacity-60 p-1 text-xs text-muted-foreground font-medium">
          Skip
        </button>
      </div>

      {/* Step content - full screen */}
      <div className="flex-1 overflow-hidden">
        <OnboardingStepRenderer
          key={step.id}
          step={step}
          onNext={goNext}
          onMilestone={handleMilestone}
          onAnswer={handleAnswer}
          answers={answers}
        />
      </div>
    </div>
  );
}
