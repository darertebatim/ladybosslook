export type OnboardingStepType =
  | 'welcome'
  | 'greeting'
  | 'multi-select'
  | 'single-select'
  | 'single-select-descriptions'
  | 'yes-no'
  | 'do-you-want'
  | 'info-stat'
  | 'motivational'
  | 'notification-permission'
  | 'results-chart'
  | 'habit-loop'
  | 'loading-testimonials'
  | 'personal-summary'
  | 'first-habit'
  | 'breathing-prep'
  | 'breathing'
  | 'breathing-done'
  | 'streak'
  | 'paywall'
  | 'before-after'
  | 'science-backed'
  | 'rating'
  | 'discount-offer'
  | 'welcome-aboard';
export interface OnboardingOption {
  label: string;
  emoji?: string;
  description?: string;
}

export interface TestimonialCard {
  name: string;
  text: string;
}

export interface PricingTier {
  label: string;
  perWeek: string;
  total: string;
  badge?: string;
}

export interface OnboardingStep {
  id: string;
  type: OnboardingStepType;
  title?: string;
  subtitle?: string;
  description?: string;
  options?: OnboardingOption[];
  buttonLabel?: string;
  secondaryButtonLabel?: string;
  statHighlight?: string;
  illustrationLabel?: string;
  testimonials?: TestimonialCard[];
  pricingTiers?: PricingTier[];
  beforeItems?: string[];
  afterItems?: string[];
  summaryBars?: { label: string; value: number; status: string }[];
  statBadges?: { label: string; value: string }[];
}

export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  createdAt: string;
  appName: string;
}
