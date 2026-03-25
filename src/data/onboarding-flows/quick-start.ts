import { OnboardingFlow } from '@/types/onboarding';
import meplusWelcomeMascot from '@/assets/onboarding/meplus-welcome-mascot.png';
import resetBeforeAfter from '@/assets/onboarding/reset-before-after.png';
import mascotPlanner from '@/assets/onboarding/mascot-planner.png';

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
      title: 'Welcome to Ladybosslook!',
      subtitle: 'Your day, back in your hands.',
      image: meplusWelcomeMascot,
      statHighlight: 'Your **FREE** Routine Planner',
      secondaryButtonLabel: 'Already a member? Sign in.',
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
      title: 'How does your mind feel\nin this moment?',
      subtitle: 'We\'ll use this to guide your first reset.',
      illustrationLabel: 'Mascot in cozy room',
      options: [
        { label: 'A bit scattered (Focus)', emoji: '☁️' },
        { label: 'Feeling the pressure (Stress)', emoji: '🌪️' },
        { label: 'I need a spark (Motivation)', emoji: '✨' },
        { label: 'Just looking for a rhythm (Routines)', emoji: '🌿' },
      ],
    },
    // 3 — Daily reset concept
    {
      id: 'qs-reset-concept',
      type: 'motivational',
      title: 'Your daily reset button',
      subtitle: '',
      image: resetBeforeAfter,
      description: '"It feels like having a little daily reset button in my pocket." — Yalda-M ⭐⭐⭐⭐⭐',
      buttonLabel: 'Continue',
    },
    // 3b — Before/After visual comparison
    {
      id: 'qs-before-after',
      type: 'before-after-visual',
      title: 'Reset your day in minutes',
      subtitle: '',
      description: 'Ready to see how a Just 1-minute reset feels?',
      beforeItems: ['Overwhelmed mind', 'Scattered thoughts', 'Low motivation', 'No clear next step'],
      afterItems: ['Calm mind', 'Clear focus', 'One small step', 'Energy to continue'],
      buttonLabel: 'Begin My First Reset',
    },
    // 4 — Starter routine preview with real task cards
    {
      id: 'qs-starter-routine',
      type: 'starter-routine',
      title: 'Here\'s your first Reset',
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
    // 6 — Push notification permission
    {
      id: 'qs-push-permission',
      type: 'welcome-aboard',
      title: 'With reminders, routines feel 80% easier.',
      subtitle: 'Get gentle nudges to keep your daily reset on track.',
      buttonLabel: 'Turn on notifications',
      secondaryButtonLabel: 'Maybe later',
    },
    // 8 — Nickname
    {
      id: 'qs-nickname',
      type: 'text-input',
      title: 'What should I call you?',
      subtitle: 'Nicknames are fine.',
      image: mascotPlanner,
      illustrationLabel: 'Mascot greeting',
      buttonLabel: 'Continue',
    },
    // 9 — Preferred second language
    {
      id: 'qs-second-language',
      type: 'single-select',
      title: 'Do you speak a\nsecond language?',
      subtitle: 'We have content in multiple languages.',
      image: mascotPlanner,
      illustrationLabel: 'Mascot with languages',
      options: [
        { label: 'English only', emoji: '🇺🇸' },
        { label: 'Persian', emoji: 'flag:persian' },
        { label: 'Turkish', emoji: '🇹🇷' },
        { label: 'Spanish', emoji: '🇪🇸' },
      ],
    },
    // 10 — Age group
    {
      id: 'qs-age-group',
      type: 'single-select',
      title: 'What is your age group?',
      subtitle: 'I recommend routines for your age.',
      image: mascotPlanner,
      illustrationLabel: 'Mascot with clipboard',
      options: [
        { label: '14 years or under' },
        { label: '15 ~ 19' },
        { label: '20 ~ 24' },
        { label: '25 ~ 29' },
        { label: '30 ~ 34' },
        { label: '35 ~ 39' },
        { label: '40 ~ 44' },
        { label: '45+' },
      ],
    },
    // 10b — Your Routine is Ready teaser
    {
      id: 'qs-routine-ready',
      type: 'routine-ready-teaser',
      title: 'Your Routine is Ready ✨',
      subtitle: 'Based on your answers, we\'ve prepared a personalized routine just for you.',
      buttonLabel: 'See My Routine',
    },
    // 11 — Gender
    {
      id: 'qs-gender',
      type: 'single-select',
      title: 'What is your gender?',
      subtitle: 'I recommend routines for your gender.',
      image: mascotPlanner,
      illustrationLabel: 'Mascot thinking',
      options: [
        { label: 'Female' },
        { label: 'Male' },
        { label: 'Neither' },
      ],
    },
  ],
};
