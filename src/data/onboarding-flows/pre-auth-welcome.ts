import { OnboardingFlow } from '@/types/onboarding';
import cheerfulBird from '@/assets/onboarding/cheerful-bird.png';

export const preAuthWelcomeFlow: OnboardingFlow = {
  id: 'pre-auth-welcome',
  name: 'Pre-Auth Welcome',
  description: 'Single welcome screen shown before sign-in/sign-up. Drives social proof and conversion.',
  appName: 'Rilo',
  createdAt: '2026-04-30',
  steps: [
    {
      id: 'paw-welcome',
      type: 'welcome',
      title: 'Welcome to Rilo!',
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
  ],
};
