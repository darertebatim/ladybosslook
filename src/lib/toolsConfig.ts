export interface ToolConfig {
  id: string;
  name: string;
  icon: string;
  bgColor: string;
  iconColor: string;
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
    bgColor: 'bg-[#FAE5C5]',
    iconColor: 'text-orange-600',
    route: '/app/journal',
    description: 'Daily reflections',
  },
  {
    id: 'breathe',
    name: 'Breathe',
    icon: 'Wind',
    bgColor: 'bg-[#D3F2EA]',
    iconColor: 'text-teal-600',
    route: '/app/breathe',
    description: 'Breathing exercises',
  },
  {
    id: 'water',
    name: 'Water',
    icon: 'Droplets',
    bgColor: 'bg-[#D6E6FC]',
    iconColor: 'text-blue-600',
    route: '/app/water',
    description: 'Hydration tracker',
  },
  {
    id: 'emotions',
    name: 'Emotions',
    icon: 'HeartHandshake',
    bgColor: 'bg-[#EDE9FE]',
    iconColor: 'text-violet-600',
    route: '/app/emotion',
    description: 'Name your feelings',
  },
  {
    id: 'period',
    name: 'Period',
    icon: 'Heart',
    bgColor: 'bg-[#FCE4EC]',
    iconColor: 'text-pink-600',
    route: '/app/period',
    description: 'Cycle tracking',
  },
  {
    id: 'routines',
    name: 'Routines',
    icon: 'Sparkles',
    bgColor: 'bg-[#E6D9FC]',
    iconColor: 'text-violet-600',
    route: '/app/routines',
    description: 'Daily habits',
  },
  {
    id: 'programs',
    name: 'My Programs',
    icon: 'GraduationCap',
    bgColor: 'bg-[#FCE4EC]',
    iconColor: 'text-pink-600',
    route: '/app/programs',
    description: 'Courses & coaching',
  },
  {
    id: 'profile',
    name: 'My Profile',
    icon: 'User',
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
    bgColor: 'bg-[#E8E4F8]',
    iconColor: 'text-indigo-600',
    route: '/app/player?category=meditate',
    description: 'Guided meditation',
  },
  {
    id: 'workout',
    name: 'Videos',
    icon: 'Dumbbell',
    bgColor: 'bg-[#FCE4EC]',
    iconColor: 'text-rose-600',
    route: '/app/player?category=workout',
    description: 'Workout videos',
  },
  {
    id: 'soundscape',
    name: 'Sounds',
    icon: 'Waves',
    bgColor: 'bg-[#D4F1F4]',
    iconColor: 'text-cyan-600',
    route: '/app/player?category=soundscape',
    description: 'Ambient sounds',
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
    id: 'fasting',
    name: 'Fasting',
    icon: 'Timer',
    bgColor: 'bg-[#D1FAE5]',
    iconColor: 'text-green-600',
    route: '/app/fasting',
    description: 'Intermittent fasting',
    comingSoon: true,
    hidden: true,
  },
  {
    id: 'reflections',
    name: 'Reflections',
    icon: 'PenLine',
    bgColor: 'bg-[#F1F5F9]',
    iconColor: 'text-slate-600',
    route: '/app/reflections',
    description: 'Guided prompts',
    comingSoon: true,
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
