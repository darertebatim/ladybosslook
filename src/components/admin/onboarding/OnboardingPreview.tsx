import { useState } from 'react';
import { OnboardingFlow } from '@/types/onboarding';
import { OnboardingStepRenderer } from './OnboardingStepRenderer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Props {
  flow: OnboardingFlow;
  onClose: () => void;
}

export function OnboardingPreview({ flow, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = flow.steps[currentStep];

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
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />

          {/* Phone body */}
          <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
            <div className="w-full h-full rounded-[2.4rem] overflow-hidden bg-white">
              <OnboardingStepRenderer step={step} />
            </div>
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
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
            onClick={() => setCurrentStep(Math.min(flow.steps.length - 1, currentStep + 1))}
            disabled={currentStep === flow.steps.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
