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
  | 'welcome-aboard'
  | 'contract'
  | 'distress-grid'
  | 'adhd-info'
  | 'lucky-draw'
  | 'super-prize'
  | 'countdown-paywall'
  | 'dark-paywall'
  | 'task-select-purple'
  | 'confetti-message'
  | 'personalized-plan'
  | 'starter-routine'
  | 'daily-reset-prompt'
  | 'before-after-visual'
  | 'text-input'
  | 'routine-ready-teaser'
  | 'week-report'
  | 'satisfaction-slider'
  | 'week-task-suggestions'
  | 'week-celebration'
  | 'selfcare-diagnosis'
  | 'selfcare-suggestions'
  | 'dynamic-single-select';

export interface OnboardingOptionVariant {
  cluster: string;
  title: string;
  options: OnboardingOption[];
}

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
  discount?: string;
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
  image?: string;
  testimonials?: TestimonialCard[];
  pricingTiers?: PricingTier[];
  beforeItems?: string[];
  afterItems?: string[];
  summaryBars?: { label: string; value: number; status: string }[];
  statBadges?: { label: string; value: string }[];
  variants?: OnboardingOptionVariant[];
}

export type OnboardingAnswers = Record<string, string | string[]>;

export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  createdAt: string;
  appName: string;
}
