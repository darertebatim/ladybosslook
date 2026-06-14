import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { isNativeApp } from "@/lib/platform";
import { registerNavigationCallback, refreshDeviceToken, initializePushNotificationHandlers, clearBadge } from "@/lib/pushNotifications";
import { initializeLocalNotificationHandlers } from "@/lib/localNotifications";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { useDeepLinks, checkInitialDeepLink } from "@/hooks/useDeepLinks";
import { initializeRevenueCat } from "@/lib/revenueCat";
import { initializeSocialLogin } from "@/lib/nativeSocialAuth";
import AppLayout from "@/layouts/NativeAppLayout";
import { AppProvidersLayout } from "@/layouts/AppProvidersLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { idbPersister, shouldDehydrateOfflineQuery, clearOfflineQueryCache } from "@/lib/offline/idbPersister";
import { initOfflineMutationQueue, onMutationFailure, retryFailedMutations } from "@/lib/offline/offlineMutationQueue";
import { registerAllOfflineExecutors } from "@/lib/offline/registerExecutors";
import { toast } from "sonner";

// Page loading fallback - minimal for fast render
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <Skeleton className="h-8 w-8 rounded-full animate-pulse" />
  </div>
);

// Lazy load app pages (most-used pages in native app)
// Preload tab-bar pages immediately for native — ensures instant navigation
const appHomeImport = import("@/pages/app/AppHome");
const appStoreImport = import("@/pages/app/AppStore");
const appInspireImport = import("@/pages/app/AppInspire");
const appPlayerImport = import("@/pages/app/AppPlayer");
const appChannelsListImport = import("@/pages/app/AppChannelsList");
const appPresenceImport = import("@/pages/app/AppPresence");

