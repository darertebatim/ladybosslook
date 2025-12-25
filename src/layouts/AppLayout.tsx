import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Bell, Loader2, Headphones, ShoppingBag, MessageCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { checkPermissionStatus, requestNotificationPermission, subscribeToPushNotifications } from '@/lib/pushNotifications';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Capacitor } from '@capacitor/core';
import { useUnreadChat } from '@/hooks/useUnreadChat';
import { useChatNotifications } from '@/hooks/useChatNotifications';

const AppLayout = () => {
  // All hooks must be called unconditionally at the top
  const location = useLocation();
  const { user } = useAuth();
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // Custom hooks after useState declarations
  const { unreadCount } = useUnreadChat();
  const { showUnreadPopup, unreadMessageCount, dismissPopup, goToChat } = useChatNotifications();

  // Only show notification prompt on native iOS
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    
    const checkAndShowPrompt = async () => {
      const hasSeenNotificationPrompt = localStorage.getItem('hasSeenNotificationPrompt') === 'true';
      const currentPermission = await checkPermissionStatus();
      setNotificationPermission(currentPermission);
      
      // Show popup if: native iOS, notifications not granted, and haven't seen prompt
      if (currentPermission !== 'granted' && !hasSeenNotificationPrompt) {
        setTimeout(() => {
          setShowNotificationPopup(true);
        }, 1500);
      }
    };
    
    checkAndShowPrompt();
  }, []);

  const handleEnableNotifications = async () => {
    if (!user?.id) {
      toast.error('Please log in first');
      setShowNotificationPopup(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      localStorage.setItem('hasSeenNotificationPrompt', 'true');
      
      if (permission === 'denied') {
        toast.error('Notifications were denied. Enable them in your device settings.');
        setShowNotificationPopup(false);
        setIsLoading(false);
        return;
      }

      if (permission === 'granted') {
        const subscribeResult = await subscribeToPushNotifications(user.id);
        if (subscribeResult.success) {
          toast.success('Notifications enabled successfully!');
        } else {
          toast.error('Failed to enable notifications. Please try again.');
        }
      }
    } catch (error) {
      console.error('[Notifications] Error:', error);
      toast.error('Failed to enable notifications');
    }
    setShowNotificationPopup(false);
    setIsLoading(false);
  };

  const handleDismissNotificationPopup = () => {
    setShowNotificationPopup(false);
  };

  const handleNeverAsk = () => {
    localStorage.setItem('hasSeenNotificationPrompt', 'true');
    setShowNotificationPopup(false);
  };

  const navItems = [
    { path: '/app/home', icon: Home, label: 'Home' },
    { path: '/app/courses', icon: BookOpen, label: 'Courses' },
    { path: '/app/browse', icon: ShoppingBag, label: 'Browse' },
    { path: '/app/player', icon: Headphones, label: 'Player' },
    { path: '/app/support-chat', icon: MessageCircle, label: 'Chat' },
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Main content area - pb-28 for tab bar clearance (72px + safe area) */}
      <main className="flex-1 pb-28">
        <Outlet />
      </main>

      {/* Bottom Navigation - pt-2 pb-4 + safe area */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pt-2 pb-4"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex justify-around items-center max-w-screen-xl mx-auto px-4">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || 
              (path === '/app/player' && location.pathname.startsWith('/app/player'));
            const showBadge = path === '/app/support-chat' && unreadCount > 0;
            
            return (
              <Link
                key={path}
                to={path}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className="h-6 w-6 mb-1" />
                  {showBadge && (
                    <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Native Notification Prompt */}
      <AlertDialog open={showNotificationPopup} onOpenChange={setShowNotificationPopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Bell className="h-8 w-8 text-primary" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Enable Push Notifications</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Stay updated with new courses, announcements, and important updates from LadyBoss Academy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 sm:flex-col">
            <AlertDialogAction 
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enabling...
                </>
              ) : (
                'Enable Notifications'
              )}
            </AlertDialogAction>
            <AlertDialogCancel 
              onClick={handleNeverAsk}
              className="w-full m-0"
            >
              Not Now
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unread Messages Popup - iOS Style */}
      <AlertDialog open={showUnreadPopup} onOpenChange={dismissPopup}>
        <AlertDialogContent className="max-w-[280px] p-0 rounded-2xl border border-border/50 shadow-xl overflow-hidden">
          <AlertDialogHeader className="pt-5 pb-4 px-4">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-primary/10 p-3">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-[17px] font-semibold leading-tight">
              {unreadMessageCount} New Message{unreadMessageCount > 1 ? 's' : ''}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] text-muted-foreground mt-1">
              Support has replied to you
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-0 sm:flex-col p-0 border-t border-border/50">
            <AlertDialogAction 
              onClick={goToChat} 
              className="w-full h-11 rounded-none border-0 bg-transparent text-primary hover:bg-muted/50 text-[17px] font-normal"
            >
              View
            </AlertDialogAction>
            <AlertDialogCancel 
              onClick={dismissPopup} 
              className="w-full h-11 rounded-none border-0 border-t border-border/50 m-0 bg-transparent hover:bg-muted/50 text-[17px] font-normal text-muted-foreground"
            >
              Later
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppLayout;