export type Valence = 'pleasant' | 'neutral' | 'unpleasant';

export interface EmotionOption {
  value: string;
  label: string;
}

export interface EmotionCategory {
  value: string;
  label: string;
  emotions: EmotionOption[];
}

export const VALENCE_OPTIONS: Array<{
  value: Valence;
  label: string;
  color: string;
  bgClass: string;
}> = [
  { 
    value: 'pleasant', 
    label: 'Pleasant', 
    color: 'hsl(38, 92%, 50%)',
    bgClass: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' 
  },
  { 
    value: 'neutral', 
    label: 'Neutral', 
    color: 'hsl(215, 16%, 47%)',
    bgClass: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' 
  },
  { 
    value: 'unpleasant', 
    label: 'Unpleasant', 
    color: 'hsl(263, 70%, 50%)',
    bgClass: 'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200' 
  },
];

export const EMOTION_CATEGORIES: Record<Valence, EmotionCategory[]> = {
  pleasant: [
    { 
      value: 'optimistic', 
      label: 'Optimistic',
      emotions: [
        { value: 'hopeful', label: 'Hopeful' },
        { value: 'inspired', label: 'Inspired' },
        { value: 'eager', label: 'Eager' },
        { value: 'open', label: 'Open' },
        { value: 'curious', label: 'Curious' },
      ]
    },
    { 
      value: 'accepted', 
      label: 'Accepted',
      emotions: [
        { value: 'respected', label: 'Respected' },
        { value: 'valued', label: 'Valued' },
        { value: 'fulfilled', label: 'Fulfilled' },
        { value: 'appreciated', label: 'Appreciated' },
      ]
    },
    { 
      value: 'content', 
      label: 'Content',
      emotions: [
        { value: 'calm', label: 'Calm' },
        { value: 'peaceful', label: 'Peaceful' },
        { value: 'balanced', label: 'Balanced' },
        { value: 'satisfied', label: 'Satisfied' },
        { value: 'relaxed', label: 'Relaxed' },
      ]
    },
    { 
      value: 'powerful', 
      label: 'Powerful',
      emotions: [
        { value: 'confident', label: 'Confident' },
        { value: 'courageous', label: 'Courageous' },
        { value: 'creative', label: 'Creative' },
        { value: 'successful', label: 'Successful' },
        { value: 'provocative', label: 'Provocative' },
      ]
    },
    { 
      value: 'interested', 
      label: 'Interested',
      emotions: [
        { value: 'inquisitive', label: 'Inquisitive' },
        { value: 'amused', label: 'Amused' },
        { value: 'fascinated', label: 'Fascinated' },
        { value: 'absorbed', label: 'Absorbed' },
      ]
    },
    { 
      value: 'playful', 
      label: 'Playful',
      emotions: [
        { value: 'aroused', label: 'Aroused' },
        { value: 'cheeky', label: 'Cheeky' },
        { value: 'energetic', label: 'Energetic' },
        { value: 'free', label: 'Free' },
      ]
    },
    { 
      value: 'proud', 
      label: 'Proud',
      emotions: [
        { value: 'important', label: 'Important' },
        { value: 'worthy', label: 'Worthy' },
        { value: 'accomplished', label: 'Accomplished' },
        { value: 'triumphant', label: 'Triumphant' },
      ]
    },
    { 
      value: 'peaceful', 
      label: 'Peaceful',
      emotions: [
        { value: 'loving', label: 'Loving' },
        { value: 'thankful', label: 'Thankful' },
        { value: 'trusting', label: 'Trusting' },
        { value: 'hopeful', label: 'Hopeful' },
      ]
    },
    { 
      value: 'trusting', 
      label: 'Trusting',
      emotions: [
        { value: 'sensitive', label: 'Sensitive' },
        { value: 'intimate', label: 'Intimate' },
        { value: 'secure', label: 'Secure' },
      ]
    },
  ],
  neutral: [
    { 
      value: 'bored', 
      label: 'Bored',
      emotions: [
        { value: 'indifferent', label: 'Indifferent' },
        { value: 'apathetic', label: 'Apathetic' },
        { value: 'unfocused', label: 'Unfocused' },
        { value: 'detached', label: 'Detached' },
      ]
    },
    { 
      value: 'busy', 
      label: 'Busy',
      emotions: [
        { value: 'rushed', label: 'Rushed' },
        { value: 'pressured', label: 'Pressured' },
        { value: 'occupied', label: 'Occupied' },
        { value: 'preoccupied', label: 'Preoccupied' },
      ]
    },
    { 
      value: 'stressed', 
      label: 'Stressed',
      emotions: [
        { value: 'overwhelmed', label: 'Overwhelmed' },
        { value: 'tense', label: 'Tense' },
        { value: 'out-of-control', label: 'Out of Control' },
        { value: 'restless', label: 'Restless' },
      ]
    },
    { 
      value: 'tired', 
      label: 'Tired',
      emotions: [
        { value: 'exhausted', label: 'Exhausted' },
        { value: 'sleepy', label: 'Sleepy' },
        { value: 'drained', label: 'Drained' },
        { value: 'unfocused', label: 'Unfocused' },
      ]
    },
    { 
      value: 'numb', 
      label: 'Numb',
      emotions: [
        { value: 'empty', label: 'Empty' },
        { value: 'disconnected', label: 'Disconnected' },
        { value: 'spaced-out', label: 'Spaced Out' },
        { value: 'flat', label: 'Flat' },
      ]
    },
  ],
  unpleasant: [
    { 
      value: 'sad', 
      label: 'Sad',
      emotions: [
        { value: 'lonely', label: 'Lonely' },
        { value: 'vulnerable', label: 'Vulnerable' },
        { value: 'depressed', label: 'Depressed' },
        { value: 'hurt', label: 'Hurt' },
        { value: 'despair', label: 'Despair' },
        { value: 'guilty', label: 'Guilty' },
      ]
    },
    { 
      value: 'angry', 
      label: 'Angry',
      emotions: [
        { value: 'mad', label: 'Mad' },
        { value: 'aggressive', label: 'Aggressive' },
        { value: 'frustrated', label: 'Frustrated' },
        { value: 'bitter', label: 'Bitter' },
        { value: 'distant', label: 'Distant' },
        { value: 'critical', label: 'Critical' },
      ]
    },
    { 
      value: 'fearful', 
      label: 'Fearful',
      emotions: [
        { value: 'scared', label: 'Scared' },
        { value: 'anxious', label: 'Anxious' },
        { value: 'insecure', label: 'Insecure' },
        { value: 'weak', label: 'Weak' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'threatened', label: 'Threatened' },
      ]
    },
    { 
      value: 'down', 
      label: 'Down',
      emotions: [
        { value: 'disappointed', label: 'Disappointed' },
        { value: 'inferior', label: 'Inferior' },
        { value: 'inadequate', label: 'Inadequate' },
        { value: 'empty', label: 'Empty' },
        { value: 'embarrassed', label: 'Embarrassed' },
      ]
    },
    { 
      value: 'surprised', 
      label: 'Surprised',
      emotions: [
        { value: 'startled', label: 'Startled' },
        { value: 'confused', label: 'Confused' },
        { value: 'amazed', label: 'Amazed' },
        { value: 'dismayed', label: 'Dismayed' },
        { value: 'shocked', label: 'Shocked' },
      ]
    },
    { 
      value: 'disgusted', 
      label: 'Disgusted',
      emotions: [
        { value: 'disapproving', label: 'Disapproving' },
        { value: 'judgmental', label: 'Judgmental' },
        { value: 'awful', label: 'Awful' },
        { value: 'revulsion', label: 'Revulsion' },
        { value: 'loathing', label: 'Loathing' },
      ]
    },
  ],
};

