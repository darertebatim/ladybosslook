import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Smartphone, Monitor, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DeviceSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export const DeviceManagementPanel = () => {
  const [devices, setDevices] = useState<DeviceSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      // Phase 7: Fetch only native iOS subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('push_subscriptions')
        .select('id, user_id, endpoint, created_at')
        .like('endpoint', 'native:%')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Get unique user IDs
      const userIds = [...new Set(subscriptions?.map(s => s.user_id) || [])];

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Combine subscriptions with profile data
      const formattedDevices = subscriptions?.map((sub) => {
        const profile = profilesMap.get(sub.user_id);
        return {
          id: sub.id,
          user_id: sub.user_id,
          endpoint: sub.endpoint,
          created_at: sub.created_at,
          user_email: profile?.email,
          user_name: profile?.full_name,
        };
      }) || [];

      setDevices(formattedDevices);
    } catch (error: any) {
      console.error('Error fetching devices:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch registered devices',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const getPlatformInfo = (endpoint: string) => {
    if (endpoint.startsWith('native:')) {
      return {
        type: 'native',
        icon: Smartphone,
        label: 'Native App',
        color: 'bg-blue-500',
      };
    }
    return {
      type: 'web',
      icon: Monitor,
      label: 'Web Browser',
      color: 'bg-green-500',
    };
  };

  const truncateEndpoint = (endpoint: string) => {
    if (endpoint.startsWith('native:')) {
      return endpoint.substring(0, 40) + '...';
    }
    if (endpoint.length > 50) {
      return endpoint.substring(0, 50) + '...';
    }
    return endpoint;
  };

  const handleSendTestNotification = async (userId: string, userEmail: string) => {
    setSendingTo(userId);
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          targetUserEmail: userEmail,
          title: '🧪 Test Notification',
          body: 'This is a test notification to verify your device registration.',
          url: '/app/home',
        },
      });

      if (error) throw error;

      toast({
        title: 'Test Sent',
        description: `Test notification sent to ${userEmail}`,
      });
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test notification',
        variant: 'destructive',
      });
    } finally {
      setSendingTo(null);
    }
  };

  const handleDeleteSubscription = async (id: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete this device subscription for ${userEmail}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Subscription Deleted',
        description: 'Device subscription has been removed',
      });

      fetchDevices();
    } catch (error: any) {
      console.error('Error deleting subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subscription',
        variant: 'destructive',
      });
    }
  };

  const nativeDeviceCount = devices.filter(d => d.endpoint.startsWith('native:')).length;
  const webDeviceCount = devices.filter(d => !d.endpoint.startsWith('native:')).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Registered Devices
            </CardTitle>
            <CardDescription>
              All devices registered for push notifications
            </CardDescription>
          </div>
          <Button onClick={fetchDevices} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">{devices.length}</div>
            <div className="text-sm text-muted-foreground">Total Devices</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{nativeDeviceCount}</div>
            <div className="text-sm text-muted-foreground">Native Apps</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{webDeviceCount}</div>
            <div className="text-sm text-muted-foreground">Web Browser</div>
          </div>
        </div>

        {/* Devices Table */}
        {devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {isLoading ? 'Loading devices...' : 'No registered devices found'}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => {
                  const platform = getPlatformInfo(device.endpoint);
                  const PlatformIcon = platform.icon;
                  
                  return (
                    <TableRow key={device.id}>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <PlatformIcon className="w-3 h-3" />
                          {platform.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{device.user_name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{device.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {truncateEndpoint(device.endpoint)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(device.created_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleSendTestNotification(device.user_id, device.user_email || '')}
                            variant="outline"
                            size="sm"
                            disabled={sendingTo === device.user_id}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Test
                          </Button>
                          <Button
                            onClick={() => handleDeleteSubscription(device.id, device.user_email || '')}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
