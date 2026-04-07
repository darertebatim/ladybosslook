import type { OnboardingFlow } from '@/types/onboarding';

export const selfcareQuizFlow: OnboardingFlow = {
  id: 'selfcare-quiz',
  name: "What's Missing?",
  description: 'A quick diagnostic to find your neglected self-care areas',
  appName: 'Ladybosslook',
  createdAt: '2026-04-07',
  steps: [
    {
      id: 'sc-hook',
      type: 'motivational',
      title: "Your problem isn't productivity.",
      subtitle: "It's that one part of your life is quietly falling apart.",
      buttonLabel: "Let's find out →",
    },
    {
      id: 'sc-drain',
      type: 'single-select',
      title: "What's draining you the most right now?",
      options: [
        { label: 'Stress & anxiety', emoji: '😰' },
        { label: 'Constant tiredness', emoji: '😴' },
        { label: 'Screen overload', emoji: '📱' },
        { label: 'Feeling disconnected', emoji: '😔' },
      ],
    },
    {
      id: 'sc-morning',
      type: 'single-select',
      title: 'Your perfect morning looks like...',
      options: [
        { label: 'Peaceful & slow', emoji: '☀️' },
        { label: 'Active & energized', emoji: '💪' },
        { label: 'Fresh & put-together', emoji: '🧴' },
        { label: 'Organized & productive', emoji: '📋' },
      ],
    },
    {
      id: 'sc-skipping',
      type: 'multi-select',
      title: 'Be honest... which of these have you been skipping?',
      subtitle: 'Select all that apply',
      options: [
        { label: 'Getting enough sleep', emoji: '😴' },
        { label: 'Drinking water', emoji: '💧' },
        { label: 'Moving your body', emoji: '🚶' },
        { label: 'Skincare / grooming', emoji: '🧴' },
        { label: 'A moment of silence', emoji: '🧘' },
        { label: 'Connecting with someone', emoji: '💬' },
        { label: 'Tidying your space', emoji: '🧹' },
        { label: 'Doing something kind for yourself', emoji: '💕' },
      ],
    },
    {
      id: 'sc-proud',
      type: 'single-select',
      title: 'What would make you proud this week?',
      options: [
        { label: 'A real morning routine', emoji: '🌅' },
        { label: 'Taking care of my mind', emoji: '🧠' },
        { label: 'Taking care of my body', emoji: '💪' },
        { label: 'Reconnecting with people', emoji: '🤝' },
      ],
    },
    {
      id: 'sc-diagnosis',
      type: 'selfcare-diagnosis',
      title: 'Your Self-Care Diagnosis',
      buttonLabel: 'Done',
    },
  ],
};
