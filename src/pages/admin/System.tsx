import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeviceManagementPanel } from '@/components/admin/DeviceManagementPanel';
import SecurityAuditLog from '@/components/SecurityAuditLog';
import { StaffPermissionsManager } from '@/components/admin/StaffPermissionsManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useResetPlannerData } from '@/hooks/useTaskPlanner';
import { RotateCcw, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function System() {
  const resetPlanner = useResetPlannerData();
  const [enrollingAll, setEnrollingAll] = useState(false);

  const handleEnrollAllPrograms = async () => {
    setEnrollingAll(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in first');
        return;
      }

      const response = await supabase.functions.invoke('admin-enroll-all-programs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      toast.success(result.message);
    } catch (error: any) {
      console.error('Error enrolling in all programs:', error);
      toast.error(error.message || 'Failed to enroll in programs');
    } finally {
      setEnrollingAll(false);
    }
  };

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

        <TabsContent value="tools" className="space-y-4">
          {/* Enroll in All Programs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Enroll in All Programs
              </CardTitle>
              <CardDescription>
                Enroll yourself in all active programs with all available rounds. Useful for testing and reviewing all content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleEnrollAllPrograms} 
                disabled={enrollingAll}
                variant="default"
              >
                {enrollingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  'Enroll in All Programs'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Complete Reset */}
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
