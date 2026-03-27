import { useState, useEffect, useCallback } from 'react';
import { haptic } from '@/lib/haptics';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadChat } from '@/hooks/useUnreadChat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  LogOut, Lock, Bell, MessageCircle, Send, Calendar, ChevronDown,
  Trash2, AlertTriangle, Settings, PlayCircle, Headset, Megaphone, Star, Download, ArrowLeft, ChevronRight
} from 'lucide-react';
import { NativeSettings, IOSSettings, AndroidSettings } from 'capacitor-native-settings';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { NotificationPreferencesCard } from '@/components/app/NotificationPreferencesCard';
import { checkCalendarPermission, requestCalendarPermission, isCalendarAvailable } from '@/lib/calendarIntegration';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { checkPermissionStatus, requestNotificationPermission, subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/lib/pushNotifications';
import { resetAllTours } from '@/lib/clientReset';
import { Capacitor } from '@capacitor/core';

import { useQueryClient } from '@tanstack/react-query';

const useShowNativeSettings = () => {
  const [searchParams] = useSearchParams();
  const debugNative = searchParams.get('debugNative') === 'true';
  return Capacitor.isNativePlatform() || debugNative;
};

const AppSettings = () => {
  const { user, signOut, canAccessAdminPage } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { unreadCount } = useUnreadChat();
  const showNativeSettings = useShowNativeSettings();

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Support
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Notifications
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'checking' | 'active' | 'none'>('checking');

  // Calendar
  const [calendarPermission, setCalendarPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isRequestingCalendar, setIsRequestingCalendar] = useState(false);
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(() => localStorage.getItem('autoSyncCalendar') === 'true');

  // Delete account
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);


  // Accordion
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);


  // Check notification / calendar status
  useEffect(() => {
    const checkStatus = async () => {
      if (Capacitor.isNativePlatform() && user?.id) {
        const status = await checkPermissionStatus();
        setNotificationPermission(status);
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .like('endpoint', 'native:%')
          .limit(1);
        if (error) { setSubscriptionStatus('none'); } 
        else if (data && data.length > 0) { setSubscriptionStatus('active'); } 
        else { setSubscriptionStatus('none'); }
        if (isCalendarAvailable()) {
          const calStatus = await checkCalendarPermission();
          setCalendarPermission(calStatus);
        }
      }
    };
    checkStatus();
  }, [user?.id]);

  // --- Handlers (same logic moved from AppProfile) ---

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all password fields', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Success', description: 'Password updated successfully' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update password', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTestNotification = async () => {
    if (!user?.id) return;
    setIsTestingNotification(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: { userIds: [user.id], title: '🔔 Test Notification', body: 'Your push notifications are working correctly!', url: '/app/settings' },
      });
      if (error) throw error;
      if (data?.sent > 0) toast({ title: 'Test Sent!', description: 'Check your notifications in a moment' });
      else toast({ title: 'No Device Found', description: 'No registered device found.', variant: 'destructive' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send test notification', variant: 'destructive' });
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleEnableNotifications = async () => {
    setIsEnablingNotifications(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        const result = await subscribeToPushNotifications(user?.id || '');
        if (result.success) {
          setNotificationPermission('granted');
          setSubscriptionStatus('active');
          toast({ title: 'Notifications Enabled', description: 'You will now receive push notifications' });
          queryClient.invalidateQueries({ queryKey: ['push-subscription', user?.id] });
        } else {
          toast({ title: 'Error', description: result.error || 'Failed to enable notifications', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Permission Denied', description: 'Please enable notifications in Settings', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to enable notifications', variant: 'destructive' });
    } finally {
      setIsEnablingNotifications(false);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      const result = await unsubscribeFromPushNotifications(user?.id || '');
      if (result.success) {
        setNotificationPermission('default');
        setSubscriptionStatus('none');
        toast({ title: 'Notifications Disabled', description: 'You will no longer receive push notifications' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to disable notifications', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to disable notifications', variant: 'destructive' });
    }
  };

  const handleOpenAppSettings = async () => {
    try {
      await NativeSettings.open({ optionAndroid: AndroidSettings.ApplicationDetails, optionIOS: IOSSettings.App });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not open settings', variant: 'destructive' });
    }
  };

  const handleEnableCalendar = async () => {
    setIsRequestingCalendar(true);
    try {
      const result = await requestCalendarPermission();
      setCalendarPermission(result);
      if (result === 'granted') {
        toast({ title: 'Calendar Access Enabled', description: 'Course sessions can now be added directly to your calendar' });
      } else {
        toast({ title: 'Permission Denied', description: 'Please enable calendar access in Settings', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to request calendar permission', variant: 'destructive' });
    } finally {
      setIsRequestingCalendar(false);
    }
  };

  const handleAutoSyncToggle = async (enabled: boolean) => {
    if (enabled && calendarPermission !== 'granted') {
      const result = await requestCalendarPermission();
      setCalendarPermission(result);
      if (result !== 'granted') {
        toast({ title: 'Permission Required', description: 'Calendar access is needed to auto-sync sessions', variant: 'destructive' });
        return;
      }
    }
    setAutoSyncCalendar(enabled);
    localStorage.setItem('autoSyncCalendar', enabled.toString());
    toast({ title: enabled ? 'Auto-Sync Enabled' : 'Auto-Sync Disabled', description: enabled ? 'Course sessions will be added to calendar on enrollment' : "Sessions won't be auto-added on enrollment" });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out', description: 'You have been signed out successfully' });
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({ title: 'Confirmation Required', description: 'Please type DELETE to confirm account deletion', variant: 'destructive' });
      return;
    }
    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' }); return; }
      const { data, error } = await supabase.functions.invoke('delete-own-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) { toast({ title: 'Error', description: 'Failed to delete account. Please contact support.', variant: 'destructive' }); return; }
      if (data?.success) {
        toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted' });
        await signOut();
        navigate('/auth');
      } else {
        toast({ title: 'Error', description: data?.error || 'Failed to delete account', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteDialog(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <SEOHead title="Settings - LadyBoss Academy" description="App settings and preferences" />

      {/* Header */}
      <header className="shrink-0 bg-card border-b" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-lg">Settings</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe space-y-2 mt-4">

        {/* Password */}
        <Collapsible open={openSections.has('password')} onOpenChange={() => toggleSection('password')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">Password</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSections.has('password') ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <Card className="rounded-2xl shadow-sm border-0 bg-card">
              <CardContent className="space-y-3 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs text-muted-foreground">New Password</Label>
                  <Input id="newPassword" type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isChangingPassword} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isChangingPassword} />
                </div>
                <Button onClick={handlePasswordChange} disabled={isChangingPassword || !newPassword || !confirmPassword} className="w-full">
                  <Lock className="mr-2 h-4 w-4" />
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Push Notifications - Native only */}
        {showNativeSettings && (
          <Collapsible open={openSections.has('push')} onOpenChange={() => toggleSection('push')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-sm">Push Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${notificationPermission === 'granted' && subscriptionStatus === 'active' ? 'bg-emerald-500' : notificationPermission === 'denied' ? 'bg-destructive' : 'bg-yellow-500'}`} />
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSections.has('push') ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1">
              <Card className="rounded-2xl shadow-sm border-0 bg-card">
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${notificationPermission === 'granted' && subscriptionStatus === 'active' ? 'bg-emerald-500' : notificationPermission === 'denied' ? 'bg-destructive' : 'bg-yellow-500'}`} />
                      <span className="text-sm font-medium">
                        {subscriptionStatus === 'checking' ? 'Checking status...' : notificationPermission === 'granted' && subscriptionStatus === 'active' ? 'Active' : notificationPermission === 'denied' ? 'Denied' : 'Not Enabled'}
                      </span>
                    </div>
                  </div>
                  {notificationPermission === 'granted' && subscriptionStatus === 'active' && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleDisableNotifications} className="flex-1" size="sm">Disable</Button>
                        <Button variant="outline" onClick={handleEnableNotifications} disabled={isEnablingNotifications} className="flex-1" size="sm">
                          {isEnablingNotifications ? 'Re-registering...' : 'Re-register'}
                        </Button>
                      </div>
                      <Button onClick={handleTestNotification} disabled={isTestingNotification} className="w-full" size="sm">
                        <Bell className="mr-2 h-4 w-4" />
                        {isTestingNotification ? 'Sending...' : 'Send Test Notification'}
                      </Button>
                      <Button variant="ghost" onClick={handleOpenAppSettings} className="w-full text-muted-foreground" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Open Settings
                      </Button>
                    </div>
                  )}
                  {notificationPermission === 'granted' && subscriptionStatus === 'none' && (
                    <Button onClick={handleEnableNotifications} className="w-full" disabled={isEnablingNotifications}>
                      <Bell className="mr-2 h-4 w-4" />
                      {isEnablingNotifications ? 'Enabling...' : 'Enable Notifications'}
                    </Button>
                  )}
                  {notificationPermission !== 'granted' && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {notificationPermission === 'denied' ? 'Notifications are disabled. Enable them in Settings.' : 'Get notified about new content and updates'}
                      </p>
                      {notificationPermission === 'denied' ? (
                        <Button onClick={handleOpenAppSettings} className="w-full"><Settings className="mr-2 h-4 w-4" />Open Settings</Button>
                      ) : (
                        <Button onClick={handleEnableNotifications} className="w-full" disabled={isEnablingNotifications}>
                          <Bell className="mr-2 h-4 w-4" />{isEnablingNotifications ? 'Enabling...' : 'Enable Notifications'}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Notification Preferences */}
        <Collapsible open={openSections.has('prefs')} onOpenChange={() => toggleSection('prefs')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">Notification Preferences</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSections.has('prefs') ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <NotificationPreferencesCard
              userId={user?.id}
              notificationsEnabled={showNativeSettings ? (notificationPermission === 'granted' && subscriptionStatus === 'active') : true}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Calendar Sync - Native only */}
        {showNativeSettings && (
          <Collapsible open={openSections.has('calendar')} onOpenChange={() => toggleSection('calendar')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-sm">Calendar Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${calendarPermission === 'granted' ? 'bg-emerald-500' : calendarPermission === 'denied' ? 'bg-destructive' : 'bg-yellow-500'}`} />
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSections.has('calendar') ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1">
              <Card className="rounded-2xl shadow-sm border-0 bg-card">
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${calendarPermission === 'granted' ? 'bg-emerald-500' : calendarPermission === 'denied' ? 'bg-destructive' : 'bg-yellow-500'}`} />
                      <span className="text-sm font-medium">
                        {calendarPermission === 'granted' ? 'Enabled' : calendarPermission === 'denied' ? 'Denied' : 'Not Enabled'}
                      </span>
                    </div>
                  </div>
                  {calendarPermission === 'granted' && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Auto-Sync on Enrollment</p>
                        <p className="text-xs text-muted-foreground">Automatically add sessions when you enroll</p>
                      </div>
                      <Switch checked={autoSyncCalendar} onCheckedChange={handleAutoSyncToggle} />
                    </div>
                  )}
                  {calendarPermission !== 'granted' && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {calendarPermission === 'denied' ? 'Calendar access is disabled. Enable it in Settings.' : 'Add course sessions directly to your calendar'}
                      </p>
                      {calendarPermission === 'denied' ? (
                        <Button onClick={handleOpenAppSettings} className="w-full"><Settings className="mr-2 h-4 w-4" />Open Settings</Button>
                      ) : (
                        <Button onClick={handleEnableCalendar} className="w-full" disabled={isRequestingCalendar}>
                          <Calendar className="mr-2 h-4 w-4" />{isRequestingCalendar ? 'Requesting...' : 'Enable Calendar Access'}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}


        {/* Support */}
        <Collapsible open={openSections.has('support')} onOpenChange={() => toggleSection('support')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">Support</span>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>
              )}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSections.has('support') ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <Card className="rounded-2xl shadow-sm border-0 bg-card">
              <CardContent className="space-y-3 pt-4">
                <Button className="w-full relative" onClick={() => navigate('/app/chat')}>
                  <MessageCircle className="mr-2 h-4 w-4" />Chat with Support
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>
                  )}
                </Button>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or via Telegram</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-xs text-muted-foreground">Subject</Label>
                  <select id="subject" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={contactSubject} onChange={(e) => setContactSubject(e.target.value)}>
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
                  <Textarea id="message" placeholder="Type your message here..." value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} rows={3} />
                </div>
                <Button variant="outline" className="w-full" onClick={() => {
                  if (!contactSubject || !contactMessage.trim()) {
                    toast({ title: 'Error', description: 'Please select a subject and enter a message', variant: 'destructive' });
                    return;
                  }
                  const telegramMessage = `Subject: ${contactSubject}\n\nMessage:\n${contactMessage}`;
                  window.open(`https://t.me/ladybosslook?text=${encodeURIComponent(telegramMessage)}`, '_blank');
                }}>
                  <Send className="mr-2 h-4 w-4" />Send via Telegram
                </Button>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Admin Tools */}
        {(canAccessAdminPage('support') || canAccessAdminPage('community')) && (
          <Collapsible open={openSections.has('admin')} onOpenChange={() => toggleSection('admin')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-sm">Admin Tools</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSections.has('admin') ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1">
              <Card className="rounded-2xl shadow-sm border-0 bg-card">
                <CardContent className="space-y-2 pt-4">
                  {canAccessAdminPage('support') && (
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/app/support', { state: { from: '/app/settings' } })}>
                      <Headset className="mr-2 h-4 w-4" />Support Inbox
                    </Button>
                  )}
                  {canAccessAdminPage('community') && (
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/app/channels/new', { state: { from: '/app/settings' } })}>
                      <Megaphone className="mr-2 h-4 w-4" />Post to Channel
                    </Button>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Redeem Code */}
        <button
          onClick={() => {
            const url = 'https://apps.apple.com/redeem?ctx=offercodes&id=6755076134';
            window.open(url, '_blank');
          }}
          className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="font-medium text-sm">Redeem Code</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Rate Ladybosslook - Native only */}
        {showNativeSettings && (
          <button onClick={() => navigate('/app/rate')} className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </div>
              <span className="font-medium text-sm">Rate Ladybosslook</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {/* Account Actions */}
        <Collapsible open={openSections.has('actions')} onOpenChange={() => toggleSection('actions')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-medium text-sm">Account Actions</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSections.has('actions') ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <Card className="rounded-2xl shadow-sm border-0 bg-card">
              <CardContent className="space-y-2 pt-4">
                <Button variant="ghost" className="w-full justify-start h-12 rounded-xl bg-muted/30" onClick={() => {
                  resetAllTours();
                  navigate('/app/home');
                  toast({ title: 'Tours Reset', description: 'All feature tours will restart when you visit each section.' });
                }}>
                  <PlayCircle className="mr-3 h-4 w-4" />Restart All Tours
                </Button>
                <Button variant="ghost" className="w-full justify-start h-12 rounded-xl bg-muted/30" onClick={handleSignOut}>
                  <LogOut className="mr-3 h-4 w-4" />Sign Out
                </Button>
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start h-12 rounded-xl text-destructive bg-destructive/10">
                      <Trash2 className="mr-3 h-4 w-4" />Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />Delete Your Account?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>This action is <strong>permanent and cannot be undone</strong>. All your data will be immediately deleted.</p>
                        <div className="pt-2">
                          <Label htmlFor="deleteConfirm" className="text-sm font-medium text-foreground">
                            Type <span className="font-bold text-destructive">DELETE</span> to confirm:
                          </Label>
                          <Input id="deleteConfirm" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE" className="mt-2" />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { haptic.warning(); handleDeleteAccount(); }} disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isDeletingAccount ? 'Deleting...' : 'Delete Forever'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

      </div>
    </div>
  );
};

export default AppSettings;
