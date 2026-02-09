import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PushNotificationCenter } from '@/components/admin/PushNotificationCenter';
import NotificationAnalytics from '@/pages/admin/NotificationAnalytics';
import { usePNDeliveryStats } from '@/hooks/usePNDeliveryStats';
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
  FileText
} from 'lucide-react';

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
}

const scheduledPNs: PNType[] = [
  {
    name: 'Daily Notifications',
    function: 'send-daily-notifications',
    schedule: 'Hourly (timezone-aware)',
    description: 'Morning summary, evening check-in, time period reminders, goal nudges - all based on user\'s local timezone',
    userPreference: 'Per-type toggles: morning_summary, evening_checkin, time_period_reminders, goal_nudges',
    icon: <Clock className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-daily-notifications/index.ts',
    messages: [
      { title: '☀️ Good morning!', body: "Your actions for today are ready. Let's make it count.", condition: '7 AM or wake_time (morning_summary)' },
      { title: '🌅 Evening check-in', body: 'A few actions are still waiting for you today.', condition: '6 PM (evening_checkin)' },
      { title: '🌅 Morning time', body: 'Your morning actions are waiting gently.', condition: '6 AM (time_period_reminders)' },
      { title: '🌤️ Afternoon is here', body: 'Time for your afternoon actions.', condition: '12 PM' },
      { title: '🌇 Evening ritual', body: 'Your evening actions await.', condition: '5 PM' },
      { title: '🌙 Bedtime routine', body: 'Time to wind down with your bedtime actions.', condition: '9 PM' },
      { title: '💧 Goal Check', body: "How's your water intake going? 💧", condition: '9 AM, 12 PM, 3 PM, 6 PM (goal_nudges)' },
    ],
  },
  {
    name: 'Drip Content',
    function: 'send-drip-notifications',
    schedule: 'Hourly (at first_session_date time)',
    description: 'New course content unlocks based on round start date. Triggers at the exact time of first session.',
    userPreference: 'content_drip',
    icon: <BookOpen className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-drip-notifications/index.ts',
    messages: [
      { title: '🎧 New Lesson Available!', body: '"{trackTitle}" is now available. Tap to listen!' },
      { title: '🎧 New Content Available!', body: '"{trackTitle}" is now available in {playlistName}', condition: 'Push notification variant' },
    ],
  },
  {
    name: 'Session Reminders',
    function: 'send-session-reminders',
    schedule: 'Every 15 min',
    description: 'Live session reminders 24h and 1h before. Creates feed posts and sends push notifications.',
    userPreference: 'session_reminders',
    icon: <Calendar className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-session-reminders/index.ts',
    messages: [
      { title: '📅 Session Tomorrow!', body: 'Don\'t forget: "{sessionTitle}" is scheduled for {date} at {time}.', condition: '24h before' },
      { title: '📅 Session Starting in 1 Hour!', body: '"{sessionTitle}" starts at {time}. Get ready to join!', condition: '1h before' },
    ],
  },
  {
    name: 'Task Reminders (Server)',
    function: 'send-task-reminders',
    schedule: 'Every 5 min',
    description: 'Server-side fallback for task reminders. Primary is local notifications on device. Skips completed tasks.',
    userPreference: 'reminder_enabled per task, reminder_offset (0/10/30/60 min)',
    icon: <CheckSquare className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-task-reminders/index.ts',
    messages: [
      { title: '{emoji} {taskTitle}', body: "It's time!", condition: 'offset = 0' },
      { title: '{emoji} {taskTitle}', body: 'Starting in 10 minutes', condition: 'offset = 10' },
      { title: '{emoji} {taskTitle}', body: 'Starting in 30 minutes', condition: 'offset = 30' },
      { title: '{emoji} {taskTitle}', body: 'Starting in 1 hour', condition: 'offset = 60' },
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
    messages: [
      { title: '🎉 Your Weekly Progress', body: 'Great week! {X} tasks completed, {Y} lessons listened, {Z} journal entries. Keep up the momentum!' },
      { title: '🎉 Your Weekly Progress', body: 'Start this week strong! Open the app to continue your journey.', condition: 'No activity' },
    ],
  },
  {
    name: 'Feed Post Notifications',
    function: 'send-feed-post-notifications',
    schedule: 'Every 15 min',
    description: 'New feed posts to channel members. Only sends for posts with send_push=true.',
    userPreference: 'Channel membership',
    icon: <MessageCircle className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-feed-post-notifications/index.ts',
    messages: [
      { title: '{postTitle or channelName}', body: '{content preview (100 chars)}' },
    ],
  },
  {
    name: 'Momentum Celebration',
    function: 'send-momentum-celebration',
    schedule: 'Daily',
    description: 'Milestone celebrations based on this_month_active_days. Uses strength-first language.',
    userPreference: 'momentum_celebration',
    icon: <Trophy className="h-5 w-5" />,
    codeFile: 'supabase/functions/send-momentum-celebration/index.ts',
    messages: [
      { title: '✨ 3 Days of Presence', body: "You're showing up for yourself. That's strength.", condition: '3 days' },
      { title: '🌟 A Full Week!', body: '7 days of honoring yourself. Your strength is growing.', condition: '7 days' },
      { title: '💫 Two Weeks!', body: "14 days of showing up. You're becoming who you want to be.", condition: '14 days' },
      { title: '🌙 Three Weeks!', body: "21 days. This is who you're becoming now.", condition: '21 days' },
      { title: '🏛️ One Month!', body: "30 days of honoring yourself. That's extraordinary strength.", condition: '30 days' },
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
    messages: [
      { title: 'Update Available 🚀', body: 'A new version is ready! Update now for the best experience.', condition: 'Default message' },
      { title: '{custom title}', body: '{custom body}', condition: 'Admin-defined' },
    ],
  },
];

const localPNs = [
  {
    name: 'Task Reminder (Local)',
    trigger: 'Capacitor LocalNotifications',
    description: 'Scheduled reminders for user tasks with configured times. Primary method - server is fallback.',
    events: ['scheduled', 'delivered', 'tapped', 'cancelled'],
    messages: [
      { title: '{emoji} {taskTitle}', body: 'Reminder based on offset timing' },
    ],
  },
  {
    name: 'Urgent Alarm',
    trigger: 'Multiple triggers with vibration',
    description: 'High-priority alarms with sound and vibration for critical reminders.',
    events: ['scheduled', 'delivered', 'tapped', 'cancelled'],
    messages: [
      { title: '⏰ Urgent Reminder', body: 'Time-sensitive action required' },
    ],
  },
];

function PNCard({ pn, stats }: { pn: PNType; stats?: { sent: number; failed: number } }) {
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
                
                {/* Links */}
                <div className="flex items-center gap-2 flex-wrap">
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

function PNDocumentation() {
  const { stats, isLoading } = usePNDeliveryStats();
  
  return (
    <div className="space-y-6">
      {/* Server-Side Scheduled */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Server-Side Scheduled (Cron Jobs)</CardTitle>
          </div>
          <CardDescription>
            Recurring notifications managed by Supabase cron. These run on schedule and respect user timezone preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {scheduledPNs.map((pn) => (
              <PNCard 
                key={pn.function} 
                pn={pn} 
                stats={stats?.[pn.function]}
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
            Notifications scheduled and managed locally on user devices via Capacitor. 
            Tracked in <code className="text-xs">local_notification_events</code> table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {localPNs.map((pn) => (
              <Card key={pn.name} className="border-muted">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{pn.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          Local
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pn.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Trigger: {pn.trigger}
                      </p>
                      
                      {/* Message Templates */}
                      <div className="bg-muted/50 rounded-md p-2 mt-2 space-y-1">
                        {pn.messages.map((msg, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-medium">{msg.title}</span>
                            <span className="text-muted-foreground"> — {msg.body}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {pn.events.map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Hybrid Strategy Note */}
      <Card className="border-primary/30 bg-accent/50">
        <CardHeader>
          <CardTitle className="text-base">📋 Deduplication Strategy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Current:</strong> Daily notifications are server-only to prevent duplicates. 
            Local scheduling in <code>useLocalNotificationScheduler</code> is disabled.
          </p>
          <p>
            <strong>Task Reminders:</strong> Local is primary (better offline), server is fallback for old app versions.
          </p>
          <p>
            <strong>Hybrid approach:</strong> To enable both for reliability, implement dedup key checking 
            via <code>pn_schedule_logs</code> table before sending.
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
          Manage scheduled jobs, analytics, and view all notification types
        </p>
      </div>

      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled Jobs
          </TabsTrigger>
          <TabsTrigger value="local" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Local Analytics
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            PN Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled">
          <PushNotificationCenter />
        </TabsContent>

        <TabsContent value="local">
          <NotificationAnalytics />
        </TabsContent>

        <TabsContent value="map">
          <PNDocumentation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
