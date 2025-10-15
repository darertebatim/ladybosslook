import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Users, CheckCircle, AlertCircle, Download, TrendingUp, Send, GraduationCap } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import UpdateMailchimpCities from '@/components/UpdateMailchimpCities';
import FixMailchimpAmounts from '@/components/FixMailchimpAmounts';
import SetupAdmin from '@/components/SetupAdmin';
import { UserCreditsManager } from '@/components/admin/UserCreditsManager';
import { CourseEnrollmentManager } from '@/components/admin/CourseEnrollmentManager';
import { AnnouncementCreator } from '@/components/admin/AnnouncementCreator';
import { EmailLogsViewer } from '@/components/admin/EmailLogsViewer';
import { usePrograms } from '@/hooks/usePrograms';

interface FormSubmission {
  id: string;
  email: string;
  name: string;
  city: string;
  phone: string;
  source: string;
  mailchimp_success: boolean;
  mailchimp_error: string | null;
  submitted_at: string;
  user_agent: string | null;
  ip_address: string | null;
}

interface CourseStats {
  course_name: string;
  student_count: number;
}

const Admin = () => {
  const { programs } = usePrograms();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    today: 0
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    targetCourse: 'all',
    type: 'general',
    badge: ''
  });
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      setSubmissions((data as FormSubmission[]) || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const successful = data?.filter(s => s.mailchimp_success).length || 0;
      const failed = total - successful;
      
      const today = new Date().toISOString().split('T')[0];
      const todayCount = data?.filter(s => 
        s.submitted_at.startsWith(today)
      ).length || 0;

      setStats({ total, successful, failed, today: todayCount });
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch submissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseStats = async () => {
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
    }
  };

  const sendAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.message) {
      toast({
        title: "Validation Error",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    setIsSendingAnnouncement(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: announcementForm.title,
          message: announcementForm.message,
          target_course: announcementForm.targetCourse === 'all' ? null : announcementForm.targetCourse,
          type: announcementForm.type,
          badge: announcementForm.badge || announcementForm.type
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Announcement sent${announcementForm.targetCourse !== 'all' ? ` to ${announcementForm.targetCourse} students` : ' to all students'}`,
      });

      // Reset form
      setAnnouncementForm({
        title: '',
        message: '',
        targetCourse: 'all',
        type: 'general',
        badge: ''
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Name', 'Email', 'City', 'Phone', 'Mailchimp Success', 'Error', 'Submitted At'].join(','),
      ...submissions.map(sub => [
        sub.name,
        sub.email,
        sub.city,
        sub.phone,
        sub.mailchimp_success ? 'Yes' : 'No',
        sub.mailchimp_error || '',
        new Date(sub.submitted_at).toLocaleString()
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchSubmissions();
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
            <p className="text-muted-foreground">Monitor submissions, enrollments, and send announcements</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { fetchSubmissions(); fetchCourseStats(); }} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}% failure rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
              <p className="text-xs text-muted-foreground">
                Submissions today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Program Sync Tool */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Program Catalog Sync
            </CardTitle>
            <CardDescription>
              Sync program definitions from code to database. Run this after updating program details.
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

        {/* Course Enrollment Manager */}
        <div className="mb-6">
          <CourseEnrollmentManager />
        </div>

        {/* Course Enrollment Stats */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                <CardTitle>Students Per Course</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
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
                size="sm"
                onClick={async () => {
                  try {
                    toast({
                      title: "Syncing...",
                      description: "Fetching orders and creating enrollments"
                    });

                    // Get all paid orders with their product names
                    const { data: orders, error } = await supabase
                      .from('orders')
                      .select('email, product_name, user_id')
                      .eq('status', 'paid');

                    if (error) {
                      console.error('Error fetching orders:', error);
                      throw error;
                    }

                    if (!orders || orders.length === 0) {
                      toast({
                        title: "No Orders Found",
                        description: "No paid orders to sync",
                        variant: "destructive"
                      });
                      return;
                    }

                    console.log(`Found ${orders.length} paid orders`);

                    // Filter orders that have user_id
                    const validOrders = orders.filter(order => order.user_id);
                    console.log(`${validOrders.length} orders have user accounts`);

                    if (validOrders.length === 0) {
                      toast({
                        title: "No Valid Orders",
                        description: "No orders with user accounts found",
                        variant: "destructive"
                      });
                      return;
                    }

                    // Create enrollments for each order
                    const enrollments = validOrders.map(order => ({
                      user_id: order.user_id,
                      course_name: order.product_name,
                      status: 'active'
                    }));

                    console.log('Inserting enrollments:', enrollments.length);

                    // Insert enrollments one by one to handle conflicts
                    let successCount = 0;
                    let skipCount = 0;
                    
                    for (const enrollment of enrollments) {
                      const { error: insertError } = await supabase
                        .from('course_enrollments')
                        .insert(enrollment)
                        .select();

                      if (insertError) {
                        if (insertError.code === '23505') { // Duplicate key error
                          skipCount++;
                        } else {
                          console.error('Insert error:', insertError);
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
                No enrollments yet - Click "Sync from Orders" to import from completed purchases
              </div>
            )}
          </CardContent>
        </Card>

        {/* Send Announcement */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Announcement
            </CardTitle>
            <CardDescription>
              Send announcements to all students or target specific courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Announcement title"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Your announcement message..."
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="targetCourse">Target Course (Optional)</Label>
                  <Select 
                    value={announcementForm.targetCourse} 
                    onValueChange={(value) => setAnnouncementForm({ ...announcementForm, targetCourse: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All students" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      {programs.map(program => (
                        <SelectItem key={program.slug} value={program.title}>{program.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={announcementForm.type} 
                    onValueChange={(value) => setAnnouncementForm({ ...announcementForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="new">New Course</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="badge">Badge Text (Optional)</Label>
                  <Input
                    id="badge"
                    placeholder="e.g., Urgent, New"
                    value={announcementForm.badge}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, badge: e.target.value })}
                  />
                </div>
              </div>

              <Button 
                onClick={sendAnnouncement} 
                disabled={isSendingAnnouncement}
                className="w-full md:w-auto"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSendingAnnouncement ? 'Sending...' : 'Send Announcement'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Announcement Creator */}
        <div className="mb-6">
          <AnnouncementCreator />
        </div>

        {/* Email Delivery Logs */}
        <div className="mb-6">
          <EmailLogsViewer />
        </div>

        {/* User Credits Management */}
        <UserCreditsManager />

        {/* Mailchimp Update Tools */}
        <div className="mb-6 space-y-4">
          <SetupAdmin />
          <UpdateMailchimpCities />
          <FixMailchimpAmounts />
          
          {/* Create Profiles for Existing Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Create Student Profiles</CardTitle>
              <CardDescription>
                Create user accounts and profiles for existing customers who made purchases before the profile system was added
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={async () => {
                  try {
                    toast({
                      title: "Creating profiles...",
                      description: "This may take a moment"
                    });

                    const { data: session } = await supabase.auth.getSession();
                    
                    const { data, error } = await supabase.functions.invoke('create-existing-profiles', {
                      headers: {
                        Authorization: `Bearer ${session.session?.access_token}`
                      }
                    });

                    if (error) throw error;

                    toast({
                      title: "Success!",
                      description: data.message
                    });
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message,
                      variant: "destructive"
                    });
                  }
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                Create Profiles for Existing Customers
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will create accounts for all past customers with their email as the password
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>
              Latest 100 form submissions with status and error details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">City</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Error</th>
                    <th className="text-left p-2">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{submission.name}</td>
                      <td className="p-2">{submission.email}</td>
                      <td className="p-2">{submission.city}</td>
                      <td className="p-2">
                        <Badge variant={submission.mailchimp_success ? "default" : "destructive"}>
                          {submission.mailchimp_success ? "Success" : "Failed"}
                        </Badge>
                      </td>
                      <td className="p-2 max-w-xs">
                        {submission.mailchimp_error && (
                          <span className="text-xs text-muted-foreground truncate block">
                            {submission.mailchimp_error.length > 50 
                              ? submission.mailchimp_error.substring(0, 50) + "..."
                              : submission.mailchimp_error
                            }
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {formatDate(submission.submitted_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {submissions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No submissions found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Performance Monitoring Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• Monitor the success rate - aim for above 95%</p>
            <p>• Check for common error patterns in failed submissions</p>
            <p>• Export data regularly for analysis</p>
            <p>• Failed submissions are still saved as backup for manual processing</p>
            <p>• Watch for rate limiting errors during high traffic periods</p>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default Admin;