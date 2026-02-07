import { 
  Footprints, 
  Calendar, 
  CalendarCheck, 
  RotateCcw, 
  Headphones, 
  BookHeart, 
  Wind, 
  Trophy,
  Sparkles,
  Heart
} from 'lucide-react';

export interface PresenceStats {
  // Presence metrics
  totalActiveDays: number;
  thisMonthActiveDays: number;
  returnCount: number;
  currentStreak: number;
  longestStreak: number;
  
  // Activity stats
  listeningMinutes: number;
  completedTracks: number;
  journalEntries: number;
  breathingSessions: number;
  emotionLogs: number;
  totalTaskCompletions: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: typeof Footprints;
  emoji: string;
  color: string; // Tailwind bg class when unlocked
  unlockCondition: (stats: PresenceStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-step',
    name: 'First Step',
    description: 'Completed your first task ever',
    icon: Footprints,
    emoji: '👣',
    color: 'bg-emerald-500',
    unlockCondition: (stats) => stats.totalTaskCompletions >= 1,
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: '7 active days in a month',
    icon: Calendar,
    emoji: '📅',
    color: 'bg-violet-500',
    unlockCondition: (stats) => stats.thisMonthActiveDays >= 7,
  },
  {
    id: 'steady-presence',
    name: 'Steady Presence',
    description: '14 active days in a month',
    icon: CalendarCheck,
    emoji: '✨',
    color: 'bg-indigo-500',
    unlockCondition: (stats) => stats.thisMonthActiveDays >= 14,
  },
  {
    id: 'return-strength',
    name: 'Return Strength',
    description: 'Came back after breaks 5 times',
    icon: RotateCcw,
    emoji: '💜',
    color: 'bg-pink-500',
    unlockCondition: (stats) => stats.returnCount >= 5,
  },
  {
    id: 'listener',
    name: 'Listener',
    description: '60+ minutes of audio content',
    icon: Headphones,
    emoji: '🎧',
    color: 'bg-sky-500',
    unlockCondition: (stats) => stats.listeningMinutes >= 60,
  },
  {
    id: 'reflective-soul',
    name: 'Reflective Soul',
    description: '10+ journal entries',
    icon: BookHeart,
    emoji: '📝',
    color: 'bg-rose-500',
    unlockCondition: (stats) => stats.journalEntries >= 10,
  },
  {
    id: 'breath-master',
    name: 'Breath Master',
    description: '10+ breathing sessions',
    icon: Wind,
    emoji: '🌬️',
    color: 'bg-teal-500',
    unlockCondition: (stats) => stats.breathingSessions >= 10,
  },
  {
    id: 'full-month',
    name: 'Full Month',
    description: '30+ total active days',
    icon: Trophy,
    emoji: '🏆',
    color: 'bg-amber-500',
    unlockCondition: (stats) => stats.totalActiveDays >= 30,
  },
];

export function getAchievementStatus(stats: PresenceStats) {
  const unlocked: Achievement[] = [];
  const locked: Achievement[] = [];
  
  for (const achievement of ACHIEVEMENTS) {
    if (achievement.unlockCondition(stats)) {
      unlocked.push(achievement);
    } else {
      locked.push(achievement);
    }
  }
  
  return { unlocked, locked };
}
