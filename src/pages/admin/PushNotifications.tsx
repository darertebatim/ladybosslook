import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PushNotificationCenter } from '@/components/admin/PushNotificationCenter';
import NotificationAnalytics from '@/pages/admin/NotificationAnalytics';
import { PNConfigEditor } from '@/components/admin/pn/PNConfigEditor';
import { LNHealthMonitor } from '@/components/admin/pn/LNHealthMonitor';
import { 
  Bell, 
  Clock, 
  BarChart3,
  Settings
} from 'lucide-react';

export default function PushNotifications() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Push Notifications
        </h1>
        <p className="text-muted-foreground">
          Manage notification content, timing, and monitor delivery
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Config
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="server" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Server Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <div className="space-y-6">
            <LNHealthMonitor />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Config
                </CardTitle>
                <CardDescription>
                  Edit notification messages, timing, and enabled state. Changes sync to all user devices in real-time.
                  Apps schedule <strong>local notifications</strong> based on this config — no app update required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PNConfigEditor />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <NotificationAnalytics />
        </TabsContent>

        <TabsContent value="server">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Server-Side Cron Jobs
              </CardTitle>
              <CardDescription>
                Fallback server-side notifications and triggered events (broadcasts, chat, session reminders).
                These run as backup when local notifications fail or for real-time triggers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PushNotificationCenter />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
