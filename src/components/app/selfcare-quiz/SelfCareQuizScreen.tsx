import type { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import {
  ScIntroScreen,
  ScHookScreen,
  ScSingleSelectScreen,
  ScMultiSelectScreen,
  ScDeeperScreen,
} from './visuals/GenericQuizSteps';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
  answers?: OnboardingAnswers;
}

/**
 * Dispatcher for the redesigned Self-Care Quiz steps. Returns null when the
 * step is not part of this flow's bespoke screens — letting the caller fall
 * through to the default OnboardingStepRenderer switch.
 */
export function SelfCareQuizScreen({ step, onNext, onAnswer, answers }: Props) {
  switch (step.id) {
    case 'sc-intro':
      return <ScIntroScreen step={step} onNext={onNext} onAnswer={onAnswer} answers={answers} />;
    case 'sc-hook':
      return <ScHookScreen step={step} onNext={onNext} onAnswer={onAnswer} answers={answers} />;
    case 'sc-weighing':
    case 'sc-win':
      return <ScSingleSelectScreen step={step} onNext={onNext} onAnswer={onAnswer} answers={answers} />;
    case 'sc-neglecting':
      return <ScMultiSelectScreen step={step} onNext={onNext} onAnswer={onAnswer} answers={answers} />;
    case 'sc-deeper':
      return <ScDeeperScreen step={step} onNext={onNext} onAnswer={onAnswer} answers={answers} />;
    default:
      return null;
  }
}