const AppHome = lazy(() => appHomeImport);
const AppStore = lazy(() => appStoreImport);
const AppInspire = lazy(() => appInspireImport);
const AppPlayer = lazy(() => appPlayerImport);
const AppChannelsList = lazy(() => appChannelsListImport);
const AppPresence = lazy(() => appPresenceImport);
const AppPrograms = lazy(() => import("@/pages/app/AppPrograms"));
// AppStore eagerly imported above
const AppBrowsePrograms = lazy(() => import("@/pages/app/AppBrowsePrograms"));
const AppCourseDetail = lazy(() => import("@/pages/app/AppCourseDetail"));
const AppProfile = lazy(() => import("@/pages/app/AppProfile"));
// AppPlayer eagerly imported above
const AppWatch = lazy(() => import("@/pages/app/AppWatch"));
const AppVideoPlaylistDetail = lazy(() => import("@/pages/app/AppVideoPlaylistDetail"));
const AppVideoDetail = lazy(() => import("@/pages/app/AppVideoDetail"));
const AppPlaylistDetail = lazy(() => import("@/pages/app/AppPlaylistDetail"));
const AppAudioPlayer = lazy(() => import("@/pages/app/AppAudioPlayer"));
const AppChat = lazy(() => import("@/pages/app/AppChat"));
const AppCoachChat = lazy(() => import("@/pages/app/AppCoachChat"));
// AppChannelsList eagerly imported above
const AppChannelDetail = lazy(() => import("@/pages/app/AppChannelDetail"));
const AppFeedPost = lazy(() => import("@/pages/app/AppFeedPost"));
const AppJournal = lazy(() => import("@/pages/app/AppJournal"));
const AppJournalEntry = lazy(() => import("@/pages/app/AppJournalEntry"));
// Journal redirect components
const JournalRedirect = () => { const navigate = useNavigate(); React.useEffect(() => { navigate('/app/reflections', { replace: true }); }, []); return null; };
const JournalNewRedirect = () => { const navigate = useNavigate(); React.useEffect(() => { navigate('/app/reflections/free-form', { replace: true }); }, []); return null; };
const JournalEntryRedirect = () => { const { entryId } = useParams(); const navigate = useNavigate(); React.useEffect(() => { navigate(`/app/reflections/notes/free/${entryId}`, { replace: true }); }, []); return null; };
const AppTaskCreate = lazy(() => import("@/pages/app/AppTaskCreate"));
// AppInspire eagerly imported above
const AppInspireDetail = lazy(() => import("@/pages/app/AppInspireDetail"));
const AppRoutineCategory = lazy(() => import("@/pages/app/AppRoutineCategory"));
const AppActions = lazy(() => import("@/pages/app/AppActions"));
const AppRoutinePlayerPage = lazy(() => import("@/pages/app/AppRoutinePlayer"));
const AppBreathe = lazy(() => import("@/pages/app/AppBreathe"));
const AppBreatheStats = lazy(() => import("@/pages/app/AppBreatheStats"));
const AppWater = lazy(() => import("@/pages/app/AppWater"));
const AppPeriod = lazy(() => import("@/pages/app/AppPeriod"));
const AppEmotion = lazy(() => import("@/pages/app/AppEmotion"));
const AppEmotionHistory = lazy(() => import("@/pages/app/AppEmotionHistory"));
const AppMood = lazy(() => import("@/pages/app/AppMood"));
const AppMoodHistory = lazy(() => import("@/pages/app/AppMoodHistory"));
// AppPresence eagerly imported above
const AppActionStats = lazy(() => import("@/pages/app/AppActionStats"));
const AppBalance = lazy(() => import("@/pages/app/AppBalance"));
const AppFasting = lazy(() => import("@/pages/app/AppFasting"));
const AppTimer = lazy(() => import("@/pages/app/AppTimer"));
const AppAdminSupport = lazy(() => import("@/pages/app/AppAdminSupport"));
const AppChannelPost = lazy(() => import("@/pages/app/AppChannelPost"));
const AppRate = lazy(() => import("@/pages/app/AppRate"));
const AppSettings = lazy(() => import("@/pages/app/AppSettings"));
const AppOnboarding = lazy(() => import("@/pages/app/AppOnboarding"));
const AppReflections = lazy(() => import("@/pages/app/AppReflections"));
const AppReflectionFlow = lazy(() => import("@/pages/app/AppReflectionFlow"));
const AppReflectionNotes = lazy(() => import("@/pages/app/AppReflectionNotes"));
const AppReflectionNoteDetail = lazy(() => import("@/pages/app/AppReflectionNoteDetail"));
const AppFreeFormReflection = lazy(() => import("@/pages/app/AppFreeFormReflection"));
const AppFreeFormNoteDetail = lazy(() => import("@/pages/app/AppFreeFormNoteDetail"));
const AppAICoach = lazy(() => import("@/pages/app/AppAICoach"));
const AppAIPlanner = lazy(() => import("@/pages/app/AppAIPlanner"));
const AppTasksBank = lazy(() => import("@/pages/app/AppTasksBank"));
const AppTasksBankCategory = lazy(() => import("@/pages/app/AppTasksBankCategory"));
const AppTaskDrafts = lazy(() => import("@/pages/app/AppTaskDrafts"));
const AppFriends = lazy(() => import("@/pages/app/AppFriends"));
const AppHub = lazy(() => import("@/pages/app/AppHub"));
const AppMyRiloPath = lazy(() => import("@/pages/app/AppMyRiloPath"));

const Users = lazy(() => import("@/pages/admin/Users"));
const Enrollment = lazy(() => import("@/pages/admin/Enrollment"));
const Audio = lazy(() => import("@/pages/admin/Audio"));
const VideoAdmin = lazy(() => import("@/pages/admin/VideoAdmin"));
const Communications = lazy(() => import("@/pages/admin/Communications"));
const ProgramsAdmin = lazy(() => import("@/pages/admin/Programs"));
const Payments = lazy(() => import("@/pages/admin/Payments"));
const System = lazy(() => import("@/pages/admin/System"));

