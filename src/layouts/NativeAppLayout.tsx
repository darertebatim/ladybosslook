import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Compass, Music, Users, Headset } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef } from 'react';
import { UnseenContentProvider, useUnseenContentContext } from '@/contexts/UnseenContentContext';
import { AudioPlayerProvider, useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { MiniPlayer } from '@/components/audio/MiniPlayer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useInvalidateAllEnrollmentData } from '@/hooks/useAppData';
import { useUnreadChat } from '@/hooks/useUnreadChat';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { useUnreadFeedCount } from '@/hooks/useFeed';
import { cn } from '@/lib/utils';
import { PushNotificationOnboarding } from '@/components/app/PushNotificationOnboarding';
import { usePushNotificationFlow } from '@/hooks/usePushNotificationFlow';
import { useTimezoneSync } from '@/hooks/useTimezoneSync';
import { useAppInstallTracking } from '@/hooks/useAppInstallTracking';

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
  
  // Push notification flow - handles full-screen onboarding
  const { 
    flowState, 
    completeOnboarding, 
    dismissOnboarding 
  } = usePushNotificationFlow(user?.id);
  
  // Auto-detect and sync user's timezone on app open
  useTimezoneSync(user?.id);
  
  // Track app version on every app open
  useAppInstallTracking(user?.id);
  
  // Custom hooks after useState declarations
  const { unreadCount } = useUnreadChat();
  const { showUnreadPopup, unreadMessageCount, dismissPopup, goToChat } = useChatNotifications();
  const invalidateAllEnrollmentData = useInvalidateAllEnrollmentData();

  // Debounce ref to prevent double invalidation from realtime + mutation success
  const lastInvalidationTime = useRef(0);
  const INVALIDATION_DEBOUNCE_MS = 2000;

  // Realtime subscription for enrollment changes - auto-refresh when enrollments change
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('enrollment-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_enrollments',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          const now = Date.now();
          // Debounce: skip if already invalidated within last 2 seconds (e.g., from mutation success)
          if (now - lastInvalidationTime.current < INVALIDATION_DEBOUNCE_MS) {
            console.log('[EnrollmentRealtime] Skipping - recent invalidation');
            return;
          }
          lastInvalidationTime.current = now;
          console.log('[EnrollmentRealtime] Enrollment changed, invalidating caches');
          invalidateAllEnrollmentData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, invalidateAllEnrollmentData]);

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

  // Get unseen content - wrap in try/catch in case provider is missing
  let hasUnseenCourses = false;
  try {
    const unseenContent = useUnseenContentContext();
    hasUnseenCourses = unseenContent.hasUnseenCourses;
  } catch {
    // Provider not available, ignore
  }

  // Get unread feed count for Channels badge
  const { data: unreadFeedCount = 0 } = useUnreadFeedCount();

  // Check if we're on the audio player page - don't show mini player there
  const isOnPlayerPage = location.pathname.match(/^\/app\/player\/[^/]+$/);
  // Check if we're on chat page - hide tab bar for full-screen experience
  const isOnChatPage = location.pathname === '/app/chat';

  const navItems = [
    { path: '/app/home', icon: Home, label: 'Home', tourClass: 'tour-nav-home' },
    { path: '/app/browse', icon: Compass, label: 'Explore', tourClass: 'tour-nav-browse' },
    { path: '/app/player', icon: Music, label: 'Listen', tourClass: 'tour-nav-listen' },
    { path: '/app/channels', icon: Users, label: 'Channels', showBadge: unreadFeedCount > 0, badgeCount: unreadFeedCount, tourClass: 'tour-nav-channels' },
    { path: '/app/chat', icon: Headset, label: 'Support', tourClass: 'tour-nav-chat' },
  ];

  // Tab bar actual height: grid content (~48px for compact) + safe area inset
  const TAB_BAR_CONTENT_HEIGHT = 48;

  return (
    <div className="flex flex-col h-[100dvh] bg-background app-theme font-farsi">
      {/* Main Content - scrollable container for iOS */}
      <main 
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{
          paddingBottom: isOnChatPage ? 0 : TAB_BAR_CONTENT_HEIGHT + 8,
          // iOS WKWebView: make the actual scroll container momentum-scrollable and
          // explicitly allow vertical panning. This helps prevent intermittent “stuck” scroll.
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        <Outlet />
      </main>

      {/* Mini Player - show when audio is playing and not on player page or chat page */}
      {!isOnPlayerPage && !isOnChatPage && <MiniPlayer />}

      {/* Bottom Navigation - hidden on chat page for full-screen experience */}
      {!isOnChatPage && (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg pb-safe">
        <div className="grid grid-cols-5 pt-1.5 pb-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/app/channels' && location.pathname.startsWith('/app/channels'));
            const Icon = item.icon;
            const showChatBadge = item.path === '/app/chat' && unreadCount > 0;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors',
                  item.tourClass
                )}
              >
                <div className="relative flex flex-col items-center">
                  <Icon 
                    className={cn(
                      'h-6 w-6',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  
                  {/* Badges */}
                  {showChatBadge && (
                    <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {item.showBadge && !showChatBadge && item.badgeCount && (
                    <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                      {item.badgeCount > 9 ? '9+' : item.badgeCount}
                    </span>
                  )}
                  {item.showBadge && !showChatBadge && !item.badgeCount && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary w-2 h-2 rounded-full" />
                  )}
                  
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-foreground" />
                  )}
                </div>
                
                <span className={cn(
                  'text-[10px]',
                  isActive 
                    ? 'text-foreground font-semibold' 
                    : 'text-muted-foreground font-medium'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      )}

      {/* Full-screen Push Notification Onboarding */}
      {user && flowState.showOnboarding && (
        <PushNotificationOnboarding 
          userId={user.id}
          onComplete={completeOnboarding}
          onSkip={dismissOnboarding}
          isPreEnrolled={flowState.isPreEnrolled}
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
    </div>
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
