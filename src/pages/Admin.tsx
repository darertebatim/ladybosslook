import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, GraduationCap, LayoutDashboard, UserCog, Send, Shield, LogOut, Search, Users, UserPlus, Music, Smartphone, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { QuickEnrollUser } from '@/components/admin/QuickEnrollUser';
import { UserCreditsManager } from '@/components/admin/UserCreditsManager';
import { CourseEnrollmentManager } from '@/components/admin/CourseEnrollmentManager';


import { BulkEnrollCourageousCourse } from '@/components/admin/BulkEnrollCourageousCourse';
import { AnnouncementCreator } from '@/components/admin/AnnouncementCreator';
import { AnnouncementsList } from '@/components/admin/AnnouncementsList';
import { PushNotificationSender } from '@/components/admin/PushNotificationSender';
import { PushNotificationsHistory } from '@/components/admin/PushNotificationsHistory';
import { DeviceManagementPanel } from '@/components/admin/DeviceManagementPanel';
import { EmailLogsViewer } from '@/components/admin/EmailLogsViewer';
import { ProgramsManager } from '@/components/admin/ProgramsManager';
import { ProgramRoundsManager } from '@/components/admin/ProgramRoundsManager';
import { LeadsManager } from '@/components/admin/LeadsManager';
import AutoEnrollmentManager from '@/components/admin/AutoEnrollmentManager';
import SecurityAuditLog from '@/components/SecurityAuditLog';
import { StripePaymentsViewer } from '@/components/admin/StripePaymentsViewer';
import { usePrograms } from '@/hooks/usePrograms';
import { AudioManager } from '@/components/admin/AudioManager';
import { isNativeApp } from '@/lib/platform';

interface CourseStats {
  course_name: string;
  student_count: number;
}

interface DeviceStats {
  totalDevices: number;
  recentDevices: number;
  lastRegistration: string | null;
}

interface InstallStats {
  totalInstalls: number;
  recentInstalls: number;
  lastInstall: string | null;
}

