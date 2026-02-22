import { useState, useCallback } from 'react';
import { OnboardingFlow, OnboardingAnswers } from '@/types/onboarding';
import { OnboardingStepRenderer } from './OnboardingStepRenderer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  flow: OnboardingFlow;
  onClose: () => void;
}

export function OnboardingPreview({ flow, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const step = flow.steps[currentStep];

  const handleAnswer = useCallback((stepId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [stepId]: answer }));
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < flow.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, flow.steps.length]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleMilestone = useCallback((type: 'review' | 'notification' | 'discount-paywall') => {
    switch (type) {
      case 'review':
        toast.success('📱 In-App Review triggered', { description: 'SKStoreReviewController.requestReview() called' });
        break;
      case 'notification':
        toast.success('🔔 Push Notifications activated', { description: 'UNUserNotificationCenter authorization requested' });
        break;
      case 'discount-paywall':
        toast.info('💰 Discount paywall shown', { description: '50% off offer displayed after closing main paywall' });
        break;
    }
  }, []);

  // Progress percentage
  const progress = ((currentStep + 1) / flow.steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex">
      {/* Step list sidebar */}
      <div className="w-56 bg-card border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">{flow.name}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {flow.steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  i === currentStep
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="font-mono text-[10px] mr-2 opacity-50">{i + 1}</span>
                {s.title || s.subtitle || s.type}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Phone preview area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Phone frame */}
        <div className="relative">
          {/* Phone body */}
          <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
            <div className="w-full h-full rounded-[2.4rem] overflow-hidden bg-white flex flex-col relative">
              {/* iOS Status Bar */}
              <div className="shrink-0 px-6 pt-3 pb-1 flex items-center justify-between z-20 absolute top-0 left-0 right-0" style={{ background: 'transparent' }}>
                <span className="text-xs font-semibold text-black">9:41</span>
                <div className="absolute left-1/2 -translate-x-1/2 top-3 w-28 h-5 bg-black rounded-full" />
                <div className="flex items-center gap-1">
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="black"><rect x="0" y="4" width="3" height="8" rx="1"/><rect x="4.5" y="2.5" width="3" height="9.5" rx="1"/><rect x="9" y="1" width="3" height="11" rx="1"/><rect x="13.5" y="0" width="2.5" height="12" rx="1"/></svg>
                  <svg width="15" height="12" viewBox="0 0 15 12" fill="black"><path d="M7.5 3.5C9.4 3.5 11.1 4.3 12.3 5.5L13.7 4.1C12.1 2.5 10 1.5 7.5 1.5C5 1.5 2.9 2.5 1.3 4.1L2.7 5.5C3.9 4.3 5.6 3.5 7.5 3.5Z"/><path d="M7.5 7C8.6 7 9.6 7.4 10.4 8.1L11.8 6.7C10.6 5.6 9.1 5 7.5 5C5.9 5 4.4 5.6 3.2 6.7L4.6 8.1C5.4 7.4 6.4 7 7.5 7Z"/><circle cx="7.5" cy="10.5" r="1.5"/></svg>
                  <svg width="24" height="12" viewBox="0 0 24 12" fill="black"><rect x="0" y="1" width="20" height="10" rx="2" stroke="black" strokeWidth="1" fill="none"/><rect x="1.5" y="2.5" width="14" height="7" rx="1" fill="black"/><rect x="21" y="4" width="2" height="4" rx="1"/></svg>
                </div>
              </div>

              {/* Navigation bar - overlaid on content */}
              <div className="shrink-0 px-4 py-2 flex items-center absolute top-9 left-0 right-0 z-20">
                {currentStep > 0 && (
                  <button onClick={goBack} className="mr-2 active:opacity-60">
                    <ChevronLeft className="h-5 w-5 text-[#1a1f3d]" />
                  </button>
                )}
                {/* Slim progress bar with transparent background */}
                <div className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1a1f3d] rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Step content */}
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
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground font-mono">
            {currentStep + 1} / {flow.steps.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goNext}
            disabled={currentStep === flow.steps.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Milestone info */}
        <div className="mt-3 flex gap-2 text-[10px] text-muted-foreground">
          <span className={currentStep >= 11 ? 'text-green-500' : ''}>⭐ Review (p12)</span>
          <span>·</span>
          <span className={currentStep >= 22 ? 'text-green-500' : ''}>🔔 PN (p23)</span>
          <span>·</span>
          <span className={currentStep >= 48 ? 'text-green-500' : ''}>💰 Discount (p49+)</span>
        </div>
      </div>
    </div>
  );
}
