import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallSheet } from '@/components/app/PaywallSheet';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface PlusUpsellBannerProps {
  /** Headline shown on the banner. */
  title?: string;
  /** Sub-line under the headline. */
  subtitle?: string;
  className?: string;
}

/**
 * Reusable Plus upsell card. Hides itself when the user is already subscribed.
 * Tap → opens the global PaywallSheet.
 */
export function PlusUpsellBanner({
  title = 'Unlock everything with Plus',
  subtitle = 'All tools, audio, and AI features',
  className,
}: PlusUpsellBannerProps) {
  const { isSubscribed, isLoading } = useSubscription();
  const [open, setOpen] = useState(false);

  if (isLoading || isSubscribed) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptic.medium();
          setOpen(true);
        }}
        className={cn(
          'relative w-full overflow-hidden rounded-2xl text-left active:scale-[0.98] transition-transform shadow-ios',
          className,
        )}
        style={{
          touchAction: 'pan-y',
          background:
            'linear-gradient(120deg, #1a1f3d 0%, #3d2a5c 45%, #6b3d7a 100%)',
        }}
      >
        {/* Shimmer */}
        <motion.div
          aria-hidden
          initial={{ x: '-120%' }}
          animate={{ x: '220%' }}
          transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-y-0 w-1/3"
          style={{
            background:
              'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
          }}
        />
        {/* Glow blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-60 blur-2xl"
          style={{ background: 'radial-gradient(circle, #FFB37A 0%, transparent 70%)' }}
        />

        <div className="relative flex items-center gap-3 p-3.5">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #FFD27A 0%, #FF8A5C 100%)',
              boxShadow: '0 6px 16px -6px rgba(255,138,92,0.7)',
            }}
          >
            <Crown className="h-5 w-5 text-[#1a1f3d]" strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-[14px] leading-tight">{title}</p>
            <p className="text-white/70 text-[12px] leading-tight mt-0.5">{subtitle}</p>
            <p
              className="text-[11px] font-semibold leading-tight mt-1"
              style={{ color: '#FFD27A' }}
            >
              Start your 7-day free trial →
            </p>
          </div>
          <div className="shrink-0 h-7 px-2.5 rounded-full bg-white/15 backdrop-blur flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#FFD27A]" />
            <span className="text-white text-[11px] font-bold tracking-wide">PLUS</span>
          </div>
        </div>
      </button>

      <PaywallSheet open={open} onOpenChange={setOpen} />
    </>
  );
}