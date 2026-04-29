import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { provisionRiloPicks } from '@/lib/onboarding/provisionRiloPicks';
import confetti from 'canvas-confetti';
import type { OnboardingStep } from '@/types/onboarding';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
}

type Row = { id: string; title: string; emoji: string };

/**
 * Final onboarding screen — list every committed task from the user's
 * freshly-provisioned "My Rilo" routine, then a swipe-to-confirm pill
 * that triggers a short emoji-burst celebration before handing off to
 * the planner via onNext().
 */
export function RiloCommitScreen({ step, onNext }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [stage, setStage] = useState<'list' | 'celebrate'>('list');

  // Pull the committed tasks directly from the planner so the user
  // sees exactly what's about to greet them on Home.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        // Idempotent — returns the same routineId on repeat calls.
        const result = await provisionRiloPicks(user.id, {});
        const routineId = result?.routineId;
        // Always pull the AI-extracted "My Week" tasks too — the user may have
        // skipped the picker buckets entirely, in which case there's no
        // routineId but still real onboarding tasks to commit to.
        const launcherP = routineId
          ? supabase
              .from('user_tasks')
              .select('id, title, emoji')
              .eq('user_id', user.id)
              .eq('pro_link_type', 'routine')
              .eq('pro_link_value', routineId)
              .limit(1)
          : Promise.resolve({ data: [] as any[] } as any);
        const childP = routineId
          ? supabase
              .from('user_tasks')
              .select('id, title, emoji, order_index')
              .eq('user_id', user.id)
              .eq('source_routine_id', routineId)
              .order('order_index', { ascending: true })
          : Promise.resolve({ data: [] as any[] } as any);
        // AI-extracted plans from RiloWeekPlansScreen — tagged 'My Week',
        // inserted with negative order_index and no source_routine_id.
        const aiP = supabase
          .from('user_tasks')
          .select('id, title, emoji, order_index, source_routine_id, tag')
          .eq('user_id', user.id)
          .eq('tag', 'My Week')
          .is('source_routine_id', null)
          .order('order_index', { ascending: true });
        const [launcherRes, childRes, aiRes] = await Promise.all([launcherP, childP, aiP]);
        if (cancelled) return;
        const out: Row[] = [];
        const launcher = launcherRes.data?.[0] as any;
        if (launcher) {
          out.push({ id: launcher.id, title: launcher.title, emoji: launcher.emoji || '🔥' });
        }
        for (const c of (childRes.data || []) as any[]) {
          out.push({ id: c.id, title: c.title, emoji: c.emoji || '✨' });
        }
        const seen = new Set(out.map((r) => r.id));
        for (const a of (aiRes.data || []) as any[]) {
          if (seen.has(a.id)) continue;
          out.push({ id: a.id, title: a.title, emoji: a.emoji || '✨' });
          seen.add(a.id);
        }
        setRows(out);
      } catch (err) {
        console.warn('[RiloCommitScreen] failed to load tasks:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Swipe-to-confirm pill ---------------------------------------------------
  const trackRef = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const [maxDrag, setMaxDrag] = useState(0);
  useEffect(() => {
    const measure = () => {
      const w = trackRef.current?.clientWidth ?? 0;
      // Pill knob is 56px; padding 4px each side
      setMaxDrag(Math.max(0, w - 56 - 8));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const labelOpacity = useTransform(x, [0, maxDrag * 0.6], [1, 0]);

  const handleDragEnd = () => {
    if (x.get() > maxDrag * 0.7) {
      animate(x, maxDrag, { duration: 0.15 });
      haptic.medium();
      setTimeout(() => triggerCelebrate(), 180);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  const triggerCelebrate = () => {
    setStage('celebrate');
    haptic.light();
    // Confetti burst from bottom-center, slightly delayed so the bubbles bloom first.
    setTimeout(() => {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          startVelocity: 55,
          gravity: 0.9,
          ticks: 220,
          origin: { x: 0.5, y: 0.65 },
          colors: ['#A98AF0', '#F08AB5', '#FFB347', '#5BB7F0', '#5BD0A8', '#FFD86B'],
          scalar: 0.95,
        });
      } catch {}
    }, 350);
    setTimeout(() => {
      try {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#A98AF0', '#F08AB5', '#FFD86B'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#5BB7F0', '#5BD0A8', '#FFB347'],
        });
      } catch {}
      haptic.medium();
    }, 900);
    // Auto-advance to Home after the celebration fully plays
    setTimeout(() => {
      haptic.medium();
      onNext();
    }, 3400);
  };

  // Build a fountain of emoji bubbles. Each one starts at the bottom-center,
  // launches upward along an arc, and settles in a soft cluster near the top.
  const bubbles = useMemo(() => {
    if (rows.length === 0) return [];
    const palette = ['#A98AF0', '#F08AB5', '#FFB347', '#5BB7F0', '#5BD0A8', '#FFD86B'];
    const count = 18;
    type B = {
      emoji: string;
      // resting position (% of container)
      left: number;
      top: number;
      size: number;
      delay: number;
      color: string;
      // launch trajectory
      fromX: number; // px offset from rest
      fromY: number;
      rotate: number;
      floatPhase: number;
    };
    const items: B[] = [];
    for (let i = 0; i < count; i++) {
      const r = rows[i % rows.length];
      // Spread roughly across a 70%-wide × 45%-tall area near the top
      const t = i / Math.max(1, count - 1);
      const ringAngle = Math.PI * (0.15 + t * 0.7) + (Math.random() - 0.5) * 0.4;
      const ringRadius = 90 + Math.random() * 70;
      const left = 50 + Math.cos(ringAngle) * (ringRadius / 4.2);
      const top = 32 - Math.sin(ringAngle) * (ringRadius / 7) + (Math.random() - 0.5) * 6;
      items.push({
        emoji: r.emoji,
        left: Math.max(8, Math.min(92, left)),
        top: Math.max(6, Math.min(58, top)),
        size: 44 + Math.random() * 22,
        delay: 0.05 + Math.random() * 0.45,
        color: palette[i % palette.length],
        fromX: (Math.random() - 0.5) * 80,
        fromY: 320 + Math.random() * 80,
        rotate: (Math.random() - 0.5) * 90,
        floatPhase: Math.random() * Math.PI * 2,
      });
    }
    return items;
  }, [rows]);

  return (
    <div className="h-full w-full bg-white relative overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {stage === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col px-7 min-h-0"
            style={{
              paddingTop: 'max(env(safe-area-inset-top, 0px), 56px)',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
            }}
          >
            <h1
              className="text-[34px] leading-[1.05] font-bold text-black mb-5 shrink-0"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {step.title || 'Lastly, commit to get this done!'}
            </h1>

            <div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2">
              <ul className="space-y-3">
                {rows.map((r, i) => (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.32, delay: 0.08 + i * 0.05 }}
                    className="flex items-center gap-3 text-[18px] text-black"
                  >
                    <FluentEmoji emoji={r.emoji} size={24} />
                    <span className="font-medium">{r.title}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Swipe-to-confirm pill */}
            <div
              ref={trackRef}
              className="relative h-[64px] w-full rounded-full bg-black mt-4 shrink-0 select-none"
              style={{ touchAction: 'pan-y' }}
            >
              <motion.div
                style={{ opacity: labelOpacity }}
                className="absolute inset-0 flex items-center justify-center text-white text-[17px] font-semibold pointer-events-none"
              >
                I'm ready
              </motion.div>
              <motion.button
                drag="x"
                dragConstraints={{ left: 0, right: maxDrag }}
                dragElastic={0.04}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                style={{ x }}
                whileTap={{ scale: 0.96 }}
                className="absolute top-1 left-1 w-[56px] h-[56px] rounded-full bg-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
                aria-label="Swipe to confirm"
              >
                <ChevronRight className="w-6 h-6 text-black" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {stage === 'celebrate' && (
          <motion.div
            key="celebrate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 60, scale: 1.04 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-start pt-32"
          >
            <div className="relative w-full h-[280px]">
              {bubbles.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0, x: 0, y: 40 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    x: 0,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.55,
                    delay: b.delay,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  className="absolute rounded-full flex items-center justify-center shadow-md"
                  style={{
                    left: `${b.left}%`,
                    top: `${b.top}%`,
                    width: b.size,
                    height: b.size,
                    background: b.color,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <FluentEmoji emoji={b.emoji} size={b.size * 0.62} />
                </motion.div>
              ))}
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-[40px] leading-[1.05] font-bold text-black mt-2 px-7 text-center"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              You've got this!
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}