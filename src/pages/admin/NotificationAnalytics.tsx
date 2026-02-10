import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing, MousePointer, XCircle, Trash2, RefreshCcw, Search, BarChart3 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface NotificationEvent {
  id: string;
  user_id: string;
  notification_type: string;
  event: string;
  task_id: string | null;
  notification_id: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles?: { full_name: string | null; email: string } | null;
}

interface Stats {
  total: number;
  scheduled: number;
  delivered: number;
  tapped: number;
  cancelled: number;
  tapRate: number;
}

export default function NotificationAnalytics() {
  const [userFilter, setUserFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('delivered');
  const [daysBack, setDaysBack] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch events with filters
  const { data: events, isLoading: eventsLoading, refetch } = useQuery({
    queryKey: ['notification-events', userFilter, typeFilter, eventFilter, daysBack],
    queryFn: async () => {
      let query = supabase
        .from('local_notification_events')
        .select(`
          *,
          profiles (full_name, email)
        `)
        .gte('created_at', subDays(new Date(), daysBack).toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (typeFilter !== 'all') {
        query = query.eq('notification_type', typeFilter);
      }
      if (eventFilter !== 'all') {
        query = query.eq('event', eventFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map to expected type
      const mapped: NotificationEvent[] = (data || []).map((item) => ({
        id: item.id,
        user_id: item.user_id,
        notification_type: item.notification_type,
        event: item.event,
        task_id: item.task_id,
        notification_id: item.notification_id,
        metadata: (item.metadata as Record<string, unknown>) || {},
        created_at: item.created_at,
        profiles: item.profiles as { full_name: string | null; email: string } | null,
      }));

      // Filter by user name/email client-side
      if (userFilter) {
        const search = userFilter.toLowerCase();
        return mapped.filter(e => 
          e.profiles?.full_name?.toLowerCase().includes(search) ||
          e.profiles?.email?.toLowerCase().includes(search) ||
          e.user_id.toLowerCase().includes(search)
        );
      }

      return mapped;
    },
  });

  // Calculate stats
  const stats: Stats = {
    total: events?.length ?? 0,
    scheduled: events?.filter(e => e.event === 'scheduled').length ?? 0,
    delivered: events?.filter(e => e.event === 'delivered').length ?? 0,
    tapped: events?.filter(e => e.event === 'tapped').length ?? 0,
    cancelled: events?.filter(e => e.event === 'cancelled').length ?? 0,
    tapRate: 0,
  };
  if (stats.delivered > 0) {
    stats.tapRate = Math.round((stats.tapped / stats.delivered) * 100);
  }

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('cleanup-notification-events', {
        body: { daysToKeep: 30 },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Cleanup complete',
        description: `Deleted ${data.deleted} events older than 30 days`,
      });
      queryClient.invalidateQueries({ queryKey: ['notification-events'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cleanup failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'scheduled': return <Bell className="h-4 w-4 text-primary" />;
      case 'delivered': return <BellRing className="h-4 w-4 text-primary" />;
      case 'tapped': return <MousePointer className="h-4 w-4 text-primary" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      task_reminder: 'default',
      urgent_alarm: 'destructive',
      session_reminder: 'secondary',
      content_reminder: 'outline',
    };
    return <Badge variant={variants[type] || 'default'}>{type.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notification Analytics</h1>
          <p className="text-muted-foreground">Track local notification events from user devices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {cleanupMutation.isPending ? 'Cleaning...' : 'Cleanup >30d'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Bell className="h-3 w-3 text-primary" /> Scheduled
            </CardDescription>
            <CardTitle className="text-2xl">{stats.scheduled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <BellRing className="h-3 w-3 text-primary" /> Delivered
            </CardDescription>
            <CardTitle className="text-2xl">{stats.delivered}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <MousePointer className="h-3 w-3 text-primary" /> Tapped
            </CardDescription>
            <CardTitle className="text-2xl">{stats.tapped}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> Tap Rate
            </CardDescription>
            <CardTitle className="text-2xl">{stats.tapRate}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user name, email, or ID..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Notification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="task_reminder">Task Reminder</SelectItem>
                <SelectItem value="urgent_alarm">Urgent Alarm</SelectItem>
                <SelectItem value="session_reminder">Session Reminder</SelectItem>
                <SelectItem value="content_reminder">Content Reminder</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="tapped">Tapped</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(daysBack)} onValueChange={(v) => setDaysBack(Number(v))}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24h</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Events</CardTitle>
          <CardDescription>
            Showing {events?.length ?? 0} events (max 200)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading events...</div>
          ) : events?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No events found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events?.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(event.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {event.profiles?.full_name || 'Unknown'}
                          </div>
                          <div className="text-muted-foreground text-xs truncate max-w-[150px]">
                            {event.profiles?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(event.notification_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.event)}
                          <span className="capitalize">{event.event}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {event.metadata?.title && <span>{String(event.metadata.title)}</span>}
                          {event.task_id && (
                            <span className="ml-1 text-xs opacity-60">
                              (task: {event.task_id.slice(0, 8)}...)
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
