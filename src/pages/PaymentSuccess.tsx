import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Loader2, Smartphone, Mail, MessageCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { useInvalidateAllEnrollmentData } from '@/hooks/useAppData';
import riloAppIcon from '@/assets/rilo-app-icon.png';
import { ONELINK_BASE_URL } from '@/lib/appsflyer';

/**
 * Smart link: AppsFlyer OneLink opens the Rilo app if installed,
 * otherwise routes the user to the correct store (App Store / Play Store),
 * and falls back to /app/home on web via `af_web_dp`.
 */
function buildOpenRiloOneLink(sessionId?: string | null, slug?: string | null) {
  const webFallback = 'https://ladybosslook.com/app/home';
  const params = new URLSearchParams({
    af_xp: 'custom',
    pid: 'web_purchase',
    c: 'payment_success',
    deep_link_value: 'home',
    af_web_dp: webFallback,
  });
  if (slug) params.set('af_sub1', slug);
  if (sessionId) params.set('af_sub2', sessionId.substring(0, 40));
  return `${ONELINK_BASE_URL}?${params.toString()}`;
}

function detectPlatform(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const programSlug = searchParams.get('program');
  const isFreeEnrollment = searchParams.get('free') === '1';
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const { toast } = useToast();
  const invalidateAllEnrollmentData = useInvalidateAllEnrollmentData();
  const platform = useMemo(() => detectPlatform(), []);

  useEffect(() => {
    const verifyPayment = async () => {
      const isTestMode = searchParams.get('test') === 'true';

      // Free enrollment (no Stripe): mark verified immediately
      if (isFreeEnrollment) {
        setPaymentVerified(true);
        setOrderDetails({
          product_name: 'Your free program',
          amount: 0,
          status: 'paid',
          created_at: new Date().toISOString(),
        });
        invalidateAllEnrollmentData();
        setIsLoading(false);
        toast({
          title: "You're enrolled!",
          description: "Your free program is unlocked.",
        });
        return;
      }
      
      if (isTestMode) {
        const testProgramData: Record<string, { title: string; amount: number }> = {
          'empowered-woman-coaching': { title: 'Empowered Woman Coaching', amount: 99700 },
          'courageous-character': { title: 'Courageous Character Course', amount: 4999 },
          'iqmoney-workshop': { title: 'IQ Money Workshop', amount: 9900 }
        };
        
        const programData = (programSlug && testProgramData[programSlug]) || testProgramData['courageous-character'];
        
        setPaymentVerified(true);
        setOrderDetails({
          id: 'test-order-123',
          product_name: programData.title,
          amount: programData.amount,
          email: 'test@example.com',
          name: 'Sarah Johnson',
          phone: '+1 (555) 123-4567',
          status: 'paid',
          created_at: new Date().toISOString()
        });
        setIsLoading(false);
        toast({
          title: "Test Mode - Payment Confirmed!",
          description: "This is a test view of the payment success page.",
        });
        return;
      }

      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.success && data?.paymentStatus === 'paid') {
          setPaymentVerified(true);
          setOrderDetails(data.orderDetails);
          
          // Invalidate all enrollment caches so user sees their new access immediately
          invalidateAllEnrollmentData();
          
          toast({
            title: "Payment Confirmed!",
            description: "Your payment has been successfully processed.",
          });
        } else if (data?.paymentStatus && data.paymentStatus !== 'paid') {
          // Payment not yet complete
          toast({
            title: "Payment Processing",
            description: "Your payment is still being processed. Please wait a moment.",
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        // Don't show error toast - we'll show a friendly message instead
      } finally {
        setIsLoading(false);
        setVerificationAttempts(prev => prev + 1);
      }
    };

    verifyPayment();
  }, [sessionId, searchParams, toast, programSlug]);

  // Confetti once verified
  useEffect(() => {
    if (!paymentVerified) return;
    const colors = ['#F08A3E', '#EC4899', '#8A5CF0', '#FFD27A', '#FFFFFF'];
    const t = setTimeout(() => {
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.35 }, colors });
      setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.5 }, colors }), 200);
      setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.5 }, colors }), 400);
    }, 350);
    return () => clearTimeout(t);
  }, [paymentVerified]);

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const productName: string = orderDetails?.product_name || 'Rilo Plus';
  const isPlus = /plus|simora-plus/i.test(productName) || /simora-plus/i.test(orderDetails?.program_slug || '');
  const isAnnual = /annual|year/i.test(productName) || /annual/i.test(orderDetails?.program_slug || '');
  const planLabel = isPlus ? (isAnnual ? 'Annual membership' : 'Monthly membership') : 'One-time purchase';
  const openRiloUrl = useMemo(
    () => buildOpenRiloOneLink(sessionId, orderDetails?.program_slug || programSlug),
    [sessionId, orderDetails?.program_slug, programSlug]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#F08A3E] mx-auto mb-4" />
          <p className="text-lg text-[#1a1f3d] font-semibold">Confirming your payment…</p>
          <p className="text-sm text-[#1a1f3d]/60 mt-2">Just a moment</p>
        </div>
      </div>
    );
  }

  const isTestMode = searchParams.get('test') === 'true';

  if (!sessionId && !isTestMode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]">
        <div className="max-w-md w-full bg-white/80 backdrop-blur rounded-3xl p-8 text-center shadow-xl">
          <h1 className="text-xl font-bold text-[#1a1f3d] mb-2">No payment session found</h1>
          <p className="text-sm text-[#1a1f3d]/70 mb-6">If you just paid, check your email for a receipt and contact support.</p>
          <Link to="/" className="inline-block px-6 py-3 rounded-2xl bg-[#1a1f3d] text-white font-semibold">Return home</Link>
        </div>
      </div>
    );
  }

  const showSuccessPage = isTestMode || (sessionId && (paymentVerified || verificationAttempts > 0));

  if (!showSuccessPage) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]">
        <div className="max-w-md w-full bg-white/80 backdrop-blur rounded-3xl p-8 text-center shadow-xl">
          <Loader2 className="h-10 w-10 animate-spin text-[#F08A3E] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#1a1f3d] mb-2">Processing your payment</h1>
          <p className="text-sm text-[#1a1f3d]/70">This should only take a moment. You can refresh in a few seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead />

      <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]">
        {/* Ambient glow blobs */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-60 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FFD6A5 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -right-20 w-[260px] h-[260px] rounded-full blur-3xl opacity-50 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #CDE7FF 0%, transparent 70%)' }} />
        <div className="absolute bottom-10 -left-16 w-[300px] h-[300px] rounded-full blur-3xl opacity-50 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #E5D6FF 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-xl mx-auto px-5 pt-10 pb-12">
          {/* Hero */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 16 }}
              className="mx-auto w-[108px] h-[108px] rounded-[26px] overflow-hidden shadow-[0_24px_60px_-12px_rgba(138,92,240,0.55)]"
            >
              <img src={riloAppIcon} alt="Rilo" className="w-full h-full object-cover" draggable={false} />
            </motion.div>

            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8590E]">
              ✨ Payment confirmed
            </p>
            <h1 className="mt-2 text-[28px] leading-[1.15] font-bold text-[#1a1f3d]">
              {isPlus ? "Welcome to Rilo Plus" : `Welcome to ${productName}`}
            </h1>
            <p className="mt-3 text-[15px] text-[#1a1f3d]/70 max-w-md mx-auto">
              {isPlus
                ? 'Every tool, sound, and guided session — unlocked. Open the Rilo app to start.'
                : 'Your lessons and materials are ready. Open the Rilo app to begin.'}
            </p>
          </div>

          {/* Primary CTA — Open the app */}
          <div className="mt-7 bg-white/75 backdrop-blur rounded-3xl p-5 shadow-[0_20px_50px_-20px_rgba(138,92,240,0.4)] border border-white">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-[#F08A3E]" />
              <h2 className="text-[15px] font-bold text-[#1a1f3d]">Open Rilo to start</h2>
            </div>

            <p className="text-[13px] text-[#1a1f3d]/70 mb-4">
              {platform === 'desktop'
                ? 'One tap: if you already have Rilo it opens instantly. If not, you\'ll go to the right store automatically.'
                : 'Already have Rilo? It\'ll open instantly. If not, you\'ll be sent to the store.'}
            </p>

            <a
              href={openRiloUrl}
              target={platform === 'desktop' ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="w-full h-[56px] rounded-2xl text-white font-semibold text-[16px] active:opacity-80 transition-opacity bg-gradient-to-r from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] shadow-[0_12px_30px_-8px_rgba(138,92,240,0.55)] flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Open Rilo
            </a>

            {platform === 'desktop' && (
              <p className="mt-3 text-center text-[12px] text-[#1a1f3d]/55">
                On desktop? Open this page on your phone, or continue on web at{' '}
                <a href="/app/home" className="font-semibold text-[#8A5CF0] active:opacity-70">/app/home</a>
              </p>
            )}

            {orderDetails?.email && (
              <div className="mt-4 flex items-start gap-2 text-[12px] text-[#1a1f3d]/65 bg-[#FFF6EC] rounded-xl p-3">
                <CheckCircle2 className="h-4 w-4 text-[#22A06B] mt-[1px] shrink-0" />
                <p>
                  Sign in to Rilo with <span className="font-semibold text-[#1a1f3d]">{orderDetails.email}</span> — your access is already linked.
                </p>
              </div>
            )}
          </div>

          {/* Order summary */}
          {orderDetails && (
            <div className="mt-5 bg-white/75 backdrop-blur rounded-3xl p-5 shadow-sm border border-white">
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#1a1f3d]/60 mb-3">Order summary</h2>
              <div className="space-y-2.5 text-[14px]">
                <Row label="Product" value={productName} />
                <Row label="Plan" value={planLabel} />
                {orderDetails.amount > 0 && (
                  <Row label="Amount" value={formatPrice(orderDetails.amount)} />
                )}
                <Row label="Status" value="Paid" valueClass="text-[#22A06B] font-semibold" />
                <Row
                  label="Date"
                  value={new Date(orderDetails.created_at || Date.now()).toLocaleDateString()}
                />
              </div>
            </div>
          )}

          {/* Support — demoted */}
          <div className="mt-6 text-center">
            <p className="text-[12px] text-[#1a1f3d]/55 mb-3">Need help with your purchase?</p>
            <div className="flex items-center justify-center gap-4 text-[13px]">
              <a href="mailto:support@ladybosslook.com" className="inline-flex items-center gap-1.5 text-[#1a1f3d]/70 active:opacity-70">
                <Mail className="h-3.5 w-3.5" /> Email support
              </a>
              <span className="text-[#1a1f3d]/20">·</span>
              <a href="https://t.me/ladybosslook" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#1a1f3d]/70 active:opacity-70">
                <MessageCircle className="h-3.5 w-3.5" /> Telegram
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#1a1f3d]/60">{label}</span>
      <span className={`text-[#1a1f3d] text-right ${valueClass}`}>{value}</span>
    </div>
  );
}
