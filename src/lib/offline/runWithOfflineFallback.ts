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
  // Supabase / PostgREST sometimes returns errors with a "code" field too —
  // treat the generic ones that mean "couldn't reach the server" as network.
  const code = (err as { code?: string } | null | undefined)?.code?.toString?.().toLowerCase?.() ?? '';
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('network request failed') ||
    msg.includes('timeout') ||
    msg.includes('aborted') ||
    msg.includes('fetch failed') ||
    code === 'pgrst000' ||
    code === 'enotfound' ||
    code === 'econnreset' ||
    code === 'etimedout'
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
  /** Safety timeout in ms before treating the call as offline. Default 8s. */
  timeoutMs?: number;
}): Promise<OfflineFallbackResult<TData>> {
  if (!getIsOnline()) {
    await enqueueMutation(opts.type, opts.payload);
    return { queued: true, data: null };
  }

  const timeoutMs = opts.timeoutMs ?? 8000;

  try {
    // Race the write against a timeout — on iOS in airplane mode the
    // network plugin can briefly still report "online" and supabase-js
    // can hang without throwing. After timeoutMs we treat it as offline
    // and queue, so the UI doesn't get stuck on a pending button.
    const data = await Promise.race<TData>([
      opts.fastPath(),
      new Promise<TData>((_, reject) =>
        setTimeout(() => reject(new Error('offline-fallback-timeout')), timeoutMs)
      ),
    ]);
    return { queued: false, data };
  } catch (err) {
    const timedOut = err instanceof Error && err.message === 'offline-fallback-timeout';
    if (timedOut || isNetworkError(err)) {
      await enqueueMutation(opts.type, opts.payload);
      return { queued: true, data: null };
    }
    throw err;
  }
}