import { OnboardingFlow } from '@/types/onboarding';
import cheerfulBird from '@/assets/onboarding/cheerful-bird.png';
import resetBeforeAfter from '@/assets/onboarding/reset-before-after.png';
import mascotPlanner from '@/assets/onboarding/mascot-planner.png';

export const quickStartV2Flow: OnboardingFlow = {
  id: 'quick-start-v2',
  name: 'Quick Start Onboarding V2',
  description: 'Copy of Quick Start — Fast onboarding focused on getting users into the app quickly',
  appName: 'Ladybosslook',
  createdAt: '2026-04-05',
  steps: [
    // 1 — Welcome / Promise
    {
      id: 'qs2-welcome',
      type: 'welcome',
      title: 'Welcome to Ladybosslook!',
      subtitle: 'Your day, back in your hands.',
      image: cheerfulBird,
      statHighlight: 'Your **FREE**\nSelf-Care App',
      secondaryButtonLabel: 'Already a member? Sign in.',
      statBadges: [
        { label: 'High-Rated App', value: '4.9' },
        { label: "Users' choice", value: '31 Million' },
      ],
      buttonLabel: 'Get Started',
    },
    // 2 — Pain points question
    {
      id: 'qs2-pain-points',
      type: 'multi-select',
      title: 'What do you struggle\nwith most?',
      subtitle: 'Pick all that apply — no judgment here.',
      image: mascotPlanner,
      illustrationLabel: 'Mascot asking',
      options: [
        { label: 'Stress & overthinking', emoji: '😮‍💨' },
        { label: 'Procrastination & low motivation', emoji: '🫠' },
        { label: 'No self-care routine', emoji: '🌀' },
        { label: 'ADHD / scattered focus', emoji: '🧠' },
        { label: 'Emotional ups & downs', emoji: '💔' },
      ],
      buttonLabel: 'Continue',
    },
    // 3 — Feature interest question
    {
      id: 'qs2-feature-interest',
      type: 'multi-select',
      title: 'What sounds most\nhelpful to you?',
      subtitle: 'We\'ll personalize your experience.',
      image: mascotPlanner,
      illustrationLabel: 'Mascot features',
      options: [
        { label: 'Daily routines & habits', emoji: '📋' },
        { label: 'Guided audio & meditation', emoji: '🎧' },
        { label: 'Self-care task planner', emoji: '✅' },
        { label: 'Journaling & stress relief', emoji: '✏️' },
        { label: 'Learning & personal growth', emoji: '🎓' },
      ],
      buttonLabel: 'Continue',
    },
    // 3 — Daily reset prompt
    {
      id: 'qs2-daily-reset-prompt',
      type: 'daily-reset-prompt',
      title: 'Enable Daily Reset?',
      subtitle: 'Your routine resets every morning so you can start each day fresh.',
      buttonLabel: 'Yes, enable it',
      secondaryButtonLabel: 'Maybe later',
    },
    // 5 — Nickname
    {
      id: 'qs2-nickname',
      type: 'text-input',
      title: 'What should I call you?',
      subtitle: 'Nicknames are fine.',
      image: mascotPlanner,
      illustrationLabel: 'Mascot greeting',
      buttonLabel: 'Continue',
    },
    // 6 — Preferred second language
    {
      id: 'qs2-second-language',
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
    // 7 — Age group
    {
      id: 'qs2-age-group',
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
    // 8 — Gender
    {
      id: 'qs2-gender',
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
    // 9 — Push notification permission (moved from earlier)
    {
      id: 'qs2-push-permission',
      type: 'welcome-aboard',
      title: 'With reminders, routines feel 80% easier.',
      subtitle: 'Get gentle nudges to keep your daily reset on track.',
      buttonLabel: 'Turn on notifications',
      secondaryButtonLabel: 'Maybe later',
    },
    // 10 — Your Routine is Ready teaser (last page)
    {
      id: 'qs2-routine-ready',
      type: 'routine-ready-teaser',
      title: 'Your Self-Care Planner is Ready ✨',
      subtitle: 'We shaped this routine around what matters to you — ready when you are.',
      buttonLabel: 'See My Routine',
    },
  ],
};
