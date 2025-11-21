import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, User, Headphones, ShoppingBag } from 'lucide-react';
import { useNotificationReminder } from '@/hooks/useNotificationReminder';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { subscribeToPushNotifications } from '@/lib/pushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * Native app layout - Clean layout specifically for iOS/Android native apps
 */
const NativeAppLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { 
    reminderState, 
    markInitialPromptSeen, 
    markTimedPromptSeen, 
    markUserDeclined, 
    dismissPopup 
  } = useNotificationReminder();
  
  const [isEnabling, setIsEnabling] = useState(false);

  const navItems = [
    { path: '/app/home', icon: Home, label: 'Home' },
    { path: '/app/courses', icon: BookOpen, label: 'Courses' },
    { path: '/app/browse', icon: ShoppingBag, label: 'Browse' },
    { path: '/app/player', icon: Headphones, label: 'Player' },
    { path: '/app/profile', icon: User, label: 'Profile' },
  ];

  const handleEnableNotifications = async () => {
    if (!user?.id) {
      toast.error('Please sign in to enable notifications');
      return;
    }

    setIsEnabling(true);
    try {
      const result = await subscribeToPushNotifications(user.id);
      
      if (result.success) {
        toast.success('Push notifications enabled successfully!');
        
        // Mark appropriate prompt as seen based on type
        if (reminderState.popupType === 'initial') {
          markInitialPromptSeen();
        } else if (reminderState.popupType === 'timed') {
          markTimedPromptSeen();
        }
        
        dismissPopup();
      } else {
        toast.error(result.error || 'Failed to enable notifications');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('An error occurred while enabling notifications');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleMaybeLater = () => {
    if (reminderState.popupType === 'initial') {
      markInitialPromptSeen();
    } else if (reminderState.popupType === 'timed') {
      markTimedPromptSeen();
    }
    dismissPopup();
  };

  const handleNeverAsk = () => {
    markUserDeclined();
    dismissPopup();
    toast('You can always enable notifications in your Profile settings');
  };

  const getPopupTitle = () => {
    switch (reminderState.popupType) {
      case 'initial':
        return 'Stay Connected!';
      case 'timed':
        return 'Don\'t Miss Out!';
      default:
        return 'Enable Notifications';
    }
  };

  return (
    <>
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
        <div className="grid grid-cols-5 h-20 safe-area-inset-bottom">
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

    {/* Notification Reminder Popup - DISABLED: Manage notifications from Profile only */}
    {/* <AlertDialog open={reminderState.shouldShowPopup} onOpenChange={(open) => !open && dismissPopup()}>
      <AlertDialogContent className="max-w-[90%] sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            {getPopupTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            {reminderState.popupMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleEnableNotifications}
            disabled={isEnabling}
            className="w-full"
            size="lg"
          >
            {isEnabling ? 'Enabling...' : 'Enable Notifications'}
          </Button>
          <Button
            variant="outline"
            onClick={handleMaybeLater}
            disabled={isEnabling}
            className="w-full"
          >
            Maybe Later
          </Button>
          {reminderState.promptCount >= 2 && (
            <Button
              variant="ghost"
              onClick={handleNeverAsk}
              disabled={isEnabling}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Don't ask again
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog> */}
  </>
  );
};

export default NativeAppLayout;
