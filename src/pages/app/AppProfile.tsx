import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadChat } from '@/hooks/useUnreadChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LogOut, User, Mail, Phone, MapPin, MessageCircle, Calendar, Lock, Send, Bell,
  BookOpen, Wallet, Receipt, Pencil, Check, X, TrendingUp, TrendingDown, ChevronRight
} from 'lucide-react';
import { checkCalendarPermission, requestCalendarPermission, isCalendarAvailable } from '@/lib/calendarIntegration';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { useState, useEffect } from 'react';
import { checkPermissionStatus, requestNotificationPermission, subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/lib/pushNotifications';
import { isNativeApp } from '@/lib/platform';
import { format } from 'date-fns';

const AppProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { unreadCount } = useUnreadChat();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'checking' | 'active' | 'none'>('checking');
  const [calendarPermission, setCalendarPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isRequestingCalendar, setIsRequestingCalendar] = useState(false);
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(() => {
    return localStorage.getItem('autoSyncCalendar') === 'true';
  });
  const isNative = isNativeApp();

  // Editable profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedCity, setEditedCity] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Check notification permission and subscription status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (isNative && user?.id) {
        // Check push notification permission
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
        
        // Check calendar permission
        if (isCalendarAvailable()) {
          const calStatus = await checkCalendarPermission();
          setCalendarPermission(calStatus);
        }
      }
    };
    checkStatus();
  }, [isNative, user?.id]);

  // Handle enabling calendar access
  const handleEnableCalendar = async () => {
    setIsRequestingCalendar(true);
    try {
      const result = await requestCalendarPermission();
      setCalendarPermission(result);
      
      if (result === 'granted') {
        toast({
          title: 'Calendar Access Enabled',
          description: 'Course sessions can now be added directly to your calendar',
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please enable calendar access in Settings > LadyBoss Academy',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Calendar permission error:', error);
      toast({
        title: 'Error',
        description: 'Failed to request calendar permission',
        variant: 'destructive',
      });
    } finally {
      setIsRequestingCalendar(false);
    }
  };

  // Handle auto-sync toggle
  const handleAutoSyncToggle = async (enabled: boolean) => {
    if (enabled && calendarPermission !== 'granted') {
      // Request permission first
      const result = await requestCalendarPermission();
      setCalendarPermission(result);
      
      if (result !== 'granted') {
        toast({
          title: 'Permission Required',
          description: 'Calendar access is needed to auto-sync sessions',
          variant: 'destructive',
        });
        return;
      }
    }
    
    setAutoSyncCalendar(enabled);
    localStorage.setItem('autoSyncCalendar', enabled.toString());
    
    toast({
      title: enabled ? 'Auto-Sync Enabled' : 'Auto-Sync Disabled',
      description: enabled 
        ? 'Course sessions will be added to calendar on enrollment'
        : 'Sessions won\'t be auto-added on enrollment',
    });
  };

  const { data: profile, refetch: refetchProfile } = useQuery({
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

  // Fetch course enrollments
  const { data: enrollments } = useQuery({
    queryKey: ['profile-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*, program_rounds(round_name, status)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('enrolled_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch wallet balance
  const { data: wallet } = useQuery({
    queryKey: ['profile-wallet', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('credits_balance')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch credit transactions
  const { data: transactions } = useQuery({
    queryKey: ['profile-transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch orders
  const { data: orders } = useQuery({
    queryKey: ['profile-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Initialize edit fields when profile loads
  useEffect(() => {
    if (profile) {
      setEditedName(profile.full_name || '');
      setEditedPhone(profile.phone || '');
      setEditedCity(profile.city || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedName.trim(),
          phone: editedPhone.trim(),
          city: editedCity.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully',
      });
      setIsEditingProfile(false);
      refetchProfile();
    } catch (error: any) {
      console.error('Save profile error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(profile?.full_name || '');
    setEditedPhone(profile?.phone || '');
    setEditedCity(profile?.city || '');
    setIsEditingProfile(false);
  };

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

  // Enable notifications - Updated to refresh subscription status and provide better feedback
  const handleEnableNotifications = async () => {
    setIsEnablingNotifications(true);
    try {
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        const result = await subscribeToPushNotifications(user?.id || '');
        
        if (result.success) {
          setNotificationPermission('granted');
          // Check if already enabled vs newly enabled
          if (subscriptionStatus === 'active') {
            toast({
              title: 'Already Enabled',
              description: 'Notifications are already enabled',
            });
          } else {
            setSubscriptionStatus('active');
            toast({
              title: 'Notifications Enabled',
              description: 'You will now receive push notifications',
            });
          }
          // Refetch subscription status
          queryClient.invalidateQueries({ queryKey: ['push-subscription', user?.id] });
        } else {
          // Specific error handling
          if (result.error === 'Permission denied') {
            toast({
              title: 'Permission Denied',
              description: 'Please open iOS Settings > LadyBoss Academy > Notifications to enable.',
              variant: 'destructive',
            });
          } else if (result.error === 'Registration timeout') {
            toast({
              title: 'Connection Issue',
              description: 'Could not connect to Apple\'s notification service. Please try again from this screen.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description: result.error || 'Failed to enable notifications',
              variant: 'destructive',
            });
          }
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

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'refunded':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <SEOHead 
        title="Profile - LadyBoss Academy"
        description="Your profile settings"
      />
      
      {/* Fixed Header with safe area */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pt-6 pb-3 px-4">
          <h1 className="font-semibold text-lg">Profile</h1>
          <p className="text-xs text-muted-foreground">Manage your account</p>
        </div>
      </header>
      
      {/* Header spacer */}
      <div style={{ height: 'calc(76px + env(safe-area-inset-top, 0px))' }} />
      
      <div className="container max-w-4xl py-4 px-4">
      <div className="space-y-6">

        {/* Quick Navigation */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
            onClick={() => scrollToSection('courses-section')}
            className="flex flex-col h-auto py-3 gap-1"
          >
            <BookOpen className="h-4 w-4" />
            <span className="text-xs">Courses</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection('wallet-section')}
            className="flex flex-col h-auto py-3 gap-1"
          >
            <Wallet className="h-4 w-4" />
            <span className="text-xs">Wallet</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection('orders-section')}
            className="flex flex-col h-auto py-3 gap-1"
          >
            <Receipt className="h-4 w-4" />
            <span className="text-xs">Orders</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection('support-section')}
            className="flex flex-col h-auto py-3 gap-1 relative"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Support</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection('actions-section')}
            className="flex flex-col h-auto py-3 gap-1"
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

        {/* Editable Account Information */}
        <Card id="info-section">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Account Information</CardTitle>
            {!isEditingProfile ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancelEdit}
                  disabled={isSavingProfile}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {isSavingProfile ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{profile?.email || user?.email}</span>
            </div>
            
            {isEditingProfile ? (
              <>
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-3 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="editName" className="text-xs text-muted-foreground">Full Name</Label>
                    <Input
                      id="editName"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-3 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="editPhone" className="text-xs text-muted-foreground">Phone</Label>
                    <Input
                      id="editPhone"
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-3 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="editCity" className="text-xs text-muted-foreground">City</Label>
                    <Input
                      id="editCity"
                      value={editedCity}
                      onChange={(e) => setEditedCity(e.target.value)}
                      placeholder="Your city"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {profile?.full_name && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.full_name}</span>
                  </div>
                )}
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
                {!profile?.full_name && !profile?.phone && !profile?.city && (
                  <p className="text-sm text-muted-foreground">Tap Edit to add your details</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* My Courses Section */}
        <Card id="courses-section">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Courses
              </CardTitle>
              <CardDescription>Your enrolled programs</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/courses">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {enrollments && enrollments.length > 0 ? (
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <Link
                    key={enrollment.id}
                    to={`/app/courses/${enrollment.program_slug || enrollment.course_name}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{enrollment.course_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Enrolled {format(new Date(enrollment.enrolled_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {(enrollment.program_rounds as any)?.status || 'active'}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No courses yet</p>
                <Button variant="link" size="sm" asChild>
                  <Link to="/app/store">Browse Programs</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet & Credits Section */}
        <Card id="wallet-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet & Credits
            </CardTitle>
            <CardDescription>Your credit balance and transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Balance Display */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">{wallet?.credits_balance || 0} Credits</p>
              </div>
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>

            {/* Recent Transactions */}
            {transactions && transactions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent Transactions</p>
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      {tx.transaction_type === 'credit' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm">{tx.description || tx.transaction_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${tx.transaction_type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.transaction_type === 'credit' ? '+' : '-'}{Math.abs(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
            )}
          </CardContent>
        </Card>

        {/* Order History Section */}
        <Card id="orders-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Order History
            </CardTitle>
            <CardDescription>Your past purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{order.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-medium">
                        {formatCurrency(order.amount, order.currency || 'usd')}
                      </span>
                      <Badge variant={getStatusBadgeVariant(order.status || 'completed')}>
                        {order.refunded ? 'Refunded' : (order.status || 'Completed')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Section with In-App Chat Button */}
        <Card id="support-section">
          <CardHeader>
            <CardTitle>Contact & Support</CardTitle>
            <CardDescription>Get help from our team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* In-App Chat Button - Primary */}
            <Button
              className="w-full relative"
              onClick={() => navigate('/app/support-chat')}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with Support
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or via Telegram</span>
              </div>
            </div>

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
              variant="outline"
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

        {/* Calendar Sync Section - Native Only */}
        {isNative && isCalendarAvailable() && (
          <Card id="calendar-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar Sync
              </CardTitle>
              <CardDescription>
                Add course sessions directly to your iOS Calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    calendarPermission === 'granted' 
                      ? 'bg-green-500' 
                      : calendarPermission === 'denied'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm font-medium">
                    {calendarPermission === 'granted'
                      ? 'Enabled'
                      : calendarPermission === 'denied'
                      ? 'Denied'
                      : 'Not Enabled'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {calendarPermission === 'granted' 
                    ? 'Can add events'
                    : calendarPermission === 'denied'
                    ? 'Permission denied'
                    : 'Tap to enable'}
                </span>
              </div>

              {/* Enabled State */}
              {calendarPermission === 'granted' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">✅ Calendar Access Enabled</p>
                    <p className="text-sm text-muted-foreground">
                      When you tap "Add to Calendar" in a course, sessions will be added directly to your iOS Calendar with reminders.
                    </p>
                  </div>
                  
                  {/* Auto-sync toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Auto-Sync on Enrollment</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically add all sessions when you enroll
                      </p>
                    </div>
                    <Switch
                      checked={autoSyncCalendar}
                      onCheckedChange={handleAutoSyncToggle}
                    />
                  </div>
                </div>
              )}

              {/* Not Enabled State */}
              {calendarPermission !== 'granted' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {calendarPermission === 'denied' 
                        ? '⚠️ Permission Denied' 
                        : '📅 Enable Calendar Sync'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {calendarPermission === 'denied'
                        ? 'Calendar access is disabled. Enable it in Settings > LadyBoss Academy > Calendars'
                        : 'Allow calendar access to add course sessions directly to your iPhone calendar with automatic reminders'}
                    </p>
                  </div>
                  <Button 
                    onClick={handleEnableCalendar} 
                    className="w-full"
                    disabled={isRequestingCalendar || calendarPermission === 'denied'}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {isRequestingCalendar 
                      ? 'Requesting...' 
                      : calendarPermission === 'denied'
                      ? 'Open Settings to Enable'
                      : 'Enable Calendar Access'}
                  </Button>
                  {calendarPermission === 'denied' && (
                    <p className="text-xs text-muted-foreground text-center">
                      Tap Settings app → LadyBoss Academy → Calendars → Enable
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
    </>
  );
};

export default AppProfile;
