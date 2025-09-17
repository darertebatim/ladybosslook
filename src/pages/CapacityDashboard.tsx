import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { LoadTester } from '@/components/LoadTester';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { useToast } from '@/hooks/use-toast';

interface SystemHealth {
  status: string;
  responseTime: number;
  services: {
    database: { healthy: boolean; latency: number };
    mailchimp: { healthy: boolean; latency: number };
  };
  memory: { used: number };
}

interface RecentSubmissions {
  total_today: number;
  successful_today: number;
  error_rate_today: number;
  peak_hour_count: number;
}

export const CapacityDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentStats, setRecentStats] = useState<RecentSubmissions | null>(null);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();

  const checkSystemHealth = async () => {
    setIsHealthChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('health-check');
      
      if (error) {
        console.error('Health check failed:', error);
        toast({
          title: "Health Check Failed",
          description: "Unable to retrieve system status",
          variant: "destructive"
        });
      } else {
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('Health check error:', error);
      toast({
        title: "Health Check Error",
        description: "Connection failed",
        variant: "destructive"
      });
    } finally {
      setIsHealthChecking(false);
    }
  };

  const fetchRecentStats = async () => {
    try {
      // Get today's form submissions
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todaySubmissions, error } = await supabase
        .from('form_submissions')
        .select('*')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`);

      if (error) {
        console.error('Error fetching recent stats:', error);
        setRecentStats({
          total_today: 0,
          successful_today: 0,
          error_rate_today: 0,
          peak_hour_count: 0
        });
        return;
      }

      const totalToday = todaySubmissions?.length || 0;
      const successfulToday = todaySubmissions?.filter((s: any) => s.mailchimp_success === true).length || 0;
      const errorRateToday = totalToday > 0 ? ((totalToday - successfulToday) / totalToday) * 100 : 0;

      // Calculate peak hour (simple approximation)
      const hourlyStats = new Map<number, number>();
      todaySubmissions?.forEach((sub: any) => {
        const hour = new Date(sub.created_at).getHours();
        hourlyStats.set(hour, (hourlyStats.get(hour) || 0) + 1);
      });
      
      const peakHourCount = hourlyStats.size > 0 ? Math.max(...Array.from(hourlyStats.values())) : 0;

      setRecentStats({
        total_today: totalToday,
        successful_today: successfulToday,
        error_rate_today: errorRateToday,
        peak_hour_count: peakHourCount
      });

    } catch (error) {
      console.error('Error calculating recent stats:', error);
      setRecentStats({
        total_today: 0,
        successful_today: 0,
        error_rate_today: 0,
        peak_hour_count: 0
      });
    }
  };

  useEffect(() => {
    checkSystemHealth();
    fetchRecentStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      checkSystemHealth();
      fetchRecentStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 1000) return 'text-green-600';
    if (latency < 2000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Capacity Dashboard</h1>
        <div className="flex gap-4">
          <Button 
            onClick={checkSystemHealth} 
            disabled={isHealthChecking}
            variant="outline"
          >
            {isHealthChecking ? 'Checking...' : 'Refresh Health'}
          </Button>
          <Button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
          >
            {autoRefresh ? 'Stop Auto-Refresh' : 'Auto-Refresh (30s)'}
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            {systemHealth ? (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(systemHealth.status)}`} />
                <span className="font-semibold capitalize">{systemHealth.status}</span>
              </div>
            ) : (
              <span className="text-gray-500">Loading...</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            {systemHealth ? (
              <div className={`text-2xl font-bold ${getLatencyColor(systemHealth.responseTime)}`}>
                {systemHealth.responseTime}ms
              </div>
            ) : (
              <span className="text-gray-500">Loading...</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
          </CardHeader>
          <CardContent>
            {systemHealth ? (
              <div className="space-y-1">
                <Badge variant={systemHealth.services.database.healthy ? "default" : "destructive"}>
                  {systemHealth.services.database.healthy ? "Healthy" : "Issues"}
                </Badge>
                <div className={`text-sm ${getLatencyColor(systemHealth.services.database.latency)}`}>
                  {systemHealth.services.database.latency}ms
                </div>
              </div>
            ) : (
              <span className="text-gray-500">Loading...</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mailchimp</CardTitle>
          </CardHeader>
          <CardContent>
            {systemHealth ? (
              <div className="space-y-1">
                <Badge variant={systemHealth.services.mailchimp.healthy ? "default" : "destructive"}>
                  {systemHealth.services.mailchimp.healthy ? "Healthy" : "Issues"}
                </Badge>
                <div className={`text-sm ${getLatencyColor(systemHealth.services.mailchimp.latency)}`}>
                  {systemHealth.services.mailchimp.latency}ms
                </div>
              </div>
            ) : (
              <span className="text-gray-500">Loading...</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {recentStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{recentStats.total_today}</div>
                <div className="text-sm text-gray-600">Total Submissions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{recentStats.successful_today}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${recentStats.error_rate_today > 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {recentStats.error_rate_today.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Error Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{recentStats.peak_hour_count}</div>
                <div className="text-sm text-gray-600">Peak Hour Count</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading statistics...</div>
          )}
        </CardContent>
      </Card>

      {/* Capacity Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Capacity Recommendations for 1000-2000 Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Optimizations Implemented</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Increased rate limiting to 50 req/min per IP</li>
                <li>Added burst protection (15 req/10s)</li>
                <li>Enhanced error handling with retry logic</li>
                <li>Performance monitoring and metrics</li>
                <li>Health check endpoint for monitoring</li>
                <li>Backup storage for all submissions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">📊 Performance Targets</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Response time: &lt; 2000ms average</li>
                <li>Error rate: &lt; 5% for high traffic</li>
                <li>Success rate: &gt; 95% during peak load</li>
                <li>Database latency: &lt; 500ms</li>
                <li>Mailchimp latency: &lt; 1500ms</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Load Testing Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Load Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadTester />
        </CardContent>
      </Card>

      {/* Real-time Performance Monitor */}
      <PerformanceMonitor enabled={true} monitoringInterval={15000} />
    </div>
  );
};

export default CapacityDashboard;