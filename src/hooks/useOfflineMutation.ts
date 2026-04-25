/**
 * useOfflineMutation
 *
 * Drop-in replacement for useMutation that:
 *  1. Runs an optimistic update synchronously (UI changes instantly)
 *  2. If online — calls the executor directly, just like a normal mutation
 *  3. If offline OR the executor throws a network-shaped error — enqueues
 *     the operation in the persistent IndexedDB queue and returns success
 *     to the caller. The queue will sync when connectivity returns.
 *
 * Each mutation `type` must have a registered executor (see
 * registerExecutor). Phase 4 wires concrete executors per feature.
 */
import { useCallback } from 'react';
import { enqueueMutation } from '@/lib/offline/offlineMutationQueue';
import { getIsOnline } from '@/hooks/useNetworkStatus';

interface UseOfflineMutationOptions<TPayload> {
  /** Stable executor key (must match registerExecutor). */
  type: string;
  /** Optional optimistic update — runs synchronously before queueing. */
  onOptimistic?: (payload: TPayload) => void;
  /**
   * Optional direct-execute fast path used when online. If omitted, all
   * mutations route through the queue (which still drains immediately
   * when online — adds ~1 tick of latency).
   */
  fastPath?: (payload: TPayload) => Promise<void>;
  /** Called after a successful execution OR successful enqueue. */
  onSuccess?: (payload: TPayload, queued: boolean) => void;
  /** Called only on synchronous failures (e.g., optimistic threw). */
  onError?: (err: unknown, payload: TPayload) => void;
}

function looksLikeNetworkError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('network request failed') ||
    msg.includes('timeout') ||
    msg.includes('typeerror')
  );
}

export function useOfflineMutation<TPayload>(opts: UseOfflineMutationOptions<TPayload>) {
  const mutate = useCallback(
    async (payload: TPayload): Promise<{ queued: boolean }> => {
      // 1. Apply optimistic UI update
      try {
        opts.onOptimistic?.(payload);
      } catch (err) {
        opts.onError?.(err, payload);
        throw err;
      }

      // 2. Try fast path if online
      if (getIsOnline() && opts.fastPath) {
        try {
          await opts.fastPath(payload);
          opts.onSuccess?.(payload, false);
          return { queued: false };
        } catch (err) {
          if (!looksLikeNetworkError(err)) {
            // Non-network error — surface it. Optimistic update will need
            // to be reconciled by caller (typically via query invalidation
            // in a refetch).
            opts.onError?.(err, payload);
            throw err;
          }
          // Fall through to enqueue for retry
        }
      }

      // 3. Enqueue for background sync
      await enqueueMutation(opts.type, payload);
      opts.onSuccess?.(payload, true);
      return { queued: true };
    },
    [opts],
  );

  return { mutate };
}