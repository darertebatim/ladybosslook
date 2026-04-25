/**
 * SyncStatusCard
 *
 * Surfaces the offline mutation queue inside Profile so users can see if
 * any of their actions (task toggles, reflections, mood logs, etc.) are
 * still queued or have failed. Provides a manual "Retry now" button.
 *
 * Hidden entirely when there's nothing pending and nothing failed — we
 * don't want to clutter the profile in the happy path.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CloudOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  onQueueChange,
  retryFailedMutations,
  getQueueSnapshot,
  type QueuedMutation,
} from '@/lib/offline/offlineMutationQueue';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { toast } from 'sonner';

export function SyncStatusCard() {
  const { isOnline } = useNetworkStatus();
  const [queue, setQueue] = useState<QueuedMutation[]>([]);

  useEffect(() => {
    void getQueueSnapshot().then(setQueue);
    const unsub = onQueueChange(setQueue);
    return unsub;
  }, []);

  const pending = queue.filter((m) => m.status !== 'failed').length;
  const failed = queue.filter((m) => m.status === 'failed').length;

  if (pending === 0 && failed === 0) return null;

  const handleRetry = async () => {
    await retryFailedMutations();
    toast.success('Retrying queued changes…');
  };

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-card">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
            {failed > 0 ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : !isOnline ? (
              <CloudOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <RefreshCw className="h-4 w-4 text-primary animate-spin" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {failed > 0
                ? `${failed} change${failed === 1 ? '' : 's'} couldn't sync`
                : !isOnline
                  ? `${pending} change${pending === 1 ? '' : 's'} waiting for connection`
                  : `Syncing ${pending} change${pending === 1 ? '' : 's'}…`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {failed > 0
                ? 'Tap retry to try sending them again.'
                : !isOnline
                  ? "We'll send them automatically once you're back online."
                  : 'Hang tight — this usually takes a moment.'}
            </p>
          </div>
        </div>

        {failed > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleRetry}
            disabled={!isOnline}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Retry sync
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Reserved for future "All synced" state confirmation
void CheckCircle2;