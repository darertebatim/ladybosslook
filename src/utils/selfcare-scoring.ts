import { OnboardingAnswers } from '@/types/onboarding';

// Scoring maps — shared between client-side (dynamic Q4) and fallback diagnosis
export const WEIGHING_MAP: Record<string, string[]> = {
  'Stress that won\'t quit': ['calm', 'sleep', 'Evening'],
  'Running on empty': ['sleep', 'nutrition', 'movement'],
  'Overstimulated & unfocused': ['Presence', 'calm', 'productivity'],
  'Feeling alone or disconnected': ['connection', 'LovedOnes', 'self-kindness'],
  'Everything feels messy': ['TidyUp', 'productivity', 'hygiene'],
};

export const NEGLECTING_MAP: Record<string, string[]> = {
  'Sleep & rest': ['sleep', 'Evening'],
  'Water & nutrition': ['nutrition'],
  'Moving your body': ['movement', 'Exercise'],
  'Skincare & grooming': ['hygiene'],
  'Moments of stillness': ['calm', 'Presence'],
  'Connecting with someone': ['connection'],
  'Tidying your space': ['TidyUp', 'productivity'],
  'Being kind to yourself': ['self-kindness', 'gratitude'],
  'Caring for loved ones': ['LovedOnes', 'connection'],
};

export const WIN_MAP: Record<string, string[]> = {
  'A real morning routine': ['movement', 'hygiene', 'Evening', 'easy-win'],
  'A calmer, clearer mind': ['calm', 'gratitude', 'Presence'],
  'Taking better care of my body': ['Exercise', 'nutrition', 'sleep'],
  'Reconnecting with my people': ['connection', 'LovedOnes', 'self-kindness'],
  'Just getting back on track': ['easy-win', 'TidyUp', 'productivity'],
};

export const DEEPER_MAP: Record<string, string[]> = {
  // Body cluster
  'Can\'t fall asleep / stay asleep': ['sleep', 'Evening'],
  'No energy to exercise': ['Exercise', 'movement'],
  'Eating poorly or skipping meals': ['nutrition'],
  'Just feeling physically run down': ['sleep', 'movement', 'nutrition'],
  // Mind cluster
  'A way to quiet racing thoughts': ['calm', 'Presence'],
  'Permission to rest without guilt': ['self-kindness', 'calm'],
  'More moments of gratitude': ['gratitude', 'Presence'],
  'Reconnecting with myself': ['self-kindness', 'gratitude'],
  // Environment cluster
  'My space is a mess': ['TidyUp'],
  'I have no real routine': ['productivity', 'Evening'],
  'I keep skipping basic self-care': ['hygiene', 'self-kindness'],
  'My evenings are chaotic': ['Evening', 'calm'],
  // People cluster
  'Quality time with loved ones': ['LovedOnes', 'connection'],
  'Feeling seen and supported': ['connection', 'self-kindness'],
  'Making effort to stay in touch': ['connection'],
  'Taking care of someone I love': ['LovedOnes'],
};

// Category → cluster mapping (exported for weekly review alignment)
export const CLUSTER_MAP: Record<string, string> = {
  sleep: 'body', nutrition: 'body', movement: 'body', Exercise: 'body',
  calm: 'mind', Presence: 'mind', gratitude: 'mind', 'self-kindness': 'mind',
  TidyUp: 'environment', productivity: 'environment', hygiene: 'environment', Evening: 'environment',
  connection: 'people', LovedOnes: 'people',
  'easy-win': 'environment', // fallback cluster
};

export const CLUSTER_LABELS: Record<ClusterType, string> = {
  body: 'Body',
  mind: 'Mind',
  environment: 'Environment',
  people: 'People',
};

export const CLUSTER_EMOJIS: Record<ClusterType, string> = {
  body: '💪',
  mind: '🧠',
  environment: '🏠',
  people: '💕',
};

/** Map a user_tasks.tag (or admin_task_bank.category) to a self-care cluster */
export function mapTaskToCluster(tag: string | null | undefined): ClusterType | null {
  if (!tag) return null;
  // Direct match
  if (CLUSTER_MAP[tag]) return CLUSTER_MAP[tag] as ClusterType;
  // Lowercase match
  const lower = tag.toLowerCase();
  for (const [key, cluster] of Object.entries(CLUSTER_MAP)) {
    if (key.toLowerCase() === lower) return cluster as ClusterType;
  }
  return null;
}

export type ClusterType = 'body' | 'mind' | 'environment' | 'people';

export function computeTopCluster(answers: OnboardingAnswers): ClusterType {
  const scores: Record<string, number> = {};
  const addScore = (cats: string[], weight: number) => {
    for (const c of cats) scores[c] = (scores[c] || 0) + weight;
  };

  const weighing = typeof answers?.['sc-weighing'] === 'string' ? answers['sc-weighing'] : null;
  if (weighing && WEIGHING_MAP[weighing]) addScore(WEIGHING_MAP[weighing], 3);

  const neglecting = Array.isArray(answers?.['sc-neglecting']) ? answers['sc-neglecting'] : [];
  for (const n of neglecting) {
    if (NEGLECTING_MAP[n]) addScore(NEGLECTING_MAP[n], 3);
  }

  const win = typeof answers?.['sc-win'] === 'string' ? answers['sc-win'] : null;
  if (win && WIN_MAP[win]) addScore(WIN_MAP[win], 2);

  // Sum by cluster
  const clusterScores: Record<string, number> = { body: 0, mind: 0, environment: 0, people: 0 };
  for (const [cat, score] of Object.entries(scores)) {
    const cluster = CLUSTER_MAP[cat] || 'mind';
    clusterScores[cluster] += score;
  }

  const sorted = Object.entries(clusterScores).sort((a, b) => b[1] - a[1]);
  return (sorted[0]?.[0] || 'mind') as ClusterType;
}

// Full scoring for fallback diagnosis
export function computeGapCategories(answers: OnboardingAnswers): string[] {
  const scores: Record<string, number> = {};
  const addScore = (cats: string[], weight: number) => {
    for (const c of cats) scores[c] = (scores[c] || 0) + weight;
  };

  const weighing = typeof answers?.['sc-weighing'] === 'string' ? answers['sc-weighing'] : null;
  if (weighing && WEIGHING_MAP[weighing]) addScore(WEIGHING_MAP[weighing], 3);

  const neglecting = Array.isArray(answers?.['sc-neglecting']) ? answers['sc-neglecting'] : [];
  for (const n of neglecting) {
    if (NEGLECTING_MAP[n]) addScore(NEGLECTING_MAP[n], 3);
  }

  const win = typeof answers?.['sc-win'] === 'string' ? answers['sc-win'] : null;
  if (win && WIN_MAP[win]) addScore(WIN_MAP[win], 2);

  const deeper = typeof answers?.['sc-deeper'] === 'string' ? answers['sc-deeper'] : null;
  if (deeper && DEEPER_MAP[deeper]) addScore(DEEPER_MAP[deeper], 3);

  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  return sorted.length > 0 ? sorted : ['calm', 'sleep', 'movement'];
}