const Support = lazy(() => import("@/pages/admin/Support"));
const Community = lazy(() => import("@/pages/admin/Community"));
const Tools = lazy(() => import("@/pages/admin/Tools"));
const TasksBank = lazy(() => import("@/pages/admin/TasksBank"));
const SelfCareTwins = lazy(() => import("@/pages/admin/SelfCareTwins"));
const AppTest = lazy(() => import("@/pages/admin/AppTest"));
const NotificationAnalytics = lazy(() => import("@/pages/admin/NotificationAnalytics"));
const PushNotifications = lazy(() => import("@/pages/admin/PushNotifications"));
const Subscriptions = lazy(() => import("@/pages/admin/Subscriptions"));
const BrandDesign = lazy(() => import("@/pages/admin/BrandDesign"));
const BrandMock = lazy(() => import("@/pages/admin/BrandMock"));
const JasperMock = lazy(() => import("@/pages/admin/JasperMock"));
const Onboarding = lazy(() => import("@/pages/admin/Onboarding"));
const Banners = lazy(() => import("@/pages/admin/Banners"));
const AudienceLibrary = lazy(() => import("@/pages/admin/AudienceLibrary"));
const Documents = lazy(() => import("@/pages/admin/Documents"));
const ReadingManager = lazy(() => import("@/pages/admin/ReadingManager"));
const QuizzesAdmin = lazy(() => import("@/pages/admin/Quizzes"));
const AnalyticsAdmin = lazy(() => import("@/pages/admin/Analytics"));
const InstructorsAdmin = lazy(() => import("@/pages/admin/Instructors"));
const MyRiloEngine = lazy(() => import("@/pages/admin/MyRiloEngine"));
const TagSchemaPage = lazy(() => import("@/pages/admin/TagSchema"));
const ContentTaggingPage = lazy(() => import("@/pages/admin/ContentTagging"));
const AppRead = lazy(() => import("@/pages/app/AppRead"));
const AppReadDetail = lazy(() => import("@/pages/app/AppReadDetail"));
const AppReadReader = lazy(() => import("@/pages/app/AppReadReader"));
const QuizLibrary = lazy(() => import("@/pages/app/QuizLibrary"));
const QuizDetail = lazy(() => import("@/pages/app/QuizDetail"));
const QuizPlay = lazy(() => import("@/pages/app/QuizPlay"));


