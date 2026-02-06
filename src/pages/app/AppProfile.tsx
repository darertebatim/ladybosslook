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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LogOut, User, Mail, Phone, MapPin, MessageCircle, Calendar, Lock, Send, Bell,
  BookOpen, Wallet, Receipt, Pencil, Check, X, TrendingUp, TrendingDown, ChevronRight, Trash2, AlertTriangle, Settings, PlayCircle
} from 'lucide-react';
import { NativeSettings, IOSSettings, AndroidSettings } from 'capacitor-native-settings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { JournalStats } from '@/components/app/JournalStats';
import { checkCalendarPermission, requestCalendarPermission, isCalendarAvailable } from '@/lib/calendarIntegration';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { useState, useEffect, useMemo } from 'react';
import { checkPermissionStatus, requestNotificationPermission, subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/lib/pushNotifications';
import { resetAllTours } from '@/lib/clientReset';
import { Capacitor } from '@capacitor/core';
import { format, startOfMonth } from 'date-fns';
import { useJournalEntries, JournalEntry } from '@/hooks/useJournal';

// Debug mode to preview iOS-only components in web browser
const useShowNativeSettings = () => {
  const [searchParams] = useSearchParams();
  const debugNative = searchParams.get('debugNative') === 'true';
  return Capacitor.isNativePlatform() || debugNative;
};

// Stats Pill Component
const StatPill = ({ label, value, icon: Icon }: { label: string; value: number | string; icon?: React.ComponentType<{ className?: string }> }) => (
  <div className="flex flex-col items-center bg-background/60 dark:bg-background/30 px-4 py-2.5 rounded-xl backdrop-blur-sm min-w-[70px]">
    {Icon && <Icon className="h-4 w-4 text-muted-foreground mb-0.5" />}
    <span className="text-lg font-bold">{value}</span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
);

// Calculate monthly presence (replaces streak - strength-first philosophy)
const calculateMonthlyPresence = (entries: JournalEntry[]): number => {
  if (!entries || entries.length === 0) return 0;

  const now = new Date();
  const monthStart = startOfMonth(now);
  
  const uniqueDays = new Set<string>();
  
  entries.forEach(entry => {
    const entryDate = new Date(entry.created_at);
    if (entryDate >= monthStart) {
      uniqueDays.add(format(entryDate, 'yyyy-MM-dd'));
    }
  });

  return uniqueDays.size;
};

const AppProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { unreadCount } = useUnreadChat();
  const showNativeSettings = useShowNativeSettings();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'checking' | 'active' | 'none'>('checking');
  const [calendarPermission, setCalendarPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isRequestingCalendar, setIsRequestingCalendar] = useState(false);
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(() => {
    return localStorage.getItem('autoSyncCalendar') === 'true';
  });
  
  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Editable profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedCity, setEditedCity] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Journal entries for monthly presence calculation
  const { data: journalEntries } = useJournalEntries();
  const daysThisMonth = useMemo(() => calculateMonthlyPresence(journalEntries || []), [journalEntries]);

  // Test push notification
  const handleTestNotification = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to test notifications',
        variant: 'destructive',
      });
      return;
    }

    setIsTestingNotification(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds: [user.id],
          title: '🔔 Test Notification',
          body: 'Your push notifications are working correctly!',
          url: '/app/profile',
        },
      });

      if (error) throw error;

      if (data?.sent > 0) {
        toast({
          title: 'Test Sent!',
          description: 'Check your notifications in a moment',
        });
      } else if (data?.failed > 0) {
        toast({
          title: 'Delivery Issue',
          description: 'Test was sent but delivery failed. Try re-registering.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'No Device Found',
          description: 'No registered device found. Try re-registering notifications.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Test notification error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test notification',
        variant: 'destructive',
      });
    } finally {
      setIsTestingNotification(false);
    }
  };

  // Check notification permission and subscription status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (Capacitor.isNativePlatform() && user?.id) {
        const status = await checkPermissionStatus();
        setNotificationPermission(status);

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
          setSubscriptionStatus('active');
        } else {
          setSubscriptionStatus('none');
        }
        
        if (isCalendarAvailable()) {
          const calStatus = await checkCalendarPermission();
          setCalendarPermission(calStatus);
        }
      }
    };
    checkStatus();
  }, [user?.id]);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({
        title: 'Confirmation Required',
        description: 'Please type DELETE to confirm account deletion',
        variant: 'destructive',
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to delete your account',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-own-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Delete account error:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete account. Please contact support.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.success) {
        toast({
          title: 'Account Deleted',
          description: 'Your account has been permanently deleted',
        });
        await signOut();
        navigate('/auth');
      } else {
        toast({
          title: 'Error',
          description: data?.error || 'Failed to delete account',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteDialog(false);
      setDeleteConfirmText('');
    }
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

  // Enable notifications
  const handleEnableNotifications = async () => {
    setIsEnablingNotifications(true);
    try {
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        const result = await subscribeToPushNotifications(user?.id || '');
        
        if (result.success) {
          setNotificationPermission('granted');
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
          queryClient.invalidateQueries({ queryKey: ['push-subscription', user?.id] });
        } else {
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

  // Disable notifications
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

  // Open native app settings
  const handleOpenAppSettings = async () => {
    try {
      await NativeSettings.open({
        optionAndroid: AndroidSettings.ApplicationDetails,
        optionIOS: IOSSettings.App,
      });
    } catch (error) {
      console.error('Failed to open settings:', error);
      toast({
        title: 'Error',
        description: 'Could not open settings',
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

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || 'U';

  const programCount = enrollments?.length || 0;
  const creditBalance = wallet?.credits_balance || 0;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <SEOHead 
        title="Profile - LadyBoss Academy"
        description="Your profile settings"
      />
      
      {/* Hero Header with Profile */}
      <header 
        className="shrink-0 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pt-3 pb-1 px-4 text-center">
          <h1 className="font-semibold text-lg">Profile</h1>
        </div>
        
        {/* Avatar + Name */}
        <div className="flex flex-col items-center py-3">
          <Avatar className="h-20 w-20 ring-4 ring-background/50 shadow-lg">
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="font-bold text-lg mt-3">{profile?.full_name || 'User'}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        
        {/* Stats Pills - Strength-first: shows days this month, not streak */}
        <div className="flex justify-center gap-3 pb-4 px-4">
          <StatPill label="Programs" value={programCount} icon={BookOpen} />
          <StatPill label="This Month" value={daysThisMonth} icon={Calendar} />
          <StatPill label="Credits" value={`$${creditBalance}`} icon={Wallet} />
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="account" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="shrink-0 mx-4 mt-4 mb-2 grid grid-cols-3 h-11 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Account
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm relative">
            Settings
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Account Tab */}
        <TabsContent value="account" className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe mt-0 space-y-4">
          {/* Profile Info Card */}
          <Card className="rounded-2xl shadow-sm border-0 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Info
              </CardTitle>
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
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm p-2 bg-muted/30 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{profile?.email || user?.email}</span>
              </div>
              
              {isEditingProfile ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="editName" className="text-xs text-muted-foreground">Full Name</Label>
                    <Input
                      id="editName"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="editPhone" className="text-xs text-muted-foreground">Phone</Label>
                    <Input
                      id="editPhone"
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      placeholder="Your phone number"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="editCity" className="text-xs text-muted-foreground">City</Label>
                    <Input
                      id="editCity"
                      value={editedCity}
                      onChange={(e) => setEditedCity(e.target.value)}
                      placeholder="Your city"
                    />
                  </div>
                </>
              ) : (
                <>
                  {profile?.full_name && (
                    <div className="flex items-center gap-3 text-sm p-2 bg-muted/30 rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.full_name}</span>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-3 text-sm p-2 bg-muted/30 rounded-lg">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile?.city && (
                    <div className="flex items-center gap-3 text-sm p-2 bg-muted/30 rounded-lg">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.city}</span>
                    </div>
                  )}
                  {!profile?.full_name && !profile?.phone && !profile?.city && (
                    <p className="text-sm text-muted-foreground p-2">Tap Edit to add your details</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Password Card */}
          <Card className="rounded-2xl shadow-sm border-0 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs text-muted-foreground">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChangingPassword}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirm Password</Label>
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

          {/* Actions Card */}
          <Card className="rounded-2xl shadow-sm border-0 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start h-12 rounded-xl bg-muted/30"
                onClick={() => {
                  resetAllTours();
                  navigate('/app/home');
                  toast({ title: 'Tours Reset', description: 'All feature tours will restart when you visit each section.' });
                }}
              >
                <PlayCircle className="mr-3 h-4 w-4" />
                Restart All Tours
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-12 rounded-xl bg-muted/30"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </Button>
              
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-3 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Your Account?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>
                        This action is <strong>permanent and cannot be undone</strong>. 
                        All your data will be immediately deleted, including:
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                        <li>Your profile and account information</li>
                        <li>All course enrollments and progress</li>
                        <li>Journal entries and chat history</li>
                        <li>Audio bookmarks and listening history</li>
                        <li>Wallet balance and transaction history</li>
                      </ul>
                      <div className="pt-2">
                        <Label htmlFor="deleteConfirm" className="text-sm font-medium">
                          Type <span className="font-bold text-destructive">DELETE</span> to confirm:
                        </Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                          placeholder="Type DELETE"
                          className="mt-2"
                          disabled={isDeletingAccount}
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel 
                      disabled={isDeletingAccount}
                      onClick={() => setDeleteConfirmText('')}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                    >
                      {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe mt-0 space-y-4">
          {/* Journal Stats */}
          <JournalStats className="rounded-2xl shadow-sm border-0" />

          {/* My Programs Card */}
          <Card className="rounded-2xl shadow-sm border-0 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                My Programs
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app/programs">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {enrollments && enrollments.length > 0 ? (
                <div className="space-y-2">
                  {enrollments.map((enrollment) => (
                    <Link
                      key={enrollment.id}
                      to={`/app/course/${enrollment.program_slug || enrollment.course_name}`}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
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

          {/* Wallet Card */}
          <Card className="rounded-2xl shadow-sm border-0 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallet & Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold">{wallet?.credits_balance || 0} Credits</p>
                </div>
                <Wallet className="h-8 w-8 text-primary/30" />
              </div>

              {transactions && transactions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Recent Transactions</p>
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        {tx.amount > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm truncate max-w-[140px]">{tx.description || tx.transaction_type}</span>
                      </div>
                      <span className={`text-sm font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders Card */}
          <Card className="rounded-2xl shadow-sm border-0 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
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
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe mt-0 space-y-4">
          {/* Support Card */}
          <Card className="rounded-2xl shadow-sm border-0 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full relative"
                onClick={() => navigate('/app/chat')}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat with Support
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or via Telegram</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs text-muted-foreground">Subject</Label>
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
              
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs text-muted-foreground">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={3}
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

          {/* Push Notifications Card - Native Only */}
          {showNativeSettings && (
            <Card className="rounded-2xl shadow-sm border-0 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Status Badge */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
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
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleDisableNotifications}
                        className="flex-1"
                        size="sm"
                      >
                        Disable
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleEnableNotifications}
                        disabled={isEnablingNotifications}
                        className="flex-1"
                        size="sm"
                      >
                        {isEnablingNotifications ? 'Re-registering...' : 'Re-register'}
                      </Button>
                    </div>
                    <Button 
                      onClick={handleTestNotification}
                      disabled={isTestingNotification}
                      className="w-full"
                      size="sm"
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      {isTestingNotification ? 'Sending...' : 'Send Test Notification'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={handleOpenAppSettings}
                      className="w-full text-muted-foreground"
                      size="sm"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Open Settings
                    </Button>
                  </div>
                )}
                
                {/* Disabled State */}
                {notificationPermission === 'granted' && subscriptionStatus === 'none' && (
                  <Button 
                    onClick={handleEnableNotifications} 
                    className="w-full"
                    disabled={isEnablingNotifications}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    {isEnablingNotifications ? 'Enabling...' : 'Enable Notifications'}
                  </Button>
                )}

                {/* Not Enabled State */}
                {notificationPermission !== 'granted' && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {notificationPermission === 'denied'
                        ? 'Notifications are disabled. Enable them in Settings.'
                        : 'Get notified about new content and updates'}
                    </p>
                    {notificationPermission === 'denied' ? (
                      <Button onClick={handleOpenAppSettings} className="w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Open Settings
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleEnableNotifications} 
                        className="w-full"
                        disabled={isEnablingNotifications}
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        {isEnablingNotifications ? 'Enabling...' : 'Enable Notifications'}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Calendar Sync Card - Native Only */}
          {showNativeSettings && (
            <Card className="rounded-2xl shadow-sm border-0 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar Sync
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Status Badge */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
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
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Auto-Sync on Enrollment</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically add sessions when you enroll
                      </p>
                    </div>
                    <Switch
                      checked={autoSyncCalendar}
                      onCheckedChange={handleAutoSyncToggle}
                    />
                  </div>
                )}

                {/* Not Enabled State */}
                {calendarPermission !== 'granted' && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {calendarPermission === 'denied'
                        ? 'Calendar access is disabled. Enable it in Settings.'
                        : 'Add course sessions directly to your calendar'}
                    </p>
                    {calendarPermission === 'denied' ? (
                      <Button onClick={handleOpenAppSettings} className="w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Open Settings
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleEnableCalendar} 
                        className="w-full"
                        disabled={isRequestingCalendar}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {isRequestingCalendar ? 'Requesting...' : 'Enable Calendar Access'}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppProfile;