const Admin = () => {
  const { programs } = usePrograms();
  const navigate = useNavigate();
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({ totalDevices: 0, recentDevices: 0, lastRegistration: null });
  const [installStats, setInstallStats] = useState<InstallStats>({ totalInstalls: 0, recentInstalls: 0, lastInstall: null });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out"
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  const fetchInstallStats = async () => {
    try {
      // Fetch all app installations
      const { data: installs, error } = await supabase
        .from('app_installations')
        .select('installed_at, platform');

      if (error) throw error;

      const totalInstalls = installs?.length || 0;
      
      // Count installs in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentInstalls = installs?.filter(install => 
        new Date(install.installed_at) > sevenDaysAgo
      ).length || 0;

      // Get most recent install
      const sortedInstalls = installs?.sort((a, b) => 
        new Date(b.installed_at).getTime() - new Date(a.installed_at).getTime()
      );
      const lastInstall = sortedInstalls?.[0]?.installed_at || null;

      setInstallStats({ totalInstalls, recentInstalls, lastInstall });
    } catch (error: any) {
      console.error('Error fetching install stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch installation statistics",
        variant: "destructive",
      });
    }
  };

  const fetchDeviceStats = async () => {
    try {
      // Fetch all native iOS subscriptions
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('endpoint, created_at')
        .like('endpoint', 'native:%');

      if (error) throw error;

      const totalDevices = subscriptions?.length || 0;
      
      // Count devices registered in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentDevices = subscriptions?.filter(sub => 
        new Date(sub.created_at) > sevenDaysAgo
      ).length || 0;

      // Get most recent registration
      const sortedSubs = subscriptions?.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastRegistration = sortedSubs?.[0]?.created_at || null;

      setDeviceStats({ totalDevices, recentDevices, lastRegistration });
    } catch (error: any) {
      console.error('Error fetching device stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch device statistics",
        variant: "destructive",
      });
    }
  };

  const fetchCourseStats = async () => {
    setIsLoading(true);
    try {
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select('program_slug, course_name');

      if (error) throw error;

      // Get current program names from catalog
      const { data: catalogPrograms } = await supabase
        .from('program_catalog')
        .select('slug, title');

      // Create a map of slug to current title
      const slugToTitle = new Map(
        catalogPrograms?.map(p => [p.slug, p.title]) || []
      );

      // Count enrollments per course using current names
      const statsMap = new Map<string, number>();
      enrollments?.forEach(enrollment => {
        // Get current name from catalog, fallback to stored name
        const currentName = enrollment.program_slug 
          ? slugToTitle.get(enrollment.program_slug) || enrollment.course_name
          : enrollment.course_name;
        
        const count = statsMap.get(currentName) || 0;
        statsMap.set(currentName, count + 1);
      });

      const statsArray: CourseStats[] = Array.from(statsMap.entries()).map(([course_name, student_count]) => ({
        course_name,
        student_count
      }));

      setCourseStats(statsArray.sort((a, b) => b.student_count - a.student_count));
      
      // Also fetch device and install stats
      await Promise.all([fetchDeviceStats(), fetchInstallStats()]);
    } catch (error: any) {
      console.error('Error fetching course stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch course statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseStats();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Comprehensive admin controls</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/auth')} variant="outline" size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up New User
              </Button>
              <Button onClick={fetchCourseStats} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-8 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Enrollment</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                <span className="hidden sm:inline">Audio</span>
              </TabsTrigger>
              <TabsTrigger value="communications" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Comms</span>
              </TabsTrigger>
              <TabsTrigger value="programs" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Programs</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Overview */}
            <TabsContent value="overview" className="space-y-6">
              {/* Course Enrollment Stats */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    <CardTitle>Students Per Course</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {courseStats.length > 0 ? (
                    <div className="space-y-2">
                      {courseStats.map((stat) => (
                        <div key={stat.course_name} className="flex justify-between items-center py-2 border-b last:border-0">
                          <span className="text-sm">{stat.course_name}</span>
                          <span className="font-bold">{stat.student_count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No enrollments yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* App Store Downloads (First Opens) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    <CardTitle>App Store Downloads</CardTitle>
                  </div>
                  <CardDescription>First app opens tracked (closest proxy to actual downloads)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-2xl font-bold">{installStats.totalInstalls}</span>
                      <span className="text-sm text-muted-foreground">Total Downloads</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-2xl font-bold text-primary">{installStats.recentInstalls}</span>
                      <span className="text-sm text-muted-foreground">Last 7 Days</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {installStats.lastInstall 
                          ? new Date(installStats.lastInstall).toLocaleDateString()
                          : 'No downloads yet'}
                      </span>
                      <span className="text-sm text-muted-foreground">Last Download</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Push Notification Devices */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    <CardTitle>Push Notification Devices</CardTitle>
                  </div>
                  <CardDescription>iOS devices with push notifications enabled</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-2xl font-bold">{deviceStats.totalDevices}</span>
                      <span className="text-sm text-muted-foreground">Total Devices</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-2xl font-bold text-primary">{deviceStats.recentDevices}</span>
                      <span className="text-sm text-muted-foreground">Last 7 Days</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {deviceStats.lastRegistration 
                          ? new Date(deviceStats.lastRegistration).toLocaleDateString()
                          : 'No registrations yet'}
                      </span>
                      <span className="text-sm text-muted-foreground">Last Registration</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              
            </TabsContent>

            {/* Tab 2: Users */}
            <TabsContent value="leads" className="space-y-6">
              <LeadsManager />
            </TabsContent>

            {/* Tab 3: Enrollment Management */}
            <TabsContent value="users" className="space-y-6">
              <QuickEnrollUser />
              
              <BulkEnrollCourageousCourse />
              
              <CourseEnrollmentManager />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Enrollment Management
                  </CardTitle>
                  <CardDescription>
                    Sync enrollments from orders and check for refunds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          setIsLoading(true);
                          toast({
                            title: "Checking Refunds...",
                            description: "Checking Stripe for refunded orders"
                          });

                          const { data, error } = await supabase.functions.invoke('handle-refunds');

                          if (error) throw error;

                          toast({
                            title: "Refunds Processed",
                            description: `Found ${data.refundedCount} refunded orders and removed them from enrollments`,
                          });

                          fetchCourseStats();
                        } catch (error: any) {
                          console.error('Refund check error:', error);
                          toast({
                            title: "Error",
                            description: error.message || 'Failed to check refunds',
                            variant: "destructive"
                          });
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Refunds
                    </Button>

                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          toast({
                            title: "Syncing...",
                            description: "Fetching orders and creating enrollments"
                          });

                          const { data: orders, error } = await supabase
                            .from('orders')
                            .select('email, product_name, user_id')
                            .eq('status', 'paid');

                          if (error) throw error;

                          if (!orders || orders.length === 0) {
                            toast({
                              title: "No Orders Found",
                              description: "No paid orders to sync",
                              variant: "destructive"
                            });
                            return;
                          }

                          const validOrders = orders.filter(order => order.user_id);

                          if (validOrders.length === 0) {
                            toast({
                              title: "No Valid Orders",
                              description: "No orders with user accounts found",
                              variant: "destructive"
                            });
                            return;
                          }

                          const enrollments = validOrders.map(order => ({
                            user_id: order.user_id,
                            course_name: order.product_name,
                            status: 'active'
                          }));

                          let successCount = 0;
                          let skipCount = 0;
                          
                          for (const enrollment of enrollments) {
                            const { error: insertError } = await supabase
                              .from('course_enrollments')
                              .insert(enrollment)
                              .select();

                            if (insertError) {
                              if (insertError.code === '23505') {
                                skipCount++;
                              } else {
                                throw insertError;
                              }
                            } else {
                              successCount++;
                            }
                          }

                          toast({
                            title: "Success!",
                            description: `Added ${successCount} new enrollments${skipCount > 0 ? `, skipped ${skipCount} existing` : ''}`
                          });

                          fetchCourseStats();
                        } catch (error: any) {
                          console.error('Sync error:', error);
                          toast({
                            title: "Error",
                            description: error.message || 'Failed to sync enrollments',
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Sync from Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <UserCreditsManager />
            </TabsContent>

            {/* Tab 4: Audio Management */}
            <TabsContent value="audio" className="space-y-6">
              <AudioManager />
            </TabsContent>

            {/* Tab 5: Communications */}
            <TabsContent value="communications" className="space-y-6">
              <AnnouncementCreator />
              <AnnouncementsList />
              {!isNativeApp() && (
                <>
                  <PushNotificationSender />
                  <DeviceManagementPanel />
                  <PushNotificationsHistory />
                </>
              )}
              <EmailLogsViewer />
            </TabsContent>

            {/* Tab 6: Programs */}
            <TabsContent value="programs" className="space-y-6">
              <Tabs defaultValue="catalog" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="catalog">Program Catalog</TabsTrigger>
                  <TabsTrigger value="rounds">Course Rounds</TabsTrigger>
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
            </TabsContent>

            {/* Tab 7: Payments */}
            <TabsContent value="payments" className="space-y-6">
              <StripePaymentsViewer />
            </TabsContent>

            {/* Tab 8: System & Security */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Program Catalog Management
                  </CardTitle>
                  <CardDescription>
                    Program catalog is now managed through the Programs tab. All program data is stored in the database.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      ✓ Programs are now managed directly in the database via the Programs tab
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ All changes to program names, prices, and details are instantly reflected throughout the app
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✓ No need to sync - database is the single source of truth
                    </p>
                  </div>
                </CardContent>
              </Card>

              
              <SecurityAuditLog />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Admin;
