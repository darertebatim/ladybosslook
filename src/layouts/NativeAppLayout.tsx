import { Outlet, Link, useLocation } from 'react-router-dom';
import { haptic } from '@/lib/haptics';
import { Home, MessageCircle, Compass, Music, Flame, CalendarPlus, Play, Sparkles, Route, ClipboardList, Headphones } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, LayoutGroup } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UnseenContentProvider, useUnseenContentContext } from '@/contexts/UnseenContentContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useTrackAppReturn } from '@/hooks/useUserPresence';
import { MiniPlayer } from '@/components/audio/MiniPlayer';
import { RoutineMiniPlayer } from '@/components/app/RoutineMiniPlayer';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useInvalidateAllEnrollmentData } from '@/hooks/useAppData';
import { useChatNotifications } from '@/hooks/useChatNotifications';

import { cn } from '@/lib/utils';
import { PushNotificationOnboarding } from '@/components/app/PushNotificationOnboarding';
import { usePushNotificationFlow } from '@/hooks/usePushNotificationFlow';
import { useTimezoneSync } from '@/hooks/useTimezoneSync';
import { useNotificationCleanup } from '@/hooks/useNotificationCleanup';
import { DeferredLayoutHooks } from '@/components/app/DeferredLayoutHooks';
import { AppUpdatePopup } from '@/components/app/AppUpdatePopup';
import { useKeyboard } from '@/hooks/useKeyboard';
import { OfflineStatusBar } from '@/components/app/OfflineStatusBar';

