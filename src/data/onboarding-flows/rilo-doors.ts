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
      type: 'text-input',
      title: 'Hi — what should we call you?',
      subtitle: 'Just a first name is perfect.',
      buttonLabel: 'Continue',
    },
    {
      id: 'rd-language',
      type: 'rilo-language-bubbles',
      title: 'Which language feels most like home?',
      subtitle: 'We use this for your content.',
    },
    {
      id: 'rd-language-switch',
      type: 'yes-no',
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
      id: 'rd-sharp-selfcare',
      type: 'door-selfcare-offers',
      doorBranch: 'selfcare',
    },
    {
      id: 'rd-sharp-immigrant',
      type: 'door-immigrant-picker',
      doorBranch: 'immigrant',
    },
    /* ─── Outro ─── */
    {
      id: 'rd-meet-rilo',
      type: 'meet-rilo-intro',
      title: 'Meet My Rilo.',
      subtitle: 'Your wellness home — calm tools, gentle routines, and a path built for you.',
      buttonLabel: 'Show me',
    },
    {
      id: 'rd-open-door',
      type: 'open-the-door',
      buttonLabel: 'Enter My Rilo',
    },
  ],
};