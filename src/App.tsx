import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import About from "./pages/About";
import Admin from "./pages/Admin";
import AssertLanding from "./pages/AssertLanding";
import Auth from "./pages/Auth";
import BusinessIdeas from "./pages/BusinessIdeas";
import BusinessGrowthAccelerator from "./pages/BusinessGrowthAccelerator";
import BusinessStartupAccelerator from "./pages/BusinessStartupAccelerator";
import CapacityDashboard from "./pages/CapacityDashboard";
import Checkout from "./pages/Checkout";
import CourageousWorkshop from "./pages/CourageousWorkshop";
import EventIrvine from "./pages/EventIrvine";
import ExpressAssert from "./pages/ExpressAssert";
import FreeLive from "./pages/FreeLive";
import Giveaway from "./pages/Giveaway";
import IQMoneyWorkshop from "./pages/IQMoneyWorkshop";
import Index from "./pages/Index";
import LadybossAnnouncements from "./pages/LadybossAnnouncements";
import LadybossCoaching from "./pages/LadybossCoaching";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import Privacy from "./pages/Privacy";
import SMSTerms from "./pages/SMSTerms";
import ThankFreeLive from "./pages/ThankFreeLive";
import Video from "./pages/Video";
import CalendarRedirect from "./components/CalendarRedirect";
import Redirect from "./components/Redirect";

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
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/checkout" element={<Checkout />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/sms-terms" element={<SMSTerms />} />
            <Route path="/giveaway" element={<Giveaway />} />
            <Route path="/ladyboss-coaching" element={<LadybossCoaching />} />
            <Route path="/announcements/coaching" element={<LadybossAnnouncements />} />
            <Route path="/freelive" element={<FreeLive />} />
            <Route path="/thankfreelive" element={<ThankFreeLive />} />
            <Route path="/iqmoney" element={<IQMoneyWorkshop />} />
            <Route path="/calendar" element={<CalendarRedirect />} />
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