export const CONTEXT_OPTIONS: EmotionOption[] = [
  { value: 'family', label: 'Family' },
  { value: 'myself', label: 'Myself' },
  { value: 'health', label: 'Health' },
  { value: 'pets', label: 'Pets' },
  { value: 'coworkers', label: 'Co-workers' },
  { value: 'friends', label: 'Friends' },
  { value: 'partner', label: 'Partner' },
  { value: 'acquaintances', label: 'Acquaintances' },
  { value: 'work', label: 'Work' },
  { value: 'home', label: 'Home' },
  { value: 'school', label: 'School' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'commuting', label: 'Commuting' },
  { value: 'outside', label: 'Outside' },
];

// Helper to get category by value
export const getCategoryByValue = (valence: Valence, categoryValue: string): EmotionCategory | undefined => {
  return EMOTION_CATEGORIES[valence]?.find(cat => cat.value === categoryValue);
};

// Helper to get emotion label
export const getEmotionLabel = (valence: Valence, categoryValue: string, emotionValue: string): string => {
  const category = getCategoryByValue(valence, categoryValue);
  const emotion = category?.emotions.find(e => e.value === emotionValue);
  return emotion?.label || emotionValue;
};

// Get valence color class
export const getValenceClass = (valence: Valence): string => {
  return VALENCE_OPTIONS.find(v => v.value === valence)?.bgClass || '';
};
