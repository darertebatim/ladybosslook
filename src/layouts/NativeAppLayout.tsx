import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, MessageCircle, Headphones, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { checkPermissionStatus } from '@/lib/pushNotifications';
import { PushNotificationPrompt } from '@/components/app/PushNotificationPrompt';
import { useUnreadChat } from '@/hooks/useUnreadChat';
import { useChatNotifications } from '@/hooks/useChatNotifications';

/**
 * Native app layout - Clean layout specifically for iOS/Android native apps
 */
const NativeAppLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useUnreadChat();
  const [showPrompt, setShowPrompt] = useState(false);
  
  // Enable in-app chat notifications
  useChatNotifications();

  useEffect(() => {
    const checkPrompt = async () => {
      if (!Capacitor.isNativePlatform() || !user?.id) return;

      // Check if already enabled
      const permission = await checkPermissionStatus();
      if (permission === 'granted') return;

      // Check if dismissed recently (within 3 days)
      const dismissed = localStorage.getItem('pushNotificationPromptDismissed');
      if (dismissed) {
        const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
        if (daysSince < 3) return;
      }

      // Show prompt after 2 seconds
      setTimeout(() => setShowPrompt(true), 2000);
    };

    checkPrompt();
  }, [user?.id]);

  const navItems = [
    { path: '/app/home', icon: Home, label: 'Home' },
    { path: '/app/courses', icon: BookOpen, label: 'Courses' },
    { path: '/app/browse', icon: ShoppingBag, label: 'Browse' },
    { path: '/app/player', icon: Headphones, label: 'Player' },
    { path: '/app/support-chat', icon: MessageCircle, label: 'Chat' },
  ];

  return (
    <>
      <div className="min-h-[100dvh] bg-background">
        {/* Main Content - pages render their own headers */}
        <main className="pb-24">
          <Outlet />
        </main>

        {/* Bottom Navigation with safe area */}
        <nav 
          className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="grid grid-cols-5 pt-2 pb-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              const showBadge = item.path === '/app/support-chat' && unreadCount > 0;
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
                  <div className="relative">
                    <Icon className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

    {user && (
      <PushNotificationPrompt 
        userId={user.id}
        open={showPrompt}
        onClose={() => setShowPrompt(false)}
      />
    )}
  </>
  );
};

export default NativeAppLayout;
