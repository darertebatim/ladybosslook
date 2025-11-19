import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Bell, User, Loader2, Headphones, ShoppingBag } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { checkPermissionStatus, requestNotificationPermission, subscribeToPushNotifications } from '@/lib/pushNotifications';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Capacitor } from '@capacitor/core';

const AppLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

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
    { path: '/app/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-background pb-16">
      <Outlet />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-4">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || 
              (path === '/app/player' && location.pathname.startsWith('/app/player'));
            
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-6 w-6 mb-1" />
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
    </div>
  );
};

export default AppLayout;
