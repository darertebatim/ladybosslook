import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
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
const AppTasksBank = lazy(() => import("@/pages/app/AppTasksBank"));
const AppTaskDrafts = lazy(() => import("@/pages/app/AppTaskDrafts"));

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
const AppTest = lazy(() => import("@/pages/admin/AppTest"));
const NotificationAnalytics = lazy(() => import("@/pages/admin/NotificationAnalytics"));
const PushNotifications = lazy(() => import("@/pages/admin/PushNotifications"));
const Subscriptions = lazy(() => import("@/pages/admin/Subscriptions"));
const BrandDesign = lazy(() => import("@/pages/admin/BrandDesign"));
const BrandMock = lazy(() => import("@/pages/admin/BrandMock"));
const Onboarding = lazy(() => import("@/pages/admin/Onboarding"));
const Banners = lazy(() => import("@/pages/admin/Banners"));
const Documents = lazy(() => import("@/pages/admin/Documents"));
const ReadingManager = lazy(() => import("@/pages/admin/ReadingManager"));
const QuizzesAdmin = lazy(() => import("@/pages/admin/Quizzes"));
const AppRead = lazy(() => import("@/pages/app/AppRead"));
const AppReadLesson = lazy(() => import("@/pages/app/AppReadLesson"));
const QuizLibrary = lazy(() => import("@/pages/app/QuizLibrary"));
const QuizDetail = lazy(() => import("@/pages/app/QuizDetail"));
const QuizPlay = lazy(() => import("@/pages/app/QuizPlay"));


// Lazy load marketing/landing pages
const Programs = lazy(() => import("@/pages/Programs"));
const About = lazy(() => import("@/pages/About"));
const AssertLanding = lazy(() => import("@/pages/AssertLanding"));
const Auth = lazy(() => import("@/pages/Auth"));
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
const AppMarketing = lazy(() => import("@/pages/AppMarketing"));
const CartPage = lazy(() => import("@/pages/CartPage"));

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

    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="max-w-md w-full space-y-3 text-center">
          <h1 className="text-xl font-semibold">App needs a refresh</h1>
          <p className="text-sm text-muted-foreground">
            We couldn’t load a required file (usually after an update). Please reload.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => window.location.reload()}>
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
      gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: false, // Don't refetch on tab focus
      refetchOnMount: 'always', // Refetch only if stale
    },
  },
});

// Persist React Query cache to localStorage — survives app restarts
// Only keys matching these prefixes are stored (avoids storing real-time / sensitive data)
const PERSIST_QUERY_KEYS = [
  'player-data',
  'routines-bank',
  'routine-categories',
  'new-home-data',
  'courses-data',
  'planner-all-tasks',
];

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'lb-query-cache-v4',
  // Only persist queries whose key starts with one of the allowed prefixes
  serialize: (client) => {
    const filtered = {
      ...client,
      clientState: {
        ...client.clientState,
        queries: client.clientState.queries.filter((q) =>
          PERSIST_QUERY_KEYS.some((prefix) =>
            Array.isArray(q.queryKey)
              ? String(q.queryKey[0]).startsWith(prefix)
              : String(q.queryKey).startsWith(prefix)
          )
        ),
      },
    };
    return JSON.stringify(filtered);
  },
  deserialize: (cachedString) => {
    try {
      const parsed = JSON.parse(cachedString);
      // Safety: clear cache if it somehow contains data that will crash on access
      // (e.g., Map objects serialized as empty objects)
      return parsed;
    } catch (e) {
      console.error('[Cache] Failed to deserialize cache, clearing:', e);
      window.localStorage.removeItem('lb-query-cache-v4');
      return { timestamp: 0, buster: '', clientState: { mutations: [], queries: [] } };
    }
  },
});

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

