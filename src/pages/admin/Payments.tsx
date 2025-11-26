import { StripePaymentsViewer } from '@/components/admin/StripePaymentsViewer';

export default function Payments() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payments</h2>
        <p className="text-muted-foreground">View and manage Stripe payment transactions</p>
      </div>
      <StripePaymentsViewer />
    </div>
  );
}
