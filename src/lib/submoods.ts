// Sub-moods for the Mood Check-in v2 second step.
// Keyed by the 5 base mood values.
export const SUBMOODS: Record<string, string[]> = {
  great: ['Brave', 'Confident', 'Creative', 'Excited', 'Grateful', 'Happy', 'Hopeful', 'Inspired', 'Loved', 'Proud'],
  good: ['Appreciated', 'Comfortable', 'Confident', 'Excited', 'Fulfilled', 'Grateful', 'Happy', 'Hopeful', 'Inspired', 'Relaxed'],
  okay: ['Anxious', 'Bored', 'Busy', 'Calm', 'Confused', 'Fine', 'Frustrated', 'Distant', 'Distracted', 'Stressed', 'Tired'],
  not_great: ['Annoyed', 'Anxious', 'Bored', 'Disappointed', 'Impatient', 'Nervous', 'Insecure', 'Judged', 'Sad', 'Stressed', 'Tired'],
  bad: ['Angry', 'Anxious', 'Disrespected', 'Hurt', 'Judged', 'Let Down', 'Lonely', 'Sad', 'Scared', 'Unimportant'],
};

export const getSubmoods = (mood: string | null): string[] =>
  (mood && SUBMOODS[mood]) || [];
