/**
 * IndexedDB-backed React Query persister.
 *
 * Replaces the prior localStorage persister so that we can cache far more
 * data (~50MB+ vs ~5MB) and survive aggressive Safari/iOS storage pressure.
 *
 * Cache key is versioned (v1) so we can bust it on incompatible changes.
 */
import { get, set, del } from 'idb-keyval';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const CACHE_KEY = 'rilo-query-cache-v1';

/**
 * Query keys whose data must survive offline. Only queries whose first
 * queryKey segment startsWith one of these prefixes will be persisted.
 *
 * Add new prefixes here when wiring more screens for offline.
 */
export const OFFLINE_QUERY_PREFIXES = [
  // Planner & tasks
  'planner-all-tasks',
  'planner-tasks',
  'planner-completions',
  'planner-subtasks',
  'planner-streak',
  'planner-completed-dates',
  'carry-forward-completions',
  'today-tasks',
  'task-completions',
  'user-tasks',
  'task-bank',
  'admin-task-bank',

  // Routines
  'routines-bank',
  'routines-bank-popular',
  'routines-bank-featured',
  'routine-bank-detail',
  'user-routines',
  'user-routines-bank',
  'completed-routines',
  'routine-categories',
  'routine-progress',
  'user-routine-progress',

  // Profile / streak / subscription
  'profile',
  'user-profile',
  'nav-streak',
  'user-streak',
  'user-subscription',
  'subscription-status',

  // Mood, reflections, focus, breathing, trackers
  'mood-history',
  'mood-today',
  'reflections',
  'free-form-reflections',
  'focus-sessions',
  'breathing-sessions',
  'water-log',
  'water-today',
  'fasting-sessions',
  'fasting-current',
  'period-settings',
  'emotion-logs',

  // Tools / content shell
  'tools-config',
  'breathing-exercises',
  'new-home-data',
  'player-data',
  'courses-data',
] as const;

function shouldPersistKey(queryKey: unknown): boolean {
  const first = Array.isArray(queryKey) ? String(queryKey[0]) : String(queryKey);
  return OFFLINE_QUERY_PREFIXES.some((p) => first.startsWith(p));
}

/**
 * Used as both `dehydrateOptions.shouldDehydrateQuery` and as a filter inside
 * the persister's serialize step. Keeping a single source of truth.
 */
export const shouldDehydrateOfflineQuery = (query: { queryKey: unknown }) =>
  shouldPersistKey(query.queryKey);

const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await get<string>(key);
      return value ?? null;
    } catch (err) {
      console.warn('[IDBPersister] read failed:', err);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await set(key, value);
    } catch (err) {
      console.warn('[IDBPersister] write failed:', err);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await del(key);
    } catch (err) {
      console.warn('[IDBPersister] remove failed:', err);
    }
  },
};

export const idbPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: CACHE_KEY,
  throttleTime: 1500,
  serialize: (client) => {
    const filtered = {
      ...client,
      clientState: {
        ...client.clientState,
        // Drop mutations from persistence — we have our own offline mutation
        // queue (see offlineMutationQueue.ts). Persisting RQ mutations would
        // double-fire on rehydrate.
        mutations: [],
        queries: client.clientState.queries.filter((q) => shouldPersistKey(q.queryKey)),
      },
    };
    return JSON.stringify(filtered);
  },
  deserialize: (cached) => {
    try {
      return JSON.parse(cached);
    } catch (err) {
      console.error('[IDBPersister] deserialize failed, clearing cache:', err);
      void del(CACHE_KEY);
      return { timestamp: 0, buster: '', clientState: { mutations: [], queries: [] } };
    }
  },
});

/**
 * Manually clear the persisted query cache (used by full client reset).
 */
export async function clearOfflineQueryCache(): Promise<void> {
  try {
    await del(CACHE_KEY);
  } catch (err) {
    console.warn('[IDBPersister] clear failed:', err);
  }
}