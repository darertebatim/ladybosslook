import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { isNativeApp } from "@/lib/platform";
import { useEffect } from "react";
import PlatformAwareAppLayout from "@/layouts/PlatformAwareAppLayout";
import AppHome from "@/pages/app/AppHome";
import AppCourses from "@/pages/app/AppCourses";
import AppStore from "@/pages/app/AppStore";
import AppCourseDetail from "@/pages/app/AppCourseDetail";
import AppProfile from "@/pages/app/AppProfile";
import AppInstall from "@/pages/app/AppInstall";
import AppPlayer from "@/pages/app/AppPlayer";
import AppPlaylistDetail from "@/pages/app/AppPlaylistDetail";
import AppAudioPlayer from "@/pages/app/AppAudioPlayer";
import Programs from "./pages/Programs";
import About from "./pages/About";
import Admin from "./pages/Admin";
import AssertLanding from "./pages/AssertLanding";
import Auth from "./pages/Auth";
import BusinessIdeas from "./pages/BusinessIdeas";
import RathusAssessment from "./pages/RathusAssessment";
import BusinessGrowthAccelerator from "./pages/BusinessGrowthAccelerator";
import BusinessStartupAccelerator from "./pages/BusinessStartupAccelerator";

import CourageousWorkshop from "./pages/CourageousWorkshop";
import CourageousCharacter from "./pages/CourageousCharacter";
import CCPayDirect from "./pages/CCPayDirect";
import EventIrvine from "./pages/EventIrvine";
import ExpressAssert from "./pages/ExpressAssert";
import FreeLive from "./pages/FreeLive";
import One from "./pages/One";
import Five from "./pages/Five";
import Giveaway from "./pages/Giveaway";
import IQMoneyWorkshop from "./pages/IQMoneyWorkshop";
import Index from "./pages/Index";
import LadybossAnnouncements from "./pages/LadybossAnnouncements";
import CCWAnnouncements from "./pages/CCWAnnouncements";
import EmpoweredWomanCoaching from "./pages/EmpoweredWomanCoaching";
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

const queryClient = new QueryClient();

// Native App Router - Redirects to /app routes
const NativeAppRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // No automatic redirects for native apps
  }, [location.pathname, navigate]);
  
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
            {!isNativeApp() && <Route path="/admin" element={<Admin />} />}
          <Route path="/video" element={<Video />} />
          <Route path="/expressassert" element={<ExpressAssert />} />
          <Route path="/business-ideas" element={<BusinessIdeas />} />
          <Route path="/business-growth-accelerator" element={<BusinessGrowthAccelerator />} />
            <Route path="/business-startup-accelerator" element={<BusinessStartupAccelerator />} />
            {!isNativeApp() && <Route path="/event-irvine" element={<EventIrvine />} />}
          {!isNativeApp() && <Route path="/ccw" element={<CourageousWorkshop />} />}
          {!isNativeApp() && <Route path="/cc" element={<CourageousCharacter />} />}
          {!isNativeApp() && <Route path="/ccpay" element={<CCPayDirect />} />}
          {!isNativeApp() && <Route path="/payment-success" element={<PaymentSuccess />} />}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/sms-terms" element={<SMSTerms />} />
            <Route path="/appsupport" element={<AppSupport />} />
            <Route path="/appmarketing" element={<AppMarketing />} />
            <Route path="/giveaway" element={<Giveaway />} />
            {!isNativeApp() && <Route path="/ewc" element={<EmpoweredWomanCoaching />} />}
            {!isNativeApp() && <Route path="/ewcnow" element={<EmpoweredWomanCoaching />} />}
            <Route path="/announcements/coaching" element={<LadybossAnnouncements />} />
            <Route path="/announcements/ccw" element={<CCWAnnouncements />} />
            {!isNativeApp() && <Route path="/freelive" element={<FreeLive />} />}
            {!isNativeApp() && <Route path="/one" element={<One />} />}
            {!isNativeApp() && <Route path="/five" element={<Five />} />}
            {!isNativeApp() && <Route path="/thankfreelive" element={<ThankFreeLive />} />}
            {!isNativeApp() && <Route path="/thankone" element={<ThankOne />} />}
            {!isNativeApp() && <Route path="/iqmoney" element={<IQMoneyWorkshop />} />}
            <Route path="/rathus" element={<RathusAssessment />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            
            {/* App Routes - PWA Experience */}
            <Route path="/app/install" element={<AppInstall />} />
            <Route path="/app" element={<ProtectedRoute><PlatformAwareAppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/app/home" replace />} />
              <Route path="home" element={<AppHome />} />
              <Route path="courses" element={<AppCourses />} />
              <Route path="browse" element={<AppStore />} />
              <Route path="course/:slug" element={<AppCourseDetail />} />
              <Route path="player" element={<AppPlayer />} />
              <Route path="player/playlist/:playlistId" element={<AppPlaylistDetail />} />
              <Route path="player/:audioId" element={<AppAudioPlayer />} />
              <Route path="profile" element={<AppProfile />} />
            </Route>
            
            <Route path="/calendar" element={<CalendarRedirect />} />
            <Route path="/send-test-email" element={<SendTestEmail />} />
            <Route path="/firststepbonus" element={<Redirect to="https://mnukhzjcvbwpvktxqlej.supabase.co/storage/v1/object/public/documents/RightsnboundariesLadybossgift.pdf" />} />
            <Route path="/fnpbonus" element={<Redirect to="https://mnukhzjcvbwpvktxqlej.supabase.co/storage/v1/object/public/documents/fnpbonus.pdf" />} />
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
