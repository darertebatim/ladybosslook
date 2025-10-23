import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Bell, User } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { InstallPromptDialog } from '@/components/InstallPromptDialog';

const AppLayout = () => {
  const location = useLocation();
  const { isInstalled } = usePWAInstall();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

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
      
      <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold">LadyBoss Academy</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-16">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-xs">{item.label}</span>
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
