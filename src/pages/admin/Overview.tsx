import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, GraduationCap, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

export default function Overview() {
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({ totalDevices: 0, recentDevices: 0, lastRegistration: null });
  const [installStats, setInstallStats] = useState<InstallStats>({ totalInstalls: 0, recentInstalls: 0, lastInstall: null });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInstallStats = async () => {
    try {
      const { data: installs, error } = await supabase
        .from('app_installations')
        .select('installed_at, platform');

      if (error) throw error;

      const totalInstalls = installs?.length || 0;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentInstalls = installs?.filter(install => 
        new Date(install.installed_at) > sevenDaysAgo
      ).length || 0;

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
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('endpoint, created_at')
        .like('endpoint', 'native:%');

      if (error) throw error;

      const totalDevices = subscriptions?.length || 0;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentDevices = subscriptions?.filter(sub => 
        new Date(sub.created_at) > sevenDaysAgo
      ).length || 0;

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

      const { data: catalogPrograms } = await supabase
        .from('program_catalog')
        .select('slug, title');

      const slugToTitle = new Map(
        catalogPrograms?.map(p => [p.slug, p.title]) || []
      );

      const statsMap = new Map<string, number>();
      enrollments?.forEach(enrollment => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-muted-foreground">Key metrics and statistics</p>
        </div>
        <Button onClick={fetchCourseStats} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

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
    </div>
  );
}
