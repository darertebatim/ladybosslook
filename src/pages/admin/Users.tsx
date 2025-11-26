import { LeadsManager } from '@/components/admin/LeadsManager';

export default function Users() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">Manage leads and user accounts</p>
      </div>
      <LeadsManager />
    </div>
  );
}
