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
  Heart,
  Flame,
  Star,
  Zap,
  Crown,
  Target,
  Sun,
  Moon,
  Music,
  Smile,
  Shield,
  Timer,
  Compass,
  Sunrise,
  Award,
  Mountain,
  Gem,
  type LucideIcon,
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
  fastingSessions: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  emoji: string;
  color: string;
  unlockCondition: (stats: PresenceStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ═══════════════════════════════════════════
  // 🏃 ACTIONS (Task Completions) - 7 tiers
  // ═══════════════════════════════════════════
  {
    id: 'first-step',
    name: 'First Step',
    description: 'Completed your first action',
    icon: Footprints,
    emoji: '👣',
    color: 'bg-emerald-500',
    unlockCondition: (s) => s.totalTaskCompletions >= 1,
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Completed 10 actions',
    icon: Zap,
    emoji: '⚡',
    color: 'bg-yellow-500',
    unlockCondition: (s) => s.totalTaskCompletions >= 10,
  },
  {
    id: 'action-taker',
    name: 'Action Taker',
    description: 'Completed 25 actions',
    icon: Target,
    emoji: '🎯',
    color: 'bg-orange-500',
    unlockCondition: (s) => s.totalTaskCompletions >= 25,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Completed 50 actions',
    icon: Flame,
    emoji: '🔥',
    color: 'bg-red-500',
    unlockCondition: (s) => s.totalTaskCompletions >= 50,
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Completed 100 actions',
    icon: Shield,
    emoji: '🛡️',
    color: 'bg-indigo-600',
    unlockCondition: (s) => s.totalTaskCompletions >= 100,
  },
  {
    id: 'powerhouse',
    name: 'Powerhouse',
    description: 'Completed 250 actions',
    icon: Crown,
    emoji: '👑',
    color: 'bg-amber-600',
    unlockCondition: (s) => s.totalTaskCompletions >= 250,
  },
  {
    id: 'legendary',
    name: 'Legendary',
    description: 'Completed 500 actions',
    icon: Gem,
    emoji: '💎',
    color: 'bg-violet-600',
    unlockCondition: (s) => s.totalTaskCompletions >= 500,
  },

  // ═══════════════════════════════════════════
  // 🔥 STREAKS - 6 tiers
  // ═══════════════════════════════════════════
  {
    id: 'three-day-fire',
    name: 'Spark',
    description: '3-day streak',
    icon: Flame,
    emoji: '🕯️',
    color: 'bg-orange-400',
    unlockCondition: (s) => s.longestStreak >= 3,
  },
  {
    id: 'week-on-fire',
    name: 'On Fire',
    description: '7-day streak',
    icon: Flame,
    emoji: '🔥',
    color: 'bg-orange-500',
    unlockCondition: (s) => s.longestStreak >= 7,
  },
  {
    id: 'two-week-blaze',
    name: 'Blazing',
    description: '14-day streak',
    icon: Flame,
    emoji: '🌟',
    color: 'bg-orange-600',
    unlockCondition: (s) => s.longestStreak >= 14,
  },
  {
    id: 'three-week-inferno',
    name: 'Inferno',
    description: '21-day streak',
    icon: Star,
    emoji: '⭐',
    color: 'bg-red-600',
    unlockCondition: (s) => s.longestStreak >= 21,
  },
  {
    id: 'month-streak',
    name: 'Iron Will',
    description: '30-day streak',
    icon: Shield,
    emoji: '🏅',
    color: 'bg-slate-700',
    unlockCondition: (s) => s.longestStreak >= 30,
  },
  {
    id: 'diamond-streak',
    name: 'Diamond Discipline',
    description: '60-day streak',
    icon: Gem,
    emoji: '💠',
    color: 'bg-cyan-600',
    unlockCondition: (s) => s.longestStreak >= 60,
  },

  // ═══════════════════════════════════════════
  // 🔄 RETURNS - 5 tiers
  // ═══════════════════════════════════════════
  {
    id: 'return-strength',
    name: 'Return Strength',
    description: 'Came back 5 times',
    icon: RotateCcw,
    emoji: '💜',
    color: 'bg-pink-500',
    unlockCondition: (s) => s.returnCount >= 5,
  },
  {
    id: 'always-welcome',
    name: 'Always Welcome',
    description: 'Came back 10 times',
    icon: RotateCcw,
    emoji: '🤗',
    color: 'bg-pink-600',
    unlockCondition: (s) => s.returnCount >= 10,
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    description: 'Came back 25 times',
    icon: RotateCcw,
    emoji: '🪃',
    color: 'bg-fuchsia-500',
    unlockCondition: (s) => s.returnCount >= 25,
  },
  {
    id: 'loyal-heart',
    name: 'Loyal Heart',
    description: 'Came back 50 times',
    icon: Heart,
    emoji: '❤️',
    color: 'bg-rose-600',
    unlockCondition: (s) => s.returnCount >= 50,
  },
  {
    id: 'forever-returning',
    name: 'Forever Returning',
    description: 'Came back 100 times',
    icon: Heart,
    emoji: '💖',
    color: 'bg-rose-700',
    unlockCondition: (s) => s.returnCount >= 100,
  },

  // ═══════════════════════════════════════════
  // 📅 ACTIVE DAYS & MONTHLY - 7 tiers
  // ═══════════════════════════════════════════
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: '7 active days this month',
    icon: Calendar,
    emoji: '📅',
    color: 'bg-violet-500',
    unlockCondition: (s) => s.thisMonthActiveDays >= 7,
  },
  {
    id: 'steady-presence',
    name: 'Steady Presence',
    description: '14 active days this month',
    icon: CalendarCheck,
    emoji: '✨',
    color: 'bg-indigo-500',
    unlockCondition: (s) => s.thisMonthActiveDays >= 14,
  },
  {
    id: 'monthly-champion',
    name: 'Monthly Champion',
    description: '21 active days this month',
    icon: Award,
    emoji: '🥇',
    color: 'bg-amber-500',
    unlockCondition: (s) => s.thisMonthActiveDays >= 21,
  },
  {
    id: 'perfect-month',
    name: 'Perfect Month',
    description: '30 active days this month',
    icon: Crown,
    emoji: '👸',
    color: 'bg-amber-600',
    unlockCondition: (s) => s.thisMonthActiveDays >= 30,
  },
  {
    id: 'full-month',
    name: 'Full Month',
    description: '30+ total active days',
    icon: Trophy,
    emoji: '🏆',
    color: 'bg-amber-500',
    unlockCondition: (s) => s.totalActiveDays >= 30,
  },
  {
    id: 'quarter-strong',
    name: 'Quarter Strong',
    description: '90+ total active days',
    icon: Mountain,
    emoji: '⛰️',
    color: 'bg-emerald-700',
    unlockCondition: (s) => s.totalActiveDays >= 90,
  },
  {
    id: 'year-of-growth',
    name: 'Year of Growth',
    description: '365+ total active days',
    icon: Sunrise,
    emoji: '🌅',
    color: 'bg-orange-700',
    unlockCondition: (s) => s.totalActiveDays >= 365,
  },

  // ═══════════════════════════════════════════
  // 🎧 LISTENING & AUDIO - 5 tiers
  // ═══════════════════════════════════════════
  {
    id: 'listener',
    name: 'Listener',
    description: '60+ minutes of audio',
    icon: Headphones,
    emoji: '🎧',
    color: 'bg-sky-500',
    unlockCondition: (s) => s.listeningMinutes >= 60,
  },
  {
    id: 'deep-listener',
    name: 'Deep Listener',
    description: '5+ hours of audio',
    icon: Headphones,
    emoji: '🎶',
    color: 'bg-sky-600',
    unlockCondition: (s) => s.listeningMinutes >= 300,
  },
  {
    id: 'sound-seeker',
    name: 'Sound Seeker',
    description: '10+ hours of audio',
    icon: Music,
    emoji: '🎵',
    color: 'bg-blue-600',
    unlockCondition: (s) => s.listeningMinutes >= 600,
  },
  {
    id: 'track-collector',
    name: 'Track Collector',
    description: 'Completed 10 tracks',
    icon: Music,
    emoji: '💿',
    color: 'bg-purple-500',
    unlockCondition: (s) => s.completedTracks >= 10,
  },
  {
    id: 'music-library',
    name: 'Music Library',
    description: 'Completed 50 tracks',
    icon: Music,
    emoji: '📀',
    color: 'bg-purple-700',
    unlockCondition: (s) => s.completedTracks >= 50,
  },

  // ═══════════════════════════════════════════
  // 📝 JOURNAL WRITING - 4 tiers
  // ═══════════════════════════════════════════
  {
    id: 'reflective-soul',
    name: 'Reflective Soul',
    description: '10+ journal entries',
    icon: BookHeart,
    emoji: '📝',
    color: 'bg-rose-500',
    unlockCondition: (s) => s.journalEntries >= 10,
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    description: '25+ journal entries',
    icon: BookHeart,
    emoji: '📖',
    color: 'bg-rose-600',
    unlockCondition: (s) => s.journalEntries >= 25,
  },
  {
    id: 'inner-author',
    name: 'Inner Author',
    description: '50+ journal entries',
    icon: BookHeart,
    emoji: '✍️',
    color: 'bg-rose-700',
    unlockCondition: (s) => s.journalEntries >= 50,
  },
  {
    id: 'journal-master',
    name: 'Journal Master',
    description: '100+ journal entries',
    icon: BookHeart,
    emoji: '📚',
    color: 'bg-red-700',
    unlockCondition: (s) => s.journalEntries >= 100,
  },

  // ═══════════════════════════════════════════
  // 🌬️ BREATHE PRACTICE - 3 tiers
  // ═══════════════════════════════════════════
  {
    id: 'breath-master',
    name: 'Breath Master',
    description: '10+ breathing sessions',
    icon: Wind,
    emoji: '🌬️',
    color: 'bg-teal-500',
    unlockCondition: (s) => s.breathingSessions >= 10,
  },
  {
    id: 'calm-warrior',
    name: 'Calm Warrior',
    description: '25+ breathing sessions',
    icon: Wind,
    emoji: '🧘',
    color: 'bg-teal-600',
    unlockCondition: (s) => s.breathingSessions >= 25,
  },
  {
    id: 'zen-master',
    name: 'Zen Master',
    description: '50+ breathing sessions',
    icon: Wind,
    emoji: '☯️',
    color: 'bg-teal-700',
    unlockCondition: (s) => s.breathingSessions >= 50,
  },

  // ═══════════════════════════════════════════
  // 😊 EMOTION CHECK - 4 tiers
  // ═══════════════════════════════════════════
  {
    id: 'self-aware',
    name: 'Self-Aware',
    description: '5+ emotion check-ins',
    icon: Smile,
    emoji: '🪞',
    color: 'bg-purple-400',
    unlockCondition: (s) => s.emotionLogs >= 5,
  },
  {
    id: 'emotion-explorer',
    name: 'Emotion Explorer',
    description: '10+ emotion check-ins',
    icon: Compass,
    emoji: '🧭',
    color: 'bg-purple-500',
    unlockCondition: (s) => s.emotionLogs >= 10,
  },
  {
    id: 'feeling-fluent',
    name: 'Feeling Fluent',
    description: '25+ emotion check-ins',
    icon: Smile,
    emoji: '💫',
    color: 'bg-purple-600',
    unlockCondition: (s) => s.emotionLogs >= 25,
  },
  {
    id: 'emotional-intelligence',
    name: 'Emotional Intelligence',
    description: '50+ emotion check-ins',
    icon: Sparkles,
    emoji: '🧠',
    color: 'bg-purple-700',
    unlockCondition: (s) => s.emotionLogs >= 50,
  },

  // ═══════════════════════════════════════════
  // ⏱️ FASTING TIMER - 3 tiers
  // ═══════════════════════════════════════════
  {
    id: 'first-fast',
    name: 'First Fast',
    description: 'Completed your first fast',
    icon: Timer,
    emoji: '⏱️',
    color: 'bg-amber-500',
    unlockCondition: (s) => s.fastingSessions >= 1,
  },
  {
    id: 'fasting-regular',
    name: 'Fasting Regular',
    description: '10+ completed fasts',
    icon: Timer,
    emoji: '🍃',
    color: 'bg-green-600',
    unlockCondition: (s) => s.fastingSessions >= 10,
  },
  {
    id: 'fasting-warrior',
    name: 'Fasting Warrior',
    description: '30+ completed fasts',
    icon: Timer,
    emoji: '⚔️',
    color: 'bg-green-700',
    unlockCondition: (s) => s.fastingSessions >= 30,
  },

  // ═══════════════════════════════════════════
  // 🌟 SPECIAL COMBO MILESTONES
  // ═══════════════════════════════════════════
  {
    id: 'well-rounded',
    name: 'Well-Rounded',
    description: 'Used 3+ different tools',
    icon: Sparkles,
    emoji: '🌈',
    color: 'bg-pink-500',
    unlockCondition: (s) => {
      let t = 0;
      if (s.totalTaskCompletions > 0) t++;
      if (s.journalEntries > 0) t++;
      if (s.breathingSessions > 0) t++;
      if (s.listeningMinutes > 0) t++;
      if (s.emotionLogs > 0) t++;
      if (s.fastingSessions > 0) t++;
      return t >= 3;
    },
  },
  {
    id: 'wellness-explorer',
    name: 'Wellness Explorer',
    description: 'Used 5+ different tools',
    icon: Compass,
    emoji: '🗺️',
    color: 'bg-emerald-600',
    unlockCondition: (s) => {
      let t = 0;
      if (s.totalTaskCompletions > 0) t++;
      if (s.journalEntries > 0) t++;
      if (s.breathingSessions > 0) t++;
      if (s.listeningMinutes > 0) t++;
      if (s.emotionLogs > 0) t++;
      if (s.fastingSessions > 0) t++;
      return t >= 5;
    },
  },
  {
    id: 'sunrise-warrior',
    name: 'Sunrise Warrior',
    description: '10+ actions & 10+ journal entries',
    icon: Sun,
    emoji: '🌤️',
    color: 'bg-yellow-600',
    unlockCondition: (s) => s.totalTaskCompletions >= 10 && s.journalEntries >= 10,
  },
  {
    id: 'mindful-achiever',
    name: 'Mindful Achiever',
    description: '25+ actions & 10+ breathing sessions',
    icon: Moon,
    emoji: '🌙',
    color: 'bg-indigo-700',
    unlockCondition: (s) => s.totalTaskCompletions >= 25 && s.breathingSessions >= 10,
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
