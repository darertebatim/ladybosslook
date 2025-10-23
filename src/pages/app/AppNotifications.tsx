import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  requestNotificationPermission, 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  checkPermissionStatus 
} from '@/lib/pushNotifications';
import { SEOHead } from '@/components/SEOHead';

const AppNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPermissionStatus(checkPermissionStatus());
  }, []);

  const handleEnableNotifications = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const permission = await requestNotificationPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        const success = await subscribeToPushNotifications(user.id);
        if (success) {
          setIsSubscribed(true);
          toast({
            title: 'Notifications enabled',
            description: 'You will now receive push notifications',
          });
        } else {
          toast({
            title: 'Subscription failed',
            description: 'Could not subscribe to notifications',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const success = await unsubscribeFromPushNotifications(user.id);
      if (success) {
        setIsSubscribed(false);
        toast({
          title: 'Notifications disabled',
          description: 'You will no longer receive push notifications',
        });
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (permissionStatus === 'granted') {
      return <Check className="h-5 w-5 text-green-500" />;
    } else if (permissionStatus === 'denied') {
      return <X className="h-5 w-5 text-destructive" />;
    }
    return <Bell className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (permissionStatus === 'granted') return 'Enabled';
    if (permissionStatus === 'denied') return 'Blocked';
    return 'Not enabled';
  };

  return (
    <div className="container max-w-4xl py-6 px-4">
      <SEOHead 
        title="Notifications - LadyBoss Academy"
        description="Manage your notification settings"
      />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Manage your notification preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Push Notifications
            </CardTitle>
            <CardDescription>
              Status: {getStatusText()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Enable push notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about announcements and courses
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={isSubscribed}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleEnableNotifications();
                  } else {
                    handleDisableNotifications();
                  }
                }}
                disabled={isLoading || permissionStatus === 'denied'}
              />
            </div>

            {permissionStatus === 'default' && (
              <Button 
                onClick={handleEnableNotifications} 
                disabled={isLoading}
                className="w-full"
              >
                <Bell className="mr-2 h-4 w-4" />
                Enable Push Notifications
              </Button>
            )}

            {permissionStatus === 'denied' && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm">
                <div className="flex items-start gap-2">
                  <BellOff className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Notifications blocked</p>
                    <p className="text-muted-foreground mt-1">
                      Please enable notifications in your browser settings to receive updates.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Push Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Push notifications help you stay updated with:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>New announcements from your instructors</li>
              <li>Course updates and materials</li>
              <li>Important reminders and deadlines</li>
              <li>Community events and opportunities</li>
            </ul>
            <p className="mt-4">
              <strong className="text-foreground">iOS users:</strong> Make sure you've added this app 
              to your home screen for notifications to work.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppNotifications;
