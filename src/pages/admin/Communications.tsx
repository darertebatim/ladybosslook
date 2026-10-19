import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnnouncementCreator } from '@/components/admin/AnnouncementCreator';
import { BroadcastHistory, type Broadcast } from '@/components/admin/BroadcastHistory';
import { useRef, useState } from 'react';
import { PushNotificationSender } from '@/components/admin/PushNotificationSender';
import { PushNotificationsHistory } from '@/components/admin/PushNotificationsHistory';
import { MailchimpTagManager } from '@/components/admin/MailchimpTagManager';
import { EmailGenerator } from '@/components/admin/EmailGenerator';
import { UpdateNotificationSender } from '@/components/admin/UpdateNotificationSender';
import { AppReviewKPIPanel } from '@/components/admin/AppReviewKPIPanel';


export default function Communications() {
  const [broadcastDraft, setBroadcastDraft] = useState<Broadcast>();
  const [draftRevision, setDraftRevision] = useState(0);
  const composerRef = useRef<HTMLDivElement>(null);

  const copyBroadcast = (broadcast: Broadcast) => {
    setBroadcastDraft(broadcast);
    setDraftRevision((revision) => revision + 1);
    composerRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Communications</h2>
        <p className="text-muted-foreground">Manage broadcasts, push notifications, and Mailchimp</p>
      </div>

      <Tabs defaultValue="updates">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="push">Push Only</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="email-gen">Email Gen</TabsTrigger>
          <TabsTrigger value="mailchimp">Mailchimp</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="space-y-6">
          <UpdateNotificationSender />
        </TabsContent>

        <TabsContent value="broadcasts" className="space-y-6">
          <div ref={composerRef}>
            <AnnouncementCreator key={draftRevision} draft={broadcastDraft} />
          </div>
          <BroadcastHistory onCopy={copyBroadcast} />
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
      </Tabs>

    </div>
  );
}
