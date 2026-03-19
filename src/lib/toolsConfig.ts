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
    bgColor: 'bg-[#E2F9F0]',
    iconColor: 'text-emerald-600',
    route: '/app/routines',
    description: 'Daily routines',
  },
  {
    id: 'focus-timer',
    name: 'Timer',
    icon: 'Clock',
    emoji: '⏱️',
    bgColor: 'bg-[#F0E3FF]',
    iconColor: 'text-purple-600',
    route: '/app/timer',
    description: 'Stay focused',
  },
  {
    id: 'focus-routine',
    name: 'MyRoutines',
    icon: 'Play',
    emoji: '🎯',
    bgColor: 'bg-[#DBEAFE]',
    iconColor: 'text-blue-600',
    route: '/app/routineplayer',
    description: 'Routine player',
  },
  {
    id: 'reflections',
    name: 'Reflections',
    icon: 'Brain',
    emoji: '🧠',
    bgColor: 'bg-[#E0FBB8]',
    iconColor: 'text-teal-600',
    route: '/app/reflections',
    description: 'Guided prompts',
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: 'BookOpen',
    emoji: '📖',
    bgColor: 'bg-[#FFE6C9]',
    iconColor: 'text-orange-600',
    route: '/app/journal',
    description: 'Daily reflections',
  },
  {
    id: 'breathe',
    name: 'Breathe',
    icon: 'Wind',
    emoji: '🌬️',
    bgColor: 'bg-[#D7E9FF]',
    iconColor: 'text-teal-600',
    route: '/app/breathe',
    description: 'Breathing exercises',
  },
  {
    id: 'mood',
    name: 'Mood',
    icon: 'Smile',
    emoji: '🫧',
    bgColor: 'bg-[#FFF492]',
    iconColor: 'text-yellow-600',
    route: '/app/mood',
    description: 'Daily mood log',
  },
  {
    id: 'emotions',
    name: 'Emotions',
    icon: 'HeartHandshake',
    emoji: '💜',
    bgColor: 'bg-[#F0E3FF]',
    iconColor: 'text-violet-600',
    route: '/app/emotion',
    description: 'Name your feelings',
  },
  {
    id: 'videos',
    name: 'Videos',
    icon: 'Dumbbell',
    emoji: '🎬',
    bgColor: 'bg-[#FFE0F5]',
    iconColor: 'text-rose-600',
    route: '/app/watch',
    description: 'Workout videos',
  },
  {
    id: 'water',
    name: 'Water',
    icon: 'Droplets',
    emoji: '💧',
    bgColor: 'bg-[#D7E9FF]',
    iconColor: 'text-blue-600',
    route: '/app/water',
    description: 'Hydration tracker',
  },
  {
    id: 'period',
    name: 'Period',
    icon: 'Heart',
    emoji: '❤️',
    bgColor: 'bg-[#FFE0F5]',
    iconColor: 'text-pink-600',
    route: '/app/period',
    description: 'Cycle tracking',
  },
  {
    id: 'fasting',
    name: 'Fasting',
    icon: 'Timer',
    emoji: '⏳',
    bgColor: 'bg-[#FFE6C9]',
    iconColor: 'text-amber-600',
    route: '/app/fasting',
    description: 'Intermittent fasting',
  },
  {
    id: 'programs',
    name: 'MyPrograms',
    icon: 'GraduationCap',
    emoji: '🎓',
    bgColor: 'bg-[#FFF492]',
    iconColor: 'text-amber-600',
    route: '/app/myprograms',
    description: 'Courses & coaching',
  },
  {
    id: 'profile',
    name: 'MyProfile',
    icon: 'User',
    emoji: '👤',
    bgColor: 'bg-[#E2F9F0]',
    iconColor: 'text-slate-600',
    route: '/app/myprofile',
    description: 'Settings & account',
  },
];

export const audioTools: ToolConfig[] = [
  {
    id: 'meditate',
    name: 'Meditate',
    icon: 'Brain',
    emoji: '🧘',
    bgColor: 'bg-[#F0E3FF]',
    iconColor: 'text-indigo-600',
    route: '/app/player?category=meditate',
    description: 'Guided meditation',
  },
  {
    id: 'workout',
    name: 'Videos',
    icon: 'Dumbbell',
    emoji: '🏋️',
    bgColor: 'bg-[#FFE0F5]',
    iconColor: 'text-rose-600',
    route: '/app/player?category=workout',
    description: 'Workout videos',
  },
  {
    id: 'soundscape',
    name: 'Soundscape',
    icon: 'Waves',
    emoji: '🌊',
    bgColor: 'bg-[#D7E9FF]',
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
