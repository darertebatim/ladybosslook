/**
 * Offline Mutation Queue
 *
 * Persists user-initiated writes to IndexedDB so they survive offline,
 * app kill, and reboot. Each mutation has a registered "executor" that
 * knows how to send it to Supabase. When the device is online the queue
 * is drained in FIFO order with exponential backoff on failure.
 *
 * Design rules:
 *  - Last-write-wins by client timestamp (simple, predictable).
 *  - Mutations are deleted only after the server confirms write.
 *  - Failed-after-N-retries → mutation marked `failed` and a single toast
 *    is surfaced via the failure listener (UX: "Only show when something
 *    fails", per the user's product decision).
 *  - Phase 3 = infrastructure. Phase 4 wires concrete executors per feature.
 */
import { get, set } from 'idb-keyval';
import { getIsOnline, subscribeNetworkStatus } from '@/hooks/useNetworkStatus';

const QUEUE_KEY = 'rilo-offline-mutation-queue-v1';
const MAX_ATTEMPTS = 5;
/** Backoff schedule per attempt index (ms). After this we mark as failed. */
const BACKOFF_MS = [0, 1_000, 4_000, 15_000, 60_000];

export type QueuedMutationStatus = 'pending' | 'in_flight' | 'failed';

export interface QueuedMutation<TPayload = unknown> {
  /** Stable client-generated UUID. */
  id: string;
  /** Executor key (must match a registered executor). */
  type: string;
  /** JSON-serialisable payload passed to executor. */
  payload: TPayload;
  /** Client timestamp at enqueue (ms since epoch). Used for last-write-wins. */
  clientTs: number;
  attempts: number;
  status: QueuedMutationStatus;
  /** Last error message, if any. */
  lastError?: string;
}

export type MutationExecutor<TPayload = unknown> = (
  payload: TPayload,
  meta: { clientTs: number; attempt: number },
) => Promise<void>;

const executors = new Map<string, MutationExecutor<any>>();
const failureListeners = new Set<(m: QueuedMutation) => void>();
const queueChangeListeners = new Set<(queue: QueuedMutation[]) => void>();

let memoryQueue: QueuedMutation[] | null = null;
let drainScheduled = false;
let draining = false;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

async function loadQueue(): Promise<QueuedMutation[]> {
  if (memoryQueue) return memoryQueue;
  try {
    const raw = await get<QueuedMutation[]>(QUEUE_KEY);
    memoryQueue = Array.isArray(raw) ? raw : [];
  } catch (err) {
    console.warn('[OfflineQueue] load failed, starting empty:', err);
    memoryQueue = [];
  }
  return memoryQueue;
}

async function saveQueue(): Promise<void> {
  if (!memoryQueue) return;
  try {
    await set(QUEUE_KEY, memoryQueue);
  } catch (err) {
    console.warn('[OfflineQueue] save failed:', err);
  }
  notifyQueueChange();
}

