import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgramsManager } from '@/components/admin/ProgramsManager';
import { ProgramRoundsManager } from '@/components/admin/ProgramRoundsManager';
import AutoEnrollmentManager from '@/components/admin/AutoEnrollmentManager';

export default function Programs() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Programs Management</h2>
        <p className="text-muted-foreground">Manage program catalog, rounds, and auto-enrollment</p>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog">Program Catalog</TabsTrigger>
          <TabsTrigger value="rounds">Program Rounds</TabsTrigger>
          <TabsTrigger value="auto-enroll">Auto-Enrollment</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <ProgramsManager />
        </TabsContent>

        <TabsContent value="rounds">
          <ProgramRoundsManager />
        </TabsContent>

        <TabsContent value="auto-enroll">
          <AutoEnrollmentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
