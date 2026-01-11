import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgramsManager } from '@/components/admin/ProgramsManager';
import { ProgramRoundsManager } from '@/components/admin/ProgramRoundsManager';
import AutoEnrollmentManager from '@/components/admin/AutoEnrollmentManager';
import PastSessionsManager from '@/components/admin/PastSessionsManager';

export default function Programs() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Programs Management</h2>
        <p className="text-muted-foreground">Manage program catalog, rounds, sessions, and auto-enrollment</p>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="catalog">Program Catalog</TabsTrigger>
          <TabsTrigger value="rounds">Program Rounds</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="auto-enroll">Auto-Enrollment</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <ProgramsManager />
        </TabsContent>

        <TabsContent value="rounds">
          <ProgramRoundsManager />
        </TabsContent>

        <TabsContent value="sessions">
          <PastSessionsManager />
        </TabsContent>

        <TabsContent value="auto-enroll">
          <AutoEnrollmentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