import { useOnboardingProfileSync } from '@/hooks/useOnboardingProfileSync';
import { useRoutePreloader } from '@/hooks/useRoutePreloader';
import { useFirebaseScreenTracking } from '@/hooks/useFirebaseScreenTracking';

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
  const { t } = useTranslation();
  
  // Push notification flow - handles full-screen onboarding
  const { 
    flowState, 
    completeOnboarding, 
    dismissOnboarding 
  } = usePushNotificationFlow(user?.id);
  
  // Auto-detect and sync user's timezone on app open
  useTimezoneSync(user?.id);
  
  // Track app returns (every open/resume increments return count)
  useTrackAppReturn(user?.id);
  
  // Comprehensive cleanup of stale/legacy local notifications (runs first, before schedulers)
  useNotificationCleanup();
  
  
  // Sync onboarding answers (nickname, gender) to user profile
  useOnboardingProfileSync(user?.id);

  // Prefetch secondary page chunks after user settles on a tab
  useRoutePreloader();

  // Auto-track screen_view for every route change (Firebase Analytics)
  useFirebaseScreenTracking();

  // Defer non-critical hooks — mount DeferredLayoutHooks after 5s delay
  const [deferredReady, setDeferredReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDeferredReady(true), 5000);
    return () => clearTimeout(timer);
  }, []);
  
  // Custom hooks after useState declarations
  const { showUnreadPopup, unreadMessageCount, dismissPopup, goToChat } = useChatNotifications();

  const invalidateAllEnrollmentData = useInvalidateAllEnrollmentData();
  const { isKeyboardOpen } = useKeyboard();

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

  // Routine mini player visibility
  let routineMiniVisible = false;
  try {
    const rp = useRoutinePlayerContext();
    routineMiniVisible = rp.isActive && rp.isMinimized;
  } catch {
    // RoutinePlayerContext not available yet
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


  // Get streak count for Presence nav badge
  const { data: streakCount = 0 } = useQuery({
    queryKey: ['nav-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();
      return data?.current_streak || 0;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  // Check if we're on the audio player page - don't show mini player there
  const isOnPlayerPage = location.pathname.match(/^\/app\/player\/[^/]+$/);
  // Check if we're on chat page - hide tab bar for full-screen experience
  const isOnChatPage = location.pathname === '/app/chat';
  // Hide nav on full-screen tool pages (journal, timer, etc.)
  const isFullScreenTool = location.pathname.startsWith('/app/journal');
  // Pages that manage their own scroll container (need overflow-hidden on main)
  const isOwnScrollPage =
    location.pathname === '/app/projects'
    || location.pathname === '/app/path'
    || location.pathname === '/app/breathe'
    || location.pathname === '/app/hub';

  const navItems = [
    { path: '/app/path', icon: Route, label: t('nav.myRilo'), tourClass: 'tour-nav-my-rilo' },
    { path: '/app/home', icon: ClipboardList, label: t('nav.home'), tourClass: 'tour-nav-home' },
    { path: '/app/player', icon: Headphones, label: t('nav.player'), tourClass: 'tour-nav-listen' },
    { path: '/app/tools', icon: Compass, label: t('nav.tools'), tourClass: 'tour-nav-explore' },
  ];


  // Tab bar actual height: grid content (~48px for compact) + safe area inset
  const TAB_BAR_CONTENT_HEIGHT = 48;

  // AI Planner FAB vertical offset: sits above nav; rises when mini players appear
  const showAudioMini = !!currentTrack && !isOnPlayerPage && !isOnChatPage && !isFullScreenTool && !isKeyboardOpen;
  const showRoutineMini = routineMiniVisible && !isOnChatPage && !isFullScreenTool && !isKeyboardOpen;
  let aiFabBottomOffset = 76; // px above safe-area inset (clears the nav pill)
  if (showRoutineMini) aiFabBottomOffset += 98;
  if (showAudioMini) aiFabBottomOffset += 84; // clears the audio mini-player

  return (
    <div className={cn(
      "flex flex-col h-[100dvh] app-theme font-farsi",
      location.pathname.startsWith('/app/watch') ? 'bg-[#132240]' : 'bg-background'
    )}>
      {/* Offline / sync status pill */}
      <OfflineStatusBar />
      {/* Main Content */}
      <main 
        data-scroll-container="true"
        className={cn(
          "flex-1 min-h-0 overflow-x-hidden overscroll-contain",
          (isOnPlayerPage || isOwnScrollPage) ? "overflow-hidden" : "overflow-y-auto"
        )}
        style={{
          paddingBottom: (isOnChatPage || isFullScreenTool || isKeyboardOpen || isOnPlayerPage) ? 0 : TAB_BAR_CONTENT_HEIGHT + 8,
          WebkitOverflowScrolling: (isOnPlayerPage || isOwnScrollPage) ? 'auto' : 'touch',
          touchAction: 'pan-y',
        }}
      >
        <Outlet />
      </main>

      {/* Deferred background hooks — mount after 5s to free initial render */}
      {deferredReady && <DeferredLayoutHooks userId={user?.id} />}

      {/* Mini Player - show when audio is playing and not on player page or chat page */}
      {!isOnPlayerPage && !isOnChatPage && !isFullScreenTool && !isKeyboardOpen && <MiniPlayer />}
      {!isOnChatPage && !isFullScreenTool && !isKeyboardOpen && <RoutineMiniPlayer />}

      {/* Bottom Navigation - hidden on chat page for full-screen experience */}
      {!isOnChatPage && !isFullScreenTool && !isKeyboardOpen && (
      <nav
        className={cn(
          'fixed left-3 right-3 z-50',
          'bottom-[max(4px,calc(env(safe-area-inset-bottom)-18px))]',
          'flex items-start gap-2',
        )}
      >
        {/* Main nav pill (4 items) */}
        <LayoutGroup id="nav-active-pill">
          <div
            className={cn(
              'flex-1 self-start rounded-[28px] px-2 py-2',
              'border-[0.5px] shadow-card-warm',
              'backdrop-blur-2xl backdrop-saturate-150',
              location.pathname.startsWith('/app/watch')
                ? 'bg-[#0F1A33]/65 border-white/15'
                : 'bg-gradient-to-b from-white/65 to-bg-warm/75 border-white/65 dark:from-[#3C2819]/55 dark:to-[#28190F]/65 dark:border-[hsl(var(--brand-primary)/0.18)]',
            )}
          >
            <div className="grid grid-cols-4 items-center">

              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                const isOverlayContext = location.pathname.startsWith('/app/watch');

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={(e) => {
                      if (isActive && item.path === '/app/home') {
                        e.preventDefault();
                        haptic.medium();
                        window.dispatchEvent(new CustomEvent('home-tab-retap'));
                      } else {
                        haptic.light();
                      }
                    }}
                    className={cn(
                      'relative flex flex-col items-center gap-0.5',
                      item.tourClass,
                    )}
                  >
                    {/* Icon container with active halo */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      {isActive && (
                        <motion.span
                          layoutId="nav-active-pill"
                          className={cn(
                            'absolute inset-0 rounded-2xl',
                            isOverlayContext
                              ? 'bg-white/15 border-[0.5px] border-white/25'
                              : 'bg-[hsl(var(--brand-primary)/0.10)] border-[0.5px] border-[hsl(var(--brand-primary)/0.25)] shadow-[0_0_12px_hsl(var(--brand-primary)/0.15)]',
                          )}
                          transition={{ type: 'spring', mass: 0.6, stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon
                        className={cn(
                          'relative z-10 h-[22px] w-[22px] transition-colors',
                          isOverlayContext
                            ? (isActive ? 'text-white' : 'text-white/55')
                            : (isActive ? 'text-brand' : 'text-fg-warm-muted'),
                        )}
                        strokeWidth={isActive ? 2.2 : 1.6}
                      />

                      {/* Badges */}

                    </div>

                    <span
                      className={cn(
                        'text-[10px] leading-tight transition-colors',
                        isOverlayContext
                          ? (isActive ? 'text-white font-semibold' : 'text-white/55 font-normal')
                          : (isActive ? 'text-brand font-semibold' : 'text-fg-warm-muted font-normal'),
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </LayoutGroup>

      </nav>
      )}

      {/* AI Planner FAB - bottom left, floats above nav / mini players */}
      {location.pathname === '/app/home' && !isOnChatPage && !isFullScreenTool && !isKeyboardOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="fixed right-4 z-[55] flex flex-col items-center"
          style={{
            bottom: `calc(${aiFabBottomOffset}px + env(safe-area-inset-bottom))`,
          }}
        >
          <Link
            to="/app/aiplanner"
            onClick={() => haptic.medium()}
            aria-label={t('nav.aiPlanner')}
            className={cn(
              'block w-[56px] h-[56px] rounded-full relative',
              'bg-gradient-to-br from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))]',
              'border-[0.5px] border-white/70 dark:border-[hsl(var(--brand-primary)/0.25)]',
              'shadow-[0_8px_24px_-4px_hsl(var(--brand-primary)/0.5),0_3px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.28)]',
              'active:scale-95 transition-transform',
              'flex items-center justify-center',
            )}
          >
            <Sparkles className="w-5 h-5 text-white relative z-10" strokeWidth={2.2} />
            {/* Glass shine */}
            <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <span className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/35 to-transparent" />
            </span>
          </Link>
        </motion.div>
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

      {/* Unread Messages Popup - Friendly iOS Style */}
      <AlertDialog open={showUnreadPopup} onOpenChange={dismissPopup}>
        <AlertDialogContent className="max-w-[300px] p-0 rounded-3xl border-0 shadow-2xl overflow-hidden bg-gradient-to-b from-background to-muted/30">
          <AlertDialogHeader className="pt-6 pb-4 px-5">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-4">
                  <MessageCircle className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center text-[11px] font-bold text-primary-foreground">
                  {unreadMessageCount}
                </div>
              </div>
            </div>
            <AlertDialogTitle className="text-center text-lg font-semibold leading-tight">
              You have a message! 💬
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-muted-foreground mt-2">
              Our support team has replied to your conversation
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-0 sm:flex-col p-4 pt-2">
            <AlertDialogAction 
              onClick={goToChat} 
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-medium shadow-md"
            >
              View Message
            </AlertDialogAction>
            <AlertDialogCancel 
              onClick={dismissPopup} 
              className="w-full h-10 rounded-xl border-0 m-0 mt-2 bg-transparent hover:bg-muted/50 text-sm font-normal text-muted-foreground"
            >
              Maybe later
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* App Update Popup */}
      <AppUpdatePopup />
    </div>
  );
};

// Wrap with unseen content provider only (Audio + Focus providers moved to AppProvidersLayout)
const NativeAppLayoutWithProvider = () => (
  <UnseenContentProvider>
    <NativeAppLayout />
  </UnseenContentProvider>
);

export default NativeAppLayoutWithProvider;
