export interface ToolConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  iconGradient: string;
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
    color: 'orange',
    gradient: 'from-amber-50/80 to-orange-50/80 dark:from-amber-900/30 dark:to-orange-900/30',
    iconGradient: 'from-amber-400 to-orange-500',
    route: '/app/journal',
    description: 'Daily reflections',
  },
  {
    id: 'breathe',
    name: 'Breathe',
    icon: 'Wind',
    color: 'teal',
    gradient: 'from-teal-50/80 to-cyan-50/80 dark:from-teal-900/30 dark:to-cyan-900/30',
    iconGradient: 'from-teal-400 to-cyan-500',
    route: '/app/breathe',
    description: 'Breathing exercises',
  },
  {
    id: 'water',
    name: 'Water',
    icon: 'Droplets',
    color: 'sky',
    gradient: 'from-sky-50/80 to-blue-50/80 dark:from-sky-900/30 dark:to-blue-900/30',
    iconGradient: 'from-sky-400 to-blue-500',
    route: '/app/water',
    description: 'Hydration tracker',
  },
  {
    id: 'routines',
    name: 'Routines',
    icon: 'Sparkles',
    color: 'purple',
    gradient: 'from-violet-50/80 to-purple-50/80 dark:from-violet-900/30 dark:to-purple-900/30',
    iconGradient: 'from-violet-400 to-purple-500',
    route: '/app/routines',
    description: 'Daily habits',
  },
];

export const audioTools: ToolConfig[] = [
  {
    id: 'meditate',
    name: 'Meditate',
    icon: 'Brain',
    color: 'indigo',
    gradient: 'from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/30 dark:to-purple-900/30',
    iconGradient: 'from-indigo-400 to-purple-500',
    route: '/app/player?category=meditate',
    description: 'Guided meditation',
  },
  {
    id: 'workout',
    name: 'Workout',
    icon: 'Dumbbell',
    color: 'rose',
    gradient: 'from-rose-50/80 to-pink-50/80 dark:from-rose-900/30 dark:to-pink-900/30',
    iconGradient: 'from-rose-400 to-pink-500',
    route: '/app/player?category=workout',
    description: 'Workout videos',
  },
  {
    id: 'soundscape',
    name: 'Soundscape',
    icon: 'Waves',
    color: 'teal',
    gradient: 'from-cyan-50/80 to-teal-50/80 dark:from-cyan-900/30 dark:to-teal-900/30',
    iconGradient: 'from-cyan-400 to-teal-500',
    route: '/app/player?category=soundscape',
    description: 'Ambient sounds',
  },
];

export const comingSoonTools: ToolConfig[] = [
  {
    id: 'ai',
    name: 'AI Coach',
    icon: 'Bot',
    color: 'cyan',
    gradient: 'from-cyan-50/80 to-teal-50/80 dark:from-cyan-900/30 dark:to-teal-900/30',
    iconGradient: 'from-cyan-400 to-teal-500',
    route: '/app/ai',
    description: 'Personal assistant',
    comingSoon: true,
  },
  {
    id: 'challenges',
    name: 'Challenges',
    icon: 'Trophy',
    color: 'amber',
    gradient: 'from-amber-50/80 to-yellow-50/80 dark:from-amber-900/30 dark:to-yellow-900/30',
    iconGradient: 'from-amber-400 to-yellow-500',
    route: '/app/challenges',
    description: 'Goal challenges',
    comingSoon: true,
  },
  {
    id: 'mood',
    name: 'Mood',
    icon: 'Smile',
    color: 'yellow',
    gradient: 'from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/30 dark:to-amber-900/30',
    iconGradient: 'from-yellow-400 to-amber-500',
    route: '/app/mood',
    description: 'Track emotions',
    comingSoon: true,
  },
  {
    id: 'period',
    name: 'Period',
    icon: 'Heart',
    color: 'pink',
    gradient: 'from-pink-50/80 to-rose-50/80 dark:from-pink-900/30 dark:to-rose-900/30',
    iconGradient: 'from-pink-400 to-rose-500',
    route: '/app/period',
    description: 'Cycle tracking',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'fasting',
    name: 'Fasting',
    icon: 'Timer',
    color: 'green',
    gradient: 'from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30',
    iconGradient: 'from-green-400 to-emerald-500',
    route: '/app/fasting',
    description: 'Intermittent fasting',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'emotions',
    name: 'Emotions',
    icon: 'Palette',
    color: 'violet',
    gradient: 'from-violet-50/80 to-purple-50/80 dark:from-violet-900/30 dark:to-purple-900/30',
    iconGradient: 'from-violet-400 to-purple-500',
    route: '/app/emotions',
    description: 'Name your feelings',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'reflections',
    name: 'Reflections',
    icon: 'PenLine',
    color: 'slate',
    gradient: 'from-slate-50/80 to-gray-50/80 dark:from-slate-900/30 dark:to-gray-900/30',
    iconGradient: 'from-slate-400 to-gray-500',
    route: '/app/reflections',
    description: 'Guided prompts',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'tests',
    name: 'Tests',
    icon: 'ClipboardCheck',
    color: 'blue',
    gradient: 'from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30',
    iconGradient: 'from-blue-400 to-indigo-500',
    route: '/app/tests',
    description: 'Self-assessments',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'habits',
    name: 'Habits',
    icon: 'Target',
    color: 'red',
    gradient: 'from-red-50/80 to-rose-50/80 dark:from-red-900/30 dark:to-rose-900/30',
    iconGradient: 'from-red-400 to-rose-500',
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
