export type Valence = 'pleasant' | 'neutral' | 'unpleasant';

export interface EmotionOption {
  value: string;
  label: string;
}

export interface CategoryColor {
  bg: string;
  bgActive: string;
  text: string;
  textActive: string;
}

export interface EmotionCategory {
  value: string;
  label: string;
  color: CategoryColor;
  emotions: EmotionOption[];
}

// Valence options with Finch-style colors
export const VALENCE_OPTIONS: Array<{
  value: Valence;
  label: string;
  color: CategoryColor;
}> = [
  { 
    value: 'pleasant', 
    label: 'Pleasant', 
    color: {
      bg: 'bg-[#FFF3E0]',
      bgActive: 'bg-[#FF9800]',
      text: 'text-[#E65100]',
      textActive: 'text-white',
    }
  },
  { 
    value: 'neutral', 
    label: 'Neutral', 
    color: {
      bg: 'bg-[#E3F2FD]',
      bgActive: 'bg-[#1976D2]',
      text: 'text-[#1565C0]',
      textActive: 'text-white',
    }
  },
  { 
    value: 'unpleasant', 
    label: 'Unpleasant', 
    color: {
      bg: 'bg-[#F3E5F5]',
      bgActive: 'bg-[#7B1FA2]',
      text: 'text-[#6A1B9A]',
      textActive: 'text-white',
    }
  },
];

// Category colors for Unpleasant emotions (Finch-style)
const CATEGORY_COLORS: Record<string, CategoryColor> = {
  // Pleasant - warm orange/yellow
  pleasant: {
    bg: 'bg-[#FFF3E0]',
    bgActive: 'bg-[#FF9800]',
    text: 'text-[#E65100]',
    textActive: 'text-white',
  },
  // Neutral - blue-gray
  neutral: {
    bg: 'bg-[#E3F2FD]',
    bgActive: 'bg-[#1976D2]',
    text: 'text-[#1565C0]',
    textActive: 'text-white',
  },
  // Sad - blue-gray
  sad: {
    bg: 'bg-[#CFD8DC]',
    bgActive: 'bg-[#546E7A]',
    text: 'text-[#37474F]',
    textActive: 'text-white',
  },
  // Angry - red tint
  angry: {
    bg: 'bg-[#FFCDD2]',
    bgActive: 'bg-[#E53935]',
    text: 'text-[#C62828]',
    textActive: 'text-white',
  },
  // Fearful - dark slate
  fearful: {
    bg: 'bg-[#455A64]',
    bgActive: 'bg-[#263238]',
    text: 'text-white',
    textActive: 'text-white',
  },
  // Down - light gray
  down: {
    bg: 'bg-[#ECEFF1]',
    bgActive: 'bg-[#78909C]',
    text: 'text-[#546E7A]',
    textActive: 'text-white',
  },
  // Surprised - pink
  surprised: {
    bg: 'bg-[#FCE4EC]',
    bgActive: 'bg-[#E91E63]',
    text: 'text-[#AD1457]',
    textActive: 'text-white',
  },
  // Disgusted - brown tint
  disgusted: {
    bg: 'bg-[#EFEBE9]',
    bgActive: 'bg-[#795548]',
    text: 'text-[#5D4037]',
    textActive: 'text-white',
  },
};

// Helper to get category color
export const getCategoryColor = (valence: Valence, categoryValue?: string): CategoryColor => {
  if (valence === 'unpleasant' && categoryValue) {
    return CATEGORY_COLORS[categoryValue] || CATEGORY_COLORS.sad;
  }
  return CATEGORY_COLORS[valence] || CATEGORY_COLORS.pleasant;
};

// Neutral emotions - flat list (no categories)
export const NEUTRAL_EMOTIONS: EmotionOption[] = [
  { value: 'content', label: 'Content' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'good', label: 'Good' },
  { value: 'calm', label: 'Calm' },
  { value: 'mellow', label: 'Mellow' },
  { value: 'peaceful', label: 'Peaceful' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'thoughtful', label: 'Thoughtful' },
  { value: 'interested', label: 'Interested' },
  { value: 'trusting', label: 'Trusting' },
  { value: 'bored', label: 'Bored' },
  { value: 'meh', label: 'Meh' },
  { value: 'indifferent', label: 'Indifferent' },
  { value: 'tired', label: 'Tired' },
];

