import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeviceManagementPanel } from '@/components/admin/DeviceManagementPanel';
import SecurityAuditLog from '@/components/SecurityAuditLog';

export default function System() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Management</h2>
        <p className="text-muted-foreground">Manage devices and view security logs</p>
      </div>

      <Tabs defaultValue="devices">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="devices">Device Management</TabsTrigger>
          <TabsTrigger value="security">Security Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <DeviceManagementPanel />
        </TabsContent>

        <TabsContent value="security">
          <SecurityAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
