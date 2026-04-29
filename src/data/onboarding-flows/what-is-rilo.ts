import { OnboardingFlow } from '@/types/onboarding';

export const whatIsRiloFlow: OnboardingFlow = {
  id: 'what-is-rilo',
  name: 'What is Rilo? (Teach)',
  description: '3 screens, 15 seconds, no input. Shows post-auth, before the planner.',
  appName: 'Rilo',
  createdAt: '2026-04-29',
  steps: [
    {
      id: 'wir-planner',
      type: 'rilo-teach',
      illustrationLabel: 'planner',
      title: 'Rilo is your self-care planner.',
      buttonLabel: 'Next',
    },
    {
      id: 'wir-routine',
      type: 'rilo-teach',
      illustrationLabel: 'routine',
      title: 'Build small daily routines you actually finish.',
      buttonLabel: 'Next',
    },
    {
      id: 'wir-suggest',
      type: 'rilo-teach',
      illustrationLabel: 'suggest',
      title: "We'll suggest your first one.",
      subtitle: 'You can swap anything.',
      buttonLabel: 'Show me my planner',
    },
  ],
};