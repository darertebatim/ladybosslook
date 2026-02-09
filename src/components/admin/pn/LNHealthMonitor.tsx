import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, TrendingDown, Activity } from 'lucide-react';

/**
 * Local Notification Health Monitor
 * 
 * Tracks if local notification system is working across users.
 * Alerts admin if delivery rates drop significantly.
 */

interface HealthMetrics {
  last24h: {
    scheduled: number;
    tapped: number;
    tapRate: number;
  };
  last7d: {
    scheduled: number;
    tapped: number;
    tapRate: number;
  };
  activeUsers: number;
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
}

export function LNHealthMonitor() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['ln-health-metrics'],
    queryFn: async (): Promise<HealthMetrics> => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get 24h stats
      const { data: events24h } = await supabase
        .from('local_notification_events')
        .select('event')
        .gte('created_at', yesterday.toISOString());

      // Get 7d stats
      const { data: events7d } = await supabase
        .from('local_notification_events')
        .select('event')
        .gte('created_at', lastWeek.toISOString());

      // Count unique users with events in last 7 days
      const { count: activeUsers } = await supabase
        .from('local_notification_events')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', lastWeek.toISOString());

      const count24h = {
        scheduled: events24h?.filter(e => e.event === 'scheduled').length || 0,
        tapped: events24h?.filter(e => e.event === 'tapped').length || 0,
      };

      const count7d = {
        scheduled: events7d?.filter(e => e.event === 'scheduled').length || 0,
        tapped: events7d?.filter(e => e.event === 'tapped').length || 0,
      };

      const tapRate24h = count24h.scheduled > 0 ? (count24h.tapped / count24h.scheduled) * 100 : 0;
      const tapRate7d = count7d.scheduled > 0 ? (count7d.tapped / count7d.scheduled) * 100 : 0;

      // Determine health status
      const issues: string[] = [];
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';

      // Check for issues
      if (count24h.scheduled === 0 && (activeUsers || 0) > 10) {
        issues.push('No notifications scheduled in 24h despite active users');
        status = 'critical';
      } else if (tapRate24h < 5 && count24h.scheduled > 20) {
        issues.push('Very low tap rate (<5%) - notifications may not be delivering');
        status = 'warning';
      }

      if (tapRate7d < tapRate24h * 0.5 && count7d.scheduled > 100) {
        issues.push('Tap rate dropped significantly from weekly average');
        status = status === 'critical' ? 'critical' : 'warning';
      }

      return {
        last24h: { scheduled: count24h.scheduled, tapped: count24h.tapped, tapRate: tapRate24h },
        last7d: { scheduled: count7d.scheduled, tapped: count7d.tapped, tapRate: tapRate7d },
        activeUsers: activeUsers || 0,
        status,
        issues,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4 animate-pulse" />
            Loading health metrics...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const StatusIcon = metrics.status === 'healthy' 
    ? CheckCircle 
    : metrics.status === 'warning' 
      ? AlertTriangle 
      : TrendingDown;

  const statusColor = metrics.status === 'healthy' 
    ? 'text-green-500' 
    : metrics.status === 'warning' 
      ? 'text-yellow-500' 
      : 'text-destructive';

  return (
    <Card className={metrics.status !== 'healthy' ? 'border-yellow-500' : ''}>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${statusColor}`} />
          Local Notification Health
          <Badge 
            variant={metrics.status === 'healthy' ? 'default' : 'destructive'}
            className="ml-auto"
          >
            {metrics.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Issues */}
        {metrics.issues.length > 0 && (
          <div className="bg-destructive/10 rounded-lg p-3 space-y-1">
            {metrics.issues.map((issue, idx) => (
              <div key={idx} className="text-sm text-destructive flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {issue}
              </div>
            ))}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{metrics.last24h.scheduled}</div>
            <div className="text-xs text-muted-foreground">Scheduled (24h)</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{metrics.last24h.tapped}</div>
            <div className="text-xs text-muted-foreground">Tapped (24h)</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{metrics.last24h.tapRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Tap Rate</div>
          </div>
        </div>

        {/* 7-day comparison */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <span className="font-medium">7-day:</span> {metrics.last7d.scheduled} scheduled, {metrics.last7d.tapped} tapped ({metrics.last7d.tapRate.toFixed(1)}% tap rate)
          <span className="ml-2">• {metrics.activeUsers} active users</span>
        </div>

        {/* Recommendation */}
        {metrics.status === 'critical' && (
          <div className="bg-muted rounded-lg p-3 text-sm">
            <strong>Recommendation:</strong> Consider switching to server-side push notifications as primary delivery method. Local notifications may not be functioning correctly.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
