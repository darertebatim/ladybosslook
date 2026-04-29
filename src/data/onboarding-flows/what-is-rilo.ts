import { OnboardingFlow } from '@/types/onboarding';
import cheerfulBird from '@/assets/onboarding/cheerful-bird.png';
import mascotPlanner from '@/assets/onboarding/mascot-planner.png';
import planMascot from '@/assets/onboarding/meplus-plan-mascot.png';

export const whatIsRiloFlow: OnboardingFlow = {
  id: 'what-is-rilo',
  name: 'What is Rilo? (Teach)',
  description: '3-screen explainer that tells new users what Rilo actually is — before any quiz or signup.',
  appName: 'Rilo',
  createdAt: '2026-04-29',
  steps: [
    // 1 — Meet Rilo
    {
      id: 'wir-meet',
      type: 'welcome',
      title: 'Meet Rilo',
      subtitle: 'Your self-care planner — built to help you actually show up for yourself.',
      image: cheerfulBird,
      statHighlight: 'Plan it.\nDo it. Feel it.',
      buttonLabel: 'Show me how',
      secondaryButtonLabel: 'Already a member? Sign in.',
    },
    // 2 — The core idea
    {
      id: 'wir-core',
      type: 'motivational',
      title: 'Plan it. Do it.\nFeel it.',
      subtitle: 'Rilo turns self-care into a simple daily routine — one you’ll actually keep.',
      image: mascotPlanner,
      statBadges: [
        { label: 'Plan your day in seconds', value: '📋' },
        { label: 'Tick off tiny self-care tasks', value: '✅' },
        { label: 'Build a streak that sticks', value: '🔥' },
      ],
      buttonLabel: 'What’s in it for me?',
    },
    // 3 — The promise
    {
      id: 'wir-promise',
      type: 'motivational',
      title: 'In 7 days you’ll have\na routine',
      subtitle: 'No overwhelm. No 50-step morning rituals. Just the few things that move your day.',
      description: 'Join 3,000+ women already using Rilo.',
      image: planMascot,
      buttonLabel: 'Let’s set yours up',
    },
  ],
};