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
      id: 'wir-task-details',
      type: 'rilo-teach',
      illustrationLabel: 'task-details',
      title: 'Every task, exactly how you want it.',
      subtitle: 'Time, repeat, reminders, color, subtasks, notes — small details that keep your routine on track.',
      buttonLabel: 'Next',
    },
    {
      id: 'wir-tools-hub',
      type: 'rilo-teach',
      illustrationLabel: 'tools-hub',
      title: 'Everything you’d download 8 apps for.',
      subtitle: 'Calm, sleep, workouts, journal, calendar, habits, career, money — all already inside Rilo. Free.',
      buttonLabel: 'Next',
    },
    {
      id: 'wir-tools-hub-v2',
      type: 'rilo-teach',
      illustrationLabel: 'tools-hub-v2',
      title: 'Delete 8 apps. Keep one.',
      subtitle: 'Calm, sleep, workouts, journal, calendar, habits, career, money — Rilo replaces them all. Free.',
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