import { OnboardingFlow } from '@/types/onboarding';
import meplusWelcomeMascot from '@/assets/onboarding/meplus-welcome-mascot.png';
import meplusImg9 from '@/assets/onboarding/meplus-9-brain.png';
import meplusImg11 from '@/assets/onboarding/meplus-11-beforeafter.png';
import meplusImg23 from '@/assets/onboarding/meplus-23-benefits.png';
import meplusImg24 from '@/assets/onboarding/meplus-24-adhd.png';
import meplusImg18 from '@/assets/onboarding/meplus-18.png';
import meplusImg19 from '@/assets/onboarding/meplus-19.png';
import meplusImg20 from '@/assets/onboarding/meplus-20.png';
import meplusImg21 from '@/assets/onboarding/meplus-21.png';
import meplusImg22Grid from '@/assets/onboarding/meplus-22-grid.png';
import meplusImg27 from '@/assets/onboarding/meplus-27.png';
import meplusImg28 from '@/assets/onboarding/meplus-28.png';
import meplusImg29 from '@/assets/onboarding/meplus-29.png';
import meplusImg16 from '@/assets/onboarding/meplus-img-16.png';
import meplusImg35Bg from '@/assets/onboarding/meplus-35-mascot-bg.png';
import meplusImg32Paywall from '@/assets/onboarding/meplus-32-beforeafter.png';
import paywallSlide2 from '@/assets/onboarding/paywall-slide-2.png';
import paywallSlide3 from '@/assets/onboarding/paywall-slide-3.png';

