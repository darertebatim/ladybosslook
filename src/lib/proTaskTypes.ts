import { 
  Music, 
  BookOpen, 
  MessageCircle, 
  GraduationCap, 
  Calendar, 
  Sparkles, 
  Link,
  Wind,
  Droplets,
  Heart,
  HeartHandshake,
  Headphones,
  Smile,
  Timer,
  Scale
} from 'lucide-react';

// Pro Task link types and their configuration
export type ProLinkType = 'playlist' | 'journal' | 'channel' | 'program' | 'planner' | 'inspire' | 'route' | 'breathe' | 'water' | 'period' | 'emotion' | 'audio' | 'mood' | 'fasting' | 'weight';

export interface ProLinkConfig {
  value: ProLinkType;
  label: string;
  icon: typeof Music;
  badgeText: string;
  color: string;
  gradientClass: string;
  iconColorClass: string;
  badgeColorClass: string;
  buttonClass: string;
  description: string;
  requiresValue: boolean;
}

export const PRO_LINK_CONFIGS: Record<ProLinkType, ProLinkConfig> = {
  playlist: {
    value: 'playlist',
    label: 'Audio Playlist',
    icon: Music,
    badgeText: 'Listen',
    color: 'emerald',
    gradientClass: 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40',
    iconColorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeColorClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Link to an audio playlist',
    requiresValue: true,
  },
  journal: {
    value: 'journal',
    label: 'Journal Writing',
    icon: BookOpen,
    badgeText: 'Write',
    color: 'purple',
    gradientClass: 'bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40',
    iconColorClass: 'text-purple-600 dark:text-purple-400',
    badgeColorClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the journal editor',
    requiresValue: false,
  },
  breathe: {
    value: 'breathe',
    label: 'Breathing Exercise',
    icon: Wind,
    badgeText: 'Breathe',
    color: 'indigo',
    gradientClass: 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40',
    iconColorClass: 'text-indigo-600 dark:text-indigo-400',
    badgeColorClass: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Link to a specific breathing exercise',
    requiresValue: true,
  },
  channel: {
    value: 'channel',
    label: 'Community Channel',
    icon: MessageCircle,
    badgeText: 'Check',
    color: 'blue',
    gradientClass: 'bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/40 dark:to-sky-900/40',
    iconColorClass: 'text-blue-600 dark:text-blue-400',
    badgeColorClass: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Link to a community feed channel',
    requiresValue: true,
  },
  program: {
    value: 'program',
    label: 'Program Page',
    icon: GraduationCap,
    badgeText: 'Learn',
    color: 'orange',
    gradientClass: 'bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40',
    iconColorClass: 'text-orange-600 dark:text-orange-400',
    badgeColorClass: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Link to a program/course',
    requiresValue: true,
  },
  planner: {
    value: 'planner',
    label: 'Planner',
    icon: Calendar,
    badgeText: 'Plan',
    color: 'yellow',
    gradientClass: 'bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40',
    iconColorClass: 'text-yellow-600 dark:text-yellow-400',
    badgeColorClass: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the planner',
    requiresValue: false,
  },
  inspire: {
    value: 'inspire',
    label: 'Inspire',
    icon: Sparkles,
    badgeText: 'Explore',
    color: 'pink',
    gradientClass: 'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40',
    iconColorClass: 'text-pink-600 dark:text-pink-400',
    badgeColorClass: 'bg-pink-500/20 text-pink-700 dark:text-pink-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the Inspire page',
    requiresValue: false,
  },
  route: {
    value: 'route',
    label: 'Custom Route',
    icon: Link,
    badgeText: 'Open',
    color: 'gray',
    gradientClass: 'bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/40 dark:to-slate-900/40',
    iconColorClass: 'text-gray-600 dark:text-gray-400',
    badgeColorClass: 'bg-gray-500/20 text-gray-700 dark:text-gray-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Link to any app page',
    requiresValue: true,
  },
  water: {
    value: 'water',
    label: 'Water Tracking',
    icon: Droplets,
    badgeText: 'Drink',
    color: 'sky',
    gradientClass: 'bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-sky-900/40 dark:to-cyan-900/40',
    iconColorClass: 'text-sky-600 dark:text-sky-400',
    badgeColorClass: 'bg-sky-500/20 text-sky-700 dark:text-sky-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the water tracking tool',
    requiresValue: false,
  },
  period: {
    value: 'period',
    label: 'Period Tracker',
    icon: Heart,
    badgeText: 'Log',
    color: 'pink',
    gradientClass: 'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40',
    iconColorClass: 'text-pink-600 dark:text-pink-400',
    badgeColorClass: 'bg-pink-500/20 text-pink-700 dark:text-pink-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the period tracker',
    requiresValue: false,
  },
  emotion: {
    value: 'emotion',
    label: 'Name Your Emotion',
    icon: HeartHandshake,
    badgeText: 'Name',
    color: 'violet',
    gradientClass: 'bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40',
    iconColorClass: 'text-violet-600 dark:text-violet-400',
    badgeColorClass: 'bg-violet-500/20 text-violet-700 dark:text-violet-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the emotion naming tool',
    requiresValue: false,
  },
  audio: {
    value: 'audio',
    label: 'Audio Track',
    icon: Headphones,
    badgeText: 'Listen',
    color: 'emerald',
    gradientClass: 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40',
    iconColorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeColorClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Link to a specific audio track',
    requiresValue: true,
  },
  mood: {
    value: 'mood',
    label: 'Mood Check-in',
    icon: Smile,
    badgeText: 'Check',
    color: 'yellow',
    gradientClass: 'bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40',
    iconColorClass: 'text-yellow-600 dark:text-yellow-400',
    badgeColorClass: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the mood check-in tool',
    requiresValue: false,
  },
  fasting: {
    value: 'fasting',
    label: 'Fasting Timer',
    icon: Timer,
    badgeText: 'Fast',
    color: 'rose',
    gradientClass: 'bg-gradient-to-br from-rose-100 to-orange-100 dark:from-rose-900/40 dark:to-orange-900/40',
    iconColorClass: 'text-rose-600 dark:text-rose-400',
    badgeColorClass: 'bg-rose-500/20 text-rose-700 dark:text-rose-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the fasting tracker',
    requiresValue: false,
  },
  weight: {
    value: 'weight',
    label: 'Weight Logging',
    icon: Scale,
    badgeText: 'Log',
    color: 'amber',
    gradientClass: 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40',
    iconColorClass: 'text-amber-600 dark:text-amber-400',
    badgeColorClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the weight logger',
    requiresValue: false,
  },
};

export const PRO_LINK_TYPES = Object.values(PRO_LINK_CONFIGS);

// Helper to get the navigation path for a Pro Task
export function getProTaskNavigationPath(linkType: ProLinkType, linkValue: string | null): string {
  switch (linkType) {
    case 'playlist':
      return `/app/player/playlist/${linkValue}`;
    case 'audio':
      return `/app/player/${linkValue}`;
    case 'journal':
      return '/app/journal/new';
    case 'breathe':
      return linkValue ? `/app/breathe?exercise=${linkValue}` : '/app/breathe';
    case 'water':
      return '/app/water';
    case 'period':
      return '/app/period';
    case 'emotion':
      return '/app/emotion?step=select';
    case 'channel':
      return `/app/channels?channel=${linkValue}`;
    case 'program':
      return `/app/course/${linkValue}`;
    case 'planner':
      return '/app/home';
    case 'inspire':
      return linkValue ? `/app/rituals/${linkValue}` : '/app/rituals';
    case 'route':
      return linkValue || '/app/home';
    case 'mood':
      return '/app/mood';
    case 'fasting':
      return '/app/fasting';
    case 'weight':
      return '/app/fasting?weight=1';
    default:
      return '/app/home';
  }
}
