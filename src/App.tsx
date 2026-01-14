import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { isNativeApp } from "@/lib/platform";
import { registerNavigationCallback, refreshDeviceToken, initializePushNotificationHandlers, clearBadge } from "@/lib/pushNotifications";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { useDeepLinks, checkInitialDeepLink } from "@/hooks/useDeepLinks";
import { initializeSocialLogin } from "@/lib/nativeSocialAuth";
import AppLayout from "@/layouts/NativeAppLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import AppHome from "@/pages/app/AppHome";
import AppCourses from "@/pages/app/AppCourses";
import AppStore from "@/pages/app/AppStore";
import AppCourseDetail from "@/pages/app/AppCourseDetail";
import AppProfile from "@/pages/app/AppProfile";

import AppPlayer from "@/pages/app/AppPlayer";
import AppPlaylistDetail from "@/pages/app/AppPlaylistDetail";
import AppAudioPlayer from "@/pages/app/AppAudioPlayer";

import AppChat from "@/pages/app/AppChat";
import AppFeed from "@/pages/app/AppFeed";
import AppFeedPost from "@/pages/app/AppFeedPost";
import AppJournal from "@/pages/app/AppJournal";
import AppJournalEntry from "@/pages/app/AppJournalEntry";
import Programs from "./pages/Programs";
import About from "./pages/About";
import Overview from "./pages/admin/Overview";
import Users from "./pages/admin/Users";
import Enrollment from "./pages/admin/Enrollment";
import Audio from "./pages/admin/Audio";
import Communications from "./pages/admin/Communications";
import ProgramsAdmin from "./pages/admin/Programs";
import Payments from "./pages/admin/Payments";
import System from "./pages/admin/System";
import AppIconGenerator from "./pages/admin/AppIconGenerator";
import Support from "./pages/admin/Support";
import Community from "./pages/admin/Community";
import AssertLanding from "./pages/AssertLanding";
import Auth from "./pages/Auth";
import BusinessIdeas from "./pages/BusinessIdeas";
import RathusAssessment from "./pages/RathusAssessment";
import BusinessGrowthAccelerator from "./pages/BusinessGrowthAccelerator";
import BusinessStartupAccelerator from "./pages/BusinessStartupAccelerator";

import CourageousWorkshop from "./pages/CourageousWorkshop";
import CourageousCharacter from "./pages/CourageousCharacter";
import ProgramPage from "./pages/ProgramPage";
import EventIrvine from "./pages/EventIrvine";
import ExpressAssert from "./pages/ExpressAssert";
import FreeLive from "./pages/FreeLive";
import One from "./pages/One";
import Five from "./pages/Five";
import Floew from "./pages/Floew";
import Giveaway from "./pages/Giveaway";
import IQMoneyWorkshop from "./pages/IQMoneyWorkshop";
import Index from "./pages/Index";
import LadybossAnnouncements from "./pages/LadybossAnnouncements";
import CCWAnnouncements from "./pages/CCWAnnouncements";
import EmpoweredWomanCoaching from "./pages/EmpoweredWomanCoaching";
import EWCBalance from "./pages/EWCBalance";
import EWPlus from "./pages/EWPlus";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import Privacy from "./pages/Privacy";
import RefundPolicy from "./pages/RefundPolicy";
import SMSTerms from "./pages/SMSTerms";
import ThankFreeLive from "./pages/ThankFreeLive";
import ThankOne from "./pages/ThankOne";
import Video from "./pages/Video";
import Dashboard from "./pages/Dashboard";
import CalendarRedirect from "./components/CalendarRedirect";
import Redirect from "./components/Redirect";
import SendTestEmail from "./pages/SendTestEmail";
import AppSupport from "./pages/AppSupport";
import AppMarketing from "./pages/AppMarketing";

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
          <Sonner />
          <BrowserRouter>
            <NativeAppRedirect />
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
                <Route path="community" element={<ProtectedRoute requiredPage="community"><Community /></ProtectedRoute>} />
                <Route path="communications" element={<ProtectedRoute requiredPage="communications"><Communications /></ProtectedRoute>} />
                <Route path="programs" element={<ProtectedRoute requiredPage="programs"><ProgramsAdmin /></ProtectedRoute>} />
                <Route path="payments" element={<ProtectedRoute requiredPage="payments"><Payments /></ProtectedRoute>} />
                <Route path="support" element={<ProtectedRoute requiredPage="support"><Support /></ProtectedRoute>} />
                <Route path="system" element={<ProtectedRoute requiredPage="system"><System /></ProtectedRoute>} />
                <Route path="app-icon" element={<ProtectedRoute requiredPage="system"><AppIconGenerator /></ProtectedRoute>} />
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
            <Route path="/app/chat" element={<ProtectedRoute><AppChat /></ProtectedRoute>} />
            <Route path="/app/journal/new" element={<ProtectedRoute><AppJournalEntry /></ProtectedRoute>} />
            <Route path="/app/journal/:entryId" element={<ProtectedRoute><AppJournalEntry /></ProtectedRoute>} />
            <Route path="/app/feed/post/:postId" element={<ProtectedRoute><AppFeedPost /></ProtectedRoute>} />
            
            {/* App Routes */}
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/app/home" replace />} />
              <Route path="home" element={<AppHome />} />
              <Route path="courses" element={<AppCourses />} />
              <Route path="browse" element={<AppStore />} />
              <Route path="course/:slug" element={<AppCourseDetail />} />
              <Route path="player" element={<AppPlayer />} />
              <Route path="player/playlist/:playlistId" element={<AppPlaylistDetail />} />
              <Route path="player/:audioId" element={<AppAudioPlayer />} />
              
              <Route path="feed" element={<AppFeed />} />
              <Route path="journal" element={<AppJournal />} />
              <Route path="profile" element={<AppProfile />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
