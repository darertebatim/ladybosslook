import { StripePaymentsViewer } from '@/components/admin/StripePaymentsViewer';
import { StripeSyncButton } from '@/components/admin/StripeSyncButton';
import { ManualPaymentDialog } from '@/components/admin/ManualPaymentDialog';
import { useState } from 'react';
import { MetaAdExpenses } from '@/components/admin/MetaAdExpenses';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Payments() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
        <h2 className="text-2xl font-bold">Payments</h2>
        <p className="text-muted-foreground">Stripe and manually recorded payments</p>
        </div>
        <ManualPaymentDialog onSaved={() => setRefreshKey(value => value + 1)} />
      </div>
      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="payments" className="space-y-6 pt-4">
          <StripeSyncButton />
          <StripePaymentsViewer refreshKey={refreshKey} />
        </TabsContent>
        <TabsContent value="expenses" className="pt-4">
          <MetaAdExpenses />
        </TabsContent>
      </Tabs>
    </div>
  );
}
