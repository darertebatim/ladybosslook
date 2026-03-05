import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Crown, Sparkles, HelpCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { PaywallSheet } from '@/components/app/PaywallSheet';
import { CancelSubscriptionFlow } from '@/components/app/CancelSubscriptionFlow';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PREMIUM_FEATURES = [
  { emoji: '🧘‍♀️', title: 'Guided Meditations', desc: 'Premium audio sessions for relaxation and mindfulness' },
  { emoji: '📊', title: 'Period Tracker', desc: 'Track your cycle with smart predictions and reminders' },
  { emoji: '💧', title: 'Water Tracker', desc: 'Stay hydrated with daily water intake tracking' },
  { emoji: '🎭', title: 'Emotion Tracker', desc: 'Monitor your emotional well-being with detailed insights' },
  { emoji: '🎧', title: 'Exclusive Audio Content', desc: 'Access premium playlists and audio programs' },
  { emoji: '✨', title: 'Premium Features', desc: 'Unlock all current and future premium tools' },
];

const HELP_FAQ = [
  { q: 'Why was I automatically charged?', a: 'Your subscription auto-renews at the end of each billing period. You can manage this in your device settings.' },
  { q: 'How do I restore my membership?', a: 'Go to the paywall screen and tap "Restore Purchases" to restore your active subscription.' },
  { q: 'How does a subscription work?', a: 'SimoraPlus is a recurring subscription that gives you access to all premium content. It renews automatically unless cancelled.' },
  { q: 'Worries about how personal data is handled or shared?', a: 'We take your privacy seriously. Please review our Privacy Policy for full details on data handling.' },
  { q: 'How can I get help with technical issues?', a: 'Contact us through the in-app chat or email support@simora.app for technical assistance.' },
  { q: 'Money-back policy', a: 'Refunds for in-app purchases are handled by Apple/Google. Contact their support for refund requests.' },
];

