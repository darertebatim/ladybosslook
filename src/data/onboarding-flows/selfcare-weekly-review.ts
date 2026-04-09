import { OnboardingFlow } from '@/types/onboarding';

export const selfcareWeeklyReviewFlow: OnboardingFlow = {
  id: 'selfcare-weekly-review',
  name: 'Self-Care Weekly Review',
  description: 'Weekend flow aligned with the 4 self-care clusters to review, clean up, and expand routines',
  appName: 'Ladybosslook',
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
    // 3. Energy check — maps to body/mind clusters
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
    // 4. Self-care wins — grouped by 4 clusters
    {
      id: 'wr-selfcare-wins',
      type: 'multi-select',
      title: 'What self-care wins did you have this week?',
      subtitle: 'Pick everything that felt good ✨',
      illustrationLabel: 'weekly-review',
      options: [
        // Body
        { label: 'Slept well', emoji: '😴', description: 'body' },
        { label: 'Moved my body', emoji: '🏃', description: 'body' },
        { label: 'Ate nourishing food', emoji: '🥗', description: 'body' },
        { label: 'Spent time in nature', emoji: '🌿', description: 'body' },
        { label: 'Drank enough water', emoji: '💧', description: 'body' },
        // Mind
        { label: 'Practiced mindfulness', emoji: '🧘', description: 'mind' },
        { label: 'Took breaks when needed', emoji: '☕', description: 'mind' },
        { label: 'Journaled or reflected', emoji: '📝', description: 'mind' },
        { label: 'Felt grateful', emoji: '🙏', description: 'mind' },
        // Environment
        { label: 'Kept my space tidy', emoji: '🏠', description: 'environment' },
        { label: 'Had an evening routine', emoji: '🌙', description: 'environment' },
        { label: 'Stayed organized', emoji: '📋', description: 'environment' },
        { label: 'Took care of hygiene', emoji: '🧴', description: 'environment' },
        // People
        { label: 'Connected with someone', emoji: '💕', description: 'people' },
        { label: 'Quality time with loved ones', emoji: '👨‍👩‍👧', description: 'people' },
        { label: 'Was kind to myself', emoji: '💚', description: 'people' },
      ],
      buttonLabel: 'Continue',
    },
    // 5. What struggled — identifies weak areas directly by cluster
    {
      id: 'wr-struggled',
      type: 'multi-select',
      title: 'What felt hardest to keep up with?',
      subtitle: 'No judgment — this helps us find better goals for you',
      illustrationLabel: 'weekly-review-struggled',
      options: [
        // Body
        { label: 'Sleep & rest', emoji: '😴', description: 'body' },
        { label: 'Exercise or movement', emoji: '💪', description: 'body' },
        { label: 'Eating well', emoji: '🥗', description: 'body' },
        // Mind
        { label: 'Quieting my mind', emoji: '🧠', description: 'mind' },
        { label: 'Being present', emoji: '🧘', description: 'mind' },
        { label: 'Managing stress', emoji: '😤', description: 'mind' },
        // Environment
        { label: 'Keeping things tidy', emoji: '🏠', description: 'environment' },
        { label: 'Sticking to routines', emoji: '📋', description: 'environment' },
        { label: 'Evening wind-down', emoji: '🌙', description: 'environment' },
        // People
        { label: 'Staying connected', emoji: '📱', description: 'people' },
        { label: 'Being kind to myself', emoji: '💚', description: 'people' },
        { label: 'Making time for others', emoji: '🤝', description: 'people' },
      ],
      buttonLabel: 'Continue',
    },
    // 6. Focus for next week — self-care intentions
    {
      id: 'wr-focus-next',
      type: 'multi-select',
      title: 'What would you like to nurture next week?',
      subtitle: 'Pick up to 3 intentions',
      illustrationLabel: 'weekly-review-focus',
      options: [
        { label: 'Better sleep', emoji: '🌙' },
        { label: 'Nourish my body', emoji: '🥑' },
        { label: 'Move more', emoji: '💪' },
        { label: 'Calm my mind', emoji: '🧠' },
        { label: 'Practice gratitude', emoji: '🙏' },
        { label: 'Be kind to myself', emoji: '💚' },
        { label: 'Tidy my space', emoji: '🏠' },
        { label: 'Build a routine', emoji: '📋' },
        { label: 'Connect with someone', emoji: '💕' },
        { label: 'Find small joys', emoji: '🌈' },
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
    // 8. Smart task suggestions (gap + replacement + expansion)
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
