import type { ProLinkType } from '@/lib/proTaskTypes';

export const PRO_LINK_EMOJIS: Record<ProLinkType, string> = {
  playlist: '🎵',
  journal: '📝',
  channel: '💬',
  program: '🎓',
  planner: '📅',
  inspire: '📋',
  route: '🔗',
  breathe: '🌬️',
  water: '💧',
  protein: '🍗',
  period: '🩸',
  emotion: '💜',
  audio: '🎧',
  mood: '😊',
  fasting: '⏱️',
  weight: '⚖️',
  reflection: '✏️',
  video: '🎬',
  video_playlist: '📺',
  focus_timer: '⏲️',
  routine: '🚀',
  myprograms: '🎓',
  myprofile: '👤',
  presence: '🔥',
  tasksbank: '🌿',
  listen: '🎧',
  watch: '📺',
  myroutines: '📅',
  projects: '📁',
  reading: '📖',
  reading_item: '📖',
};

export function getProLinkEmoji(type: ProLinkType) {
  return PRO_LINK_EMOJIS[type];
}
