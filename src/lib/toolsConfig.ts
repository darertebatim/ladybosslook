export interface ToolConfig {
  id: string;
  name: string;
  icon: string;
  emoji?: string;
  bgColor: string;
  iconColor: string;
  route: string;
  description: string;
  comingSoon?: boolean;
  hidden?: boolean;
}

export const wellnessTools: ToolConfig[] = [
  {
    id: 'routines',
    name: 'Routines',
    icon: 'CalendarPlus',
    emoji: '📋',
    bgColor: 'bg-[#D1FAE5]',
    iconColor: 'text-emerald-600',
    route: '/app/routines',
    description: 'Daily routines',
  },
  {
    id: 'focus-timer',
    name: 'Timer',
    icon: 'Clock',
    emoji: '⏱️',
    bgColor: 'bg-[#E8E4F8]',
    iconColor: 'text-purple-600',
    route: '/app/timer',
    description: 'Stay focused',
  },
  {
    id: 'reflections',
    name: 'Reflections',
    icon: 'Brain',
    emoji: '🧠',
    bgColor: 'bg-[#CCFBF1]',
    iconColor: 'text-teal-600',
    route: '/app/reflections',
    description: 'Guided prompts',
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: 'BookOpen',
    emoji: '📖',
    bgColor: 'bg-[#FAE5C5]',
    iconColor: 'text-orange-600',
    route: '/app/journal',
    description: 'Daily reflections',
  },
  {
    id: 'breathe',
    name: 'Breathe',
    icon: 'Wind',
    emoji: '🌬️',
    bgColor: 'bg-[#D3F2EA]',
    iconColor: 'text-teal-600',
    route: '/app/breathe',
    description: 'Breathing exercises',
  },
  {
    id: 'mood',
    name: 'Mood',
    icon: 'Smile',
    emoji: '🫧',
    bgColor: 'bg-[#FEF9C3]',
    iconColor: 'text-yellow-600',
    route: '/app/mood',
    description: 'Daily mood log',
  },
  {
    id: 'emotions',
    name: 'Emotions',
    icon: 'HeartHandshake',
    emoji: '💜',
    bgColor: 'bg-[#EDE9FE]',
    iconColor: 'text-violet-600',
    route: '/app/emotion',
    description: 'Name your feelings',
  },
  {
    id: 'videos',
    name: 'Videos',
    icon: 'Dumbbell',
    emoji: '🎬',
    bgColor: 'bg-[#FCE4EC]',
    iconColor: 'text-rose-600',
    route: '/app/watch',
    description: 'Workout videos',
  },
  {
    id: 'water',
    name: 'Water',
    icon: 'Droplets',
    emoji: '💧',
    bgColor: 'bg-[#D6E6FC]',
    iconColor: 'text-blue-600',
    route: '/app/water',
    description: 'Hydration tracker',
  },
  {
    id: 'period',
    name: 'Period',
    icon: 'Heart',
    emoji: '❤️',
    bgColor: 'bg-[#FCE4EC]',
    iconColor: 'text-pink-600',
    route: '/app/period',
    description: 'Cycle tracking',
  },
  {
    id: 'fasting',
    name: 'Fasting',
    icon: 'Timer',
    emoji: '⏳',
    bgColor: 'bg-[#FFE4C4]',
    iconColor: 'text-amber-600',
    route: '/app/fasting',
    description: 'Intermittent fasting',
  },
  {
    id: 'programs',
    name: 'Programs',
    icon: 'GraduationCap',
    emoji: '🎓',
    bgColor: 'bg-[#FEF3C7]',
    iconColor: 'text-amber-600',
    route: '/app/programs',
    description: 'Courses & coaching',
  },
  {
    id: 'profile',
    name: 'Profile',
    icon: 'User',
    emoji: '👤',
    bgColor: 'bg-[#F1F5F9]',
    iconColor: 'text-slate-600',
    route: '/app/profile',
    description: 'Settings & account',
  },
];

export const audioTools: ToolConfig[] = [
  {
    id: 'meditate',
    name: 'Meditate',
    icon: 'Brain',
    emoji: '🧘',
    bgColor: 'bg-[#E8E4F8]',
    iconColor: 'text-indigo-600',
    route: '/app/player?category=meditate',
    description: 'Guided meditation',
  },
  {
    id: 'workout',
    name: 'Videos',
    icon: 'Dumbbell',
    emoji: '🏋️',
    bgColor: 'bg-[#FCE4EC]',
    iconColor: 'text-rose-600',
    route: '/app/player?category=workout',
    description: 'Workout videos',
  },
  {
    id: 'soundscape',
    name: 'Soundscape',
    icon: 'Waves',
    emoji: '🌊',
    bgColor: 'bg-[#D4F1F4]',
    iconColor: 'text-cyan-600',
    route: '/app/player?category=soundscape',
    description: 'Nature and Ambient',
  },
];

export const comingSoonTools: ToolConfig[] = [
  {
    id: 'ai',
    name: 'AI Coach',
    icon: 'Bot',
    bgColor: 'bg-[#D4F1F4]',
    iconColor: 'text-cyan-600',
    route: '/app/ai',
    description: 'Personal assistant',
    comingSoon: true,
  },
  {
    id: 'challenges',
    name: 'Challenges',
    icon: 'Trophy',
    bgColor: 'bg-[#FEF3C7]',
    iconColor: 'text-amber-600',
    route: '/app/challenges',
    description: 'Goal challenges',
    comingSoon: true,
  },
  {
    id: 'mood',
    name: 'Mood',
    icon: 'Smile',
    bgColor: 'bg-[#FEF9C3]',
    iconColor: 'text-yellow-600',
    route: '/app/mood',
    description: 'Track emotions',
    comingSoon: true,
  },
  {
    id: 'reflections-coming',
    name: 'Reflections',
    icon: 'PenLine',
    bgColor: 'bg-[#F1F5F9]',
    iconColor: 'text-slate-600',
    route: '/app/reflections',
    description: 'Guided prompts',
    hidden: true,
  },
  {
    id: 'tests',
    name: 'Tests',
    icon: 'ClipboardCheck',
    bgColor: 'bg-[#DBEAFE]',
    iconColor: 'text-blue-600',
    route: '/app/tests',
    description: 'Self-assessments',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'habits',
    name: 'Habits',
    icon: 'Target',
    bgColor: 'bg-[#FEE2E2]',
    iconColor: 'text-red-600',
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
