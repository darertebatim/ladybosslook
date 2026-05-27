import type { OnboardingAnswers } from '@/types/onboarding';

export type Personality =
  | 'giver'
  | 'achiever'
  | 'survivor'
  | 'ghost'
  | 'perfectionist'
  | 'ruminator';

export type Cluster = 'body' | 'mind' | 'environment' | 'people';
export type ReadinessLevel = 'tiny' | 'small' | 'medium' | 'unknown';

// ─── Q1-Q5 scoring ────────────────────────────────────────────

type ScoreRow = Partial<Record<Personality, number>>;

const Q1_MAP: Record<string, ScoreRow> = {
  'Exhausted': { survivor: 2, giver: 1 },
  'Scattered': { ruminator: 2, perfectionist: 1 },
  'Numb': { ghost: 2 },
  'Overwhelmed': { survivor: 2, ruminator: 1 },
  'Behind': { perfectionist: 2, achiever: 1 },
  'Empty': { ghost: 2, survivor: 1 },
};

const Q2_MAP: Record<string, ScoreRow> = {
  "I think of everything I should be doing and can't settle": { ruminator: 2, achiever: 1 },
  "I scroll my phone and suddenly it's midnight": { ghost: 2 },
  'I feel guilty — someone else probably needs something': { giver: 2 },
  'I start something and abandon it halfway through': { perfectionist: 2 },
  'I feel nothing much. I just wait for it to pass.': { ghost: 2, survivor: 1 },
  'I try to use it productively even now': { achiever: 2 },
};

const Q3_MAP: Record<string, ScoreRow> = {
  'I snap at someone I love and feel terrible': { ruminator: 2, giver: 1 },
  'I get sick — my body forces me to stop': { survivor: 2, achiever: 1 },
  "I cry at something small and don't know why": { ghost: 2, ruminator: 1 },
  "I realize I can't remember the last time I felt like myself": { ghost: 2 },
  'I miss one day of routine and stop completely': { perfectionist: 2 },
  "I keep going until I crash. I don't really notice.": { achiever: 2 },
};

const Q4_MAP: Record<string, ScoreRow> = {
  'My mind keeps running through everything unfinished': { ruminator: 2, achiever: 1 },
  'I feel like I need to earn it first': { perfectionist: 2 },
  'I feel guilty — like someone needs me': { giver: 2 },
  "Rest feels far away right now. I don't really try.": { survivor: 2, ghost: 1 },
  "I rest but it doesn't restore me": { achiever: 2 },
  'I fall into it but feel worse when I come out': { ghost: 2 },
};

const Q5_MAP: Record<string, Personality> = {
  "I'm hard on myself — standards I'd never apply to anyone else": 'perfectionist',
  "I've lost track of what I actually want": 'ghost',
  "I know what I need. I just can't prioritize it.": 'achiever',
  "I'm surviving. That's about all I can say.": 'survivor',
  "I'm so focused on others I forget to check in with myself": 'giver',
  "My mind won't slow down. I'm always on.": 'ruminator',
};

const PERSONALITIES: Personality[] = [
  'giver', 'achiever', 'survivor', 'ghost', 'perfectionist', 'ruminator',
];

function addScores(target: ScoreRow, row?: ScoreRow) {
  if (!row) return;
  for (const p of PERSONALITIES) {
    if (row[p]) target[p] = (target[p] || 0) + (row[p] || 0);
  }
}

/**
 * Compute the user's winning personality from Q1–Q5 answers.
 * Q5 weighted +5. Tie → Q5 wins.
 * Does NOT apply Survivor gate — that runs after Q6-Survivor.
 */
export function scorePersonality(answers: OnboardingAnswers): Personality {
  const scores: ScoreRow = {};
  addScores(scores, Q1_MAP[String(answers['scp-q1'] || '')]);
  addScores(scores, Q2_MAP[String(answers['scp-q2'] || '')]);
  addScores(scores, Q3_MAP[String(answers['scp-q3'] || '')]);
  addScores(scores, Q4_MAP[String(answers['scp-q4'] || '')]);

  const q5 = Q5_MAP[String(answers['scp-q5'] || '')];
  if (q5) scores[q5] = (scores[q5] || 0) + 5;

  // Find max; tie → q5 wins
  let winner: Personality = q5 || 'ghost';
  let max = scores[winner] ?? -1;
  for (const p of PERSONALITIES) {
    const s = scores[p] || 0;
    if (s > max) { max = s; winner = p; }
  }
  if (q5 && (scores[q5] || 0) === max) winner = q5;
  return winner;
}

