import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { OnboardingStep } from '@/types/onboarding';
import { haptic } from '@/lib/haptics';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
}

/**
 * Self-Care Quiz: ask for push notification permission.
 *
 * Auto-skips when permission has already been granted (so users who already
 * enabled PN don't see this step at all). Native (Capacitor) APIs are used
 * first, with a web Notification API fallback.
 */
export function SelfCarePushPermissionStep({ step, onNext }: Props) {
  const [checking, setChecking] = useState(true);
  const [requesting, setRequesting] = useState(false);

  // On mount: if PN are already granted, skip immediately.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const status = await PushNotifications.checkPermissions();
          if (!cancelled && status.receive === 'granted') {
            onNext();
            return;
          }
        } catch {
          // Web fallback
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            if (!cancelled) onNext();
            return;
          }
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [onNext]);

  const handleTurnOn = async () => {
    if (requesting) return;
    haptic.light();
    setRequesting(true);
    try {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const result = await PushNotifications.requestPermissions();
        if (result.receive === 'granted') {
          await PushNotifications.register();
        }
      } catch {
        try { await Notification.requestPermission(); } catch { /* ignore */ }
      }
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.requestPermissions();
      } catch { /* ignore */ }
    } finally {
      setRequesting(false);
      onNext();
    }
  };

  const handleSkip = () => {
    haptic.light();
    onNext();
  };

  if (checking) {
    return <div className="h-full w-full bg-gradient-to-b from-[#FFF6E8] via-[#FFE9F1] to-[#EFE4FF]" />;
  }

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-gradient-to-b from-[#FFF6E8] via-[#FFE9F1] to-[#EFE4FF]">
      {/* Ambient warmth */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, #FFD6A5 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 -right-16 w-[300px] h-[300px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, #E5D6FF 0%, transparent 70%)' }}
      />

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4 relative z-10">
        {/* Bell hero */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 18 }}
          className="relative mx-auto w-24 h-24 rounded-[26px] bg-gradient-to-br from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] shadow-[0_20px_50px_-10px_rgba(138,92,240,0.5)] flex items-center justify-center"
        >
          <Bell className="w-11 h-11 text-white" strokeWidth={2.4} />
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-white shadow-md flex items-center justify-center"
          >
            <span className="text-[11px] font-extrabold text-[#EC4899]">1</span>
          </motion.div>
        </motion.div>

        {/* Header */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-5 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8590E]"
        >
          🔔 Stay on track
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28 }}
          className="mt-2 text-[24px] leading-[1.2] font-extrabold text-[#1a1f3d] text-center whitespace-pre-line"
        >
          {step.title || 'Gentle nudges,\nnot noisy alerts.'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.36 }}
          className="mt-3 text-center text-[14px] text-[#1a1f3d]/70 leading-snug"
        >
          {step.subtitle || "Get a soft reminder when it's time to show up for one of your routine tasks."}
        </motion.p>

        {/* Reasons card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-6 max-w-[360px] mx-auto rounded-3xl bg-white/75 backdrop-blur-sm border border-white shadow-[0_18px_45px_-18px_rgba(138,92,240,0.35)] p-4"
        >
          {[
            { icon: '🌅', label: 'Daily check-in reminders' },
            { icon: '💪', label: 'Routine task nudges' },
            { icon: '🔥', label: 'Streak protection alerts' },
          ].map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.55 + i * 0.07 }}
              className="flex items-center gap-3 py-1.5"
            >
              <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[18px]">
                {r.icon}
              </div>
              <span className="text-[14px] font-semibold text-[#1a1f3d]">{r.label}</span>
            </motion.div>
          ))}
          <p className="mt-2 text-center text-[11px] text-[#1a1f3d]/55">
            You can change this anytime in Settings.
          </p>
        </motion.div>
      </div>

      {/* CTAs */}
      <div
        className="shrink-0 px-6 pt-2 pb-6 relative z-10"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)' }}
      >
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          onClick={handleTurnOn}
          disabled={requesting}
          className="w-full h-[56px] rounded-2xl text-white font-bold text-[16px] active:opacity-80 transition-opacity bg-gradient-to-r from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] shadow-[0_12px_30px_-8px_rgba(138,92,240,0.55)] disabled:opacity-60"
        >
          {step.buttonLabel || 'Turn on reminders'}
        </motion.button>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          onClick={handleSkip}
          className="mt-3 w-full h-[44px] rounded-xl text-[#1a1f3d]/70 font-semibold text-[14px] active:opacity-60 transition-opacity"
        >
          {step.secondaryButtonLabel || 'Maybe later'}
        </motion.button>
      </div>
    </div>
  );
}