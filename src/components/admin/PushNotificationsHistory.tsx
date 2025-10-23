import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, RefreshCw, ExternalLink } from 'lucide-react';

interface PushLog {
  id: string;
  title: string;
  message: string;
  destination_url: string | null;
  target_type: string;
  target_course: string | null;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export function PushNotificationsHistory() {
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('push_notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching push logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch push notification history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications History
            </CardTitle>
            <CardDescription>
              Latest 50 push notifications sent to users
            </CardDescription>
          </div>
          <Button onClick={fetchLogs} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading history...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No push notifications sent yet
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <h4 className="font-semibold">{log.title}</h4>
                    {log.destination_url && (
                      <Badge variant="outline" className="gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Link
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{log.message}</p>
                  {log.destination_url && (
                    <p className="text-xs text-muted-foreground">
                      Destination: {log.destination_url}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Target: {log.target_type === 'all' ? 'All Students' : log.target_course}
                    </span>
                    <span>•</span>
                    <span className="text-green-600">
                      ✓ {log.sent_count} sent
                    </span>
                    {log.failed_count > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-red-600">
                          ✗ {log.failed_count} failed
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
