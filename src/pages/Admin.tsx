import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, GraduationCap, LayoutDashboard, UserCog, Send, Shield, LogOut, Search, Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { UserCreditsManager } from '@/components/admin/UserCreditsManager';
import { CourseEnrollmentManager } from '@/components/admin/CourseEnrollmentManager';
import { BulkEnrollCourageousCourse } from '@/components/admin/BulkEnrollCourageousCourse';
import { AnnouncementCreator } from '@/components/admin/AnnouncementCreator';
import { AnnouncementsList } from '@/components/admin/AnnouncementsList';
import { PushNotificationSender } from '@/components/admin/PushNotificationSender';
import { PushNotificationsHistory } from '@/components/admin/PushNotificationsHistory';
import { VapidKeyGenerator } from '@/components/admin/VapidKeyGenerator';
import { EmailLogsViewer } from '@/components/admin/EmailLogsViewer';
import { PWAInstallStats } from '@/components/admin/PWAInstallStats';
import { ProgramsManager } from '@/components/admin/ProgramsManager';
import { ProgramRoundsManager } from '@/components/admin/ProgramRoundsManager';
import { LeadsManager } from '@/components/admin/LeadsManager';
import SecurityAuditLog from '@/components/SecurityAuditLog';
import { usePrograms } from '@/hooks/usePrograms';

interface CourseStats {
  course_name: string;
  student_count: number;
}

const Admin = () => {
  const { programs } = usePrograms();
  const navigate = useNavigate();
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
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

  const fetchCourseStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('course_name');

      if (error) throw error;

      // Count enrollments per course
      const statsMap = new Map<string, number>();
      data?.forEach(enrollment => {
        const count = statsMap.get(enrollment.course_name) || 0;
        statsMap.set(enrollment.course_name, count + 1);
      });

      const statsArray: CourseStats[] = Array.from(statsMap.entries()).map(([course_name, student_count]) => ({
        course_name,
        student_count
      }));

      setCourseStats(statsArray.sort((a, b) => b.student_count - a.student_count));
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
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span>Enrollment</span>
              </TabsTrigger>
              <TabsTrigger value="communications" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                <span>Communications</span>
              </TabsTrigger>
              <TabsTrigger value="programs" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span>Programs</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>System</span>
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

              <PWAInstallStats />
            </TabsContent>

            {/* Tab 2: Users */}
            <TabsContent value="leads" className="space-y-6">
              <LeadsManager />
            </TabsContent>

            {/* Tab 3: Enrollment Management */}
            <TabsContent value="users" className="space-y-6">
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

            {/* Tab 4: Communications */}
            <TabsContent value="communications" className="space-y-6">
              <AnnouncementCreator />
              <AnnouncementsList />
              <PushNotificationSender />
              <PushNotificationsHistory />
              <EmailLogsViewer />
            </TabsContent>

            {/* Tab 5: Programs */}
            <TabsContent value="programs" className="space-y-6">
              <Tabs defaultValue="catalog" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="catalog">Program Catalog</TabsTrigger>
                  <TabsTrigger value="rounds">Course Rounds</TabsTrigger>
                </TabsList>
                <TabsContent value="catalog">
                  <ProgramsManager />
                </TabsContent>
                <TabsContent value="rounds">
                  <ProgramRoundsManager />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Tab 6: System & Security */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Program Catalog Sync
                  </CardTitle>
                  <CardDescription>
                    Sync program definitions from code to database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const programCatalogData = programs.map(p => ({
                          slug: p.slug,
                          title: p.title,
                          type: p.type,
                          payment_type: p.paymentType,
                          price_amount: p.priceAmount,
                          is_active: true
                        }));

                        const { error } = await supabase
                          .from('program_catalog')
                          .upsert(programCatalogData, { 
                            onConflict: 'slug',
                            ignoreDuplicates: false 
                          });

                        if (error) throw error;

                        toast({
                          title: "Success",
                          description: `Synced ${programs.length} programs to database`,
                        });
                      } catch (error: any) {
                        console.error('Sync error:', error);
                        toast({
                          title: "Error",
                          description: error.message,
                          variant: "destructive",
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Syncing...' : `Sync ${programs.length} Programs to Database`}
                  </Button>
                </CardContent>
              </Card>

              <VapidKeyGenerator />
              <SecurityAuditLog />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Admin;
