import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Bell, 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  MessageSquare, 
  TrendingUp,
  Play,
  RefreshCw,
  ExternalLink,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PNSchedule {
  id: string;
  name: string;
  function_name: string;
  schedule: string;
  is_active: boolean;
  description: string | null;
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_count: number;
}

interface PNLog {
  id: string;
  function_name: string;
  sent_count: number;
  failed_count: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'send-drip-notifications': <BookOpen className="h-5 w-5" />,
  'send-session-reminders': <Calendar className="h-5 w-5" />,
  'send-task-reminders': <CheckSquare className="h-5 w-5" />,
  'send-journal-reminders': <MessageSquare className="h-5 w-5" />,
  'send-feed-post-notifications': <Bell className="h-5 w-5" />,
  'send-weekly-summary': <TrendingUp className="h-5 w-5" />,
};

const SCHEDULE_LABELS: Record<string, string> = {
  '0 6 * * *': 'Daily at 6 AM UTC',
  '0 * * * *': 'Hourly (timezone-aware)',
  '*/5 * * * *': 'Every 5 minutes',
  '*/15 * * * *': 'Every 15 minutes',
  '0 9 * * 1': 'Mondays at 9 AM (user timezone)',
  'trigger': 'On-demand (triggered)',
};

export function PushNotificationCenter() {
  const queryClient = useQueryClient();
  const [runningFunctions, setRunningFunctions] = useState<Set<string>>(new Set());

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['pn-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('push_notification_schedules')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as PNSchedule[];
    },
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['pn-schedule-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pn_schedule_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as PNLog[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('push_notification_schedules')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pn-schedules'] });
      toast.success('Schedule updated');
    },
    onError: (error) => {
      toast.error('Failed to update schedule: ' + error.message);
    },
  });

  const runNow = async (functionName: string) => {
    setRunningFunctions(prev => new Set(prev).add(functionName));
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error) throw error;
      
      toast.success(`${functionName} completed`, {
        description: `Sent: ${data?.sent || 0}, Failed: ${data?.failed || 0}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['pn-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['pn-schedule-logs'] });
    } catch (error: any) {
      toast.error(`Failed to run ${functionName}: ${error.message}`);
    } finally {
      setRunningFunctions(prev => {
        const next = new Set(prev);
        next.delete(functionName);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Partial</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const projectId = 'mnukhzjcvbwpvktxqlej';

  if (schedulesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schedule Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schedules?.map((schedule) => (
          <Card key={schedule.id} className={!schedule.is_active ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {ICON_MAP[schedule.function_name] || <Bell className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{schedule.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {SCHEDULE_LABELS[schedule.schedule] || schedule.schedule}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={schedule.is_active}
                  onCheckedChange={(checked) => 
                    toggleMutation.mutate({ id: schedule.id, is_active: checked })
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {schedule.description}
              </p>
              
              {schedule.last_run_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last run: {formatDistanceToNow(new Date(schedule.last_run_at), { addSuffix: true })}</span>
                  {getStatusBadge(schedule.last_run_status)}
                  {schedule.last_run_count > 0 && (
                    <span className="text-primary font-medium">({schedule.last_run_count} sent)</span>
                  )}
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runNow(schedule.function_name)}
                  disabled={runningFunctions.has(schedule.function_name) || !schedule.is_active}
                  className="flex-1"
                >
                  {runningFunctions.has(schedule.function_name) ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-1" />
                  )}
                  Run Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <a
                    href={`https://supabase.com/dashboard/project/${projectId}/functions/${schedule.function_name}/logs`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Runs</CardTitle>
              <CardDescription>History of push notification jobs</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['pn-schedule-logs'] })}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center p-4">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Function</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {ICON_MAP[log.function_name] || <Bell className="h-4 w-4" />}
                        <span className="text-sm">{log.function_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log.status)}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {log.sent_count}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {log.failed_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>No logs yet. Run a notification job to see results here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