// Lazy load marketing/landing pages
const Programs = lazy(() => import("@/pages/Programs"));
const About = lazy(() => import("@/pages/About"));
const AssertLanding = lazy(() => import("@/pages/AssertLanding"));
const Auth = lazy(() => import("@/pages/Auth"));
const PublicDedication = lazy(() => import("@/pages/PublicDedication"));
const PublicPlaylistGift = lazy(() => import("@/pages/PublicPlaylistGift"));
const BusinessIdeas = lazy(() => import("@/pages/BusinessIdeas"));
const RathusAssessment = lazy(() => import("@/pages/RathusAssessment"));
const BusinessGrowthAccelerator = lazy(() => import("@/pages/BusinessGrowthAccelerator"));
const BusinessStartupAccelerator = lazy(() => import("@/pages/BusinessStartupAccelerator"));
const CourageousWorkshop = lazy(() => import("@/pages/CourageousWorkshop"));
const CourageousCharacter = lazy(() => import("@/pages/CourageousCharacter"));
const ProgramPage = lazy(() => import("@/pages/ProgramPage"));
const EventIrvine = lazy(() => import("@/pages/EventIrvine"));
const ExpressAssert = lazy(() => import("@/pages/ExpressAssert"));
const FreeLive = lazy(() => import("@/pages/FreeLive"));
const One = lazy(() => import("@/pages/One"));
const Five = lazy(() => import("@/pages/Five"));
const Floew = lazy(() => import("@/pages/Floew"));
const Giveaway = lazy(() => import("@/pages/Giveaway"));
const IQMoneyWorkshop = lazy(() => import("@/pages/IQMoneyWorkshop"));
const LadybossAnnouncements = lazy(() => import("@/pages/LadybossAnnouncements"));
const CCWAnnouncements = lazy(() => import("@/pages/CCWAnnouncements"));
const EmpoweredWomanCoaching = lazy(() => import("@/pages/EmpoweredWomanCoaching"));
const EWCBalance = lazy(() => import("@/pages/EWCBalance"));
const EWPlus = lazy(() => import("@/pages/EWPlus"));
const Landing = lazy(() => import("@/pages/Landing"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const DeleteAccount = lazy(() => import("@/pages/DeleteAccount"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const SMSTerms = lazy(() => import("@/pages/SMSTerms"));
const ThankFreeLive = lazy(() => import("@/pages/ThankFreeLive"));
const ThankOne = lazy(() => import("@/pages/ThankOne"));
const Video = lazy(() => import("@/pages/Video"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SendTestEmail = lazy(() => import("@/pages/SendTestEmail"));
const AppSupport = lazy(() => import("@/pages/AppSupport"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const Rilo = lazy(() => import("@/pages/Rilo"));
const ApertureRouter = lazy(() => import("@/aperture/router"));

// Eagerly imported (small, always needed)
import CalendarRedirect from "@/components/CalendarRedirect";
import Redirect from "@/components/Redirect";
import Index from "@/pages/Index";
import Overview from "@/pages/admin/Overview";

class ChunkLoadErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    const message = error?.message || "";
    const isChunkLoadError =
      /Failed to fetch dynamically imported module/i.test(message) ||
      /Loading chunk .* failed/i.test(message) ||
      /Importing a module script failed/i.test(message);

    if (!isChunkLoadError) return;

    // If the device is offline, do NOT auto-reload — the reload will fail and
    // leave the user staring at a white screen. Show the friendly fallback UI
    // instead so they can tap Reload once they're back online.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return;
    }

    // Avoid infinite reload loops.
    const key = "__chunk_reload_ts__";
    const last = Number(sessionStorage.getItem(key) || "0");
    const now = Date.now();
    if (now - last > 30_000) {
      sessionStorage.setItem(key, String(now));
      window.location.reload();
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="max-w-md w-full space-y-3 text-center">
          <h1 className="text-xl font-semibold">
            {isOffline ? "You're offline" : "App needs a refresh"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isOffline
              ? "We couldn't load part of the app while offline. Reconnect and tap Reload."
              : "We couldn't load a required file (usually after an update). Please reload."}
          </p>
          <div className="flex justify-center">
            <Button
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
            >
              Reload
            </Button>
          </div>
          <p className="text-xs text-muted-foreground break-all">
            {this.state.error.message}
          </p>
        </div>
      </div>
    );
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000, // 3 minutes - data considered fresh
      // Keep in memory long enough for the persister to write to IndexedDB
      // and for tab/route changes to reuse data instead of refetching.
      gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: false, // Don't refetch on tab focus
      // Refetch in the background when stale, but show cached data immediately
      // so screens render instantly offline. Was 'always' which caused full
      // spinners every navigation.
      refetchOnMount: true,
      // Don't auto-refetch on reconnect — the offline queue handles writes,
      // and screens already mark themselves stale so they refetch on next mount.
      refetchOnReconnect: 'always',
    },
  },
});

// Offline cache + mutation queue (Phase 1+2 of offline-first architecture).
// Cache lives in IndexedDB via `idbPersister` (allowlist of keys defined in
// src/lib/offline/idbPersister.ts). Mutations queued via offlineMutationQueue
// have their executors registered up-front so the drain loop can run any
// queued writes left over from a previous session as soon as we go online.
registerAllOfflineExecutors();
initOfflineMutationQueue();

// Surface a single toast when a mutation has exhausted retries. Per product
// decision ("Only show when something fails") this is the *only* offline
// signal the user normally sees.
if (typeof window !== 'undefined') {
  onMutationFailure((m) => {
    toast.error("Couldn't sync your last change", {
      description: 'Your other changes are safe.',
      duration: 8000,
      action: {
        label: 'Retry',
        onClick: () => { void retryFailedMutations(); },
      },
    });
    console.warn('[Offline] mutation failed permanently:', m);
  });
}

// Native App Router - Registers deep linking navigation callback and refreshes tokens
const NativeAppRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize Universal Link handler
  useDeepLinks();
  
  useEffect(() => {
    // Register navigation callback for push notification deep linking
    if (isNativeApp()) {
      console.log('[App] Registering navigation callback for push notifications');
      registerNavigationCallback((url: string) => {
        console.log('[App] Navigation callback triggered, navigating to:', url);
        navigate(url);
      });

      // Initialize push notification handlers once
      initializePushNotificationHandlers();
      
      // Initialize local notification handlers for task reminders
      initializeLocalNotificationHandlers((url: string) => {
        console.log('[App] Local notification deep link:', url);
        navigate(url);
      });
      
      // Initialize native social login (Google/Apple)
      initializeSocialLogin();
      
      // Clear badge on app open
      clearBadge();
      
      // Refresh device token on app startup
      const refreshTokenAndInitRC = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('[App] Refreshing push notification token for user:', user.id);
          await refreshDeviceToken(user.id);
          // Initialize RevenueCat with user ID
          await initializeRevenueCat(user.id);
        }
      };
      refreshTokenAndInitRC();
      
      // Check if app was launched with a deep link (cold start)
      const handleInitialDeepLink = async () => {
        const initialPath = await checkInitialDeepLink();
        if (initialPath) {
          console.log('[App] App launched with deep link, navigating to:', initialPath);
          navigate(initialPath);
        }
      };
      handleInitialDeepLink();
    }
  }, [navigate]);
  
  return null;
};

