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
import { EmailOpenRates } from '@/components/admin/EmailOpenRates';
import { MetaCrmEvents } from '@/components/admin/MetaCrmEvents';
import { LeadEmailCampaign } from '@/components/admin/LeadEmailCampaign';
import { MetaAudienceExport } from '@/components/admin/MetaAudienceExport';
import { PromoBannerManager } from '@/components/admin/PromoBannerManager';
import { BoxBannerManager } from '@/components/admin/BoxBannerManager';
import { SpecialBannersArchive } from '@/components/admin/SpecialBannersArchive';
import AudienceLibrary from '@/pages/admin/AudienceLibrary';



export default function Communications() {
  const [broadcastDraft, setBroadcastDraft] = useState<Broadcast>();
  const [draftRevision, setDraftRevision] = useState(0);
  const [tab, setTab] = useState('updates');
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

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-11">
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="push">Push Only</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="email-gen">Email Gen</TabsTrigger>
          <TabsTrigger value="mailchimp">Mailchimp</TabsTrigger>
          <TabsTrigger value="marketing">Email Marketing</TabsTrigger>
          <TabsTrigger value="opens">Email Opens</TabsTrigger>
          <TabsTrigger value="crm">Meta CRM</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="audiences">Audiences</TabsTrigger>
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
        <TabsContent value="marketing" className="space-y-6">
          <LeadEmailCampaign />
        </TabsContent>

        <TabsContent value="opens" className="space-y-6">
          <EmailOpenRates onResend={() => setTab('marketing')} />
        </TabsContent>

        <TabsContent value="crm" className="space-y-6">
          <MetaAudienceExport />
          <MetaCrmEvents />
        </TabsContent>

        <TabsContent value="banners" className="space-y-6">
          <Tabs defaultValue="promo">
            <TabsList>
              <TabsTrigger value="promo">Promo Banners</TabsTrigger>
              <TabsTrigger value="box">Box Banners</TabsTrigger>
              <TabsTrigger value="special">Special Banners</TabsTrigger>
            </TabsList>
            <TabsContent value="promo" className="space-y-6">
              <PromoBannerManager />
            </TabsContent>
            <TabsContent value="box" className="space-y-6">
              <BoxBannerManager />
            </TabsContent>
            <TabsContent value="special" className="space-y-6">
              <SpecialBannersArchive />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="audiences" className="space-y-6">
          <AudienceLibrary />
        </TabsContent>
      </Tabs>

    </div>
  );
}