// ─── Q6-Survivor gating ───────────────────────────────────────

const SURVIVOR_GATE_PASS = new Set<string>([
  'A new baby or very young children',
  'Burnout — running on empty for too long',
  'A loss, grief, or something ending',
  'A major life change — move, relationship, identity',
]);

/**
 * If Q5 picked Survivor but Q6-Survivor answer fails the gate, reassign
 * to Q5 personality. Otherwise keep Survivor.
 */
export function applySurvivorGate(
  scored: Personality,
  answers: OnboardingAnswers,
): Personality {
  if (scored !== 'survivor') return scored;
  const q6 = String(answers['scp-q6'] || '');
  if (!q6) return scored;
  if (SURVIVOR_GATE_PASS.has(q6)) return 'survivor';
  // Reassign to Q5 personality (or keep survivor if Q5 was survivor too)
  const q5p = Q5_MAP[String(answers['scp-q5'] || '')];
  return q5p && q5p !== 'survivor' ? q5p : 'survivor';
}

// ─── Personality → categories ─────────────────────────────────

export interface PersonalityProfile {
  primary_cluster: Cluster;
  secondary_cluster: Cluster;
  primary_category: string;
  secondary_category: string;
}

export const PERSONALITY_DEFAULTS: Record<Personality, PersonalityProfile> = {
  giver:        { primary_cluster: 'people',      secondary_cluster: 'mind',        primary_category: 'connection', secondary_category: 'selfkind' },
  achiever:     { primary_cluster: 'mind',        secondary_cluster: 'body',        primary_category: 'calm',       secondary_category: 'sleep' },
  survivor:     { primary_cluster: 'environment', secondary_cluster: 'mind',        primary_category: 'easy-win',   secondary_category: 'calm' },
  ghost:        { primary_cluster: 'mind',        secondary_cluster: 'mind',        primary_category: 'selfkind',   secondary_category: 'Presence' },
  perfectionist:{ primary_cluster: 'mind',        secondary_cluster: 'environment', primary_category: 'selfkind',   secondary_category: 'productivity' },
  ruminator:    { primary_cluster: 'mind',        secondary_cluster: 'body',        primary_category: 'calm',       secondary_category: 'sleep' },
};

// Category category-output overrides from Q6/Q7 branching
// Maps personality + question id + answer → optional category overrides
const Q6_OVERRIDES: Record<string, Partial<PersonalityProfile>> = {
  // Shared
  'Keeping up physically — I\'m running on empty':         { primary_category: 'sleep', primary_cluster: 'body', secondary_category: 'movement', secondary_cluster: 'body' },
  'Quieting my mind — the noise won\'t stop':              { primary_category: 'calm', primary_cluster: 'mind', secondary_category: 'Presence', secondary_cluster: 'mind' },
  'Managing my days — mornings, evenings, my space feel chaotic': { primary_category: 'Evening', primary_cluster: 'environment', secondary_category: 'TidyUp', secondary_cluster: 'environment' },
  "Staying connected — I've pulled away from people":     { primary_category: 'connection', primary_cluster: 'people', secondary_category: 'LovedOnes', secondary_cluster: 'people' },
  // Giver
  'I feel guilty toward my partner or family':            { primary_category: 'LovedOnes', primary_cluster: 'people' },
  'I feel guilty toward friends I\'ve been neglecting':   { primary_category: 'connection', primary_cluster: 'people' },
  'I feel guilty toward myself — I\'ve let myself down':  { primary_category: 'selfkind', primary_cluster: 'mind' },
  "I don't feel guilty — I just don't know how to receive": { primary_category: 'gratitude', primary_cluster: 'mind', secondary_category: 'selfkind', secondary_cluster: 'mind' },
  // Survivor (gate-passed only)
  'A new baby or very young children':                    { primary_category: 'easy-win', primary_cluster: 'environment', secondary_category: 'sleep', secondary_cluster: 'body' },
  'Burnout — running on empty for too long':              { primary_category: 'easy-win', primary_cluster: 'environment', secondary_category: 'calm', secondary_cluster: 'mind' },
  'A loss, grief, or something ending':                   { primary_category: 'selfkind', primary_cluster: 'mind', secondary_category: 'calm', secondary_cluster: 'mind' },
  'A major life change — move, relationship, identity':   { primary_category: 'selfkind', primary_cluster: 'mind', secondary_category: 'connection', secondary_cluster: 'people' },
  // Ruminator
  'In my body — chest, stomach, tension, can\'t sleep':   { primary_category: 'sleep', primary_cluster: 'body', secondary_category: 'movement', secondary_cluster: 'body' },
  'In my thoughts — spiraling, replaying, anticipating':  { primary_category: 'calm', primary_cluster: 'mind' },
  'In my relationships — I overthink every interaction':  { primary_category: 'connection', primary_cluster: 'people', secondary_category: 'selfkind', secondary_cluster: 'mind' },
  "Everywhere at once — it's just always there":          { primary_category: 'calm', primary_cluster: 'mind', secondary_category: 'easy-win', secondary_cluster: 'environment' },
};