// Golden subscription card shown on profile
export function SubscriptionCard() {
  const { subscriptions, isSubscribed, isLoading } = useSubscription();
  const [showManage, setShowManage] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  if (isLoading) return null;

  // Not subscribed - show upgrade card
  if (!isSubscribed) {
    return (
      <>
        <button
          onClick={() => setShowPaywall(true)}
          className="w-full rounded-2xl p-4 text-left transition-transform active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-bold text-primary-foreground text-base">Upgrade to SimoraPlus</p>
              <p className="text-primary-foreground/80 text-xs mt-0.5">Unlock all premium features & content</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <span className="text-primary-foreground/90 text-xs font-medium">View Plans</span>
            <ChevronRight className="h-3.5 w-3.5 text-primary-foreground/90" />
          </div>
        </button>
        <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
      </>
    );
  }

  // Find the active subscription details
  const activeSub = subscriptions[0];
  const isAnnual = activeSub?.product_id?.toLowerCase().includes('annual') || activeSub?.product_id?.toLowerCase().includes('yearly');
  const planLabel = isAnnual ? 'SimoraPlus Yearly' : 'SimoraPlus Monthly';
  const expiresAt = activeSub?.expires_at;
  const platform = activeSub?.platform;

  return (
    <>
      <button
        onClick={() => setShowManage(true)}
        className="w-full rounded-2xl p-4 text-left transition-transform active:scale-[0.98] shadow-md"
        style={{
          background: 'linear-gradient(135deg, #F5A623 0%, #F7C948 50%, #F5A623 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-bold text-white text-base drop-shadow-sm">{planLabel}</p>
            <p className="text-white/80 text-xs mt-0.5">Enjoy all premium features & contents</p>
          </div>
          <div className="h-14 w-14 rounded-full bg-yellow-300/40 flex items-center justify-center">
            <Crown className="h-7 w-7 text-white drop-shadow" />
          </div>
        </div>
        {/* Progress bar decoration */}
        <div className="mt-3 h-1.5 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full" style={{ width: '15%' }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-white/90 text-xs">
            {expiresAt ? `Expiration: ${format(new Date(expiresAt), 'yyyy-MM-dd')}` : 'Active · No expiry'}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-white text-xs font-semibold">Manage</span>
            <ChevronRight className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      </button>

      <ManageSubscriptionSheet
        open={showManage}
        onOpenChange={setShowManage}
        planLabel={planLabel}
        expiresAt={expiresAt}
        platform={platform}
      />
    </>
  );
}

// Manage Subscription Dialog
function ManageSubscriptionSheet({
  open, onOpenChange, planLabel, expiresAt, platform,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  planLabel: string;
  expiresAt: string | null;
  platform?: string;
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <Dialog open={open && !showHelp} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[400px] h-[85vh] p-0 rounded-2xl overflow-hidden border-0 [&>button]:hidden">
          <VisuallyHidden><DialogTitle>Manage Subscription</DialogTitle></VisuallyHidden>
          <div className="h-full flex flex-col bg-[#F4ECFE] dark:bg-background">
            {/* Header */}
            <div className="shrink-0 flex items-center px-4 pt-4 pb-2">
              <button onClick={() => onOpenChange(false)} className="p-1">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="flex-1 text-center font-semibold text-base">Manage Subscription</h2>
              <div className="w-7" />
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
              {/* Gold card */}
              <div
                className="rounded-2xl p-4 shadow-md"
                style={{ background: 'linear-gradient(135deg, #F5A623 0%, #F7C948 50%, #F5A623 100%)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-base drop-shadow-sm">{planLabel}</p>
                    <p className="text-white/80 text-xs mt-0.5">Enjoy all premium features & contents</p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-yellow-300/40 flex items-center justify-center">
                    <Crown className="h-7 w-7 text-white drop-shadow" />
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white/70 rounded-full" style={{ width: '15%' }} />
                </div>
                <p className="text-white/90 text-xs mt-2">
                  {expiresAt ? `Expiration Date: ${format(new Date(expiresAt), 'yyyy-MM-dd')}` : 'Active · No expiry'}
                </p>
              </div>

              {/* Premium features */}
              <div className="bg-card rounded-2xl p-4 shadow-sm">
                <h3 className="font-semibold text-base mb-4">Enjoy your premium features</h3>
                <div className="space-y-4">
                  {PREMIUM_FEATURES.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{f.emoji}</span>
                      <div>
                        <p className="font-medium text-sm">{f.title}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Help button */}
            <div className="shrink-0 px-4 pb-6 pt-2">
              <Button
                variant="default"
                className="w-full rounded-full h-12 text-sm font-semibold bg-foreground text-background hover:bg-foreground/90"
                onClick={() => setShowHelp(true)}
              >
                Membership Help Center
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <HelpCenterSheet open={showHelp} onOpenChange={setShowHelp} platform={platform} />
    </>
  );
}

// Help Center Dialog
function HelpCenterSheet({
  open, onOpenChange, platform,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  platform?: string;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleCancel = async () => {
    if (Capacitor.getPlatform() === 'ios') {
      // Open iOS subscription settings
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    } else if (Capacitor.getPlatform() === 'android') {
      window.open('https://play.google.com/store/account/subscriptions', '_blank');
    } else {
      // Web - direct to app store
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] h-[85vh] p-0 rounded-2xl overflow-hidden border-0 [&>button]:hidden">
        <VisuallyHidden><DialogTitle>Help Center</DialogTitle></VisuallyHidden>
        <div className="h-full flex flex-col bg-[#F4ECFE] dark:bg-background">
          {/* Header */}
          <div className="shrink-0 flex items-center px-4 pt-4 pb-2">
            <button onClick={() => onOpenChange(false)} className="p-1">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="w-7" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
            <h2 className="text-2xl font-bold">Any concerns about your membership?</h2>

            <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
              {HELP_FAQ.map((item, i) => (
                <div key={i}>
                  <button
                    className="w-full text-left p-4 flex items-center justify-between active:bg-muted/50 transition-colors"
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                  >
                    <span className="text-sm font-medium pr-4">{item.q}</span>
                    <ChevronRight className={cn(
                      'h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform',
                      expandedIndex === i && 'rotate-90'
                    )} />
                  </button>
                  {expandedIndex === i && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-muted-foreground">{item.a}</p>
                    </div>
                  )}
                  {i < HELP_FAQ.length - 1 && <div className="mx-4 border-b border-border" />}
                </div>
              ))}
            </div>
          </div>

          {/* Cancel button */}
          <div className="shrink-0 px-4 pb-6 pt-2">
            <Button
              variant="default"
              className="w-full rounded-full h-12 text-sm font-semibold bg-foreground text-background hover:bg-foreground/90"
              onClick={handleCancel}
            >
              Cancel Subscription
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
