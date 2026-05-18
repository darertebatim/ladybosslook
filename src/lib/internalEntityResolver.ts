import { getInternalPath } from './navigation-utils';

export type EntityType =
  | 'playlist'
  | 'audio'
  | 'video_playlist'
  | 'video'
  | 'routine'
  | 'program'
  | 'reading'
  | 'channel'
  | 'quiz'
  | 'channel_post'
  | 'tool';

export interface InternalEntity {
  type: EntityType;
  id: string;
  /** Tool slug like "breathe", "mood", "reflections" — only set when type=tool */
  toolKey?: string;
  /** Original href to fall back to when navigating */
  href: string;
}

const TOOL_PATHS: Record<string, string> = {
  breathe: 'Breathe',
  mood: 'Mood Check-in',
  emotion: 'Emotions',
  fasting: 'Fasting',
  water: 'Water',
  period: 'Period',
  reflections: 'Reflections',
  timer: 'Focus Timer',
  presence: 'Presence',
  tasksbank: 'Self-Care Tasks',
  projects: 'Projects',
  journal: 'Journal',
  quizzes: 'Quizzes',
  read: 'Reading',
  routines: 'Routines',
  myprograms: 'My Programs',
  academy: 'Academy',
  player: 'Listen',
  watch: 'Watch',
  channels: 'Channels',
  ai: 'AI Coach',
  friends: 'Friends',
  myprofile: 'My Profile',
};

/**
 * Parse an internal app URL or path into a typed entity reference.
 * Returns null if the URL is not a recognized internal entity.
 */
export function resolveInternalEntity(input: string): InternalEntity | null {
  let path = input.startsWith('/app') ? input : getInternalPath(input) || '';
  if (!path.startsWith('/app')) return null;

  // Strip query/hash for matching
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search.split('#')[0]);
  const segs = pathname.split('/').filter(Boolean); // ['app', ...]

  // /app/player/playlist/:id
  if (segs[1] === 'player' && segs[2] === 'playlist' && segs[3]) {
    return { type: 'playlist', id: segs[3], href: path };
  }
  // /app/player/:audioId
  if (segs[1] === 'player' && segs[2] && segs[2] !== 'playlist') {
    return { type: 'audio', id: segs[2], href: path };
  }
  // /app/watch/playlist/:id
  if (segs[1] === 'watch' && segs[2] === 'playlist' && segs[3]) {
    return { type: 'video_playlist', id: segs[3], href: path };
  }
  // /app/watch/video/:id
  if (segs[1] === 'watch' && segs[2] === 'video' && segs[3]) {
    return { type: 'video', id: segs[3], href: path };
  }
  // /app/routineplayer?routine=:id
  if (segs[1] === 'routineplayer') {
    const rid = params.get('routine');
    if (rid) return { type: 'routine', id: rid, href: path };
  }
  // /app/routines/:planId
  if (segs[1] === 'routines' && segs[2] && segs[2] !== 'category') {
    return { type: 'routine', id: segs[2], href: path };
  }
  // /app/myprograms/:slug
  if (segs[1] === 'myprograms' && segs[2]) {
    return { type: 'program', id: segs[2], href: path };
  }
  // /app/read/:id
  if (segs[1] === 'read' && segs[2]) {
    return { type: 'reading', id: segs[2], href: path };
  }
  // /app/channels/post/:postId
  if (segs[1] === 'channels' && segs[2] === 'post' && segs[3]) {
    return { type: 'channel_post', id: segs[3], href: path };
  }
  // /app/channels/:slug
  if (segs[1] === 'channels' && segs[2]) {
    return { type: 'channel', id: segs[2], href: path };
  }
  // /app/quiz/:slug
  if (segs[1] === 'quiz' && segs[2]) {
    return { type: 'quiz', id: segs[2], href: path };
  }
  // Tools: /app/breathe, /app/mood, etc. — single segment matches a known tool
  if (segs[1] && segs.length <= 3 && TOOL_PATHS[segs[1]]) {
    return { type: 'tool', id: segs[1], toolKey: segs[1], href: path };
  }
  return null;
}

export function getToolLabel(key: string): string {
  return TOOL_PATHS[key] || key;
}

/**
 * Extract internal entity URLs that appear on their own line/paragraph in markdown.
 * Returns the URL strings (in order) and a "stripped" version of the markdown
 * with those standalone URL lines removed (so they can be rendered as cards
 * separately).
 */
export function extractStandaloneInternalUrls(md: string): {
  urls: string[];
  stripped: string;
} {
  const urls: string[] = [];
  const urlRegex = /^\s*(https?:\/\/\S+|\/app\/\S+)\s*$/;
  const outLines: string[] = [];
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(urlRegex);
    if (m && resolveInternalEntity(m[1])) {
      urls.push(m[1]);
    } else {
      outLines.push(line);
    }
  }
  // Collapse multiple blank lines from removals
  const stripped = outLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return { urls, stripped };
}