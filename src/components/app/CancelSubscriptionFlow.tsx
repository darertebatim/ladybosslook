import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { ChevronLeft, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';
import cancelStep1 from '@/assets/cancel-step1-settings.png';
import cancelStep2 from '@/assets/cancel-step2-account.png';
import cancelStep3 from '@/assets/cancel-step3-subscriptions.png';

const CANCEL_REASONS = [
  { emoji: '💰', text: 'The subscription was too expensive' },
  { emoji: '🎯', text: 'I have reached my goal' },
  { emoji: '😢', text: 'Not satisfied with the services provided' },
  { emoji: '🤷', text: "I didn't use the services as much as I thought" },
  { emoji: '⛔', text: 'There are no features I need' },
  { emoji: '❓', text: 'App has too many issues' },
  { emoji: '🤔', text: 'Others' },
];

const BENEFITS_LOST = [
  { emoji: '📅', text: 'Routine Planner' },
  { emoji: '💃', text: 'Habit Tracker' },
  { emoji: '🧠', text: 'Mood and Progress Tracker' },
  { emoji: '🧘', text: 'Self-Care Plans' },
  { emoji: '📋', text: 'Self-Care Information' },
  { emoji: '📊', text: 'Detailed Analytics' },
];

function FluentEmoji({ emoji, size = 28 }: { emoji: string; size?: number }) {
  const [useFallback, setUseFallback] = useState(false);
  if (useFallback) return <span style={{ fontSize: size * 0.8 }}>{emoji}</span>;
  return (
    <img
      src={getFluentEmojiUrl(emoji)}
      alt=""
      width={size}
      height={size}
      className="flex-shrink-0"
      onError={() => setUseFallback(true)}
    />
  );
}

interface CancelSubscriptionFlowProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type Step = 'survey' | 'retention' | 'how-to';

export function CancelSubscriptionFlow({ open, onOpenChange }: CancelSubscriptionFlowProps) {
  const [step, setStep] = useState<Step>('survey');
  const [selectedReason, setSelectedReason] = useState<number | null>(null);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('survey');
      setSelectedReason(null);
    }, 300);
  };

  const handleSurveyNext = () => {
    if (selectedReason !== null) {
      setStep('retention');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[400px] h-[85vh] p-0 rounded-2xl overflow-hidden border-0 [&>button]:hidden flex flex-col">
        <VisuallyHidden><DialogTitle>Cancel Subscription</DialogTitle></VisuallyHidden>
        {step === 'survey' && (
          <SurveyStep
            selectedReason={selectedReason}
            onSelectReason={setSelectedReason}
            onNext={handleSurveyNext}
            onKeepUsing={handleClose}
          />
        )}
        {step === 'retention' && (
          <RetentionStep
            onClose={handleClose}
            onGiveUp={() => setStep('how-to')}
          />
        )}
        {step === 'how-to' && (
          <HowToCancelStep onBack={() => setStep('retention')} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Step 1: Survey
function SurveyStep({
  selectedReason, onSelectReason, onNext, onKeepUsing,
}: {
  selectedReason: number | null;
  onSelectReason: (i: number) => void;
  onNext: () => void;
  onKeepUsing: () => void;
}) {
  return (
    <div className="h-full flex flex-col bg-[#F4ECFE] dark:bg-background">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onKeepUsing} className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={onKeepUsing} className="text-sm font-semibold text-primary">
          Keep Using
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <h2 className="text-2xl font-bold mt-2 mb-6">
          Please let us know why you want to leave 🥺
        </h2>

        <div className="space-y-3">
          {CANCEL_REASONS.map((reason, i) => (
            <button
              key={i}
              onClick={() => onSelectReason(i)}
              className={cn(
                'w-full flex items-center gap-3 p-4 rounded-2xl bg-card text-left transition-all',
                selectedReason === i
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              )}
            >
              <FluentEmoji emoji={reason.emoji} size={28} />
              <span className="text-sm font-medium flex-1">{reason.text}</span>
              <div className={cn(
                'h-5 w-5 rounded-full border-2 flex-shrink-0 transition-colors',
                selectedReason === i
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/30'
              )}>
                {selectedReason === i && (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Next button */}
      <div className="shrink-0 px-4 pb-6 pt-2">
        <Button
          variant="default"
          className="w-full rounded-full h-12 text-sm font-semibold bg-foreground text-background hover:bg-foreground/90"
          onClick={onNext}
          disabled={selectedReason === null}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

// Step 2: Retention offer
function RetentionStep({
  onClose, onGiveUp,
}: {
  onClose: () => void;
  onGiveUp: () => void;
}) {
  const { handlePurchase } = useRevenueCat();

  return (
    <div className="h-full flex flex-col bg-[#F4ECFE] dark:bg-background">
      {/* Close button */}
      <div className="shrink-0 flex items-center px-4 pt-4 pb-2">
        <button onClick={onClose} className="p-1">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Heading */}
        <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent mb-4">
          Wait! Give Us Another Chance
        </h2>

        {/* Premium card */}
        <div className="rounded-2xl p-6 text-center shadow-lg mb-6"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)' }}
        >
          <p className="text-primary-foreground/80 text-sm">🌿 Ladybosslook+ 🌿</p>
          <h3 className="text-4xl font-black text-primary-foreground mt-2 mb-1">Free Trial</h3>
          <p className="text-primary-foreground/70 text-xs tracking-[0.3em] uppercase">Super Prize</p>
        </div>

        {/* Benefits lost */}
        <h3 className="text-base font-bold text-center mb-4">
          You will lose the following benefits in your next period
        </h3>

        <div className="space-y-3 mb-6">
          {BENEFITS_LOST.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <FluentEmoji emoji={b.emoji} size={28} />
              <span className="text-sm font-medium flex-1">{b.text}</span>
              <span className="text-destructive text-lg">✕</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="shrink-0 px-4 pb-6 pt-2 space-y-3">
        <p className="text-xs text-center text-muted-foreground">
          Keep your premium access. Cancel anytime.
        </p>
        <Button
          className="w-full rounded-full h-12 text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)' }}
          onClick={onClose}
        >
          Keep My Subscription
        </Button>
        <button
          onClick={onGiveUp}
          className="w-full text-center text-sm text-muted-foreground underline underline-offset-2"
        >
          Give up and continue canceling
        </button>
      </div>
    </div>
  );
}

// Step 3: How to stop subscription (with screenshots)
function HowToCancelStep({ onBack }: { onBack: () => void }) {
  const isIos = Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'web';

  const steps = isIos
    ? [
        { num: 1, text: 'Open the Settings app.', image: cancelStep1 },
        { num: 2, text: 'Tap your account name.', image: cancelStep2 },
        { num: 3, text: 'Tap Subscriptions.', image: cancelStep3 },
        { num: 4, text: 'Tap Cancel Subscription.', image: null },
      ]
    : [
        { num: 1, text: 'Open Google Play Store.', image: null },
        { num: 2, text: 'Tap your profile icon → Payments & subscriptions.', image: null },
        { num: 3, text: 'Tap Subscriptions.', image: null },
        { num: 4, text: 'Select Simora and tap Cancel subscription.', image: null },
      ];

  return (
    <div className="h-full flex flex-col bg-[#F4ECFE] dark:bg-background">
      {/* Header */}
      <div className="shrink-0 flex items-center px-4 pt-4 pb-2">
        <button onClick={onBack} className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="w-7" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <h2 className="text-2xl font-bold mb-2">How to stop your subscription</h2>
        <p className="text-sm text-muted-foreground mb-6">
          If you have reached your goal or just changed your mind, you need to go to your settings to stop auto-renewal after the current billing cycle. Please follow the following steps:
        </p>

        <div className="space-y-6">
          {steps.map((s) => (
            <div key={s.num}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-lg">{s.num}</span>
                </div>
                <p className="font-medium text-sm">{s.text}</p>
              </div>
              {s.image && (
                <div className="rounded-2xl overflow-hidden bg-card shadow-sm">
                  <img src={s.image} alt={`Step ${s.num}`} className="w-full h-auto" />
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          You might need to scroll down to find the Cancel Subscription button. If there is no Cancel button or you see an expiration message in red text, the subscription is already canceled.
        </p>
      </div>
    </div>
  );
}