const Q7_SECONDARY_HINTS: Record<string, Partial<PersonalityProfile>> = {
  // Shared
  "I don't feel I deserve it yet":                                  { secondary_category: 'selfkind', secondary_cluster: 'mind' },
  'I start but can\'t finish':                                      { secondary_category: 'productivity', secondary_cluster: 'environment' },
  'My mind won\'t let me be present in it':                         { secondary_category: 'Presence', secondary_cluster: 'mind' },
  // Q7-Giver
  'More energy to give to the people I love':                       { secondary_category: 'connection', secondary_cluster: 'people' },
  'Finally feeling like myself again':                              { secondary_category: 'Presence', secondary_cluster: 'mind' },
  'Showing the people I love that I matter too':                    { secondary_category: 'selfkind', secondary_cluster: 'mind' },
  'Just having one thing that\'s mine':                             { secondary_category: 'gratitude', secondary_cluster: 'mind' },
  // Q7-Survivor
  'Getting out of bed and washing my face':                         { secondary_category: 'hygiene', secondary_cluster: 'body' },
  'Drinking water and stepping outside once':                       { secondary_category: 'nutrition', secondary_cluster: 'body' },
  'Taking 3 deep breaths and being still':                          { secondary_category: 'calm', secondary_cluster: 'mind' },
  'Saying one kind thing to myself':                                { secondary_category: 'selfkind', secondary_cluster: 'mind' },
  // Q7-Ruminator
  'Moving my body — walking, stretching':                           { secondary_category: 'movement', secondary_cluster: 'body' },
  'Writing things down':                                            { secondary_category: 'calm', secondary_cluster: 'mind' },
  'Talking to someone or being around people':                      { secondary_category: 'connection', secondary_cluster: 'people' },
  'Breathing or grounding techniques':                              { secondary_category: 'calm', secondary_cluster: 'mind' },
  'Nothing has really helped':                                      { secondary_category: 'selfkind', secondary_cluster: 'mind' },
};

const Q8_CATEGORY_MAP: Record<string, { category: string; cluster: Cluster }> = {
  'Wake up actually rested':                          { category: 'sleep',      cluster: 'body' },
  'Move my body and enjoy it':                        { category: 'movement',   cluster: 'body' },
  'Eat in a way that nourishes me':                   { category: 'nutrition',  cluster: 'body' },
  'Feel more comfortable in my own skin':             { category: 'hygiene',    cluster: 'body' },
  'Have a quieter mind':                              { category: 'calm',       cluster: 'mind' },
  'Feel more present — actually here':                { category: 'Presence',   cluster: 'mind' },
  'Be kinder to myself':                              { category: 'selfkind',   cluster: 'mind' },
  'Notice more good in my daily life':                { category: 'gratitude',  cluster: 'mind' },
  'Feel more connected to people I love':             { category: 'connection', cluster: 'people' },
  'Give more time to my closest relationships':       { category: 'LovedOnes',  cluster: 'people' },
  'Feel less alone':                                  { category: 'connection', cluster: 'people' },
  'Receive as much as I give':                        { category: 'selfkind',   cluster: 'mind' },
  'Have calmer mornings':                             { category: 'easy-win',   cluster: 'environment' },
  'Wind down properly at night':                      { category: 'Evening',    cluster: 'environment' },
  'Feel more in control of my days':                  { category: 'productivity', cluster: 'environment' },
  'Have a space that restores me':                    { category: 'TidyUp',     cluster: 'environment' },
};

