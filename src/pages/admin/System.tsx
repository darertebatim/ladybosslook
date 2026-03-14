import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeviceManagementPanel } from '@/components/admin/DeviceManagementPanel';
import SecurityAuditLog from '@/components/SecurityAuditLog';
import { StaffPermissionsManager } from '@/components/admin/StaffPermissionsManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useResetPlannerData } from '@/hooks/useTaskPlanner';
import { RotateCcw, UserCheck, Loader2, Smartphone, Copy, Check, RefreshCw, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BUILD_INFO, getDisplayBuildInfo } from '@/lib/buildInfo';
import { format } from 'date-fns';

// Build Info Card Component
function BuildInfoCard() {
  const [copied, setCopied] = useState(false);
  const displayInfo = getDisplayBuildInfo();
  
  const handleCopy = () => {
    const fullInfo = `Version: ${BUILD_INFO.version}\nBuild ID: ${BUILD_INFO.buildId}\nBuild Time: ${BUILD_INFO.buildTime}\nMode: ${BUILD_INFO.mode}`;
    navigator.clipboard.writeText(fullInfo);
    setCopied(true);
    toast.success('Build info copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Smartphone className="h-5 w-5" />
          Current Build Info
        </CardTitle>
        <CardDescription>
          Compare this with your iOS app to verify the build is up-to-date
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main display info - what user sees on auth screen */}
        <div className="bg-background rounded-lg p-4 border">
          <p className="text-xs text-muted-foreground mb-1">Expected on Auth Screen:</p>
          <code className="text-lg font-mono font-semibold text-primary">{displayInfo}</code>
        </div>
        
        {/* Detailed breakdown */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-background rounded-lg p-3 border">
            <p className="text-xs text-muted-foreground">Version</p>
            <p className="font-mono font-medium">{BUILD_INFO.version}</p>
          </div>
          <div className="bg-background rounded-lg p-3 border">
            <p className="text-xs text-muted-foreground">Build ID</p>
            <p className="font-mono font-medium text-primary">{BUILD_INFO.buildId}</p>
          </div>
          <div className="bg-background rounded-lg p-3 border">
            <p className="text-xs text-muted-foreground">Build Time</p>
            <p className="font-mono font-medium text-xs">{BUILD_INFO.buildTime}</p>
          </div>
          <div className="bg-background rounded-lg p-3 border">
            <p className="text-xs text-muted-foreground">Mode</p>
            <p className="font-mono font-medium">{BUILD_INFO.mode}</p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleCopy} className="w-full">
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Build Info
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          💡 If iOS app shows a different Build ID, run: <code className="bg-muted px-1 rounded">npm run build && npx cap sync ios</code>
        </p>
      </CardContent>
    </Card>
  );
}

// App Update Logs Card
function AppUpdateLogsCard() {
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['app-update-logs'],
    queryFn: async () => {
      // First, get the update logs
      const { data: logsData, error: logsError } = await supabase
        .from('app_update_logs')
        .select('id, device_version, latest_version, update_available, platform, checked_at, user_id')
        .order('checked_at', { ascending: false })
        .limit(50);
      
      if (logsError) throw logsError;
      if (!logsData || logsData.length === 0) return [];

      // Then, fetch profiles for the user_ids
      const userIds = [...new Set(logsData.map(l => l.user_id).filter(Boolean))];
      if (userIds.length === 0) return logsData.map(l => ({ ...l, profile: null }));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      
      return logsData.map(l => ({
        ...l,
        profile: l.user_id ? profileMap.get(l.user_id) || null : null,
      }));
    },
  });

  const updateNeededCount = logs?.filter(l => l.update_available).length || 0;
  const uniqueUsers = new Set(logs?.map(l => l.user_id)).size;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              App Update Checks
            </CardTitle>
            <CardDescription>
              Recent version checks from native iOS app users
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{logs?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total Checks</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{updateNeededCount}</p>
            <p className="text-xs text-muted-foreground">Need Update</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">{uniqueUsers}</p>
            <p className="text-xs text-muted-foreground">Unique Users</p>
          </div>
        </div>

        {/* Recent logs */}
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : logs && logs.length > 0 ? (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge 
                    variant={log.update_available ? "destructive" : "secondary"}
                    className="shrink-0"
                  >
                    v{log.device_version}
                  </Badge>
                  <span className="text-muted-foreground truncate">
                    {log.profile?.full_name || log.profile?.email?.split('@')[0] || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  {log.update_available && (
                    <span className="text-orange-500">→ v{log.latest_version}</span>
                  )}
                  <span>{format(new Date(log.checked_at), 'MMM d, HH:mm')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No update checks logged yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
          {/* App Update Logs */}
          <AppUpdateLogsCard />
          
          {/* Build Info Card */}
          <BuildInfoCard />
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
