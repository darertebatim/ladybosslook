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
      title: 'Which language feels most like home?',
      subtitle: 'We use this for your content.',
      options: [
        { label: 'English only', emoji: '🇺🇸' },
        { label: 'Persian', emoji: 'flag:persian' },
        { label: 'Turkish', emoji: '🇹🇷' },
        { label: 'Spanish', emoji: '🇪🇸' },
      ],
    },
    {
      id: 'rd-door-primary',
      type: 'door-cards-glass',
      doorSlot: 'primary',
      title: 'Which door is yours\nright now?',
      subtitle: 'Pick the one that needs you most.',
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
    /* ─── Final loader: builds the path while teasing what they get ─── */
    {
      id: 'rd-building',
      type: 'rilo-doors-loader',
      title: 'Building your path…',
      subtitle: 'Picking your playlists, lining up your first steps.',
    },
  ],
};