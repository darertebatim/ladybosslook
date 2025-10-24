import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Bell, User, Loader2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { InstallPromptDialog } from '@/components/InstallPromptDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { checkPermissionStatus, requestNotificationPermission, subscribeToPushNotifications } from '@/lib/pushNotifications';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const AppLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isInstalled, isIOS } = usePWAInstall();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(checkPermissionStatus());

  useEffect(() => {
    // Check if we should show the install prompt
    const hasSeenPrompt = localStorage.getItem('hideInstallPrompt') === 'true';
    const isInstallPage = location.pathname === '/app/install';
    
    // Show prompt if: not installed, haven't seen it, and not on install page
    if (!isInstalled && !hasSeenPrompt && !isInstallPage) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isInstalled, location.pathname]);

  // Show notification popup when app is installed but notifications aren't enabled
  useEffect(() => {
    const hasSeenNotificationPrompt = localStorage.getItem('hasSeenNotificationPrompt') === 'true';
    const currentPermission = checkPermissionStatus();
    setNotificationPermission(currentPermission);
    
    // Show popup if: app is installed, iOS device, notifications not granted, and haven't seen prompt
    if (isInstalled && isIOS && currentPermission !== 'granted' && !hasSeenNotificationPrompt) {
      const timer = setTimeout(() => {
        setShowNotificationPopup(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isInstalled, isIOS]);

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
    localStorage.setItem('hasSeenNotificationPrompt', 'true');
    setShowNotificationPopup(false);
  };

  const navItems = [
    { path: '/app/home', icon: Home, label: 'Home' },
    { path: '/app/courses', icon: BookOpen, label: 'Courses' },
    { path: '/app/notifications', icon: Bell, label: 'Notifications' },
    { path: '/app/profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      <InstallPromptDialog 
        open={showInstallPrompt} 
        onOpenChange={setShowInstallPrompt}
      />

      <AlertDialog open={showNotificationPopup} onOpenChange={handleDismissNotificationPopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Enable Notifications?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Stay updated with course announcements, new content, and important updates. 
              You can change this anytime in your device settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDismissNotificationPopup}>
              Maybe Later
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleEnableNotifications} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Enable Now
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold">LadyBoss Academy</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
        <div className="grid grid-cols-4 h-20 safe-area-inset-bottom">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1.5 transition-colors min-h-[48px] ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </>
  );
};

export default AppLayout;
