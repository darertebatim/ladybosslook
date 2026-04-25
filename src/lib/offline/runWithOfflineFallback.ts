/**
 * Tiny helper that wraps a Supabase write with the standard offline pattern:
 *
 *   1. If offline → enqueue the mutation and return.
 *   2. If online  → try the direct write.
 *   3. If the write fails with a network-shaped error → enqueue and return
 *      (caller treats it as success; queue will retry).
 *   4. Any other error → rethrow so React Query / UI can surface it.
 *
 * Use from inside a `useMutation` mutationFn. Keeps the four-step boilerplate
 * out of every hook so we don't drift between features.
 */
import { getIsOnline } from '@/hooks/useNetworkStatus';
import { enqueueMutation } from '@/lib/offline/offlineMutationQueue';

function isNetworkError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('network request failed') ||
    msg.includes('timeout')
  );
}

export interface OfflineFallbackResult<T> {
  /** True if the work was queued for later sync rather than executed now. */
  queued: boolean;
  /** Direct-write result if online + success, else null. */
  data: T | null;
}

export async function runWithOfflineFallback<TPayload, TData>(opts: {
  type: string;
  payload: TPayload;
  /** The direct write — only called when online. */
  fastPath: () => Promise<TData>;
}): Promise<OfflineFallbackResult<TData>> {
  if (!getIsOnline()) {
    await enqueueMutation(opts.type, opts.payload);
    return { queued: true, data: null };
  }

  try {
    const data = await opts.fastPath();
    return { queued: false, data };
  } catch (err) {
    if (isNetworkError(err)) {
      await enqueueMutation(opts.type, opts.payload);
      return { queued: true, data: null };
    }
    throw err;
  }
}