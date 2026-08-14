import { OnboardingFlow } from '@/types/onboarding';

/**
 * Rilo Doors — the new primary onboarding flow.
 *
 * Branching: sharpener steps with `doorBranch` are skipped by AppOnboarding
 * when they don't match the user's `rd-door-primary` answer. Productivity
 * and Exploring have no sharpener (they jump straight to Meet Rilo).
 */
export const riloDoorsFlow: OnboardingFlow = {
  id: 'rilo-doors',
  name: 'Rilo Doors',
  description: 'Glass Bloom onboarding — language → primary door → secondary → sharpener → Meet My Rilo.',
  appName: 'Rilo',
  createdAt: '2026-05-26',
  steps: [
    {
      id: 'rd-nickname',
      type: 'door-nickname',
      title: 'Hi — what should we call you?',
      subtitle: 'Just a first name is perfect.',
      buttonLabel: 'Continue',
    },
    {
      id: 'rd-language',
      type: 'rilo-language-bubbles',
      title: 'In which language\nshould we serve content?',
      subtitle: 'Audio, articles & guided sessions — in a language that feels like home.',
      options: [
        { label: 'English only', emoji: '🇺🇸' },
        { label: 'Persian', emoji: 'flag:persian' },
        { label: 'Turkish', emoji: '🇹🇷' },
        { label: 'Spanish', emoji: '🇪🇸' },
      ],
    },
    {
      id: 'rd-language-switch',
      type: 'door-language-switch',
      title: 'Switch the app to this language too?',
      subtitle: 'Or keep the interface in English — your choice.',
      buttonLabel: 'Switch it',
      secondaryButtonLabel: 'Keep English',
    },
    {
      id: 'rd-door-primary',
      type: 'door-cards-glass',
      doorSlot: 'primary',
      title: 'Which door is yours\nright now?',
      subtitle: 'Pick the one that needs you most.',
    },
    {
      id: 'rd-door-secondary',
      type: 'door-cards-glass',
      doorSlot: 'secondary',
      title: 'And a second one?',
      subtitle: 'Optional — you can always add more later.',
    },
    /* ─── Sharpeners (only one runs based on primary) ─── */
    {
      id: 'rd-sharp-emotion',
      type: 'door-emotion-picker',
      doorBranch: 'emotion',
    },
    {
      id: 'rd-sharp-immigrant',
      type: 'door-immigrant-picker',
      doorBranch: 'immigrant',
    },
    {
      id: 'rd-sharp-financial',
      type: 'door-financial-picker',
      doorBranch: 'financial',
    },
    {
      id: 'rd-sharp-business',
      type: 'door-business-picker',
      doorBranch: 'business',
    },
    /* ─── Final loader: builds the path while teasing what they get ─── */
    {
      id: 'rd-building',
      type: 'rilo-doors-loader',
      title: 'Building your path…',
      subtitle: 'Picking your playlists, lining up your first steps.',
    },
    /* ─── Final teach screen: everything that's inside Rilo ─── */
    {
      id: 'rd-tools-hub',
      type: 'rilo-teach',
      illustrationLabel: 'tools-hub',
      title: 'Everything you’d download 8 apps for.',
      subtitle: 'Calm, sleep, workouts, journal, calendar, habits, career, money — all already inside Rilo. Free.',
      buttonLabel: 'Enter Rilo',
    },
    /* ─── Push permission — last step before entering the app ─── */
    {
      id: 'rd-push-permission',
      type: 'welcome-aboard',
      title: 'With reminders, routines feel 80% easier.',
      subtitle: 'Get gentle nudges so your Check Ins stay on track.',
      buttonLabel: 'Turn on notifications',
      secondaryButtonLabel: 'Maybe later',
    },
  ],
};