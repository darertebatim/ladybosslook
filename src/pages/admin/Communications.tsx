import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnnouncementCreator } from '@/components/admin/AnnouncementCreator';
import { BroadcastHistory } from '@/components/admin/BroadcastHistory';
import { PushNotificationSender } from '@/components/admin/PushNotificationSender';
import { PushNotificationsHistory } from '@/components/admin/PushNotificationsHistory';
import { HomeBannerManager } from '@/components/admin/HomeBannerManager';
import { MailchimpTagManager } from '@/components/admin/MailchimpTagManager';
import { EmailGenerator } from '@/components/admin/EmailGenerator';

export default function Communications() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Communications</h2>
        <p className="text-muted-foreground">Manage broadcasts, push notifications, banners, and Mailchimp</p>
      </div>

      <Tabs defaultValue="broadcasts">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="push">Push Only</TabsTrigger>
          <TabsTrigger value="email-gen">Email Generator</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="mailchimp">Mailchimp</TabsTrigger>
        </TabsList>

        <TabsContent value="broadcasts" className="space-y-6">
          <AnnouncementCreator />
          <BroadcastHistory />
        </TabsContent>

        <TabsContent value="push" className="space-y-6">
          <PushNotificationSender />
          <PushNotificationsHistory />
        </TabsContent>

        <TabsContent value="email-gen" className="space-y-6">
          <EmailGenerator />
        </TabsContent>

        <TabsContent value="banners" className="space-y-6">
          <HomeBannerManager />
        </TabsContent>

        <TabsContent value="mailchimp" className="space-y-6">
          <MailchimpTagManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
