import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Users, CheckCircle, AlertCircle, Download, TrendingUp } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import UpdateMailchimpCities from '@/components/UpdateMailchimpCities';
import FixMailchimpAmounts from '@/components/FixMailchimpAmounts';
import SetupAdmin from '@/components/SetupAdmin';
import { CourseStats } from '@/components/admin/CourseStats';
import { AnnouncementCreator } from '@/components/admin/AnnouncementCreator';

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

const Admin = () => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    today: 0
  });
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
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Landing Page Admin</h1>
            <p className="text-muted-foreground">Monitor form submissions and performance</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchSubmissions} variant="outline" size="sm">
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

        {/* Course Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CourseStats />
          <AnnouncementCreator />
        </div>

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