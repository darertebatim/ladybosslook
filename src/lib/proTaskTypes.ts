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
  Scale,
  Brain,
  Video,
  Clapperboard,
  ListChecks,
  Clock,
  User,
  Library,
  Eye,
  Leaf,
  MonitorPlay,
  PlayCircle,
  FolderKanban
} from 'lucide-react';

// Pro Task link types and their configuration
export type ProLinkType = 'playlist' | 'journal' | 'channel' | 'program' | 'planner' | 'inspire' | 'route' | 'breathe' | 'water' | 'protein' | 'period' | 'emotion' | 'audio' | 'mood' | 'fasting' | 'weight' | 'reflection' | 'video' | 'video_playlist' | 'focus_timer' | 'routine' | 'myprograms' | 'myprofile' | 'presence' | 'tasksbank' | 'listen' | 'watch' | 'myroutines' | 'projects' | 'reading' | 'reading_item';

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
    label: 'Write Reflection',
    icon: BookOpen,
    badgeText: 'Write',
    color: 'purple',
    gradientClass: 'bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40',
    iconColorClass: 'text-purple-600 dark:text-purple-400',
    badgeColorClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the free-form reflection editor',
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
    label: 'Routines Templates',
    icon: Sparkles,
    badgeText: 'Browse',
    color: 'pink',
    gradientClass: 'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40',
    iconColorClass: 'text-pink-600 dark:text-pink-400',
    badgeColorClass: 'bg-pink-500/20 text-pink-700 dark:text-pink-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Link to a routine template',
    requiresValue: true,
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
  protein: {
    value: 'protein',
    label: 'Protein Tracking',
    icon: Droplets,
    badgeText: 'Log',
    color: 'orange',
    gradientClass: 'bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40',
    iconColorClass: 'text-orange-600 dark:text-orange-400',
    badgeColorClass: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the protein tracking tool',
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
    label: 'My Mood Check-in',
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
  reflection: {
    value: 'reflection',
    label: 'Reflections Journal',
    icon: Brain,
    badgeText: 'Reflect',
    color: 'teal',
    gradientClass: 'bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40',
    iconColorClass: 'text-teal-600 dark:text-teal-400',
    badgeColorClass: 'bg-teal-500/20 text-teal-700 dark:text-teal-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the reflections tool',
    requiresValue: true,
  },
  video: {
    value: 'video',
    label: 'Video',
    icon: Clapperboard,
    badgeText: 'Watch',
    color: 'sky',
    gradientClass: 'bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40',
    iconColorClass: 'text-sky-600 dark:text-sky-400',
    badgeColorClass: 'bg-sky-500/20 text-sky-700 dark:text-sky-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Link to a specific video',
    requiresValue: true,
  },
  video_playlist: {
    value: 'video_playlist',
    label: 'Video Playlist',
    icon: Video,
    badgeText: 'Watch',
    color: 'sky',
    gradientClass: 'bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-sky-900/40 dark:to-cyan-900/40',
    iconColorClass: 'text-sky-600 dark:text-sky-400',
    badgeColorClass: 'bg-sky-500/20 text-sky-700 dark:text-sky-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Link to a video playlist',
    requiresValue: true,
  },
  focus_timer: {
    value: 'focus_timer',
    label: 'Focus Timer',
    icon: Clock,
    badgeText: 'Focus',
    color: 'slate',
    gradientClass: 'bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-900/40 dark:to-gray-900/40',
    iconColorClass: 'text-slate-600 dark:text-slate-400',
    badgeColorClass: 'bg-slate-500/20 text-slate-700 dark:text-slate-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the focus timer',
    requiresValue: false,
  },
  routine: {
    value: 'routine',
    label: 'Routine Player',
    icon: ListChecks,
    badgeText: 'Play',
    color: 'emerald',
    gradientClass: 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40',
    iconColorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeColorClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open a routine in the player',
    requiresValue: true,
  },
  myprograms: {
    value: 'myprograms',
    label: 'My Programs',
    icon: Library,
    badgeText: 'View',
    color: 'orange',
    gradientClass: 'bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40',
    iconColorClass: 'text-orange-600 dark:text-orange-400',
    badgeColorClass: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open My Programs page',
    requiresValue: false,
  },
  myprofile: {
    value: 'myprofile',
    label: 'My Profile',
    icon: User,
    badgeText: 'View',
    color: 'slate',
    gradientClass: 'bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-900/40 dark:to-gray-900/40',
    iconColorClass: 'text-slate-600 dark:text-slate-400',
    badgeColorClass: 'bg-slate-500/20 text-slate-700 dark:text-slate-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open your profile',
    requiresValue: false,
  },
  presence: {
    value: 'presence',
    label: 'Presence',
    icon: Eye,
    badgeText: 'Start',
    color: 'cyan',
    gradientClass: 'bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/40',
    iconColorClass: 'text-cyan-600 dark:text-cyan-400',
    badgeColorClass: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the presence exercise',
    requiresValue: false,
  },
  tasksbank: {
    value: 'tasksbank',
    label: 'Self-Care Goals',
    icon: Leaf,
    badgeText: 'Browse',
    color: 'green',
    gradientClass: 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40',
    iconColorClass: 'text-green-600 dark:text-green-400',
    badgeColorClass: 'bg-green-500/20 text-green-700 dark:text-green-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Browse self-care habit library',
    requiresValue: false,
  },
  listen: {
    value: 'listen',
    label: 'Audio Player',
    icon: PlayCircle,
    badgeText: 'Listen',
    color: 'emerald',
    gradientClass: 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40',
    iconColorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeColorClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the audio player',
    requiresValue: false,
  },
  watch: {
    value: 'watch',
    label: 'Video Player',
    icon: MonitorPlay,
    badgeText: 'Watch',
    color: 'sky',
    gradientClass: 'bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40',
    iconColorClass: 'text-sky-600 dark:text-sky-400',
    badgeColorClass: 'bg-sky-500/20 text-sky-700 dark:text-sky-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open the video player',
    requiresValue: false,
  },
  myroutines: {
    value: 'myroutines',
    label: 'MyRoutine Player',
    icon: ListChecks,
    badgeText: 'Play',
    color: 'emerald',
    gradientClass: 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40',
    iconColorClass: 'text-emerald-600 dark:text-emerald-400',
    badgeColorClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open your routines player',
    requiresValue: false,
  },
  projects: {
    value: 'projects',
    label: 'Projects',
    icon: FolderKanban,
    badgeText: 'Open',
    color: 'amber',
    gradientClass: 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40',
    iconColorClass: 'text-amber-600 dark:text-amber-400',
    badgeColorClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open your projects board',
    requiresValue: false,
  },
  reading: {
    value: 'reading',
    label: 'Read & Learn',
    icon: BookOpen,
    badgeText: 'Read',
    color: 'purple',
    gradientClass: 'bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40',
    iconColorClass: 'text-purple-600 dark:text-purple-400',
    badgeColorClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Open reading library',
    requiresValue: false,
  },
  reading_item: {
    value: 'reading_item',
    label: 'Specific Reading',
    icon: BookOpen,
    badgeText: 'Read',
    color: 'purple',
    gradientClass: 'bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40',
    iconColorClass: 'text-purple-600 dark:text-purple-400',
    badgeColorClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
    buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
    description: 'Link to a specific lesson or story',
    requiresValue: true,
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
    case 'video':
      return linkValue ? `/app/watch/video/${linkValue}` : '/app/watch';
    case 'video_playlist':
      return linkValue ? `/app/watch/playlist/${linkValue}` : '/app/watch';
    case 'journal':
      return '/app/reflections/free-form';
    case 'breathe':
      return linkValue ? `/app/breathe?exercise=${linkValue}` : '/app/breathe';
    case 'water':
      return '/app/water';
    case 'protein':
      return '/app/protein';
    case 'period':
      return '/app/period';
    case 'emotion':
      return '/app/emotion?step=select';
    case 'channel':
      return `/app/channels?channel=${linkValue}`;
    case 'program':
      return `/app/myprograms/${linkValue}`;
    case 'planner':
      return '/app/home';
    case 'inspire':
      return linkValue ? `/app/routines/${linkValue}` : '/app/routines';
    case 'route':
      return linkValue || '/app/home';
    case 'mood':
      return '/app/mood';
    case 'fasting':
      return '/app/fasting';
    case 'weight':
      return '/app/fasting?weight=1';
    case 'reflection':
      return linkValue ? `/app/reflections/${linkValue}` : '/app/reflections';
    case 'focus_timer':
      return '/app/timer';
    case 'routine':
      return linkValue ? `/app/routineplayer?routine=${linkValue}` : '/app/routineplayer';
    case 'myprograms':
      return '/app/myprograms';
    case 'myprofile':
      return '/app/myprofile';
    case 'presence':
      return '/app/presence';
    case 'tasksbank':
      return '/app/tasksbank';
    case 'listen':
      return '/app/player';
    case 'watch':
      return '/app/watch';
    case 'myroutines':
      return '/app/routineplayer';
    case 'projects':
      return '/app/projects';
    case 'reading':
      return '/app/read';
    case 'reading_item':
      return linkValue ? `/app/read/${linkValue}` : '/app/read';
    default:
      return '/app/home';
  }
}
