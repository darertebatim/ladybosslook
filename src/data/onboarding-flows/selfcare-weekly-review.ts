import { OnboardingFlow } from '@/types/onboarding';

export const selfcareWeeklyReviewFlow: OnboardingFlow = {
  id: 'selfcare-weekly-review',
  name: 'Self-Care Weekly Review',
  description: 'Weekend flow aligned with the 14 self-care categories to review, clean up, and expand routines',
  appName: 'Rilo',
  createdAt: '2026-04-09',
  steps: [
    // 1. Performance report with cluster breakdown
    {
      id: 'wr-report',
      type: 'week-report',
      title: 'Your Week in Review',
      subtitle: 'Here\'s how your self-care went!',
      buttonLabel: 'Continue',
    },
    // 2. Satisfaction slider
    {
      id: 'wr-satisfaction',
      type: 'satisfaction-slider',
      title: 'How satisfied are you with your self-care this week?',
      subtitle: 'Be honest — there\'s no wrong answer.',
      buttonLabel: 'Continue',
    },
    // 3. Energy check
    {
      id: 'wr-energy-check',
      type: 'single-select',
      title: 'How has your energy been this week?',
      subtitle: 'This helps us understand your body & mind balance',
      options: [
        { label: 'Drained — running on fumes', emoji: '🪫' },
        { label: 'Low — getting by but tired', emoji: '😮‍💨' },
        { label: 'Okay — some good, some tough days', emoji: '⚖️' },
        { label: 'Good — mostly energized', emoji: '⚡' },
        { label: 'Great — I felt alive!', emoji: '🔋' },
      ],
      buttonLabel: 'Continue',
    },
    // 4. Self-care wins — description = category slug from admin_task_bank
    {
      id: 'wr-selfcare-wins',
      type: 'multi-select',
      title: 'What self-care wins did you have this week?',
      subtitle: 'Pick everything that felt good ✨',
      illustrationLabel: 'weekly-review',
      options: [
        // Body cluster
        { label: 'Slept well', emoji: '😴', description: 'sleep' },
        { label: 'Moved my body', emoji: '🏃', description: 'movement' },
        
        { label: 'Ate nourishing food', emoji: '🥗', description: 'nutrition' },
        // Mind cluster
        { label: 'Found moments of calm', emoji: '🧘', description: 'calm' },
        { label: 'Was present & mindful', emoji: '🌿', description: 'Presence' },
        { label: 'Felt grateful', emoji: '🙏', description: 'gratitude' },
        { label: 'Was kind to myself', emoji: '💚', description: 'self-kindness' },
        // Environment cluster
        { label: 'Kept my space tidy', emoji: '🏠', description: 'TidyUp' },
        { label: 'Had an evening routine', emoji: '🌙', description: 'Evening' },
        { label: 'Stayed organized', emoji: '📋', description: 'productivity' },
        { label: 'Took care of hygiene', emoji: '🧴', description: 'hygiene' },
        // People cluster
        { label: 'Connected with someone', emoji: '💕', description: 'connection' },
        { label: 'Quality time with loved ones', emoji: '👨‍👩‍👧', description: 'LovedOnes' },
      ],
      buttonLabel: 'Continue',
    },
    // 5. What struggled — description = category slug
    {
      id: 'wr-struggled',
      type: 'multi-select',
      title: 'What felt hardest to keep up with?',
      subtitle: 'No judgment — this helps us find better goals for you',
      illustrationLabel: 'weekly-review-struggled',
      options: [
        // Body
        { label: 'Sleep & rest', emoji: '😴', description: 'sleep' },
        
        { label: 'Eating well', emoji: '🥗', description: 'nutrition' },
        // Mind
        { label: 'Quieting my mind', emoji: '🧠', description: 'calm' },
        { label: 'Being present', emoji: '🧘', description: 'Presence' },
        { label: 'Self-kindness & gratitude', emoji: '💚', description: 'self-kindness' },
        // Environment
        { label: 'Keeping things tidy', emoji: '🏠', description: 'TidyUp' },
        { label: 'Sticking to routines', emoji: '📋', description: 'productivity' },
        { label: 'Evening wind-down', emoji: '🌙', description: 'Evening' },
        { label: 'Basic hygiene & grooming', emoji: '🧴', description: 'hygiene' },
        // People
        { label: 'Staying connected', emoji: '📱', description: 'connection' },
        { label: 'Making time for loved ones', emoji: '🤝', description: 'LovedOnes' },
      ],
      buttonLabel: 'Continue',
    },
    // 6. Focus for next week — description = category slug
    {
      id: 'wr-focus-next',
      type: 'multi-select',
      title: 'What would you like to nurture next week?',
      subtitle: 'Pick up to 3 intentions',
      illustrationLabel: 'weekly-review-focus',
      options: [
        { label: 'Better sleep', emoji: '🌙', description: 'sleep' },
        { label: 'Nourish my body', emoji: '🥑', description: 'nutrition' },
        { label: 'Move more', emoji: '💪', description: 'movement' },
        
        { label: 'Calm my mind', emoji: '🧠', description: 'calm' },
        { label: 'Be more present', emoji: '🌿', description: 'Presence' },
        { label: 'Practice gratitude', emoji: '🙏', description: 'gratitude' },
        { label: 'Be kind to myself', emoji: '💚', description: 'self-kindness' },
        { label: 'Tidy my space', emoji: '🏠', description: 'TidyUp' },
        { label: 'Build a routine', emoji: '📋', description: 'productivity' },
        { label: 'Evening wind-down', emoji: '🌙', description: 'Evening' },
        { label: 'Self-care & hygiene', emoji: '🧴', description: 'hygiene' },
        { label: 'Connect with someone', emoji: '💕', description: 'connection' },
        { label: 'Time with loved ones', emoji: '👨‍👩‍👧', description: 'LovedOnes' },
      ],
      buttonLabel: 'Continue',
    },
    // 7. Cleanup — remove/replace struggling tasks
    {
      id: 'wr-cleanup',
      type: 'week-cleanup',
      title: "These goals didn't stick this week",
      subtitle: "It's okay — let's make room for what works better",
      buttonLabel: 'Continue',
    },
    // 8. Smart task suggestions (category-based + expansion)
    {
      id: 'wr-task-suggestions',
      type: 'week-task-suggestions',
      title: 'Here are some goals tailored for you',
      subtitle: 'Based on your self-care balance & answers',
      buttonLabel: 'Add to My Routines',
      secondaryButtonLabel: 'Skip for now',
    },
    // 9. Celebration
    {
      id: 'wr-celebration',
      type: 'week-celebration',
      title: 'You\'re showing up for yourself 💛',
      subtitle: 'Small steps, big impact. Your next week is set up for growth!',
      buttonLabel: 'Done',
    },
  ],
};