function notifyQueueChange() {
  if (!memoryQueue) return;
  const snapshot = [...memoryQueue];
  queueChangeListeners.forEach((cb) => {
    try { cb(snapshot); } catch (err) { console.warn('[OfflineQueue] listener error:', err); }
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function registerExecutor<TPayload>(
  type: string,
  executor: MutationExecutor<TPayload>,
): void {
  executors.set(type, executor as MutationExecutor<any>);
}

export function onMutationFailure(cb: (m: QueuedMutation) => void): () => void {
  failureListeners.add(cb);
  return () => failureListeners.delete(cb);
}

export function onQueueChange(cb: (queue: QueuedMutation[]) => void): () => void {
  queueChangeListeners.add(cb);
  // Fire immediately with current state if loaded
  if (memoryQueue) cb([...memoryQueue]);
  return () => queueChangeListeners.delete(cb);
}

export async function getQueueSnapshot(): Promise<QueuedMutation[]> {
  return [...(await loadQueue())];
}

function genId(): string {
  // crypto.randomUUID is widely supported on iOS 14+/Android 8+/all evergreen
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Enqueue a mutation. Returns the queued record id.
 *
 * If online, schedules an immediate drain attempt — so when there's network
 * the user sees no perceptible delay vs a normal mutation.
 */
export async function enqueueMutation<TPayload>(
  type: string,
  payload: TPayload,
): Promise<string> {
  const queue = await loadQueue();
  const record: QueuedMutation<TPayload> = {
    id: genId(),
    type,
    payload,
    clientTs: Date.now(),
    attempts: 0,
    status: 'pending',
  };
  queue.push(record);
  await saveQueue();
  scheduleDrain(0);
  return record.id;
}

/** Manually retry all failed mutations. */
export async function retryFailedMutations(): Promise<void> {
  const queue = await loadQueue();
  let changed = false;
  for (const m of queue) {
    if (m.status === 'failed') {
      m.status = 'pending';
      m.attempts = 0;
      m.lastError = undefined;
      changed = true;
    }
  }
  if (changed) {
    await saveQueue();
    scheduleDrain(0);
  }
}

/** Drop a specific mutation (e.g. user dismisses persistent failure). */
export async function discardMutation(id: string): Promise<void> {
  const queue = await loadQueue();
  const idx = queue.findIndex((m) => m.id === id);
  if (idx >= 0) {
    queue.splice(idx, 1);
    await saveQueue();
  }
}

// ---------------------------------------------------------------------------
// Drain loop
// ---------------------------------------------------------------------------

function scheduleDrain(delayMs: number): void {
  if (drainScheduled) return;
  drainScheduled = true;
  setTimeout(() => {
    drainScheduled = false;
    void drainQueue();
  }, delayMs);
}

async function drainQueue(): Promise<void> {
  if (draining) return;
  if (!getIsOnline()) return;
  draining = true;

  try {
    const queue = await loadQueue();
    // FIFO — process pending mutations in insertion order
    for (const m of queue) {
      if (m.status !== 'pending') continue;
      if (!getIsOnline()) break;

      const executor = executors.get(m.type);
      if (!executor) {
        // Executor not yet registered (e.g. lazy module). Try again next drain.
        console.warn('[OfflineQueue] no executor for type:', m.type);
        continue;
      }

      m.status = 'in_flight';
      m.attempts += 1;
      await saveQueue();

      try {
        await executor(m.payload, { clientTs: m.clientTs, attempt: m.attempts });
        // Success — remove from queue
        const idx = queue.findIndex((q) => q.id === m.id);
        if (idx >= 0) queue.splice(idx, 1);
        await saveQueue();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        m.lastError = msg;
        if (m.attempts >= MAX_ATTEMPTS) {
          m.status = 'failed';
          await saveQueue();
          failureListeners.forEach((cb) => {
            try { cb({ ...m }); } catch (e) { console.warn('[OfflineQueue] failure cb:', e); }
          });
        } else {
          m.status = 'pending';
          await saveQueue();
          // Schedule a retry; break so we don't hot-loop
          const delay = BACKOFF_MS[Math.min(m.attempts, BACKOFF_MS.length - 1)];
          scheduleDrain(delay);
          break;
        }
      }
    }
  } finally {
    draining = false;
  }
}

// ---------------------------------------------------------------------------
// Lifecycle wiring
// ---------------------------------------------------------------------------

let initialized = false;

/** Idempotent — call once at app start. */
export function initOfflineMutationQueue(): void {
  if (initialized) return;
  initialized = true;

  // Try a drain on load
  void loadQueue().then(() => scheduleDrain(500));

  // Drain whenever we come back online
  subscribeNetworkStatus((s) => {
    if (s.isOnline) scheduleDrain(0);
  });

  // Drain on focus / visibility change (catches "phone unlocked" state)
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => scheduleDrain(0));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') scheduleDrain(0);
    });
  }
}