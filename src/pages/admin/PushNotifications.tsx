import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PushNotificationCenter } from '@/components/admin/PushNotificationCenter';
import NotificationAnalytics from '@/pages/admin/NotificationAnalytics';
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
  Sparkles
} from 'lucide-react';

const PROJECT_ID = 'mnukhzjcvbwpvktxqlej';

interface PNType {
  name: string;
  function: string;
  schedule?: string;
  trigger?: string;
  description: string;
  userPreference?: string;
  icon: React.ReactNode;
}

const scheduledPNs: PNType[] = [
  {
    name: 'Daily Notifications',
    function: 'send-daily-notifications',
    schedule: 'Hourly (timezone-aware)',
    description: 'Morning summary, evening check-in, time period reminders, goal nudges',
    userPreference: 'Per-type toggles in settings',
    icon: <Clock className="h-5 w-5" />,
  },
  {
    name: 'Drip Content',
    function: 'send-drip-notifications',
    schedule: 'Hourly',
    description: 'New course content unlocks based on round start date',
    userPreference: 'content_drip',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    name: 'Session Reminders',
    function: 'send-session-reminders',
    schedule: 'Every 15 min',
    description: 'Live session reminders (24h and 1h before)',
    userPreference: 'session_reminders',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    name: 'Task Reminders (Server)',
    function: 'send-task-reminders',
    schedule: 'Every 5 min',
    description: 'Fallback server-side task reminders for older app versions',
    userPreference: 'reminder_enabled per task',
    icon: <CheckSquare className="h-5 w-5" />,
  },
  {
    name: 'Weekly Summary',
    function: 'send-weekly-summary',
    schedule: 'Hourly (Mon 9 AM local)',
    description: 'Monday 9 AM local time - weekly progress summary',
    userPreference: 'Default enabled',
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    name: 'Feed Post Notifications',
    function: 'send-feed-post-notifications',
    schedule: 'Every 15 min',
    description: 'New feed posts to channel members',
    userPreference: 'Channel membership',
    icon: <MessageCircle className="h-5 w-5" />,
  },
  {
    name: 'Momentum Celebration',
    function: 'send-momentum-celebration',
    schedule: 'Daily',
    description: 'Milestone celebrations (3, 7, 14, 21, 30 days)',
    userPreference: 'momentum_celebration',
    icon: <Trophy className="h-5 w-5" />,
  },
];

const triggeredPNs: PNType[] = [
  {
    name: 'Manual Push',
    function: 'send-push-notification',
    trigger: 'Admin action',
    description: 'Manual push to specific users/courses/rounds',
    icon: <Send className="h-5 w-5" />,
  },
  {
    name: 'Broadcast Message',
    function: 'send-broadcast-message',
    trigger: 'Admin action',
    description: 'Broadcast with optional email + push',
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    name: 'Chat Notification',
    function: 'send-chat-notification',
    trigger: 'New chat message',
    description: 'Real-time support chat notifications',
    icon: <MessageCircle className="h-5 w-5" />,
  },
  {
    name: 'Update Push',
    function: 'send-update-push-notification',
    trigger: 'Admin action',
    description: 'Targeted updates to users on old app versions',
    icon: <Sparkles className="h-5 w-5" />,
  },
];

const localPNs = [
  {
    name: 'Task Reminder',
    trigger: 'Capacitor LocalNotifications',
    description: 'Scheduled reminders for user tasks with configured times',
    events: ['scheduled', 'delivered', 'tapped', 'cancelled'],
  },
  {
    name: 'Urgent Alarm',
    trigger: 'Multiple triggers with vibration',
    description: 'High-priority alarms with sound and vibration',
    events: ['scheduled', 'delivered', 'tapped', 'cancelled'],
  },
];

function PNDocumentation() {
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
              <Card key={pn.function} className="border-muted">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {pn.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{pn.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {pn.schedule}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pn.description}
                      </p>
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
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 h-7 px-2 text-xs"
                        asChild
                      >
                        <a
                          href={`https://supabase.com/dashboard/project/${PROJECT_ID}/functions/${pn.function}/logs`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Logs
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
              <Card key={pn.function} className="border-muted">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {pn.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{pn.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {pn.trigger}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pn.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">
                          {pn.function}
                        </code>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 h-7 px-2 text-xs"
                        asChild
                      >
                        <a
                          href={`https://supabase.com/dashboard/project/${PROJECT_ID}/functions/${pn.function}/logs`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Logs
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
