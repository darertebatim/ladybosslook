export interface ToolConfig {
  id: string;
  name: string;
  icon: string;
  emoji?: string;
  color: string;
  gradient: string;
  route: string;
  description: string;
  comingSoon?: boolean;
  hidden?: boolean;
}

export const wellnessTools: ToolConfig[] = [
  {
    id: 'journal',
    name: 'Journal',
    icon: 'BookOpen',
    emoji: '📝',
    color: 'orange',
    gradient: 'from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40',
    route: '/app/journal',
    description: 'Daily reflections',
  },
  {
    id: 'breathe',
    name: 'Breathe',
    icon: 'Wind',
    emoji: '🌬️',
    color: 'teal',
    gradient: 'from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40',
    route: '/app/breathe',
    description: 'Breathing exercises',
  },
  {
    id: 'water',
    name: 'Water',
    icon: 'Droplets',
    emoji: '💧',
    color: 'sky',
    gradient: 'from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40',
    route: '/app/water',
    description: 'Hydration tracker',
  },
  {
    id: 'routines',
    name: 'Routines',
    icon: 'Sparkles',
    emoji: '✨',
    color: 'purple',
    gradient: 'from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40',
    route: '/app/routines',
    description: 'Daily habits',
  },
];

export const audioTools: ToolConfig[] = [
  {
    id: 'meditate',
    name: 'Meditate',
    icon: 'Brain',
    emoji: '🧘',
    color: 'indigo',
    gradient: 'from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40',
    route: '/app/player?category=meditate',
    description: 'Guided meditation',
  },
  {
    id: 'workout',
    name: 'Workout',
    icon: 'Dumbbell',
    emoji: '💪',
    color: 'rose',
    gradient: 'from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40',
    route: '/app/player?category=workout',
    description: 'Energizing audio',
  },
  {
    id: 'soundscape',
    name: 'Soundscape',
    icon: 'Waves',
    emoji: '🌊',
    color: 'teal',
    gradient: 'from-teal-100 to-blue-100 dark:from-teal-900/40 dark:to-blue-900/40',
    route: '/app/player?category=soundscape',
    description: 'Ambient sounds',
  },
];

export const comingSoonTools: ToolConfig[] = [
  {
    id: 'period',
    name: 'Period',
    icon: 'Heart',
    emoji: '🩸',
    color: 'pink',
    gradient: 'from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40',
    route: '/app/period',
    description: 'Cycle tracking',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'fasting',
    name: 'Fasting',
    icon: 'Timer',
    emoji: '⏱️',
    color: 'green',
    gradient: 'from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40',
    route: '/app/fasting',
    description: 'Intermittent fasting',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'mood',
    name: 'Mood',
    icon: 'Smile',
    emoji: '😊',
    color: 'yellow',
    gradient: 'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40',
    route: '/app/mood',
    description: 'Emotional wellness',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'emotions',
    name: 'Emotions',
    icon: 'Palette',
    emoji: '🎨',
    color: 'violet',
    gradient: 'from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40',
    route: '/app/emotions',
    description: 'Name your feelings',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'reflections',
    name: 'Reflections',
    icon: 'PenLine',
    emoji: '✍️',
    color: 'slate',
    gradient: 'from-slate-100 to-gray-100 dark:from-slate-900/40 dark:to-gray-900/40',
    route: '/app/reflections',
    description: 'Guided prompts',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'tests',
    name: 'Tests',
    icon: 'ClipboardCheck',
    emoji: '📋',
    color: 'blue',
    gradient: 'from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40',
    route: '/app/tests',
    description: 'Self-assessments',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'challenges',
    name: 'Challenges',
    icon: 'Trophy',
    emoji: '🏆',
    color: 'amber',
    gradient: 'from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40',
    route: '/app/challenges',
    description: 'Goal challenges',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'ai',
    name: 'AI Coach',
    icon: 'Bot',
    emoji: '🤖',
    color: 'cyan',
    gradient: 'from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/40',
    route: '/app/ai',
    description: 'Personal assistant',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'habits',
    name: 'Habits',
    icon: 'Target',
    emoji: '🎯',
    color: 'red',
    gradient: 'from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40',
    route: '/app/habits',
    description: 'Habit building',
    comingSoon: true,
    hidden: true,
  },
];

// Get all visible tools (not hidden)
export const getVisibleTools = () => {
  return [
    ...wellnessTools.filter(t => !t.hidden),
    ...audioTools.filter(t => !t.hidden),
  ];
};

// Get coming soon tools that should be shown
export const getVisibleComingSoon = () => {
  return comingSoonTools.filter(t => !t.hidden);
};
