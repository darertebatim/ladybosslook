import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';
import riloAppIcon from '@/assets/rilo-app-icon.png';
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

type PlannerRow = {
  id: string;
  title: string;
  emoji: string;
  color: string; // hex
  isLauncher: boolean;
};

/**
 * Reassurance screen shown after the 3 task pickers, before the AI step.
 * Renders 3 chips picked from the user's selections (one per bucket when
 * possible). Chips fly in from above, then slide down and "click" into the
 * planner card's rows. Auto-advances after the animation completes.
 */
export function RiloBuildingPlanScreen({ step, onNext, answers }: Props) {
  const { user } = useAuth();
  // Real planner rows belonging to the freshly-created "My Rilo" routine
  const [rows, setRows] = useState<PlannerRow[]>([]);
  const [ready, setReady] = useState(false);

  // Provision the routine FIRST, then read back its tasks
  useEffect(() => {
    if (!user?.id) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await provisionRiloPicks(user.id, answers || {});
        const routineId = result.routineId;
        if (!routineId) {
          if (!cancelled) setReady(true);
          return;
        }
        // Pull the routine launcher + child tasks (max 6 to keep the card tidy)
        const [launcherRes, childRes] = await Promise.all([
          supabase
            .from('user_tasks')
            .select('id, title, emoji, color')
            .eq('user_id', user.id)
            .eq('pro_link_type', 'routine')
            .eq('pro_link_value', routineId)
            .limit(1),
          supabase
            .from('user_tasks')
            .select('id, title, emoji, color, order_index')
            .eq('user_id', user.id)
            .eq('source_routine_id', routineId)
            .order('order_index', { ascending: true })
            .limit(5),
        ]);
        if (cancelled) return;
        const out: PlannerRow[] = [];
        const launcher = launcherRes.data?.[0] as any;
        if (launcher) {
          out.push({
            id: launcher.id,
            title: launcher.title,
            emoji: launcher.emoji || '🔥',
            color: TOKEN_TO_HEX[launcher.color] || '#F08AB5',
            isLauncher: true,
          });
        }
        for (const r of (childRes.data || []) as any[]) {
          out.push({
            id: r.id,
            title: r.title,
            emoji: r.emoji || '✨',
            color: TOKEN_TO_HEX[r.color] || '#5BB7F0',
            isLauncher: false,
          });
        }
        setRows(out);
      } catch (err) {
        console.warn('[BuildingPlan] provision/load failed:', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Drop animation: rows reveal one-by-one once they're loaded
  const [phase, setPhase] = useState<0 | 1>(0);
  useEffect(() => {
    if (!ready) return;
    const t1 = setTimeout(() => setPhase(1), 200);
    const visibleCount = Math.max(rows.length, 1);
    const settleMs = 200 + visibleCount * 200 + 600;
    const tHaptic = setTimeout(() => haptic.light(), settleMs);
    const tNext = setTimeout(() => onNext(), settleMs + 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(tHaptic);
      clearTimeout(tNext);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, rows.length]);

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

          {/* Routine launcher + its child tasks — exactly what shows up in the planner */}
          <div className="px-3 py-3 space-y-2 min-h-[180px]">
            {rows.map((r, i) => {
              const dropped = phase >= 1;
              const dropDelay = i * 0.18;
              return (
                <div
                  key={r.id}
                  className="relative h-11 rounded-xl bg-black/5 overflow-visible"
                >
                  <motion.div
                    initial={{ opacity: 0, y: -70, scale: 0.85 }}
                    animate={
                      dropped
                        ? { opacity: 1, y: 0, scale: 1 }
                        : { opacity: 0, y: -70, scale: 0.85 }
                    }
                    transition={{
                      duration: 0.5,
                      delay: dropDelay,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                    className={`absolute inset-0 flex items-center gap-2 px-3 rounded-xl bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.18)] border ${
                      r.isLauncher ? 'ring-2 ring-[#E84A6F]/30' : ''
                    }`}
                    style={{ borderColor: `${r.color}66` }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: r.color }}
                    />
                    <img
                      src={getFluentEmojiUrl(r.emoji)}
                      alt=""
                      className="w-5 h-5 shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span
                      className={`text-[13px] truncate ${
                        r.isLauncher ? 'font-bold text-black' : 'font-semibold text-black/80'
                      }`}
                    >
                      {r.title}
                    </span>
                    {r.isLauncher && (
                      <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-[#A0123F]">
                        Routine
                      </span>
                    )}
                  </motion.div>
                </div>
              );
            })}
            {ready && rows.length === 0 && (
              <div className="h-11 rounded-xl bg-black/5 flex items-center justify-center text-[12px] text-black/40">
                Setting things up…
              </div>
            )}
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