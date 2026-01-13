import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Newspaper, MessageCircle, Headphones, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { checkPermissionStatus } from '@/lib/pushNotifications';
import { PushNotificationPrompt } from '@/components/app/PushNotificationPrompt';
import { useUnreadChat } from '@/hooks/useUnreadChat';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { UnseenContentProvider, useUnseenContentContext } from '@/contexts/UnseenContentContext';
import { AudioPlayerProvider, useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { MiniPlayer } from '@/components/audio/MiniPlayer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

/**
 * Reset iOS viewport zoom - fixes stuck zoom after input focus
 */
const resetViewportZoom = () => {
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }
};

/**
 * Native app layout - Clean layout specifically for iOS/Android native apps
 */
const NativeAppLayout = () => {
  // All hooks must be called unconditionally at the top
  const location = useLocation();
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  
  // Custom hooks after useState declarations
  const { unreadCount } = useUnreadChat();
  const { showUnreadPopup, unreadMessageCount, dismissPopup, goToChat } = useChatNotifications();

  // Get current track for mini player visibility
  let currentTrack = null;
  try {
    const audioPlayer = useAudioPlayer();
    currentTrack = audioPlayer.currentTrack;
  } catch {
    // AudioPlayerContext not available yet
  }

  // Reset viewport zoom on navigation to fix iOS zoom bug
  useEffect(() => {
    resetViewportZoom();
  }, [location.pathname]);

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

  // Get unseen content - wrap in try/catch in case provider is missing
  let hasUnseenCourses = false;
  try {
    const unseenContent = useUnseenContentContext();
    hasUnseenCourses = unseenContent.hasUnseenCourses;
  } catch {
    // Provider not available, ignore
  }

  // Get unread feed count for Community badge
  let unreadFeedCount = 0;
  try {
    const { useUnreadFeedCount } = require('@/hooks/useFeed');
    const { data } = useUnreadFeedCount();
    unreadFeedCount = data || 0;
  } catch {
    // Hook not available
  }

  // Check if we're on the audio player page - don't show mini player there
  const isOnPlayerPage = location.pathname.match(/^\/app\/player\/[^/]+$/);

  const navItems = [
    { path: '/app/home', icon: Home, label: 'Home' },
    { path: '/app/feed', icon: Newspaper, label: 'Community', showBadge: unreadFeedCount > 0, badgeCount: unreadFeedCount },
    { path: '/app/browse', icon: ShoppingBag, label: 'Browse' },
    { path: '/app/player', icon: Headphones, label: 'Player' },
    { path: '/app/support-chat', icon: MessageCircle, label: 'Chat' },
  ];

  // Tab bar actual height: grid content (~56px) + safe area inset
  const TAB_BAR_CONTENT_HEIGHT = 56; // pt-2 pb-2 + icons + labels

  return (
    <>
      <div className="flex flex-col h-full bg-background app-theme font-farsi">
        {/* Main Content - scrollable container for iOS */}
        {/* Bottom padding = tab bar content height only, safe-area handled by nav */}
        <main 
          className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ paddingBottom: TAB_BAR_CONTENT_HEIGHT + 8 }} // 56px + small buffer
        >
          <Outlet />
        </main>

        {/* Mini Player - show when audio is playing and not on player page */}
        {!isOnPlayerPage && <MiniPlayer />}

        {/* Bottom Navigation - safe area applied via pb-safe */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg pb-safe">
          <div className="grid grid-cols-5 pt-2 pb-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              const showChatBadge = item.path === '/app/support-chat' && unreadCount > 0;
              const showBadge = showChatBadge || item.showBadge;
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
                    {showChatBadge && (
                      <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    {item.showBadge && !showChatBadge && item.badgeCount && (
                      <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {item.badgeCount > 9 ? '9+' : item.badgeCount}
                      </span>
                    )}
                    {item.showBadge && !showChatBadge && !item.badgeCount && (
                      <span className="absolute -top-0.5 -right-0.5 bg-primary w-2.5 h-2.5 rounded-full" />
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
  </>
  );
};

// Wrap with providers
const NativeAppLayoutWithProvider = () => (
  <AudioPlayerProvider>
    <UnseenContentProvider>
      <NativeAppLayout />
    </UnseenContentProvider>
  </AudioPlayerProvider>
);

export default NativeAppLayoutWithProvider;
