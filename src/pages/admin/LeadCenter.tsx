import { useEffect, useState } from 'react';
import { useInactiveLeadCampaigns } from '@/hooks/useLeadCampaignStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadCampaignDirectory } from '@/components/admin/LeadCampaignDirectory';
import { WebinarStats } from '@/components/admin/WebinarStats';
import { SixTrapsSignups } from '@/components/admin/SixTrapsSignups';
import { SmartInstaSignups } from '@/components/admin/SmartInstaSignups';
import { GenericWebinarSignups } from '@/components/admin/GenericWebinarSignups';
import { EmailOpenRates } from '@/components/admin/EmailOpenRates';
import { WebinarEmailSender } from '@/components/admin/WebinarEmailSender';
import { WebinarEmailEngagement } from '@/components/admin/WebinarEmailEngagement';
import { WebinarRoundBreakdown } from '@/components/admin/WebinarRoundBreakdown';

import { MetaCrmEvents } from '@/components/admin/MetaCrmEvents';
import { LeadEmailCampaign } from '@/components/admin/LeadEmailCampaign';
import { LEAD_CAMPAIGNS } from '@/lib/leadCampaigns';

const igads = LEAD_CAMPAIGNS.find((c) => c.key === 'igads')!;
const customerVideo = LEAD_CAMPAIGNS.find((c) => c.key === 'customerwithigads')!;

export default function LeadCenter() {
  const [tab, setTab] = useState('campaigns');
  const { inactive } = useInactiveLeadCampaigns();
  const show = (key: string) => !inactive.includes(key);
  const campaignTabKeys = ['sixtraps', 'smartinsta', 'igads', 'customerwithigads'];
  const visibleCampaignTabs = campaignTabKeys.filter(show).length;
  const colCount = 5 + visibleCampaignTabs;

  useEffect(() => {
    if (campaignTabKeys.includes(tab) && !show(tab)) setTab('campaigns');
  }, [inactive, tab]);


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
          {show('customerwithigads') && (
            <TabsTrigger value="customerwithigads">IG Video</TabsTrigger>
          )}
          <TabsTrigger value="marketing">Email Marketing</TabsTrigger>
          <TabsTrigger value="opens">Email Opens</TabsTrigger>
          <TabsTrigger value="crm">Meta CRM</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <LeadCampaignDirectory />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
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
            sources={[igads.regSource, ...igads.extraSources]}
          />
          <WebinarEmailSender
            campaignKey="igads"
            programSlug={igads.programSlug}
            sources={[igads.regSource, ...igads.extraSources]}
            signupPath={igads.landingPath}
          />
          <WebinarEmailEngagement
            campaignKey="igads"
            sources={[igads.regSource, ...igads.extraSources]}
          />
          <GenericWebinarSignups campaign={igads} />
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