export const EMOTION_CATEGORIES: Record<Valence, EmotionCategory[]> = {
  pleasant: [
    { 
      value: 'optimistic', 
      label: 'Optimistic',
      color: CATEGORY_COLORS.pleasant,
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
      color: CATEGORY_COLORS.pleasant,
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
      color: CATEGORY_COLORS.pleasant,
      emotions: [
        { value: 'calm', label: 'Calm' },
        { value: 'mellow', label: 'Mellow' },
        { value: 'good', label: 'Good' },
        { value: 'fulfilled', label: 'Fulfilled' },
        { value: 'peaceful', label: 'Peaceful' },
        { value: 'comfortable', label: 'Comfortable' },
        { value: 'balanced', label: 'Balanced' },
      ]
    },
    { 
      value: 'powerful', 
      label: 'Powerful',
      color: CATEGORY_COLORS.pleasant,
      emotions: [
        { value: 'confident', label: 'Confident' },
        { value: 'courageous', label: 'Courageous' },
        { value: 'creative', label: 'Creative' },
        { value: 'successful', label: 'Successful' },
      ]
    },
    { 
      value: 'interested', 
      label: 'Interested',
      color: CATEGORY_COLORS.pleasant,
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
      color: CATEGORY_COLORS.pleasant,
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
      color: CATEGORY_COLORS.pleasant,
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
      color: CATEGORY_COLORS.pleasant,
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
      color: CATEGORY_COLORS.pleasant,
      emotions: [
        { value: 'sensitive', label: 'Sensitive' },
        { value: 'intimate', label: 'Intimate' },
        { value: 'secure', label: 'Secure' },
      ]
    },
  ],
  neutral: [], // Neutral uses flat list (NEUTRAL_EMOTIONS)
  unpleasant: [
    { 
      value: 'sad', 
      label: 'Sad',
      color: CATEGORY_COLORS.sad,
      emotions: [
        { value: 'lonely', label: 'Lonely' },
        { value: 'vulnerable', label: 'Vulnerable' },
        { value: 'depressed', label: 'Depressed' },
        { value: 'hurt', label: 'Hurt' },
        { value: 'despair', label: 'Despair' },
        { value: 'guilty', label: 'Guilty' },
        { value: 'isolated', label: 'Isolated' },
        { value: 'abandoned', label: 'Abandoned' },
        { value: 'forlorn', label: 'Forlorn' },
        { value: 'alienated', label: 'Alienated' },
        { value: 'nostalgic', label: 'Nostalgic' },
        { value: 'victimized', label: 'Victimized' },
        { value: 'fragile', label: 'Fragile' },
        { value: 'lost', label: 'Lost' },
        { value: 'miserable', label: 'Miserable' },
        { value: 'embarrassed', label: 'Embarrassed' },
        { value: 'disappointed', label: 'Disappointed' },
        { value: 'powerless', label: 'Powerless' },
        { value: 'grief', label: 'Grief' },
        { value: 'trapped', label: 'Trapped' },
        { value: 'discouraged', label: 'Discouraged' },
        { value: 'ashamed', label: 'Ashamed' },
        { value: 'remorseful', label: 'Remorseful' },
        { value: 'insecure', label: 'Insecure' },
        { value: 'empty', label: 'Empty' },
        { value: 'inferior', label: 'Inferior' },
        { value: 'pessimistic', label: 'Pessimistic' },
      ]
    },
    { 
      value: 'angry', 
      label: 'Angry',
      color: CATEGORY_COLORS.angry,
      emotions: [
        { value: 'let-down', label: 'Let down' },
        { value: 'disrespected', label: 'Disrespected' },
        { value: 'mad', label: 'Mad' },
        { value: 'aggressive', label: 'Aggressive' },
        { value: 'frustrated', label: 'Frustrated' },
        { value: 'bitter', label: 'Bitter' },
        { value: 'distant', label: 'Distant' },
        { value: 'critical', label: 'Critical' },
        { value: 'betrayed', label: 'Betrayed' },
        { value: 'humiliated', label: 'Humiliated' },
        { value: 'infuriated', label: 'Infuriated' },
        { value: 'annoyed', label: 'Annoyed' },
        { value: 'furious', label: 'Furious' },
        { value: 'jealous', label: 'Jealous' },
        { value: 'provoked', label: 'Provoked' },
        { value: 'hostile', label: 'Hostile' },
      ]
    },
    { 
      value: 'fearful', 
      label: 'Fearful',
      color: CATEGORY_COLORS.fearful,
      emotions: [
        { value: 'scared', label: 'Scared' },
        { value: 'anxious', label: 'Anxious' },
        { value: 'insecure', label: 'Insecure' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'threatened', label: 'Threatened' },
        { value: 'weak', label: 'Weak' },
        { value: 'helpless', label: 'Helpless' },
        { value: 'frightened', label: 'Frightened' },
        { value: 'worried', label: 'Worried' },
        { value: 'jittery', label: 'Jittery' },
        { value: 'overwhelmed', label: 'Overwhelmed' },
        { value: 'terrified', label: 'Terrified' },
        { value: 'panicked', label: 'Panicked' },
        { value: 'fomo', label: 'FOMO' },
      ]
    },
    { 
      value: 'down', 
      label: 'Down',
      color: CATEGORY_COLORS.down,
      emotions: [
        { value: 'bored', label: 'Bored' },
        { value: 'busy', label: 'Busy' },
        { value: 'stressed', label: 'Stressed' },
        { value: 'tired', label: 'Tired' },
        { value: 'numb', label: 'Numb' },
        { value: 'indifferent', label: 'Indifferent' },
        { value: 'apathetic', label: 'Apathetic' },
        { value: 'rushed', label: 'Rushed' },
        { value: 'pressured', label: 'Pressured' },
        { value: 'overwhelmed', label: 'Overwhelmed' },
        { value: 'out-of-control', label: 'Out of control' },
        { value: 'sleepy', label: 'Sleepy' },
        { value: 'unfocused', label: 'Unfocused' },
      ]
    },
    { 
      value: 'surprised', 
      label: 'Surprised',
      color: CATEGORY_COLORS.surprised,
      emotions: [
        { value: 'startled', label: 'Startled' },
        { value: 'shocked', label: 'Shocked' },
        { value: 'dismayed', label: 'Dismayed' },
        { value: 'confused', label: 'Confused' },
        { value: 'disillusioned', label: 'Disillusioned' },
        { value: 'perplexed', label: 'Perplexed' },
      ]
    },
    { 
      value: 'disgusted', 
      label: 'Disgusted',
      color: CATEGORY_COLORS.disgusted,
      emotions: [
        { value: 'disapproving', label: 'Disapproving' },
        { value: 'disappointed', label: 'Disappointed' },
        { value: 'repelled', label: 'Repelled' },
        { value: 'awful', label: 'Awful' },
        { value: 'judgemental', label: 'Judgemental' },
        { value: 'embarrassed', label: 'Embarrassed' },
        { value: 'appalled', label: 'Appalled' },
        { value: 'revolted', label: 'Revolted' },
        { value: 'horrified', label: 'Horrified' },
        { value: 'hesitant', label: 'Hesitant' },
        { value: 'nauseated', label: 'Nauseated' },
        { value: 'detestable', label: 'Detestable' },
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
  // For neutral, check the flat list
  if (valence === 'neutral') {
    const emotion = NEUTRAL_EMOTIONS.find(e => e.value === emotionValue);
    return emotion?.label || emotionValue;
  }
  
  const category = getCategoryByValue(valence, categoryValue);
  const emotion = category?.emotions.find(e => e.value === emotionValue);
  return emotion?.label || emotionValue;
};

// Get valence color
export const getValenceColor = (valence: Valence): CategoryColor => {
  return VALENCE_OPTIONS.find(v => v.value === valence)?.color || VALENCE_OPTIONS[0].color;
};
