import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Mail, Phone, MapPin, MessageCircle, Calendar, Lock, Send, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { useState, useEffect } from 'react';
import { checkPermissionStatus, requestNotificationPermission, subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/lib/pushNotifications';
import { isNativeApp } from '@/lib/platform';

const AppProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'checking' | 'active' | 'none'>('checking');
  const isNative = isNativeApp();

  // Check notification permission and subscription status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (isNative && user?.id) {
        // Check permission
        const status = await checkPermissionStatus();
        setNotificationPermission(status);

        // Check if user has active subscription in database
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('id, endpoint, created_at')
          .eq('user_id', user.id)
          .like('endpoint', 'native:%')
          .limit(1);

        if (error) {
          console.error('[Profile] Error checking subscription:', error);
          setSubscriptionStatus('none');
        } else if (data && data.length > 0) {
          console.log('[Profile] Active subscription found:', data[0]);
          setSubscriptionStatus('active');
        } else {
          console.log('[Profile] No active subscription found');
          setSubscriptionStatus('none');
        }
      }
    };
    checkStatus();
  }, [isNative, user?.id]);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully',
    });
    navigate('/auth');
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all password fields',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });

      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || 'U';

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Enable notifications - Updated to refresh subscription status
  const handleEnableNotifications = async () => {
    setIsEnablingNotifications(true);
    try {
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        const result = await subscribeToPushNotifications(user?.id || '');
        
        if (result.success) {
          setNotificationPermission('granted');
          setSubscriptionStatus('active');
          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive push notifications',
          });
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to enable notifications',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in Settings > LadyBoss Academy > Notifications',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Enable notifications error:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications',
        variant: 'destructive',
      });
    } finally {
      setIsEnablingNotifications(false);
    }
  };

  // Disable notifications - Updated to refresh subscription status
  const handleDisableNotifications = async () => {
    try {
      const result = await unsubscribeFromPushNotifications(user?.id || '');
      
      if (result.success) {
        setNotificationPermission('default');
        setSubscriptionStatus('none');
        toast({
          title: 'Notifications Disabled',
          description: 'You will no longer receive push notifications',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to disable notifications',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Disable notifications error:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable notifications',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container max-w-4xl py-6 px-4">
      <SEOHead 
        title="Profile - LadyBoss Academy"
        description="Your profile settings"
      />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection('info-section')}
            className="flex flex-col h-auto py-3 gap-1"
          >
            <User className="h-4 w-4" />
            <span className="text-xs">Info</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection('support-section')}
            className="flex flex-col h-auto py-3 gap-1"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Support</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection('password-section')}
            className="flex flex-col h-auto py-3 gap-1"
          >
            <Lock className="h-4 w-4" />
            <span className="text-xs">Password</span>
          </Button>
          {isNative && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollToSection('notifications-section')}
              className="flex flex-col h-auto py-3 gap-1"
            >
              <Bell className="h-4 w-4" />
              <span className="text-xs">Notifications</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection('actions-section')}
            className="flex flex-col h-auto py-3 gap-1 col-span-2 sm:col-span-1"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs">Sign Out</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{profile?.full_name || 'User'}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card id="info-section">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{profile?.email || user?.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile?.city && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.city}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="support-section">
          <CardHeader>
            <CardTitle>Contact & Support</CardTitle>
            <CardDescription>Send us a message on Telegram @ladybosslook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <select
                id="subject"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
              >
                <option value="">Select a topic...</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Refund Request">Refund Request</option>
                <option value="Cancel Subscription">Cancel Subscription</option>
                <option value="Course Question">Course Question</option>
                <option value="Billing Issue">Billing Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => {
                if (!contactSubject || !contactMessage.trim()) {
                  toast({
                    title: 'Error',
                    description: 'Please select a subject and enter a message',
                    variant: 'destructive',
                  });
                  return;
                }
                const telegramMessage = `Subject: ${contactSubject}\n\nMessage:\n${contactMessage}`;
                window.open(`https://t.me/ladybosslook?text=${encodeURIComponent(telegramMessage)}`, '_blank');
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Send via Telegram
            </Button>
          </CardContent>
        </Card>

        {isNative && (
          <Card id="notifications-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Push Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences and stay updated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    notificationPermission === 'granted' && subscriptionStatus === 'active' 
                      ? 'bg-green-500' 
                      : notificationPermission === 'denied'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm font-medium">
                    {subscriptionStatus === 'checking' 
                      ? 'Checking status...'
                      : notificationPermission === 'granted' && subscriptionStatus === 'active'
                      ? 'Active'
                      : notificationPermission === 'denied'
                      ? 'Denied'
                      : 'Not Enabled'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {notificationPermission === 'granted' && subscriptionStatus === 'active' 
                    ? 'Receiving notifications'
                    : notificationPermission === 'denied'
                    ? 'Permission denied'
                    : 'No notifications'}
                </span>
              </div>

              {/* Enabled State */}
              {notificationPermission === 'granted' && subscriptionStatus === 'active' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">✅ Notifications Enabled</p>
                    <p className="text-sm text-muted-foreground">
                      You'll receive course updates, reminders, and announcements
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleDisableNotifications}
                      className="flex-1"
                    >
                      Disable
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleEnableNotifications}
                      disabled={isEnablingNotifications}
                      className="flex-1"
                    >
                      {isEnablingNotifications ? 'Re-registering...' : 'Re-register'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Use "Re-register" if you're not receiving notifications
                  </p>
                </div>
              )}
              
              {/* Disabled State (permission granted but subscription removed) */}
              {notificationPermission === 'granted' && subscriptionStatus === 'none' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">🟡 Not Enabled</p>
                    <p className="text-sm text-muted-foreground">
                      No notifications
                    </p>
                  </div>
                  <Button 
                    onClick={handleEnableNotifications} 
                    className="w-full"
                    disabled={isEnablingNotifications}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    {isEnablingNotifications ? 'Enabling...' : 'Enable Notifications'}
                  </Button>
                </div>
              )}

              {/* Not Enabled State (no permission) */}
              {notificationPermission !== 'granted' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {notificationPermission === 'denied' 
                        ? '⚠️ Permission Denied' 
                        : '🔔 Enable Notifications'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notificationPermission === 'denied'
                        ? 'Notifications are disabled. Enable them in Settings > LadyBoss Academy > Notifications'
                        : 'Get notified about new courses, content updates, and important announcements'}
                    </p>
                  </div>
                  <Button 
                    onClick={handleEnableNotifications} 
                    className="w-full"
                    disabled={isEnablingNotifications || notificationPermission === 'denied'}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    {isEnablingNotifications 
                      ? 'Enabling...' 
                      : notificationPermission === 'denied'
                      ? 'Open Settings to Enable'
                      : 'Enable Notifications'}
                  </Button>
                  {notificationPermission === 'denied' && (
                    <p className="text-xs text-muted-foreground text-center">
                      Tap your Settings app → LadyBoss Academy → Notifications → Allow Notifications
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card id="password-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword}
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              <Lock className="mr-2 h-4 w-4" />
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>

        <Card id="actions-section">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppProfile;
