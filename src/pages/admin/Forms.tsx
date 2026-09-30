import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileAnalysisManager } from '@/components/admin/ProfileAnalysisManager';
import { FormInvitesPanel } from '@/components/admin/FormInvitesPanel';

export default function Forms() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Forms</h2>
        <p className="text-muted-foreground">Invite students to fill forms and review their answers</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Instagram Profile Analysis</h3>
        <Tabs defaultValue="submissions">
          <TabsList>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="invite">Invite to fill</TabsTrigger>
          </TabsList>
          <TabsContent value="submissions">
            <ProfileAnalysisManager />
          </TabsContent>
          <TabsContent value="invite">
            <FormInvitesPanel formKey="profileanalyze" programSlug="smartig" submissionTable="profile_analysis_requests" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
