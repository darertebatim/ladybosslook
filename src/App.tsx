import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { isNativeApp } from "@/lib/platform";
import { registerNavigationCallback, refreshDeviceToken, initializePushNotificationHandlers, clearBadge } from "@/lib/pushNotifications";
import { initializeLocalNotificationHandlers } from "@/lib/localNotifications";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { useDeepLinks, checkInitialDeepLink } from "@/hooks/useDeepLinks";
import { initializeSocialLogin } from "@/lib/nativeSocialAuth";
import AppLayout from "@/layouts/NativeAppLayout";
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
const AppHome = lazy(() => import("@/pages/app/AppHome"));
const AppPrograms = lazy(() => import("@/pages/app/AppPrograms"));
const AppStore = lazy(() => import("@/pages/app/AppStore"));
const AppCourseDetail = lazy(() => import("@/pages/app/AppCourseDetail"));
const AppProfile = lazy(() => import("@/pages/app/AppProfile"));
const AppPlayer = lazy(() => import("@/pages/app/AppPlayer"));
const AppPlaylistDetail = lazy(() => import("@/pages/app/AppPlaylistDetail"));
const AppAudioPlayer = lazy(() => import("@/pages/app/AppAudioPlayer"));
const AppChat = lazy(() => import("@/pages/app/AppChat"));
const AppChannelsList = lazy(() => import("@/pages/app/AppChannelsList"));
const AppChannelDetail = lazy(() => import("@/pages/app/AppChannelDetail"));
const AppFeedPost = lazy(() => import("@/pages/app/AppFeedPost"));
const AppJournal = lazy(() => import("@/pages/app/AppJournal"));
const AppJournalEntry = lazy(() => import("@/pages/app/AppJournalEntry"));
const AppTaskCreate = lazy(() => import("@/pages/app/AppTaskCreate"));
const AppInspire = lazy(() => import("@/pages/app/AppInspire"));
const AppInspireDetail = lazy(() => import("@/pages/app/AppInspireDetail"));
const AppBreathe = lazy(() => import("@/pages/app/AppBreathe"));
const AppWater = lazy(() => import("@/pages/app/AppWater"));
const AppPeriod = lazy(() => import("@/pages/app/AppPeriod"));
const AppEmotion = lazy(() => import("@/pages/app/AppEmotion"));
const AppEmotionHistory = lazy(() => import("@/pages/app/AppEmotionHistory"));
const AppMood = lazy(() => import("@/pages/app/AppMood"));
const AppMoodHistory = lazy(() => import("@/pages/app/AppMoodHistory"));
const AppPresence = lazy(() => import("@/pages/app/AppPresence"));

// Lazy load admin pages
const Users = lazy(() => import("@/pages/admin/Users"));
const Enrollment = lazy(() => import("@/pages/admin/Enrollment"));
const Audio = lazy(() => import("@/pages/admin/Audio"));
const Communications = lazy(() => import("@/pages/admin/Communications"));
const ProgramsAdmin = lazy(() => import("@/pages/admin/Programs"));
const Payments = lazy(() => import("@/pages/admin/Payments"));
const System = lazy(() => import("@/pages/admin/System"));
const AppIconGenerator = lazy(() => import("@/pages/admin/AppIconGenerator"));
const Support = lazy(() => import("@/pages/admin/Support"));
const Community = lazy(() => import("@/pages/admin/Community"));
const Tools = lazy(() => import("@/pages/admin/Tools"));
const TasksBank = lazy(() => import("@/pages/admin/TasksBank"));
const AppTest = lazy(() => import("@/pages/admin/AppTest"));

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
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const SMSTerms = lazy(() => import("@/pages/SMSTerms"));
const ThankFreeLive = lazy(() => import("@/pages/ThankFreeLive"));
const ThankOne = lazy(() => import("@/pages/ThankOne"));
const Video = lazy(() => import("@/pages/Video"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SendTestEmail = lazy(() => import("@/pages/SendTestEmail"));
const AppSupport = lazy(() => import("@/pages/AppSupport"));
const AppMarketing = lazy(() => import("@/pages/AppMarketing"));

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
      staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: false, // Don't refetch on tab focus
    },
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
      const refreshToken = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('[App] Refreshing push notification token for user:', user.id);
          await refreshDeviceToken(user.id);
        }
      };
      refreshToken();
      
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

