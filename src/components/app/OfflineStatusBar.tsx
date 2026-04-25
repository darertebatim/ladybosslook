/**
 * OfflineStatusBar
 *
 * Tiny pill that appears at the very top of the screen when:
 *  - the device is offline (amber "You're offline — changes will sync"), OR
 *  - the device just came back online and there are still queued writes
 *    syncing (emerald "Syncing N change(s)…"), OR
 *  - the queue just drained successfully (brief "Synced N change(s)" toast).
 *
 * Kept intentionally lightweight: one fixed bar, respects safe-area inset,
 * no layout shift below it (uses pointer-events-none for the wrapper, the
 * pill is a small chip).
 */
import { useEffect, useRef, useState } from 'react';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { onQueueChange, type QueuedMutation } from '@/lib/offline/offlineMutationQueue';
import { toast } from 'sonner';

export function OfflineStatusBar() {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const prevPendingRef = useRef(0);
  const wasOfflineRef = useRef(!isOnline);

  // Track queue size for "syncing N…" pill + "Synced N" toast on drain.
  useEffect(() => {
    const unsub = onQueueChange((q: QueuedMutation[]) => {
      const pending = q.filter((m) => m.status !== 'failed').length;
      const prev = prevPendingRef.current;
      // Toast only when we drop to 0 from >0 AND we are online
      if (prev > 0 && pending === 0 && isOnlineRef.current) {
        toast.success(`Synced ${prev} change${prev === 1 ? '' : 's'}`, { duration: 2200 });
      }
      prevPendingRef.current = pending;
      setPendingCount(pending);
    });
    return unsub;
  }, []);

  // Mirror isOnline into a ref so the queue listener (which has stale closure)
  // can read fresh value without re-subscribing.
  const isOnlineRef = useRef(isOnline);
  useEffect(() => {
    isOnlineRef.current = isOnline;
    if (!isOnline) wasOfflineRef.current = true;
  }, [isOnline]);

  // Decide what to render
  const showOffline = !isOnline;
  const showSyncing = isOnline && pendingCount > 0;

  if (!showOffline && !showSyncing) return null;

  const label = showOffline
    ? "You're offline — changes will sync"
    : `Syncing ${pendingCount} change${pendingCount === 1 ? '' : 's'}…`;

  const Icon = showOffline ? CloudOff : RefreshCw;

  return (
    <div
      className="fixed left-0 right-0 z-[60] flex justify-center pointer-events-none"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 6px)' }}
      aria-live="polite"
    >
      <div
        className={[
          'pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full',
          'text-xs font-medium shadow-md backdrop-blur-md border',
          showOffline
            ? 'bg-amber-500/95 text-white border-amber-600/40'
            : 'bg-emerald-500/95 text-white border-emerald-600/40',
        ].join(' ')}
      >
        <Icon className={`h-3.5 w-3.5 ${showSyncing ? 'animate-spin' : ''}`} />
        <span>{label}</span>
      </div>
    </div>
  );
}

// Unused export just to keep tree-shaking happy if imported as default elsewhere
export default OfflineStatusBar;

// Reference to avoid linter warning about unused CheckCircle2 import for future use
void CheckCircle2;