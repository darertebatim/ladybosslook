import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnnouncementCreator } from '@/components/admin/AnnouncementCreator';
import { BroadcastHistory } from '@/components/admin/BroadcastHistory';
import { PushNotificationSender } from '@/components/admin/PushNotificationSender';
import { PushNotificationsHistory } from '@/components/admin/PushNotificationsHistory';
import { MailchimpTagManager } from '@/components/admin/MailchimpTagManager';
import { EmailGenerator } from '@/components/admin/EmailGenerator';
import { UpdateNotificationSender } from '@/components/admin/UpdateNotificationSender';
import { AppReviewKPIPanel } from '@/components/admin/AppReviewKPIPanel';
import { SixTrapsSignups } from '@/components/admin/SixTrapsSignups';

export default function Communications() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Communications</h2>
        <p className="text-muted-foreground">Manage broadcasts, push notifications, and Mailchimp</p>
      </div>

      <Tabs defaultValue="updates">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="push">Push Only</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="email-gen">Email Gen</TabsTrigger>
          <TabsTrigger value="mailchimp">Mailchimp</TabsTrigger>
          <TabsTrigger value="sixtraps">6 Traps</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="space-y-6">
          <UpdateNotificationSender />
        </TabsContent>

        <TabsContent value="broadcasts" className="space-y-6">
          <AnnouncementCreator />
          <BroadcastHistory />
        </TabsContent>

        <TabsContent value="push" className="space-y-6">
          <PushNotificationSender />
          <PushNotificationsHistory />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <AppReviewKPIPanel />
        </TabsContent>

        <TabsContent value="email-gen" className="space-y-6">
          <EmailGenerator />
        </TabsContent>

        <TabsContent value="mailchimp" className="space-y-6">
          <MailchimpTagManager />
        </TabsContent>

        <TabsContent value="sixtraps" className="space-y-6">
          <SixTrapsSignups />
        </TabsContent>
      </Tabs>
    </div>
  );
}