// Clear old cache key to prevent crash on app update
try { window.localStorage.removeItem('lb-query-cache-v1'); } catch {}
try { window.localStorage.removeItem('lb-query-cache-v2'); } catch {}
try { window.localStorage.removeItem('lb-query-cache-v3'); } catch {}

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister: localStoragePersister,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      dehydrateOptions: {
        shouldDehydrateQuery: (query) =>
          PERSIST_QUERY_KEYS.some((prefix) =>
            Array.isArray(query.queryKey)
              ? String(query.queryKey[0]).startsWith(prefix)
              : String(query.queryKey).startsWith(prefix)
          ),
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
                  <Route path="/landing" element={<Landing />} />
                  <Route path="/asac" element={<AssertLanding />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/cart" element={<CartPage />} />
                  
                  {/* Admin Routes */}
                  {!isNativeApp() && (
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<ProtectedRoute requiredPage="overview"><Overview /></ProtectedRoute>} />
                      <Route path="users" element={<ProtectedRoute requiredPage="users"><Users /></ProtectedRoute>} />
                      <Route path="enrollment" element={<ProtectedRoute requiredPage="enrollment"><Enrollment /></ProtectedRoute>} />
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
                      <Route path="support" element={<ProtectedRoute requiredPage="support"><Support /></ProtectedRoute>} />
                      <Route path="system" element={<ProtectedRoute requiredPage="system"><System /></ProtectedRoute>} />
                      
                      <Route path="tools" element={<ProtectedRoute requiredPage="tools"><Tools /></ProtectedRoute>} />
                      <Route path="tools/tasks" element={<ProtectedRoute requiredPage="tools"><TasksBank /></ProtectedRoute>} />
                      <Route path="tools/notifications" element={<ProtectedRoute requiredPage="tools"><NotificationAnalytics /></ProtectedRoute>} />
                      <Route path="onboarding" element={<ProtectedRoute requiredPage="tools"><Onboarding /></ProtectedRoute>} />
                      
                      <Route path="banners" element={<ProtectedRoute requiredPage="communications"><Banners /></ProtectedRoute>} />
                      <Route path="app" element={<ProtectedRoute requiredPage="system"><AppTest /></ProtectedRoute>} />
                      <Route path="documents" element={<ProtectedRoute requiredPage="system"><Documents /></ProtectedRoute>} />
                      <Route path="read" element={<ProtectedRoute requiredPage="tools"><ReadingManager /></ProtectedRoute>} />
                      <Route path="quizzes" element={<ProtectedRoute requiredPage="tools"><QuizzesAdmin /></ProtectedRoute>} />
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
                  <Route path="/appmarketing" element={<AppMarketing />} />
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
                    <Route path="/app/fasting" element={<ProtectedRoute><AppFasting /></ProtectedRoute>} />
                    <Route path="/app/timer" element={<ProtectedRoute><AppTimer /></ProtectedRoute>} />
                    <Route path="/app/support" element={<ProtectedRoute><AppAdminSupport /></ProtectedRoute>} />
                    <Route path="/app/channels/new" element={<ProtectedRoute><AppChannelPost /></ProtectedRoute>} />
                    <Route path="/app/rate" element={<ProtectedRoute><AppRate /></ProtectedRoute>} />
                    <Route path="/app/settings" element={<ProtectedRoute><AppSettings /></ProtectedRoute>} />
                    <Route path="/app/onboarding/:flowId" element={<AppOnboarding />} />
                    <Route path="/app/reflections/notes/free/:noteId" element={<ProtectedRoute><AppFreeFormNoteDetail /></ProtectedRoute>} />
                    <Route path="/app/reflections/notes/:reflectionId" element={<ProtectedRoute><AppReflectionNoteDetail /></ProtectedRoute>} />
                    <Route path="/app/reflections/free-form" element={<ProtectedRoute><AppFreeFormReflection /></ProtectedRoute>} />
                    <Route path="/app/reflections/:reflectionId" element={<ProtectedRoute><AppReflectionFlow /></ProtectedRoute>} />
                    <Route path="/app/ai" element={<ProtectedRoute><AppAICoach /></ProtectedRoute>} />
                    <Route path="/app/read" element={<ProtectedRoute><AppRead /></ProtectedRoute>} />
                    <Route path="/app/read/:lessonId" element={<ProtectedRoute><AppReadLesson /></ProtectedRoute>} />
                    <Route path="/app/quiz/:slug" element={<ProtectedRoute><QuizDetail /></ProtectedRoute>} />
                    <Route path="/app/quiz/:slug/play" element={<ProtectedRoute><QuizPlay /></ProtectedRoute>} />
                    {/* Redirect old feed post route */}
                    <Route path="/app/feed/post/:postId" element={<Navigate to="/app/channels/post/:postId" replace />} />
                    
                    {/* App Routes */}
                    <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                      <Route index element={<Navigate to="/app/home" replace />} />
                      <Route path="home" element={<AppHome />} />
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
                      <Route path="projects" element={<AppTaskDrafts />} />
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