const Q9_READINESS: Record<string, { level: ReadinessLevel; count: number }> = {
  '2-3 minutes. Tiny steps only.':              { level: 'tiny',    count: 3 },
  '5-10 minutes. Small but real.':              { level: 'small',   count: 5 },
  '15-20 minutes. I want to build something.':  { level: 'medium',  count: 7 },
  "I'm not sure. Help me start somewhere.":     { level: 'unknown', count: 3 },
};

export interface FinalResult extends PersonalityProfile {
  personality: Personality;
  readiness_level: ReadinessLevel;
  task_count: number;
  use_easy_win_first: boolean;
}

/**
 * Resolve the final personality + categories + task count from the full
 * answer set. Mirrors the server-side logic so previews can render before
 * the edge function returns.
 */
export function resolveFinalResult(answers: OnboardingAnswers): FinalResult {
  const scored = scorePersonality(answers);
  const personality = applySurvivorGate(scored, answers);
  const base: PersonalityProfile = { ...PERSONALITY_DEFAULTS[personality] };

  const q6 = String(answers['scp-q6'] || '');
  const q6Override = Q6_OVERRIDES[q6];
  if (q6Override) Object.assign(base, q6Override);

  const q7 = String(answers['scp-q7'] || '');
  const q7Override = Q7_SECONDARY_HINTS[q7];
  if (q7Override) Object.assign(base, q7Override);

  const q8 = String(answers['scp-q8'] || '');
  const q8Override = Q8_CATEGORY_MAP[q8];
  if (q8Override) {
    base.primary_category = q8Override.category;
    base.primary_cluster = q8Override.cluster;
  }

  const q9 = String(answers['scp-q9'] || '');
  const readiness = Q9_READINESS[q9] || { level: 'unknown' as ReadinessLevel, count: 3 };

  let task_count = readiness.count;
  // Q7-Shared "no time/energy" → −1 (floor 2)
  if (q7 === 'I genuinely don\'t have the time or energy right now') {
    task_count = Math.max(2, task_count - 1);
  }
  // Q6-Ruminator "Everywhere at once" → −1
  if (q6 === "Everywhere at once — it's just always there") {
    task_count = Math.max(2, task_count - 1);
  }
  // Survivor override: always 3
  if (personality === 'survivor') task_count = 3;
  // Floor 2
  task_count = Math.max(2, task_count);

  return {
    ...base,
    personality,
    readiness_level: readiness.level,
    task_count,
    use_easy_win_first: readiness.level === 'unknown',
  };
}

// ─── Q6/Q7 variant resolution ─────────────────────────────────

export type Q6Q7Branch = 'giver' | 'survivor' | 'ruminator' | 'shared';

export function branchFor(personality: Personality): Q6Q7Branch {
  if (personality === 'giver') return 'giver';
  if (personality === 'survivor') return 'survivor';
  if (personality === 'ruminator') return 'ruminator';
  return 'shared';
}

// ─── Q8 cluster resolution ────────────────────────────────────

/** Returns the cluster Q8 options should be drawn from. */
export function aspirationClusterFor(answers: OnboardingAnswers): Cluster {
  const personality = applySurvivorGate(scorePersonality(answers), answers);
  const base = PERSONALITY_DEFAULTS[personality];
  const q6 = String(answers['scp-q6'] || '');
  const q6o = Q6_OVERRIDES[q6];
  if (q6o?.primary_cluster) return q6o.primary_cluster;
  return base.primary_cluster;
}
