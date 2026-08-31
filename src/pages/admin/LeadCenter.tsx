import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadCampaignDirectory } from '@/components/admin/LeadCampaignDirectory';
import { WebinarStats } from '@/components/admin/WebinarStats';
import { SixTrapsSignups } from '@/components/admin/SixTrapsSignups';
import { SmartInstaSignups } from '@/components/admin/SmartInstaSignups';
import { GenericWebinarSignups } from '@/components/admin/GenericWebinarSignups';
import { EmailOpenRates } from '@/components/admin/EmailOpenRates';
import { LEAD_CAMPAIGNS } from '@/lib/leadCampaigns';

const igads = LEAD_CAMPAIGNS.find((c) => c.key === 'igads')!;

export default function LeadCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Lead Center</h2>
        <p className="text-muted-foreground">
          Every lead campaign in one place — landing pages, thank-you pages, Meta events, rounds,
          signups and email performance.
        </p>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="sixtraps">6 Traps</TabsTrigger>
          <TabsTrigger value="smartinsta">Smart IG</TabsTrigger>
          <TabsTrigger value="igads">IG Ads</TabsTrigger>
          <TabsTrigger value="opens">Email Opens</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <LeadCampaignDirectory />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <WebinarStats />
        </TabsContent>

        <TabsContent value="sixtraps" className="space-y-6">
          <SixTrapsSignups />
        </TabsContent>

        <TabsContent value="smartinsta" className="space-y-6">
          <SmartInstaSignups />
        </TabsContent>

        <TabsContent value="igads" className="space-y-6">
          <GenericWebinarSignups campaign={igads} />
        </TabsContent>

        <TabsContent value="opens" className="space-y-6">
          <EmailOpenRates />
        </TabsContent>
      </Tabs>
    </div>
  );
}
