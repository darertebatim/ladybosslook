import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnnouncementCreator } from '@/components/admin/AnnouncementCreator';
import { AnnouncementsList } from '@/components/admin/AnnouncementsList';
import { PushNotificationSender } from '@/components/admin/PushNotificationSender';
import { PushNotificationsHistory } from '@/components/admin/PushNotificationsHistory';
import { EmailLogsViewer } from '@/components/admin/EmailLogsViewer';

export default function Communications() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Communications</h2>
        <p className="text-muted-foreground">Manage announcements, push notifications, and emails</p>
      </div>

      <Tabs defaultValue="announcements">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="push">Push Notifications</TabsTrigger>
          <TabsTrigger value="emails">Email Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="space-y-6">
          <AnnouncementCreator />
          <AnnouncementsList />
        </TabsContent>

        <TabsContent value="push" className="space-y-6">
          <PushNotificationSender />
          <PushNotificationsHistory />
        </TabsContent>

        <TabsContent value="emails">
          <EmailLogsViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