// Redirect component for old /app/rituals/:planId routes (backward compat)
const RitualRedirect = () => {
  const { planId } = useParams();
  return <Navigate to={`/app/routines/${planId}`} replace />;
};

// Redirect component for old /app/inspire/:planId routes (backward compat)
const InspireRedirect = () => {
  const { planId } = useParams();
  return <Navigate to={`/app/routines/${planId}`} replace />;
};

// Redirect component for old /app/course/:slug routes
const CourseRedirect = () => {
  const { slug, roundId } = useParams();
  const location = useLocation();
  return <Navigate to={`/app/myprograms/${slug}${roundId ? `/${roundId}` : ''}`} replace state={location.state} />;
};

// Clear old cache key to prevent crash on app update.
// Also clear v4 — superseded by IndexedDB cache (rilo-query-cache-v1).
try { window.localStorage.removeItem('lb-query-cache-v1'); } catch {}
try { window.localStorage.removeItem('lb-query-cache-v2'); } catch {}
try { window.localStorage.removeItem('lb-query-cache-v3'); } catch {}
try { window.localStorage.removeItem('lb-query-cache-v4'); } catch {}

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister: idbPersister,
      // Keep cached data usable for 7 days offline. Stale data still shows
      // immediately while a background refetch runs when online.
      maxAge: 7 * 24 * 60 * 60 * 1000,
      dehydrateOptions: {
        shouldDehydrateQuery: shouldDehydrateOfflineQuery,
      },
    }}
  >
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <NativeAppRedirect />
            <ChunkLoadErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/programs" element={<Programs />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/appmarketing" element={<Rilo />} />
                  <Route path="/rilo" element={<Navigate to="/appmarketing" replace />} />
                  <Route path="/landing" element={<Landing />} />
                  <Route path="/asac" element={<AssertLanding />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/d/:token" element={<PublicDedication />} />
                  <Route path="/g/:token" element={<PublicPlaylistGift />} />
                  
                  {/* Admin Routes */}
                  {!isNativeApp() && (
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<ProtectedRoute requiredPage="overview"><Overview /></ProtectedRoute>} />
                      <Route path="users" element={<ProtectedRoute requiredPage="users"><Users /></ProtectedRoute>} />
                      <Route path="enrollment" element={<ProtectedRoute requiredPage="enrollment"><Enrollment /></ProtectedRoute>} />
                      <Route path="instructors" element={<ProtectedRoute requiredPage="users"><InstructorsAdmin /></ProtectedRoute>} />
                      <Route path="audio" element={<ProtectedRoute requiredPage="audio"><Audio /></ProtectedRoute>} />
                      <Route path="video" element={<ProtectedRoute requiredPage="audio"><VideoAdmin /></ProtectedRoute>} />
                      <Route path="channels" element={<ProtectedRoute requiredPage="community"><Community /></ProtectedRoute>} />
                      
                      <Route path="communications" element={<ProtectedRoute requiredPage="communications"><Communications /></ProtectedRoute>} />
                      <Route path="pn" element={<ProtectedRoute requiredPage="communications"><PushNotifications /></ProtectedRoute>} />
                      <Route path="programs" element={<ProtectedRoute requiredPage="programs"><ProgramsAdmin /></ProtectedRoute>} />
                      <Route path="payments" element={<ProtectedRoute requiredPage="payments"><Payments /></ProtectedRoute>} />
                      <Route path="subscriptions" element={<ProtectedRoute requiredPage="payments"><Subscriptions /></ProtectedRoute>} />
                      <Route path="brand" element={<ProtectedRoute requiredPage="system"><BrandDesign /></ProtectedRoute>} />
                      <Route path="brand/mock" element={<ProtectedRoute requiredPage="system"><BrandMock /></ProtectedRoute>} />
                      <Route path="brand/jasper-mock" element={<ProtectedRoute requiredPage="system"><JasperMock /></ProtectedRoute>} />
                      <Route path="support" element={<ProtectedRoute requiredPage="support"><Support /></ProtectedRoute>} />
                      <Route path="system" element={<ProtectedRoute requiredPage="system"><System /></ProtectedRoute>} />
                      
                      <Route path="tools" element={<ProtectedRoute requiredPage="tools"><Tools /></ProtectedRoute>} />
                      <Route path="tools/tasks" element={<ProtectedRoute requiredPage="tools"><TasksBank /></ProtectedRoute>} />
                      <Route path="tools/self-care-twins" element={<ProtectedRoute requiredPage="tools"><SelfCareTwins /></ProtectedRoute>} />
                      <Route path="tools/notifications" element={<ProtectedRoute requiredPage="tools"><NotificationAnalytics /></ProtectedRoute>} />
                      <Route path="onboarding" element={<ProtectedRoute requiredPage="tools"><Onboarding /></ProtectedRoute>} />
                      
                      <Route path="banners" element={<ProtectedRoute requiredPage="communications"><Banners /></ProtectedRoute>} />
                      <Route path="audiences" element={<ProtectedRoute requiredPage="communications"><AudienceLibrary /></ProtectedRoute>} />
                      <Route path="app" element={<ProtectedRoute requiredPage="system"><AppTest /></ProtectedRoute>} />
                      <Route path="documents" element={<ProtectedRoute requiredPage="system"><Documents /></ProtectedRoute>} />
                      <Route path="read" element={<ProtectedRoute requiredPage="tools"><ReadingManager /></ProtectedRoute>} />
                      <Route path="quizzes" element={<ProtectedRoute requiredPage="tools"><QuizzesAdmin /></ProtectedRoute>} />
                      <Route path="analytics" element={<ProtectedRoute requiredPage="overview"><AnalyticsAdmin /></ProtectedRoute>} />
                      <Route path="my-rilo" element={<ProtectedRoute requiredPage="tools"><MyRiloEngine /></ProtectedRoute>} />
                      <Route path="tags/schema" element={<Navigate to="/admin/tags/content" replace />} />
                      <Route path="tags/content" element={<ProtectedRoute requiredPage="tools"><ContentTaggingPage /></ProtectedRoute>} />
                    </Route>
                  )}
                  
                  <Route path="/video" element={<Video />} />
                  <Route path="/expressassert" element={<ExpressAssert />} />
                  <Route path="/business-ideas" element={<BusinessIdeas />} />
                  <Route path="/business-growth-accelerator" element={<BusinessGrowthAccelerator />} />
                  <Route path="/business-startup-accelerator" element={<BusinessStartupAccelerator />} />
                  {!isNativeApp() && <Route path="/event-irvine" element={<EventIrvine />} />}
                  {!isNativeApp() && <Route path="/ccw" element={<CourageousWorkshop />} />}
                  {!isNativeApp() && <Route path="/cc" element={<CourageousCharacter />} />}
                  {!isNativeApp() && <Route path="/payment-success" element={<PaymentSuccess />} />}
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/delete-account" element={<DeleteAccount />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/sms-terms" element={<SMSTerms />} />
                  <Route path="/appsupport" element={<AppSupport />} />
                  <Route path="/giveaway" element={<Giveaway />} />
                  {!isNativeApp() && <Route path="/ewc" element={<EmpoweredWomanCoaching />} />}
                  {!isNativeApp() && <Route path="/ewcnow" element={<EmpoweredWomanCoaching />} />}
                  {!isNativeApp() && <Route path="/ewc-balance" element={<EWCBalance />} />}
                  {!isNativeApp() && <Route path="/ewplus" element={<EWPlus />} />}
                  <Route path="/announcements/coaching" element={<LadybossAnnouncements />} />
                  <Route path="/announcements/ccw" element={<CCWAnnouncements />} />
                  {!isNativeApp() && <Route path="/freelive" element={<FreeLive />} />}
                  {!isNativeApp() && <Route path="/one" element={<One />} />}
                  {!isNativeApp() && <Route path="/five" element={<Five />} />}
                  {!isNativeApp() && <Route path="/floew" element={<Floew />} />}
                  {!isNativeApp() && <Route path="/thankfreelive" element={<ThankFreeLive />} />}
                  {!isNativeApp() && <Route path="/thankone" element={<ThankOne />} />}
                  {!isNativeApp() && <Route path="/iqmoney" element={<IQMoneyWorkshop />} />}
                  <Route path="/rathus" element={<RathusAssessment />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  
                  {/* All /app/* routes wrapped with Audio + Focus player providers */}
                  <Route element={<AppProvidersLayout />}>
                    {/* Full-screen pages - Outside of AppLayout so no tab bar */}
                    <Route path="/app/journal/new" element={<JournalNewRedirect />} />
                    <Route path="/app/journal/:entryId" element={<JournalEntryRedirect />} />
                    <Route path="/app/home/new" element={<ProtectedRoute><AppTaskCreate /></ProtectedRoute>} />
                    <Route path="/app/home/edit/:taskId" element={<ProtectedRoute><AppTaskCreate /></ProtectedRoute>} />
                    <Route path="/app/channels/post/:postId" element={<ProtectedRoute><AppFeedPost /></ProtectedRoute>} />
                    <Route path="/app/breathe" element={<ProtectedRoute><AppBreathe /></ProtectedRoute>} />
                    <Route path="/app/breathe/stats" element={<ProtectedRoute><AppBreatheStats /></ProtectedRoute>} />
                    <Route path="/app/water" element={<ProtectedRoute><AppWater /></ProtectedRoute>} />
                    <Route path="/app/period" element={<ProtectedRoute><AppPeriod /></ProtectedRoute>} />
                    <Route path="/app/emotion" element={<ProtectedRoute><AppEmotion /></ProtectedRoute>} />
                    <Route path="/app/emotion/history" element={<ProtectedRoute><AppEmotionHistory /></ProtectedRoute>} />
                    <Route path="/app/mood" element={<ProtectedRoute><AppMood /></ProtectedRoute>} />
                    <Route path="/app/mood/history" element={<ProtectedRoute><AppMoodHistory /></ProtectedRoute>} />
                    <Route path="/app/presence" element={<ProtectedRoute><AppPresence /></ProtectedRoute>} />
                    <Route path="/app/action-stats" element={<ProtectedRoute><AppActionStats /></ProtectedRoute>} />
                    <Route path="/app/balance" element={<ProtectedRoute><AppBalance /></ProtectedRoute>} />
                    <Route path="/app/fasting" element={<ProtectedRoute><AppFasting /></ProtectedRoute>} />
                    <Route path="/app/timer" element={<ProtectedRoute><AppTimer /></ProtectedRoute>} />
                    <Route path="/app/support" element={<ProtectedRoute><AppAdminSupport /></ProtectedRoute>} />
                    <Route path="/app/channels/new" element={<ProtectedRoute><AppChannelPost /></ProtectedRoute>} />
                    <Route path="/app/rate" element={<ProtectedRoute><AppRate /></ProtectedRoute>} />
                    <Route path="/app/settings" element={<ProtectedRoute><AppSettings /></ProtectedRoute>} />
                    <Route path="/app/friends" element={<ProtectedRoute><AppFriends /></ProtectedRoute>} />
                    <Route path="/app/hub" element={<ProtectedRoute><AppHub /></ProtectedRoute>} />
                    <Route path="/app/onboarding/:flowId" element={<AppOnboarding />} />
                    <Route path="/app/reflections/notes/free/:noteId" element={<ProtectedRoute><AppFreeFormNoteDetail /></ProtectedRoute>} />
                    <Route path="/app/reflections/notes/:reflectionId" element={<ProtectedRoute><AppReflectionNoteDetail /></ProtectedRoute>} />
                    <Route path="/app/reflections/free-form" element={<ProtectedRoute><AppFreeFormReflection /></ProtectedRoute>} />
                    <Route path="/app/reflections/:reflectionId" element={<ProtectedRoute><AppReflectionFlow /></ProtectedRoute>} />
                    <Route path="/app/ai" element={<ProtectedRoute><AppAICoach /></ProtectedRoute>} />
                    <Route path="/app/aiplanner" element={<ProtectedRoute><AppAIPlanner /></ProtectedRoute>} />
                    <Route path="/app/read/:id" element={<ProtectedRoute><AppReadDetail /></ProtectedRoute>} />
                    <Route path="/app/read/:id/reader" element={<ProtectedRoute><AppReadReader /></ProtectedRoute>} />
                    <Route path="/app/quiz/:slug" element={<ProtectedRoute><QuizDetail /></ProtectedRoute>} />
                    <Route path="/app/quiz/:slug/play" element={<ProtectedRoute><QuizPlay /></ProtectedRoute>} />
                    {/* Redirect old feed post route */}
                    <Route path="/app/feed/post/:postId" element={<Navigate to="/app/channels/post/:postId" replace />} />
                    
                    {/* App Routes */}
                    <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                      <Route index element={<Navigate to="/app/my-rilo" replace />} />
                      <Route path="home" element={<AppHome />} />
                      <Route path="my-rilo" element={<AppMyRiloPath />} />
                      <Route path="myprograms" element={<AppPrograms />} />
                      <Route path="programs" element={<Navigate to="/app/myprograms" replace />} />
                      <Route path="tools" element={<AppStore />} />
                      <Route path="explore" element={<Navigate to="/app/tools" replace />} />
                      <Route path="browse" element={<Navigate to="/app/tools" replace />} />
                      <Route path="academy" element={<AppBrowsePrograms />} />
                      <Route path="browse-programs" element={<Navigate to="/app/academy" replace />} />
                      <Route path="myprograms/:slug" element={<AppCourseDetail />} />
                      <Route path="myprograms/:slug/:roundId" element={<AppCourseDetail />} />
                      {/* Backward compat redirects for old /app/programs/ and /app/course/ URLs */}
                      <Route path="programs/:slug/:roundId" element={<CourseRedirect />} />
                      <Route path="programs/:slug" element={<CourseRedirect />} />
                      {/* Backward compat redirects for old /app/course/ URLs */}
                      <Route path="course/:slug/:roundId" element={<CourseRedirect />} />
                      <Route path="course/:slug" element={<CourseRedirect />} />
                      <Route path="player" element={<AppPlayer />} />
                      <Route path="player/playlist/:playlistId" element={<AppPlaylistDetail />} />
                      <Route path="player/:audioId" element={<AppAudioPlayer />} />
                      <Route path="watch" element={<AppWatch />} />
                      <Route path="watch/playlist/:playlistId" element={<AppVideoPlaylistDetail />} />
                      <Route path="watch/video/:videoId" element={<AppVideoDetail />} />
                      <Route path="chat" element={<AppChat />} />
                      <Route path="coach-chat" element={<AppCoachChat />} />
                      <Route path="channels" element={<AppChannelsList />} />
                      <Route path="channels/:slug" element={<AppChannelDetail />} />
                      {/* Redirect old feed route */}
                      <Route path="feed" element={<Navigate to="/app/channels" replace />} />
                      <Route path="journal" element={<JournalRedirect />} />
                      <Route path="reflections" element={<AppReflections />} />
                      <Route path="reflections/notes" element={<AppReflectionNotes />} />
                      <Route path="routines" element={<AppInspire />} />
                      <Route path="routines/category/:categorySlug" element={<AppRoutineCategory />} />
                      <Route path="routines/:planId" element={<AppInspireDetail />} />
                      <Route path="actions" element={<AppActions />} />
                      <Route path="tasksbank" element={<AppTasksBank />} />
                      <Route path="tasksbank/:categorySlug" element={<AppTasksBankCategory />} />
                      <Route path="projects" element={<AppTaskDrafts />} />
                      <Route path="quizzes" element={<QuizLibrary />} />
                      <Route path="read" element={<AppRead />} />
                      <Route path="routineplayer" element={<AppRoutinePlayerPage />} />
                      {/* Redirects for backward compatibility with older app versions */}
                      <Route path="rituals" element={<Navigate to="/app/routines" replace />} />
                      <Route path="rituals/:planId" element={<RitualRedirect />} />
                      <Route path="inspire" element={<Navigate to="/app/routines" replace />} />
                      <Route path="inspire/:planId" element={<InspireRedirect />} />
                      <Route path="myprofile" element={<AppProfile />} />
                      <Route path="profile" element={<Navigate to="/app/myprofile" replace />} />
                      {/* Legacy routes - redirect to home */}
                    </Route>
                  </Route>
                  
                  <Route path="/calendar" element={<CalendarRedirect />} />
                  <Route path="/send-test-email" element={<SendTestEmail />} />
                  <Route path="/firststepbonus" element={<Redirect to="https://mnukhzjcvbwpvktxqlej.supabase.co/storage/v1/object/public/documents/RightsnboundariesLadybossgift.pdf" />} />
                  <Route path="/fnpbonus" element={<Redirect to="https://mnukhzjcvbwpvktxqlej.supabase.co/storage/v1/object/public/documents/fnpbonus.pdf" />} />
                  
                  {/* Dynamic program routes - must be before catch-all */}
                  {!isNativeApp() && <Route path="/:slug" element={<ProgramPage />} />}
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ChunkLoadErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </PersistQueryClientProvider>
);

export default App;
