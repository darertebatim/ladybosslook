import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import NotificationAnalytics from '@/pages/admin/NotificationAnalytics';
import { PNConfigEditor } from '@/components/admin/pn/PNConfigEditor';
import { LNHealthMonitor } from '@/components/admin/pn/LNHealthMonitor';
import { usePNDeliveryStats } from '@/hooks/usePNDeliveryStats';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  Clock, 
  Zap, 
  Smartphone, 
  ExternalLink,
  Calendar,
  BookOpen,
  CheckSquare,
  MessageCircle,
  TrendingUp,
  Send,
  Megaphone,
  Trophy,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Code,
  BarChart3,
  FileText,
  Settings,
  Server,
  Play,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const PROJECT_ID = 'mnukhzjcvbwpktxqlej';

interface MessageTemplate {
  title: string;
  body: string;
  condition?: string;
}

interface PNType {
  name: string;
  function: string;
  schedule?: string;
  trigger?: string;
  description: string;
  userPreference?: string;
  icon: React.ReactNode;
  messages: MessageTemplate[];
  codeFile: string;
  deliveryType: 'server' | 'local' | 'hybrid';
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

const scheduledPNs: PNType[] = [
  {
    name: 'Smart Action Nudges',
    function: 'local-smart-nudges',
    schedule: 'On app launch (local)',
    description: 'Random reminders from user\'s actual planner data: incomplete actions, proactions (journal, breathe, emotion), and water reminders. Scheduled between 8 AM - 8 PM.',
    userPreference: 'Auto (based on active tasks)',
    icon: <Sparkles className="h-5 w-5" />,
    codeFile: 'src/hooks/useSmartActionNudges.ts',
    deliveryType: 'local',
    messages: [
      { title: '{emoji} {taskTitle}', body: 'Time to do this! Your strength grows with each action.', condition: 'Random incomplete action' },
      { title: '🫁 Time for breathing', body: 'A few deep breaths can change your whole day.', condition: 'Random proaction' },
      { title: '📝 Your journal is waiting', body: 'Take a moment to write. Even a few words matter.', condition: 'Random proaction' },
      { title: '💧 Water Reminder', body: 'Have you had water recently? 💧', condition: '3-4x daily if water tracking' },
    ],
  },
  {
    name: 'Period Reminders',
    function: 'local-period-reminders',
    schedule: 'On app launch (local)',
    description: 'Period tracker notifications: before predicted start, on start day, and daily during predicted period for logging.',
    userPreference: 'reminder_enabled in period_settings',
    icon: <Calendar className="h-5 w-5" />,
    codeFile: 'src/hooks/usePeriodNotifications.ts',
    deliveryType: 'local',
    messages: [
      { title: '🌸 Period Reminder', body: 'Your period may start in {X} days. Prepare yourself.', condition: 'reminder_days before' },
      { title: '🌸 Period May Have Started', body: 'Your period may have started today. Tap to log.', condition: 'Predicted start day' },
      { title: '🌸 Log Your Day', body: "Don't forget to log today.", condition: 'During predicted period' },
    ],
  },
  {
    name: 'Drip Content',
    function: 'send-drip-notifications',
    schedule: 'On enrollment sync (local)',
    description: 'New content unlock alerts. LOCAL FIRST: Scheduled when app syncs enrollment data. Server is fallback for old app versions.',
    userPreference: 'content_drip',
    icon: <BookOpen className="h-5 w-5" />,
    codeFile: 'src/hooks/useProgramEventNotificationScheduler.ts',
    deliveryType: 'hybrid',
    messages: [
      { title: '🔓 New Content Available!', body: '"{title}" is now available. Tap to view!' },
      { title: '🎧 New Lesson Available!', body: '"{title}" is now available. Tap to listen!' },
    ],
  },
  {
    name: 'Drip Content Follow-up',
    function: 'send-drip-followup',
    schedule: 'Every 2h (cron)',
    description: 'Follow-up for users who unlocked content 2+ days ago but haven\'t listened. Timezone-aware (8 AM - 8 PM local). Only 1 follow-up per content item.',
    userPreference: 'content_drip',
    icon: <BookOpen className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-drip-followup/index.ts',
    deliveryType: 'server',
    messages: [
      { title: '🎧 Content Waiting', body: '"{title}" is waiting for you. Tap to listen.', condition: 'Unlocked 2+ days, no progress, user in active window' },
    ],
  },
  {
    name: 'Session Reminders',
    function: 'send-session-reminders',
    schedule: 'On enrollment sync (local)',
    description: 'Live session reminders 24h and 1h before. LOCAL FIRST: Scheduled when app syncs. Server fallback creates feed posts for old versions.',
    userPreference: 'session_reminders',
    icon: <Calendar className="h-5 w-5" />,
    codeFile: 'src/hooks/useProgramEventNotificationScheduler.ts',
    deliveryType: 'hybrid',
    messages: [
      { title: '📅 Session Tomorrow!', body: '"{sessionTitle}" is scheduled for {date} at {time}.', condition: '24h before (local)' },
      { title: '📅 Session Starting in 1 Hour!', body: '"{sessionTitle}" starts at {time}. Get ready to join!', condition: '1h before (local)' },
    ],
  },
  {
    name: 'Weekly Summary',
    function: 'send-weekly-summary',
    schedule: 'Hourly (Mon 9 AM local)',
    description: 'Monday 9 AM local time weekly progress summary with tasks, lessons, and journal stats.',
    userPreference: 'Default enabled',
    icon: <TrendingUp className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-weekly-summary/index.ts',
    deliveryType: 'server',
    messages: [
      { title: '🎉 Your Weekly Progress', body: 'Great week! {X} tasks completed, {Y} lessons listened, {Z} journal entries. Keep up the momentum!' },
      { title: '🎉 Your Weekly Progress', body: 'Start this week strong! Open the app to continue your journey.', condition: 'No activity' },
    ],
  },
  {
    name: 'Feed Post Notifications',
    function: 'send-feed-post-notifications',
    schedule: 'Every 15 min (deduped)',
    description: 'New feed posts to channel members. Only sends for posts with send_push=true. Tracks last_notified_at to prevent duplicates.',
    userPreference: 'Channel membership',
    icon: <MessageCircle className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-feed-post-notifications/index.ts',
    deliveryType: 'server',
    messages: [
      { title: '{postTitle or channelName}', body: '{content preview (100 chars)}' },
    ],
  },
  {
    name: 'Momentum Keeper',
    function: 'send-momentum-celebration',
    schedule: 'Every 2h (cron)',
    description: 'Detects user INACTIVITY (1-14 days) and sends nudges to bring them back. Includes coins context. Respects 8 AM - 8 PM user timezone.',
    userPreference: 'momentum_celebration',
    icon: <Trophy className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-momentum-celebration/index.ts',
    deliveryType: 'server',
    messages: [
      { title: '💪 Keep Going!', body: 'You showed up {X} days this month. One more today?', condition: '1 day inactive' },
      { title: '✨ Your Momentum is Waiting', body: 'Your {X}-day momentum is waiting. Come back and keep it alive.', condition: '2 days inactive' },
      { title: '🌿 We Miss You', body: "You've been away for {X} days. Your strength doesn't expire.", condition: '3-4 days inactive' },
      { title: '🌸 Your Actions Miss You', body: 'You have {coins} coins waiting. Even 1 minute counts.', condition: '5-6 days inactive' },
      { title: '🕊️ No Pressure', body: "When you're ready, everything is still here for you.", condition: '7-14 days inactive' },
    ],
  },
  {
    name: 'Streak Challenges',
    function: 'send-streak-challenges',
    schedule: 'Every 2h (cron)',
    description: 'Smart streak-based nudges: first-week critical path, streak continuation, goal proximity, and gold badge encouragement. Max 1/day per user.',
    userPreference: 'momentum_celebration',
    icon: <TrendingUp className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-streak-challenges/index.ts',
    deliveryType: 'server',
    messages: [
      { title: '🌱 Your First Step', body: 'Your first action is waiting. Just one tap to start.', condition: 'First week, no completions' },
      { title: '🌱 Day 2!', body: "Day 2! You came back. That's already more than most.", condition: 'First week, came yesterday' },
      { title: '🔥 Almost There', body: '{n} of {goal} days done. Just {remaining} more to hit your target.', condition: 'Streak goal proximity' },
      { title: '🏆 Goal Reached!', body: "You did it. {goal} days. That's not luck, that's you.", condition: 'Streak goal reached' },
      { title: '🔥 2 Days!', body: '2 days in a row! Come back for day 3.', condition: '2-day streak' },
      { title: '🥇 Gold Streak', body: "Gold streak: {n} days. Don't break the chain.", condition: 'Gold streak 2+' },
      { title: '🥇 Finish for Gold', body: "You've done {x}/{y} actions today. Finish all to earn Gold.", condition: 'Partial completions today' },
    ],
  },
];

const triggeredPNs: PNType[] = [
  {
    name: 'Manual Push',
    function: 'send-push-notification',
    trigger: 'Admin action',
    description: 'Manual push to specific users, courses, rounds, or by email. Requires admin role.',
    icon: <Send className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-push-notification/index.ts',
    deliveryType: 'server',
    messages: [
      { title: '{custom title}', body: '{custom message}', condition: 'Admin-defined content' },
    ],
  },
  {
    name: 'Broadcast Message',
    function: 'send-broadcast-message',
    trigger: 'Admin action',
    description: 'Broadcast to all/course/round users. Creates chat messages + optional push + email.',
    icon: <Megaphone className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-broadcast-message/index.ts',
    deliveryType: 'server',
    messages: [
      { title: '📢 {title}', body: '{content (100 chars)}', condition: 'Push notification' },
      { title: '📢 **{title}**', body: '{full content with link button}', condition: 'Chat message' },
    ],
  },
  {
    name: 'Chat Notification',
    function: 'send-chat-notification',
    trigger: 'New chat message',
    description: 'Real-time support chat notifications. Notifies admins for user messages, users for admin replies.',
    icon: <MessageCircle className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-chat-notification/index.ts',
    deliveryType: 'server',
    messages: [
      { title: 'New support message from {userName}', body: '{message preview}', condition: 'User → Admin' },
      { title: 'New reply from Support', body: '{message preview}', condition: 'Admin → User' },
    ],
  },
  {
    name: 'Update Push',
    function: 'send-update-push-notification',
    trigger: 'Admin action',
    description: 'Targeted updates to users on old app versions. Supports dry run for testing.',
    icon: <Sparkles className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-update-push-notification/index.ts',
    deliveryType: 'server',
    messages: [
      { title: 'Update Available 🚀', body: 'A new version is ready! Update now for the best experience.', condition: 'Default message' },
      { title: '{custom title}', body: '{custom body}', condition: 'Admin-defined' },
    ],
  },
];

const localPNs: PNType[] = [
  {
    name: 'Task Reminders',
    function: 'local-task-reminder',
    trigger: 'Capacitor LocalNotifications',
    description: 'Scheduled reminders for user actions with configured times. 100% local - no server involved.',
    userPreference: 'reminder_enabled per task, reminder_offset (0/10/30/60 min)',
    icon: <CheckSquare className="h-5 w-5" />,
    codeFile: 'src/hooks/useLocalNotificationScheduler.ts',
    deliveryType: 'local',
    messages: [
      { title: '{emoji} {taskTitle}', body: "It's time!", condition: 'offset = 0' },
      { title: '{emoji} {taskTitle}', body: 'Starting in 10 minutes', condition: 'offset = 10' },
      { title: '{emoji} {taskTitle}', body: 'Starting in 30 minutes', condition: 'offset = 30' },
      { title: '{emoji} {taskTitle}', body: 'Starting in 1 hour', condition: 'offset = 60' },
    ],
  },
  {
    name: 'Urgent Alarm',
    function: 'local-urgent-alarm',
    trigger: 'Multiple triggers with vibration',
    description: 'High-priority alarms with sound and vibration for critical reminders. Uses time-sensitive interruption level.',
    icon: <Bell className="h-5 w-5" />,
    codeFile: 'src/hooks/useLocalNotificationScheduler.ts',
    deliveryType: 'local',
    messages: [
      { title: '⏰ Urgent Reminder', body: 'Time-sensitive action required' },
    ],
  },
];

function DeliveryBadge({ type }: { type: 'server' | 'local' | 'hybrid' }) {
  const config = {
    server: { label: 'Server', icon: Server, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    local: { label: 'Local', icon: Smartphone, className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    hybrid: { label: 'Hybrid', icon: Zap, className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  };
  
  const { label, icon: Icon, className } = config[type];
  
  return (
    <Badge variant="outline" className={`text-xs ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

function PNCard({ pn, stats, onRunNow, isRunning }: { 
  pn: PNType; 
  stats?: { sent: number; failed: number };
  onRunNow?: () => void;
  isRunning?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Card className="border-muted">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {pn.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium">{pn.name}</h4>
                <DeliveryBadge type={pn.deliveryType} />
                <Badge variant="outline" className="text-xs">
                  {pn.schedule || pn.trigger}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {pn.description}
              </p>
              
              {/* Stats */}
              {stats && (
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-primary">
                    <BarChart3 className="h-3 w-3" />
                    {stats.sent} sent (24h)
                  </span>
                  {stats.failed > 0 && (
                    <span className="text-destructive">{stats.failed} failed</span>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <code className="text-xs bg-muted px-2 py-0.5 rounded">
                  {pn.function}
                </code>
                {pn.userPreference && (
                  <span className="text-xs text-muted-foreground">
                    Pref: {pn.userPreference}
                  </span>
                )}
              </div>
              
              {/* Expandable section */}
              <CollapsibleTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-7 px-2 text-xs w-full justify-between"
                >
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {pn.messages.length} message template{pn.messages.length > 1 ? 's' : ''}
                  </span>
                  {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2 space-y-2">
                {/* Message Templates */}
                <div className="bg-muted/50 rounded-md p-3 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Message Templates:</div>
                  {pn.messages.map((msg, idx) => (
                    <div key={idx} className="bg-background rounded p-2 text-xs space-y-1">
                      <div className="font-medium">{msg.title}</div>
                      <div className="text-muted-foreground">{msg.body}</div>
                      {msg.condition && (
                        <div className="text-primary/80 text-[10px]">When: {msg.condition}</div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Links & Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {pn.deliveryType === 'server' && onRunNow && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs"
                      onClick={onRunNow}
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 mr-1" />
                      )}
                      Run Now
                    </Button>
                  )}
                  {pn.deliveryType !== 'local' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs"
                      asChild
                    >
                      <a
                        href={`https://supabase.com/dashboard/project/${PROJECT_ID}/functions/${pn.function}/logs`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Logs
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    asChild
                  >
                    <a
                      href={`https://github.com/user/repo/blob/main/${pn.codeFile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Code className="h-3 w-3 mr-1" />
                      Source
                    </a>
                  </Button>
                </div>
              </CollapsibleContent>
            </div>
          </div>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

function getStatusBadge(status: string | null) {
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
}

function FullLogsTab() {
  const queryClient = useQueryClient();
  const [functionFilter, setFunctionFilter] = useState('');
  
  const { data: logs, isLoading } = useQuery({
    queryKey: ['pn-schedule-logs-full', functionFilter],
    queryFn: async () => {
      let query = supabase
        .from('pn_schedule_logs')
        .select('*, profiles:user_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (functionFilter) {
        query = query.eq('function_name', functionFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Summary stats
  const todayLogs = logs?.filter(l => {
    const logDate = new Date(l.created_at).toISOString().split('T')[0];
    return logDate === new Date().toISOString().split('T')[0];
  }) || [];
  
  const totalSentToday = todayLogs.reduce((sum, l) => sum + (l.sent_count || 0), 0);
  const totalFailedToday = todayLogs.reduce((sum, l) => sum + (l.failed_count || 0), 0);
  const uniqueUsersToday = new Set(todayLogs.filter(l => l.user_id).map(l => l.user_id)).size;

  const functionNames = [...new Set(logs?.map(l => l.function_name) || [])].sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{totalSentToday}</div>
            <div className="text-xs text-muted-foreground">Sent today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{totalFailedToday}</div>
            <div className="text-xs text-muted-foreground">Failed today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{uniqueUsersToday}</div>
            <div className="text-xs text-muted-foreground">Users notified today</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          className="text-sm border rounded px-2 py-1 bg-background"
          value={functionFilter}
          onChange={(e) => setFunctionFilter(e.target.value)}
        >
          <option value="">All functions</option>
          {functionNames.map(fn => (
            <option key={fn} value={fn}>{fn}</option>
          ))}
        </select>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['pn-schedule-logs-full'] })}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Logs Table */}
      {!logs || logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p>No logs yet.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Function</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Failed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium text-xs">{log.function_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{log.notification_type || '—'}</TableCell>
                <TableCell className="text-xs">
                  {log.profiles?.full_name || log.profiles?.email || (log.user_id ? log.user_id.slice(0, 8) + '...' : '—')}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>{getStatusBadge(log.status)}</TableCell>
                <TableCell className="text-right text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>{log.sent_count}</TableCell>
                <TableCell className="text-right text-xs font-medium text-destructive">{log.failed_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function RecentLogsTable() {
  const queryClient = useQueryClient();
  
  const { data: logs, isLoading } = useQuery({
    queryKey: ['pn-schedule-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pn_schedule_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (error) throw error;
      return data as PNLog[];
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>No logs yet. Run a notification job to see results here.</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-end mb-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['pn-schedule-logs'] })}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
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
              <TableCell className="font-medium text-sm">{log.function_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell>{getStatusBadge(log.status)}</TableCell>
              <TableCell className="text-right font-medium" style={{ color: 'hsl(var(--primary))' }}>{log.sent_count}</TableCell>
              <TableCell className="text-right font-medium text-destructive">{log.failed_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PNDocumentation() {
  const { stats } = usePNDeliveryStats();
  const [runningFunctions, setRunningFunctions] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  
  const runNow = async (functionName: string) => {
    setRunningFunctions(prev => new Set(prev).add(functionName));
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error) throw error;
      
      toast.success(`${functionName} completed`, {
        description: `Sent: ${data?.sent || 0}, Failed: ${data?.failed || 0}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['pn-schedule-logs'] });
      queryClient.invalidateQueries({ queryKey: ['pn-delivery-stats'] });
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
  
  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-sm">
        <span className="text-muted-foreground">Delivery types:</span>
        <DeliveryBadge type="server" />
        <span className="text-xs text-muted-foreground">APNs from edge functions</span>
        <DeliveryBadge type="local" />
        <span className="text-xs text-muted-foreground">Scheduled on device</span>
        <DeliveryBadge type="hybrid" />
        <span className="text-xs text-muted-foreground">Local primary, server fallback</span>
      </div>
      
      {/* Server-Side Scheduled */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Scheduled (Cron Jobs)</CardTitle>
          </div>
          <CardDescription>
            Recurring notifications managed by Supabase cron. Respect user timezone preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {scheduledPNs.map((pn) => (
              <PNCard 
                key={pn.function} 
                pn={pn} 
                stats={stats?.[pn.function]}
                onRunNow={pn.deliveryType === 'server' ? () => runNow(pn.function) : undefined}
                isRunning={runningFunctions.has(pn.function)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Triggered (On-Demand) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Triggered (On-Demand)</CardTitle>
          </div>
          <CardDescription>
            Notifications triggered by specific actions or events in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {triggeredPNs.map((pn) => (
              <PNCard 
                key={pn.function} 
                pn={pn}
                stats={stats?.[pn.function]}
                onRunNow={() => runNow(pn.function)}
                isRunning={runningFunctions.has(pn.function)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client-Side Local */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle>Client-Side (Local Notifications)</CardTitle>
          </div>
          <CardDescription>
            Notifications scheduled locally on user devices via Capacitor. 
            Config synced from <code className="text-xs">pn_config</code> table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {localPNs.map((pn) => (
              <PNCard key={pn.function} pn={pn} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Strategy Note */}
      <Card className="border-primary/30 bg-accent/50">
        <CardHeader>
          <CardTitle className="text-base">📋 Delivery Strategy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Local-first (Smart Nudges):</strong> Action reminders, water, and period notifications are generated from on-device planner data. Random times between 8 AM - 8 PM.
          </p>
          <p>
            <strong>Server (Momentum Keeper):</strong> Detects user inactivity and sends nudges to bring them back. Includes coins context.
          </p>
          <p>
            <strong>Server (Drip Follow-up):</strong> Follows up on unlocked content that hasn't been listened to after 2+ days.
          </p>
          <p>
            <strong>Hybrid:</strong> Session reminders and content unlocks use local as primary, server as fallback.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PushNotifications() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Push Notifications Hub
        </h1>
        <p className="text-muted-foreground">
          Configure local notifications, view all notification types, and monitor health
        </p>
      </div>

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            PN Map
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Config
          </TabsTrigger>
          <TabsTrigger value="local" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Local Analytics
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <PNDocumentation />
        </TabsContent>

        <TabsContent value="config">
          <div className="space-y-6">
            <LNHealthMonitor />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Local Notification Config
                </CardTitle>
                <CardDescription>
                  Edit notification messages, timing, and enabled state. Changes sync to all user devices in real-time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PNConfigEditor />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="local">
          <NotificationAnalytics />
        </TabsContent>

        <TabsContent value="logs">
          <FullLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