export const mePlusFlow: OnboardingFlow = {
  id: 'me-plus-v1',
  name: 'Simora Onboarding',
  description: 'Full 38-screen Simora onboarding with surveys, paywalls, and gamification',
  appName: 'Simora',
  createdAt: '2026-02-22',
  steps: [
    // ─── PDF1 Page 1: Welcome ─────────────────────────────
    {
      id: 'mp-1',
      type: 'welcome',
      title: 'Welcome to Simora!',
      subtitle: 'Every day, a gentle step\ntowards my better self',
      image: meplusWelcomeMascot,
      statBadges: [
        { label: 'High-Rated App 2024', value: '4.9' },
        { label: "Users' choice", value: '31 Million' },
        { label: 'Incredible iPhone App by Apple 2023', value: '🍎' },
      ],
      buttonLabel: 'Continue',
    },

    // ─── PDF1 Page 2: Organized Life ──────────────────────
    {
      id: 'mp-2',
      type: 'greeting',
      title: 'Get a More Organized Life, and Stay Disciplined',
      subtitle: 'Make you healthier, happier, and more productive.',
      buttonLabel: 'Continue',
      illustrationLabel: 'Phone mockup showing schedule with tasks (Drink coffee, Healthy breakfast, Apply a face mask)',
    },

    // ─── PDF1 Page 3: Structure Day ───────────────────────
    {
      id: 'mp-3',
      type: 'greeting',
      title: 'Structure Your Day and Make Goals Achievable!',
      subtitle: 'Start a preset plan for a productive day!',
      buttonLabel: 'Continue',
      illustrationLabel: 'Phone mockup showing Discover page with routine cards',
    },

    // ─── PDF1 Page 4: Millions of Users ───────────────────
    {
      id: 'mp-4',
      type: 'greeting',
      title: 'Millions of Happiness Seekers Achieve Their Goals with Simora',
      subtitle: 'Discover the life-changing benefits of many small things.',
      buttonLabel: 'Continue',
      illustrationLabel: '4.9 Ratings App 2024 badge with laurel wreath + review card from LovingLeslie',
    },

    // ─── PDF1 Page 5: Sleep duration ──────────────────────
    {
      id: 'mp-5',
      type: 'single-select',
      title: '👋 Hi, tell us about you, how long do you usually sleep at night?',
      illustrationLabel: 'Mascot (chicken with glasses) in cozy room',
      options: [
        { label: 'Less than 6 hours', emoji: '🥱' },
        { label: '6-8 hours', emoji: '😊' },
        { label: '8-10 hours', emoji: '😌' },
        { label: 'More than 10 hours', emoji: '😴' },
      ],
    },

    // ─── PDF1 Page 6: Wake up time ────────────────────────
    {
      id: 'mp-6',
      type: 'single-select',
      title: 'Got it! How long do you usually need to get up from bed?',
      illustrationLabel: 'Mascot in cozy room',
      options: [
        { label: '0-10 minutes', emoji: '⏱️' },
        { label: '10-20 minutes', emoji: '⏰' },
        { label: '20-30 minutes', emoji: '🕐' },
        { label: 'More than 30 minutes', emoji: '⏳' },
      ],
    },

    // ─── PDF1 Page 7: Energy level ────────────────────────
    {
      id: 'mp-7',
      type: 'single-select',
      title: 'How do you feel your energy is during the day?',
      illustrationLabel: 'Mascot in cozy room',
      options: [
        { label: 'High-Full of energy during the day', emoji: '💪' },
        { label: 'Medium-My energy weakens over time', emoji: '👌' },
        { label: 'Low-I need help increasing my energy', emoji: '🥱' },
      ],
    },

    // ─── PDF1 Page 8: Lifestyle satisfaction ──────────────
    {
      id: 'mp-8',
      type: 'single-select',
      title: 'How satisfied are you with your current lifestyle?',
      illustrationLabel: 'Mascot in cozy room',
      options: [
        { label: 'Completely-I am very active and productive', emoji: '🤗' },
        { label: "Slightly-I'd like to see some improvement", emoji: '😊' },
        { label: 'Not at all-I expect to see a major change', emoji: '🥺' },
      ],
    },

    // ─── PDF1 Page 9: Behavior Science ────────────────────
    {
      id: 'mp-9',
      type: 'science-backed',
      title: 'Build Good Habits Based on Behavior Science',
      subtitle: 'Brain Diagram',
      image: meplusImg9,
      description: '3X times more successful than other to achieve the goal by behavioral science. 96% of Simora users have accomplished at least one goal and built healthy habits.',
      buttonLabel: 'Continue',
    },

    // ─── PDF1 Page 10: Better life goals ──────────────────
    {
      id: 'mp-10',
      type: 'single-select',
      title: 'How do you want yourself to have a better life?',
      illustrationLabel: 'Mascot at office desk with computer',
      options: [
        { label: 'More productive', emoji: '⏳' },
        { label: 'More active', emoji: '💡' },
        { label: 'More disciplined', emoji: '📌' },
        { label: 'More mindfulness', emoji: '🧠' },
        { label: 'None of these', emoji: '🤔' },
      ],
    },

    // ─── PDF1 Page 11: Before/After ───────────────────────
    {
      id: 'mp-11',
      type: 'before-after',
      title: 'Move Now! Become the',
      subtitle: 'Best Version of Yourself',
      image: meplusImg11,
      buttonLabel: 'Continue',
    },

    // ─── PDF1 Page 12: Distraction ────────────────────────
    {
      id: 'mp-12',
      type: 'single-select',
      title: 'How easy are you to distract?',
      illustrationLabel: 'Mascot in purple bedroom',
      options: [
        { label: 'Easily distracted', emoji: '🤯' },
        { label: 'Sometimes lose focus', emoji: '🎯' },
        { label: 'Rarely lose focus', emoji: '👀' },
        { label: 'Stay focused', emoji: '🧐' },
      ],
    },

    // ─── PDF1 Page 13: Procrastination ────────────────────
    {
      id: 'mp-13',
      type: 'single-select',
      title: 'Do you often procrastinate?',
      illustrationLabel: 'Mascot in purple bedroom',
      options: [
        { label: 'I easily keep up with my schedule.', emoji: '✌️' },
        { label: 'I procrastinate from time to time.', emoji: '📅' },
        { label: 'Yes, and I want to change it!!', emoji: '👊' },
      ],
    },

    // ─── PDF1 Page 14: Support system ─────────────────────
    {
      id: 'mp-14',
      type: 'single-select',
      title: 'How strong is your support system?',
      illustrationLabel: 'Mascot in purple bedroom',
      options: [
        { label: 'Very strong-I can count on the people in my life.', emoji: '👌' },
        { label: "Medium-I worry people won't be there.", emoji: '🤨' },
        { label: 'Weak-I feel isolated.', emoji: '😢' },
      ],
    },

    // ─── PDF1 Page 15: Motivation ─────────────────────────
    {
      id: 'mp-15',
      type: 'single-select',
      title: 'What motivates you to build good habits?',
      illustrationLabel: 'Mascot in purple bedroom',
      options: [
        { label: 'To set and achieve my goals', emoji: '🎯' },
        { label: 'To feel better about me', emoji: '😊' },
        { label: 'To improve my health', emoji: '💪' },
        { label: 'To be someone I want to be!', emoji: '😁' },
      ],
    },

    // ─── PDF1 Page 16: Good Habits Chart ──────────────────
    {
      id: 'mp-16',
      type: 'science-backed',
      title: 'Build Good Habits and Have More Great Days!',
      subtitle: '30 day Timeline',
      image: meplusImg16,
      statHighlight: '86%',
      description: 'Good habits will help you reach your goals, develop both personally and professionally, and feel fulfilled. According to the statistics, 86% of Simora users responded that building good habits makes them happier and have more great days.',
      buttonLabel: 'Continue',
    },

    // ─── PDF1 Page 17: Organization influence ─────────────
    {
      id: 'mp-17',
      type: 'multi-select',
      title: 'What influenced you to become organized?',
      illustrationLabel: 'Mascot in library with red bookshelves',
      options: [
        { label: 'ADHD related problem' },
        { label: 'Lack of motivation' },
        { label: 'No daily plan' },
        { label: 'Not enough time' },
        { label: "There's nothing holding me back" },
      ],
      buttonLabel: 'Continue',
    },

    // ─── PDF1 Page 18: Yes/No Anxious ─────────────────────
    {
      id: 'mp-18',
      type: 'yes-no',
      title: 'Do you relate to the statement below?',
      image: meplusImg18,
    },

    // ─── PDF1 Page 19: Yes/No Not enough time ─────────────
    {
      id: 'mp-19',
      type: 'yes-no',
      title: 'Do you relate to the statement below?',
      image: meplusImg19,
    },

    // ─── PDF1 Page 20: Yes/No Concentrating ───────────────
    {
      id: 'mp-20',
      type: 'yes-no',
      title: 'Do you relate to the statement below?',
      image: meplusImg20,
    },

    // ─── PDF2 Page 1: Yes/No End of day regret ────────────
    {
      id: 'mp-21',
      type: 'yes-no',
      title: 'Do you relate to the statement below?',
      image: meplusImg21,
    },

    // ─── PDF2 Page 2: Distress Grid ───────────────────────
    {
      id: 'mp-22',
      type: 'distress-grid',
      title: 'Simora Is Here for You!\nSay goodbye to distress.',
      image: meplusImg22Grid,
      buttonLabel: 'Continue',
    },

    // ─── PDF2 Page 3: Benefits ────────────────────────────
    {
      id: 'mp-23',
      type: 'motivational',
      title: 'Simora Is Here for You!\nSay goodbye to distress.',
      description: '92% of Simora users claim fabulous improvement and meet the better self as Simora science-based program.',
      image: meplusImg23,
      buttonLabel: 'Continue',
    },

    // ─── PDF2 Page 4: ADHD Info ───────────────────────────
    {
      id: 'mp-24',
      type: 'adhd-info',
      title: 'Cognitive behavioral therapy for ADHD users, Simora is a real help',
      image: meplusImg24,
      options: [
        { label: 'Keep focus on one thing easily', emoji: '✅' },
        { label: 'Structure the day and make life organized', emoji: '✅' },
        { label: 'Reduce anxiety and depression and keep calm', emoji: '✅' },
      ],
      buttonLabel: 'Continue',
    },

    // ─── PDF2 Page 5: Loading/Testimonials ────────────────
    {
      id: 'mp-25',
      type: 'loading-testimonials',
      title: 'Creating your personal journey...',
      subtitle: 'Millions of users have chosen Simora',
      testimonials: [
        { name: 'NightVain', text: 'Love it ❤️ Love it ❤️ Love it' },
        { name: 'hdbdhdbdhdjcj', text: 'Helps me get things done' },
        { name: 'BestUser', text: 'Best app ever' },
      ],
      illustrationLabel: 'Heart-shaped progress indicator with diverse group of people',
    },

    // ─── PDF2 Page 6: Personal Summary ────────────────────
    {
      id: 'mp-26',
      type: 'personal-summary',
      title: 'Knowing ourselves better, so we can be our best selves',
      summaryBars: [
        { label: 'Self-control', value: 85, status: '✓ Right on track' },
        { label: 'Concentration', value: 80, status: '✓ Right on track' },
        { label: 'Productivity', value: 85, status: '✓ Right on track' },
        { label: 'Energy', value: 45, status: 'Could be better' },
      ],
      description: 'Certified by HubLab behavioral science',
      statBadges: [
        { label: 'Already organized', value: '30M+' },
        { label: 'of users meet their better self', value: '94%' },
      ],
      buttonLabel: 'Continue',
    },

    // ─── PDF2 Page 7: Do you want - organize ─────────────
    {
      id: 'mp-27',
      type: 'do-you-want',
      title: 'Do you want to organize your day?',
      buttonLabel: "Sure! Let's go!",
      secondaryButtonLabel: 'No',
      image: meplusImg27,
    },

    // ─── PDF2 Page 8: Do you want - habits ────────────────
    {
      id: 'mp-28',
      type: 'do-you-want',
      title: 'Do you want to build good habits?',
      buttonLabel: "Sure! Let's go!",
      secondaryButtonLabel: 'No',
      image: meplusImg28,
    },

    // ─── PDF2 Page 9: Do you want - best version ─────────
    {
      id: 'mp-29',
      type: 'do-you-want',
      title: 'Do you want to be the best version of yourself?',
      buttonLabel: "Sure! Let's go!",
      secondaryButtonLabel: 'No',
      image: meplusImg29,
    },

    // ─── PDF2 Page 10: Well done confetti ─────────────────
    {
      id: 'mp-30',
      type: 'confetti-message',
      title: 'This is a very good start,',
      subtitle: 'Well done!',
      illustrationLabel: 'Confetti particles',
    },

    // ─── PDF2 Page 11: Contract ───────────────────────────
    {
      id: 'mp-31',
      type: 'contract',
      title: "Let's make a contract",
      options: [
        { label: "I'll achieve my goal!" },
        { label: "I'll make the most of my day!" },
        { label: "I'll keep my life organized!" },
        { label: "I'll be worry-free!" },
        { label: "I'll be more productive!" },
        { label: "I'll be the best version of myself!" },
      ],
      buttonLabel: 'Confirm',
      illustrationLabel: 'Purple heart emoji',
    },

    // ─── PDF2 Page 12: Paywall 1 (7-day trial) ───────────
    {
      id: 'mp-32',
      type: 'paywall',
      title: 'Make your life organized and meet your best self',
      subtitle: 'No Payment Now!',
      image: meplusImg32Paywall,
      images: [meplusImg32Paywall, paywallSlide2, paywallSlide3],
      pricingTiers: [
        { label: '1 month', perWeek: '$19.99/mo.', total: '$13.99/mo', badge: '7-Day Free Trial', discount: '40% OFF' },
        { label: '12 months', perWeek: '$8.33/mo.', total: '$99.99/yr', badge: '7-Day Free Trial', discount: '59% OFF' },
      ],
      buttonLabel: 'Continue',
      description: 'After your 7-day free trial, your Apple ID payment method will be automatically charged $59.99 for a year. Cancel the subscription at least 24 hours before the current subscription period.',
    },

    // ─── PDF2 Page 15: Get Started (purple) ───────────────
    {
      id: 'mp-35',
      type: 'motivational',
      title: 'Tailored to your personality, Simora helps you build momentum with simple mini habits',
      image: meplusImg35Bg,
      buttonLabel: 'Get Started!',
    },
  ],
};
