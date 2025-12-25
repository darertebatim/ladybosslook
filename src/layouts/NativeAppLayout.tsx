import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, User, Headphones, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { checkPermissionStatus } from '@/lib/pushNotifications';
import { PushNotificationPrompt } from '@/components/app/PushNotificationPrompt';

/**
 * Native app layout - Clean layout specifically for iOS/Android native apps
 */
const NativeAppLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

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
    { path: '/app/profile', icon: User, label: 'Profile' },
  ];

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
