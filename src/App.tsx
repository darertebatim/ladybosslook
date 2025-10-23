import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";
import AppHome from "@/pages/app/AppHome";
import AppCourses from "@/pages/app/AppCourses";
import AppCourseDetail from "@/pages/app/AppCourseDetail";
import AppNotifications from "@/pages/app/AppNotifications";
import AppProfile from "@/pages/app/AppProfile";
import AppInstall from "@/pages/app/AppInstall";
import Programs from "./pages/Programs";
import About from "./pages/About";
import Admin from "./pages/Admin";
import AssertLanding from "./pages/AssertLanding";
import Auth from "./pages/Auth";
import BusinessIdeas from "./pages/BusinessIdeas";
import RathusAssessment from "./pages/RathusAssessment";
import BusinessGrowthAccelerator from "./pages/BusinessGrowthAccelerator";
import BusinessStartupAccelerator from "./pages/BusinessStartupAccelerator";
import Checkout from "./pages/Checkout";
import CourageousWorkshop from "./pages/CourageousWorkshop";
import CourageousCharacter from "./pages/CourageousCharacter";
import CCPayDirect from "./pages/CCPayDirect";
import EventIrvine from "./pages/EventIrvine";
import ExpressAssert from "./pages/ExpressAssert";
import FreeLive from "./pages/FreeLive";
import One from "./pages/One";
import Giveaway from "./pages/Giveaway";
import IQMoneyWorkshop from "./pages/IQMoneyWorkshop";
import Index from "./pages/Index";
import LadybossAnnouncements from "./pages/LadybossAnnouncements";
import CCWAnnouncements from "./pages/CCWAnnouncements";
import LadybossCoaching from "./pages/LadybossCoaching";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/about" element={<About />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/asac" element={<AssertLanding />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
          <Route path="/video" element={<Video />} />
          <Route path="/expressassert" element={<ExpressAssert />} />
          <Route path="/business-ideas" element={<BusinessIdeas />} />
            <Route path="/business-growth-accelerator" element={<BusinessGrowthAccelerator />} />
            <Route path="/business-startup-accelerator" element={<BusinessStartupAccelerator />} />
            <Route path="/event-irvine" element={<EventIrvine />} />
          <Route path="/ccw" element={<CourageousWorkshop />} />
          <Route path="/cc" element={<CourageousCharacter />} />
          <Route path="/ccpay" element={<CCPayDirect />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/checkout" element={<Checkout />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/sms-terms" element={<SMSTerms />} />
            <Route path="/giveaway" element={<Giveaway />} />
            <Route path="/ladyboss-coaching" element={<LadybossCoaching />} />
            <Route path="/announcements/coaching" element={<LadybossAnnouncements />} />
            <Route path="/announcements/ccw" element={<CCWAnnouncements />} />
            <Route path="/freelive" element={<FreeLive />} />
            <Route path="/one" element={<One />} />
            <Route path="/thankfreelive" element={<ThankFreeLive />} />
            <Route path="/thankone" element={<ThankOne />} />
            <Route path="/iqmoney" element={<IQMoneyWorkshop />} />
            <Route path="/rathus" element={<RathusAssessment />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            
            {/* App Routes - PWA Experience */}
            <Route path="/app/install" element={<AppInstall />} />
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/app/home" replace />} />
              <Route path="home" element={<AppHome />} />
              <Route path="courses" element={<AppCourses />} />
              <Route path="course/:slug" element={<AppCourseDetail />} />
              <Route path="notifications" element={<AppNotifications />} />
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
