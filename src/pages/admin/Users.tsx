import { useState } from 'react';
import { Users as UsersIcon, GraduationCap } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LeadsManager } from '@/components/admin/LeadsManager';
import { QuickEnrollUser } from '@/components/admin/QuickEnrollUser';
import { ProgramEnrollmentManager } from '@/components/admin/ProgramEnrollmentManager';

export default function Users() {
  const [tab, setTab] = useState<string>('leads');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">Manage leads, user accounts and enrollments</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="leads" className="gap-2">
            <UsersIcon className="h-4 w-4" />
            Leads & Users
          </TabsTrigger>
          <TabsTrigger value="enrollment" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Enrollment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-4">
          <LeadsManager />
        </TabsContent>

        <TabsContent value="enrollment" className="mt-4 space-y-6">
          <QuickEnrollUser />
          <ProgramEnrollmentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
