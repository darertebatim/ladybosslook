import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';
import riloAppIcon from '@/assets/rilo-app-icon.png';
import { whatIsRiloFlow } from '@/data/onboarding-flows/what-is-rilo';
import type { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { haptic } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { provisionRiloPicks } from '@/lib/onboarding/provisionRiloPicks';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  answers?: OnboardingAnswers;
}

const BUCKET_IDS = ['wir-pick-morning', 'wir-pick-afternoon', 'wir-pick-evening'] as const;
const PALETTE = ['#FFB347', '#F08AB5', '#8A5CF0']; // morning, midday, evening

// Map our task `color` token names to display hex used inside the planner card
const TOKEN_TO_HEX: Record<string, string> = {
  sky: '#5BB7F0',
  mint: '#5BD0A8',
  lavender: '#A98AF0',
  pink: '#F08AB5',
  lime: '#B6D34A',
  yellow: '#F5C842',
  peach: '#FFB347',
};

/**
 * Reassurance screen shown after the 3 task pickers, before the AI step.
 * Renders 3 chips picked from the user's selections (one per bucket when
 * possible). Chips fly in from above, then slide down and "click" into the
 * planner card's rows. Auto-advances after the animation completes.
 */
export function RiloBuildingPlanScreen({ step, onNext, answers }: Props) {
  const { user } = useAuth();
  // Tasks that already exist for this user (e.g. Daily Reset) — shown as
  // "already in your routine" rows under the new picks.
  const [existingTasks, setExistingTasks] = useState<
    { title: string; emoji: string; color: string }[]
  >([]);

  // Kick off provisioning + load existing routine tasks as soon as we land
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      // Fire-and-forget: persist the picks NOW so they really make it into
      // the planner before the user reaches the home screen.
      provisionRiloPicks(user.id, answers || {}).catch((err) =>
        console.warn('[BuildingPlan] provisionRiloPicks failed:', err)
      );
      // Pull a few of their existing routine player tasks (Daily Reset etc.)
      try {
        const { data } = await supabase
          .from('user_tasks')
          .select('title, emoji, color')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .neq('pro_link_type', 'routine')
          .order('order_index', { ascending: true })
          .limit(4);
        if (!cancelled && data) {
          setExistingTasks(
            data
              .filter((r: any) => r.title)
              .map((r: any) => ({
                title: r.title,
                emoji: r.emoji || '✨',
                color: TOKEN_TO_HEX[r.color] || '#5BB7F0',
              }))
          );
        }
      } catch (e) {
        // ignore — fallback is just an empty list
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Build label -> emoji lookup from the picker step definitions
  const labelEmoji = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of whatIsRiloFlow.steps as any[]) {
      if (s.type === 'rilo-pick-tasks' && Array.isArray(s.pickerTasks)) {
        for (const t of s.pickerTasks) map[t.label] = t.emoji;
      }
    }
    return map;
  }, []);

  // Pick exactly 3 chips: prefer one per bucket; pad from any bucket; then fallbacks
  const chips = useMemo(() => {
    const picks: { label: string; emoji: string; color: string }[] = [];
    BUCKET_IDS.forEach((id, i) => {
      const a = answers?.[id];
      const arr = Array.isArray(a) ? a : a ? [a] : [];
      if (arr.length > 0) {
        const label = arr[0];
        picks.push({ label, emoji: labelEmoji[label] || '✨', color: PALETTE[i] });
      }
    });
    if (picks.length < 3) {
      const leftover: { label: string; bucketIdx: number }[] = [];
      BUCKET_IDS.forEach((id, i) => {
        const a = answers?.[id];
        const arr = Array.isArray(a) ? a : a ? [a] : [];
        arr.slice(1).forEach((l) => leftover.push({ label: l, bucketIdx: i }));
      });
      while (picks.length < 3 && leftover.length > 0) {
        const l = leftover.shift()!;
        picks.push({ label: l.label, emoji: labelEmoji[l.label] || '✨', color: PALETTE[l.bucketIdx] });
      }
    }
    const fallbacks = [
      { label: 'Morning routine', emoji: '🌅', color: PALETTE[0] },
      { label: 'Midday reset', emoji: '🥗', color: PALETTE[1] },
      { label: 'Wind down', emoji: '🌙', color: PALETTE[2] },
    ];
    while (picks.length < 3) picks.push(fallbacks[picks.length]);
    return picks.slice(0, 3);
  }, [answers, labelEmoji]);

  // Phases: 0 = card rises, 1 = chips drop into rows one-by-one, 2 = settled
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => {
      haptic.light();
      setPhase(2);
    }, 500 + 800 + chips.length * 220);
    const t3 = setTimeout(() => {
      onNext();
    }, 500 + 800 + chips.length * 220 + 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chips.length]);

  const handleTap = () => {
    haptic.light();
    onNext();
  };

  return (
    <div
      onClick={handleTap}
      className="h-full w-full flex flex-col relative overflow-hidden bg-gradient-to-b from-[#FFF4DC] via-[#FFE0E6] to-[#FBD4E2] cursor-pointer"
    >
      {/* Soft glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
          style={{ background: 'radial-gradient(circle, #FFD36E 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-10 -left-16 w-[300px] h-[300px] rounded-full blur-3xl opacity-50"
          style={{ background: 'radial-gradient(circle, #E84A6F 0%, transparent 70%)' }}
        />
      </div>

      {/* Visual stage */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-[280px] rounded-[24px] bg-white shadow-[0_24px_50px_-18px_rgba(232,74,111,0.45)] border border-black/5 overflow-hidden"
        >
          {/* Card header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-black/5">
            <img src={riloAppIcon} alt="Rilo" className="w-6 h-6 rounded-[7px]" />
            <span className="text-[13px] font-bold text-black">Today</span>
            <span className="ml-auto text-[10px] font-semibold text-black/40 uppercase tracking-wider">
              Building…
            </span>
          </div>

          {/* Existing routine player tasks (already provisioned via Daily Reset) */}
          {existingTasks.length > 0 && (
            <div className="px-3 pt-3 pb-1 space-y-1.5">
              <div className="px-1 text-[9px] font-bold uppercase tracking-wider text-black/40">
                Already in your routine
              </div>
              {existingTasks.map((t, i) => (
                <motion.div
                  key={`ex-${t.title}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.06 }}
                  className="h-9 flex items-center gap-2 px-3 rounded-xl bg-black/[0.03] border border-black/5"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: t.color }}
                  />
                  <img
                    src={getFluentEmojiUrl(t.emoji)}
                    alt=""
                    className="w-4 h-4 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[12px] font-semibold text-black/70 truncate">
                    {t.title}
                  </span>
                  <span className="ml-auto text-[10px] text-black/30">✓</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Three rows for new picks; each shows a faint slot then the chip "clicks" in */}
          {existingTasks.length > 0 && (
            <div className="px-4 pt-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-[#A0123F]">
              + Adding now
            </div>
          )}
          <div className="px-3 py-3 space-y-2 min-h-[180px]">
            {chips.map((c, i) => {
              const dropDelay = i * 0.22;
              const dropped = phase >= 1;
              return (
                <div
                  key={c.label + i}
                  className="relative h-11 rounded-xl bg-black/5 overflow-visible"
                >
                  <motion.div
                    initial={{ opacity: 0, y: -90, scale: 0.85 }}
                    animate={
                      dropped
                        ? { opacity: 1, y: 0, scale: 1 }
                        : { opacity: 0, y: -90, scale: 0.85 }
                    }
                    transition={{
                      duration: 0.55,
                      delay: dropDelay,
                      ease: [0.34, 1.56, 0.64, 1], // overshoot for "click"
                    }}
                    className="absolute inset-0 flex items-center gap-2 px-3 rounded-xl bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.18)] border"
                    style={{ borderColor: `${c.color}66` }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: c.color }}
                    />
                    <img
                      src={getFluentEmojiUrl(c.emoji)}
                      alt=""
                      className="w-5 h-5 shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="text-[13px] font-semibold text-black truncate">
                      {c.label}
                    </span>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Progress shimmer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#E84A6F] to-transparent"
          />
        </motion.div>
      </div>

      {/* Copy */}
      <div className="shrink-0 px-6 pb-12 relative z-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A0123F] mb-2"
        >
          ✨ Got it
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-[26px] leading-[1.2] font-bold text-black"
        >
          {step.title || 'Building your plan…'}
        </motion.h1>
        {step.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="mt-3 text-[15px] leading-snug text-black/70"
          >
            {step.subtitle}
          </motion.p>
        )}
      </div>
    </div>
  );
}