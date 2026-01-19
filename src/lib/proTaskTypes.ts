import { 
  Music, 
  BookOpen, 
  MessageCircle, 
  GraduationCap, 
  Calendar, 
  Sparkles, 
  Link 
} from 'lucide-react';

// Pro Task link types and their configuration
export type ProLinkType = 'playlist' | 'journal' | 'channel' | 'program' | 'planner' | 'inspire' | 'route';

export interface ProLinkConfig {
  value: ProLinkType;
  label: string;
  icon: typeof Music;
  badgeText: string;
  color: string;
  gradientClass: string;
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
    description: 'Open the journal editor',
    requiresValue: false,
  },
  channel: {
    value: 'channel',
    label: 'Community Channel',
    icon: MessageCircle,
    badgeText: 'Check',
    color: 'blue',
    gradientClass: 'bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/40 dark:to-sky-900/40',
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
    description: 'Link to any app page',
    requiresValue: true,
  },
};

export const PRO_LINK_TYPES = Object.values(PRO_LINK_CONFIGS);

// Helper to get the navigation path for a Pro Task
export function getProTaskNavigationPath(linkType: ProLinkType, linkValue: string | null): string {
  switch (linkType) {
    case 'playlist':
      return `/app/player/playlist/${linkValue}`;
    case 'journal':
      return '/app/journal/new';
    case 'channel':
      return `/app/feed?channel=${linkValue}`;
    case 'program':
      return `/app/course/${linkValue}`;
    case 'planner':
      return '/app/planner';
    case 'inspire':
      return linkValue ? `/app/inspire/${linkValue}` : '/app/inspire';
    case 'route':
      return linkValue || '/app/home';
    default:
      return '/app/home';
  }
}
