import { OnboardingFlow } from '@/types/onboarding';

export const quickStartFlow: OnboardingFlow = {
  id: 'quick-start-v1',
  name: 'Quick Start Onboarding',
  description: 'Fast 4-screen onboarding focused on getting users into the app quickly',
  appName: 'Simora',
  createdAt: '2026-03-14',
  steps: [
    // 1 — Welcome / Promise
    {
      id: 'qs-welcome',
      type: 'welcome',
      title: 'Welcome to Simora!',
      subtitle: 'Reset your day and build\nsmall routines that make\nyou stronger.',
      statBadges: [
        { label: 'High-Rated App', value: '4.9' },
        { label: "Users' choice", value: '31 Million' },
      ],
      buttonLabel: 'Get Started',
    },
    // 2 — Intent question
    {
      id: 'qs-intent',
      type: 'single-select',
      title: 'What do you want\nmost right now?',
      subtitle: 'We\'ll personalise your first routine based on your answer.',
      options: [
        { label: 'Reduce stress', emoji: '🧘' },
        { label: 'Build discipline', emoji: '💪' },
        { label: 'Improve focus', emoji: '🎯' },
        { label: 'Build stronger routines', emoji: '🔄' },
      ],
    },
    // 3 — Starter routine preview
    {
      id: 'qs-starter-routine',
      type: 'confetti-message',
      title: 'Here\'s your first routine ✨',
      subtitle: 'A simple daily reset to start your journey:',
      description: '🌤️ Check in with your mood\n🫁 Take a breathing exercise\n📝 Write a short reflection\n✅ Complete one small task',
      buttonLabel: 'Start your first reset',
    },
    // 4 — Welcome aboard
    {
      id: 'qs-welcome-aboard',
      type: 'welcome-aboard',
      title: 'You\'re all set! 🎉',
      subtitle: 'Your Simora journey starts now.\nLet\'s make today count.',
      buttonLabel: 'Let\'s go!',
    },
  ],
};
