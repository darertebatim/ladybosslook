import { OnboardingFlow } from '@/types/onboarding';
import meplusWelcomeMascot from '@/assets/onboarding/meplus-welcome-mascot.png';
import resetBeforeAfter from '@/assets/onboarding/reset-before-after.png';

export const quickStartFlow: OnboardingFlow = {
  id: 'quick-start-v1',
  name: 'Quick Start Onboarding',
  description: 'Fast 5-screen onboarding focused on getting users into the app quickly',
  appName: 'Simora',
  createdAt: '2026-03-14',
  steps: [
    // 1 — Welcome / Promise
    {
      id: 'qs-welcome',
      type: 'welcome',
      title: 'Welcome to Simora!',
      subtitle: 'Reset your day and build\nsmall routines that make\nyou stronger.',
      image: meplusWelcomeMascot,
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
      illustrationLabel: 'Mascot in cozy room',
      options: [
        { label: 'Reduce stress', emoji: '🧘' },
        { label: 'Build discipline', emoji: '💪' },
        { label: 'Improve focus', emoji: '🎯' },
        { label: 'Build stronger routines', emoji: '🔄' },
      ],
    },
    // 3 — Daily reset concept
    {
      id: 'qs-reset-concept',
      type: 'motivational',
      title: 'Your daily reset button',
      subtitle: 'Whenever your day feels scattered, stressed, or heavy — Simora gives you a small reset.\n\nA few guided actions to calm your mind, refocus, and move forward.',
      image: resetBeforeAfter,
      description: '"It feels like having a little daily reset button in my pocket."\n— Yalda-M ⭐⭐⭐⭐⭐',
      buttonLabel: 'Continue',
    },
    // 4 — Starter routine preview with real task cards
    {
      id: 'qs-starter-routine',
      type: 'starter-routine',
      title: 'Here\'s your first routine',
      subtitle: 'A simple daily reset to start your journey',
      buttonLabel: 'Start your first reset',
    },
    // 5 — Daily reset prompt
    {
      id: 'qs-daily-reset-prompt',
      type: 'daily-reset-prompt',
      title: 'Enable Daily Reset?',
      subtitle: 'Your routine resets every morning so you can start each day fresh.',
      buttonLabel: 'Yes, enable it',
      secondaryButtonLabel: 'Maybe later',
    },
    // 6 — Welcome aboard
    {
      id: 'qs-welcome-aboard',
      type: 'welcome-aboard',
      title: 'You\'re all set! 🎉',
      subtitle: 'Your Simora journey starts now.\nLet\'s make today count.',
      buttonLabel: 'Let\'s go!',
    },
  ],
};