const App = () => (
  <QueryClientProvider client={queryClient}>
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
                  
                  {/* Admin Routes */}
                  {!isNativeApp() && (
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<ProtectedRoute requiredPage="overview"><Overview /></ProtectedRoute>} />
                      <Route path="users" element={<ProtectedRoute requiredPage="users"><Users /></ProtectedRoute>} />
                      <Route path="enrollment" element={<ProtectedRoute requiredPage="enrollment"><Enrollment /></ProtectedRoute>} />
                      <Route path="audio" element={<ProtectedRoute requiredPage="audio"><Audio /></ProtectedRoute>} />
                      <Route path="channels" element={<ProtectedRoute requiredPage="community"><Community /></ProtectedRoute>} />
                      
                      <Route path="communications" element={<ProtectedRoute requiredPage="communications"><Communications /></ProtectedRoute>} />
                      <Route path="programs" element={<ProtectedRoute requiredPage="programs"><ProgramsAdmin /></ProtectedRoute>} />
                      <Route path="payments" element={<ProtectedRoute requiredPage="payments"><Payments /></ProtectedRoute>} />
                      <Route path="support" element={<ProtectedRoute requiredPage="support"><Support /></ProtectedRoute>} />
                      <Route path="system" element={<ProtectedRoute requiredPage="system"><System /></ProtectedRoute>} />
                      <Route path="app-icon" element={<ProtectedRoute requiredPage="system"><AppIconGenerator /></ProtectedRoute>} />
                      <Route path="tools" element={<ProtectedRoute requiredPage="tools"><Tools /></ProtectedRoute>} />
                      <Route path="tools/tasks" element={<ProtectedRoute requiredPage="tools"><TasksBank /></ProtectedRoute>} />
                      <Route path="app" element={<ProtectedRoute requiredPage="system"><AppTest /></ProtectedRoute>} />
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
                  
                  {/* Full-screen pages - Outside of AppLayout so no tab bar */}
                  <Route path="/app/journal/new" element={<ProtectedRoute><AppJournalEntry /></ProtectedRoute>} />
                  <Route path="/app/journal/:entryId" element={<ProtectedRoute><AppJournalEntry /></ProtectedRoute>} />
                  <Route path="/app/home/new" element={<ProtectedRoute><AppTaskCreate /></ProtectedRoute>} />
                  <Route path="/app/home/edit/:taskId" element={<ProtectedRoute><AppTaskCreate /></ProtectedRoute>} />
                  <Route path="/app/channels/post/:postId" element={<ProtectedRoute><AppFeedPost /></ProtectedRoute>} />
                  <Route path="/app/breathe" element={<ProtectedRoute><AppBreathe /></ProtectedRoute>} />
                  <Route path="/app/water" element={<ProtectedRoute><AppWater /></ProtectedRoute>} />
                  <Route path="/app/period" element={<ProtectedRoute><AppPeriod /></ProtectedRoute>} />
                  <Route path="/app/emotion" element={<ProtectedRoute><AppEmotion /></ProtectedRoute>} />
                  <Route path="/app/emotion/history" element={<ProtectedRoute><AppEmotionHistory /></ProtectedRoute>} />
                  <Route path="/app/mood" element={<ProtectedRoute><AppMood /></ProtectedRoute>} />
                  <Route path="/app/mood/history" element={<ProtectedRoute><AppMoodHistory /></ProtectedRoute>} />
                  <Route path="/app/presence" element={<ProtectedRoute><AppPresence /></ProtectedRoute>} />
                  {/* Redirect old feed post route */}
                  <Route path="/app/feed/post/:postId" element={<Navigate to="/app/channels/post/:postId" replace />} />
                  
                  {/* App Routes */}
                  <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/app/home" replace />} />
                    <Route path="home" element={<AppHome />} />
                    <Route path="programs" element={<AppPrograms />} />
                    <Route path="browse" element={<AppStore />} />
                    <Route path="course/:slug" element={<AppCourseDetail />} />
                    <Route path="course/:slug/:roundId" element={<AppCourseDetail />} />
                    <Route path="player" element={<AppPlayer />} />
                    <Route path="player/playlist/:playlistId" element={<AppPlaylistDetail />} />
                    <Route path="player/:audioId" element={<AppAudioPlayer />} />
                    <Route path="chat" element={<AppChat />} />
                    <Route path="channels" element={<AppChannelsList />} />
                    <Route path="channels/:slug" element={<AppChannelDetail />} />
                    {/* Redirect old feed route */}
                    <Route path="feed" element={<Navigate to="/app/channels" replace />} />
                    <Route path="journal" element={<AppJournal />} />
                    <Route path="routines" element={<AppInspire />} />
                    <Route path="routines/:planId" element={<AppInspireDetail />} />
                    <Route path="profile" element={<AppProfile />} />
                    {/* Legacy routes - redirect to home */}
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
  </QueryClientProvider>
);

export default App;
