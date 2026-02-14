import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgramsManager } from '@/components/admin/ProgramsManager';
import { ProgramRoundsManager } from '@/components/admin/ProgramRoundsManager';
import AutoEnrollmentManager from '@/components/admin/AutoEnrollmentManager';
import PastSessionsManager from '@/components/admin/PastSessionsManager';
import { SubscriptionProductsManager } from '@/components/admin/SubscriptionProductsManager';
import { AccessControlManager } from '@/components/admin/AccessControlManager';
import { SubscribersManager } from '@/components/admin/SubscribersManager';

export default function Programs() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Programs Management</h2>
        <p className="text-muted-foreground">Manage program catalog, rounds, sessions, subscriptions, and access control</p>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="rounds">Rounds</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="auto-enroll">Auto-Enroll</TabsTrigger>
          <TabsTrigger value="sub-products">Sub Products</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
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

        <TabsContent value="sub-products">
          <SubscriptionProductsManager />
        </TabsContent>

        <TabsContent value="access">
          <AccessControlManager />
        </TabsContent>

        <TabsContent value="subscribers">
          <SubscribersManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
