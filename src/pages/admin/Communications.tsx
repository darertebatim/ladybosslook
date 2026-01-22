import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnnouncementCreator } from '@/components/admin/AnnouncementCreator';
import { BroadcastHistory } from '@/components/admin/BroadcastHistory';
import { PushNotificationSender } from '@/components/admin/PushNotificationSender';
import { PushNotificationsHistory } from '@/components/admin/PushNotificationsHistory';
import { PushNotificationCenter } from '@/components/admin/PushNotificationCenter';
import { HomeBannerManager } from '@/components/admin/HomeBannerManager';
import { MailchimpTagManager } from '@/components/admin/MailchimpTagManager';
import { EmailGenerator } from '@/components/admin/EmailGenerator';
import { PromoBannerManager } from '@/components/admin/PromoBannerManager';

export default function Communications() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Communications</h2>
        <p className="text-muted-foreground">Manage broadcasts, push notifications, banners, and Mailchimp</p>
      </div>

      <Tabs defaultValue="pn-center">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="pn-center">PN Center</TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="push">Push Only</TabsTrigger>
          <TabsTrigger value="promo">Promo</TabsTrigger>
          <TabsTrigger value="email-gen">Email Gen</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="mailchimp">Mailchimp</TabsTrigger>
        </TabsList>

        <TabsContent value="pn-center" className="space-y-6">
          <PushNotificationCenter />
        </TabsContent>

        <TabsContent value="broadcasts" className="space-y-6">
          <AnnouncementCreator />
          <BroadcastHistory />
        </TabsContent>

        <TabsContent value="push" className="space-y-6">
          <PushNotificationSender />
          <PushNotificationsHistory />
        </TabsContent>

        <TabsContent value="promo" className="space-y-6">
          <PromoBannerManager />
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