import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';

interface SoftReviewPromptProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when the user explicitly says they LOVE it AND taps "Rate 5 stars". */
  onAccept: () => void;
  /** Optional source label, persisted with the satisfaction signal. */
  trigger?: string;
}

type Stage = 'gate' | 'rate' | 'feedback';

/**
 * Satisfaction Gate (a.k.a. SoftReviewPrompt — name preserved for API compatibility).
 *
 * Two-step funnel that protects the App Store rating:
 *  1. GATE  — "How's Rilo treating you?" (Loving it / Could be better)
 *  2a. RATE — Only if they tapped "Loving it" → invites the 5-star review (calls onAccept).
 *  2b. FEEDBACK — If they tapped "Could be better" → routes to in-app support, NEVER to the store.
 *
 * Every signal is logged to `app_review_prompts` for KPI tracking, including the
 * "negative" branch so we can see how many users we *protected* the rating from.
 */
export function SoftReviewPrompt({ isOpen, onClose, onAccept, trigger }: SoftReviewPromptProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [stage, setStage] = useState<Stage>('gate');

  useEffect(() => {
    if (isOpen) {
      setStage('gate');
      // next frame so the enter transition plays
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const close = (after?: () => void) => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      after?.();
    }, 200);
  };

  const logSignal = async (sentiment: 'positive' | 'negative' | 'dismissed', action: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('app_review_prompts').insert({
        user_id: user.id,
        platform: 'web',
        trigger_source: `gate:${trigger ?? 'unknown'}:${sentiment}:${action}`,
        success: false,
        forced: false,
        error_message: 'satisfaction_gate',
      });
    } catch {
      // best-effort; never block UX
    }
  };

  const handleLoveIt = () => {
    haptic.success();
    logSignal('positive', 'love');
    setStage('rate');
  };

  const handleNotGreat = () => {
    haptic.light();
    logSignal('negative', 'meh');
    setStage('feedback');
  };

  const handleRateNow = () => {
    haptic.success();
    logSignal('positive', 'rate');
    close(() => onAccept());
  };

  const handleSendFeedback = () => {
    haptic.light();
    logSignal('negative', 'support');
    close(() => navigate('/app/chat'));
  };

  const handleDismiss = () => {
    haptic.light();
    logSignal('dismissed', stage);
    close();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
      />

      <div
        className={cn(
          'relative w-full max-w-sm overflow-hidden rounded-[28px] bg-card text-card-foreground shadow-ios transition-all duration-300',
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient header */}
        <div className="relative h-28 bg-gradient-to-br from-orange-400 via-orange-500 to-rose-500">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, white 0%, transparent 35%), radial-gradient(circle at 80% 70%, white 0%, transparent 30%)',
          }} />
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-black/20 text-white active:bg-black/30"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-ios">
              {stage === 'gate' && <Sparkles className="h-7 w-7 text-orange-500" />}
              {stage === 'rate' && <Star className="h-7 w-7 fill-amber-400 text-amber-400" />}
              {stage === 'feedback' && <span className="text-2xl">💌</span>}
            </div>
          </div>
        </div>

        <div className="px-6 pt-12 pb-6 text-center">
          {stage === 'gate' && (
            <>
              <h2 className="text-[20px] font-bold leading-tight text-foreground">
                How's Rilo treating you?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Your honest take helps us make Rilo better for every woman who needs it.
              </p>
              <div className="mt-5 space-y-2.5">
                <button
                  onClick={handleLoveIt}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3.5 text-[15px] font-semibold text-white shadow-ios active:opacity-90"
                >
                  😍 I'm loving it
                </button>
                <button
                  onClick={handleNotGreat}
                  className="w-full rounded-2xl bg-muted px-4 py-3.5 text-[15px] font-semibold text-foreground active:opacity-80"
                >
                  🤔 Could be better
                </button>
              </div>
              <button
                onClick={handleDismiss}
                className="mt-3 w-full py-1.5 text-[13px] font-medium text-muted-foreground active:text-foreground"
              >
                Not now
              </button>
            </>
          )}

          {stage === 'rate' && (
            <>
              <h2 className="text-[20px] font-bold leading-tight text-foreground">
                Yay! Mind sharing the love?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A quick 5-star review on the App Store helps more women discover Rilo. It takes 10 seconds. 💛
              </p>
              <div className="mt-4 flex justify-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-7 w-7 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="mt-5 space-y-2.5">
                <button
                  onClick={handleRateNow}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3.5 text-[15px] font-semibold text-white shadow-ios active:opacity-90"
                >
                  Rate Rilo 5 stars
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-full py-2 text-[14px] font-medium text-muted-foreground active:text-foreground"
                >
                  Maybe later
                </button>
              </div>
            </>
          )}

          {stage === 'feedback' && (
            <>
              <h2 className="text-[20px] font-bold leading-tight text-foreground">
                We'd love to make it right.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Tell us what's not working and we'll personally look into it. Real humans read every message.
              </p>
              <div className="mt-5 space-y-2.5">
                <button
                  onClick={handleSendFeedback}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3.5 text-[15px] font-semibold text-white shadow-ios active:opacity-90"
                >
                  Send us feedback
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-full py-2 text-[14px] font-medium text-muted-foreground active:text-foreground"
                >
                  Maybe later
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
