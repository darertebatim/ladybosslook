import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Video from "./pages/Video";
import ExpressAssert from "./pages/ExpressAssert";
import Landing from "./pages/Landing";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import BusinessIdeas from "./pages/BusinessIdeas";
import EventIrvine from "./pages/EventIrvine";
import CourageousWorkshop from "./pages/CourageousWorkshop";
import PaymentSuccess from "./pages/PaymentSuccess";
import Checkout from "./pages/Checkout";
import Privacy from "./pages/Privacy";
import SMSTerms from "./pages/SMSTerms";
import Giveaway from "./pages/Giveaway";
import LadybossCoaching from "./pages/LadybossCoaching";
import LadybossAnnouncements from "./pages/LadybossAnnouncements";
import NotFound from "./pages/NotFound";
import Redirect from "./components/Redirect";
import FreeLive from "./pages/FreeLive";

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
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              } 
            />
          <Route path="/video" element={<Video />} />
          <Route path="/expressassert" element={<ExpressAssert />} />
          <Route path="/business-ideas" element={<BusinessIdeas />} />
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
