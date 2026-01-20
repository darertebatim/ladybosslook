import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeviceManagementPanel } from '@/components/admin/DeviceManagementPanel';
import SecurityAuditLog from '@/components/SecurityAuditLog';
import { StaffPermissionsManager } from '@/components/admin/StaffPermissionsManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useResetPlannerData } from '@/hooks/useTaskPlanner';
import { RotateCcw } from 'lucide-react';

export default function System() {
  const resetPlanner = useResetPlannerData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Management</h2>
        <p className="text-muted-foreground">Manage devices, permissions, and view security logs</p>
      </div>

      <Tabs defaultValue="devices">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="security">Audit Log</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <DeviceManagementPanel />
        </TabsContent>

        <TabsContent value="permissions">
          <StaffPermissionsManager />
        </TabsContent>

        <TabsContent value="security">
          <SecurityAuditLog />
        </TabsContent>

        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Complete Reset (Admin Testing)
              </CardTitle>
              <CardDescription>
                Reset all user data to simulate a fresh "day one" experience. This clears tasks, journal entries, chat history, wallet credits, and all other user-associated data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={resetPlanner.isPending}>
                    {resetPlanner.isPending ? 'Resetting...' : 'Complete Reset'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your user data including tasks, journal entries, chat messages, wallet credits, and all progress.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => resetPlanner.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, reset everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
