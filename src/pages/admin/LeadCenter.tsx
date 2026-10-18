import { useEffect, useState } from 'react';
import { useInactiveLeadCampaigns } from '@/hooks/useLeadCampaignStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadCampaignDirectory } from '@/components/admin/LeadCampaignDirectory';
import { WebinarStats } from '@/components/admin/WebinarStats';
import { CalendarClickStats } from '@/components/admin/CalendarClickStats';
import { IgAdsRoundStats } from '@/components/admin/IgAdsRoundStats';
import { WebinarAutomationLog } from '@/components/admin/WebinarAutomationLog';
import { SixTrapsSignups } from '@/components/admin/SixTrapsSignups';
import { SmartInstaSignups } from '@/components/admin/SmartInstaSignups';
import { GenericWebinarSignups } from '@/components/admin/GenericWebinarSignups';
import { EmailOpenRates } from '@/components/admin/EmailOpenRates';
import { WebinarEmailSender } from '@/components/admin/WebinarEmailSender';
import { WebinarEmailEngagement } from '@/components/admin/WebinarEmailEngagement';
import { WebinarRoundBreakdown } from '@/components/admin/WebinarRoundBreakdown';

import { MetaCrmEvents } from '@/components/admin/MetaCrmEvents';
import { LeadEmailCampaign } from '@/components/admin/LeadEmailCampaign';
import { StartAdsEmailAutomation } from '@/components/admin/StartAdsEmailAutomation';
import { StartAdsShowUpEmails } from '@/components/admin/StartAdsShowUpEmails';
import { LEAD_CAMPAIGNS } from '@/lib/leadCampaigns';

const igads = LEAD_CAMPAIGNS.find((c) => c.key === 'igads');
const aliagads = LEAD_CAMPAIGNS.find((c) => c.key === 'aliagads');
const customerVideo = LEAD_CAMPAIGNS.find((c) => c.key === 'customerwithigads');
const igthree = LEAD_CAMPAIGNS.find((c) => c.key === 'igthree');
const assertive = LEAD_CAMPAIGNS.find((c) => c.key === 'assertive');
const startads = LEAD_CAMPAIGNS.find((c) => c.key === 'startads');
// Both IG Ads landing pages share one program, so round views and round emails
// include everyone in the round no matter which page they signed up on.
const igAdsRoundSources = [igads, aliagads].flatMap((c) => (c ? [c.regSource, ...c.extraSources] : []));

export default function LeadCenter() {
  const [tab, setTab] = useState('campaigns');
  const { inactive } = useInactiveLeadCampaigns();
  const show = (key: string) => !inactive.includes(key);
  const campaignTabKeys = ['sixtraps', 'smartinsta', 'igads', 'aliagads', 'customerwithigads', 'igthree', 'assertive', 'startads'];
  const visibleCampaignTabs = campaignTabKeys.filter(show).length;
  const colCount = 5 + visibleCampaignTabs;

  useEffect(() => {
    if (campaignTabKeys.includes(tab) && !show(tab)) setTab('campaigns');
  }, [inactive, tab]);


  if (!igads || !aliagads || !customerVideo || !igthree || !assertive || !startads) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Lead Center</h2>
        <p className="text-muted-foreground">
          Every lead campaign in one place — landing pages, thank-you pages, Meta events, rounds,
          signups and email performance.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>

        <TabsList
          className="grid w-full"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          {show('sixtraps') && <TabsTrigger value="sixtraps">6 Traps</TabsTrigger>}
          {show('smartinsta') && <TabsTrigger value="smartinsta">Smart IG</TabsTrigger>}
          {show('igads') && <TabsTrigger value="igads">IG Ads</TabsTrigger>}
          {show('aliagads') && <TabsTrigger value="aliagads">IG Ads (Ali)</TabsTrigger>}
          {show('customerwithigads') && (
            <TabsTrigger value="customerwithigads">IG Video</TabsTrigger>
          )}
          {show('igthree') && <TabsTrigger value="igthree">IG Three</TabsTrigger>}
          {show('assertive') && <TabsTrigger value="assertive">Assertive</TabsTrigger>}
          {show('startads') && <TabsTrigger value="startads">Start Ads</TabsTrigger>}
          <TabsTrigger value="marketing">Email Marketing</TabsTrigger>
          <TabsTrigger value="opens">Email Opens</TabsTrigger>
          <TabsTrigger value="crm">Meta CRM</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <LeadCampaignDirectory />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <WebinarAutomationLog />
          <IgAdsRoundStats />
          <CalendarClickStats />
          <WebinarStats />
        </TabsContent>

        <TabsContent value="sixtraps" className="space-y-6">
          <SixTrapsSignups />
          <WebinarEmailEngagement
            campaignKey="sixtraps"
            sources={['sixtraps_registration', 'presixtraps_interest', 'sixtraps_additional_email']}
          />
        </TabsContent>


        <TabsContent value="smartinsta" className="space-y-6">
          <SmartInstaSignups />
        </TabsContent>

        <TabsContent value="igads" className="space-y-6">
          <WebinarRoundBreakdown
            programSlug={igads.programSlug}
            campaignKey="igads"
            sources={igAdsRoundSources}
          />
          <WebinarEmailSender
            campaignKey="igads"
            programSlug={igads.programSlug}
            sources={igAdsRoundSources}
            signupPath={igads.landingPath}
          />
          <WebinarEmailEngagement
            campaignKey="igads"
            sources={[igads.regSource, ...igads.extraSources]}
          />
          <GenericWebinarSignups campaign={igads} />
        </TabsContent>

        <TabsContent value="aliagads" className="space-y-6">
          <WebinarRoundBreakdown
            programSlug={aliagads.programSlug}
            routingKey="aliagads"
            campaignKey="aliagads"
            sources={igAdsRoundSources}
          />
          <WebinarEmailSender
            campaignKey="aliagads"
            programSlug={aliagads.programSlug}
            sources={igAdsRoundSources}
            signupPath={aliagads.landingPath}
          />
          <WebinarEmailEngagement
            campaignKey="aliagads"
            sources={[aliagads.regSource, ...aliagads.extraSources]}
          />
          <GenericWebinarSignups campaign={aliagads} />
        </TabsContent>

        <TabsContent value="customerwithigads" className="space-y-6">
          <GenericWebinarSignups campaign={customerVideo} />
        </TabsContent>



        <TabsContent value="igthree" className="space-y-6">
          <GenericWebinarSignups campaign={igthree} />
        </TabsContent>

        <TabsContent value="assertive" className="space-y-6">
          <GenericWebinarSignups campaign={assertive} />
        </TabsContent>

        <TabsContent value="startads" className="space-y-6">
          <StartAdsEmailAutomation />
          <StartAdsShowUpEmails />
          <WebinarRoundBreakdown
            programSlug={startads.programSlug}
            campaignKey="startads"
            sources={[startads.regSource, ...startads.extraSources]}
          />
          <GenericWebinarSignups campaign={startads} />
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <LeadEmailCampaign />
        </TabsContent>

        <TabsContent value="opens" className="space-y-6">
          <EmailOpenRates onResend={() => setTab('marketing')} />
        </TabsContent>

        <TabsContent value="crm" className="space-y-6">
          <MetaCrmEvents />
        </TabsContent>
      </Tabs>
    </div>
  );
}
