import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
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
      // Pull every task created during onboarding for this user. We rely on
      // the routine launcher (pro_link_type='routine') + its child tasks
      // (source_routine_id set) which both belong to the user.
      const { data } = await supabase
        .from('user_tasks')
        .select('id, title, emoji, order_index, pro_link_type, source_routine_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(40);
      if (cancelled) return;
      const list = (data || []) as any[];
      // Show launcher first, then its children in stored order.
      const launchers = list.filter((r) => r.pro_link_type === 'routine');
      const launcher = launchers[launchers.length - 1]; // most recent "My Rilo"
      const out: Row[] = [];
      if (launcher) {
        out.push({ id: launcher.id, title: launcher.title, emoji: launcher.emoji || '🔥' });
        const children = list
          .filter((r) => r.source_routine_id && r.source_routine_id === launcher.pro_link_value)
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        for (const c of children) {
          out.push({ id: c.id, title: c.title, emoji: c.emoji || '✨' });
        }
      } else {
        // Fallback: show whatever child tasks exist
        for (const r of list.slice(0, 10)) {
          out.push({ id: r.id, title: r.title, emoji: r.emoji || '✨' });
        }
      }
      setRows(out);
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
    // Auto-advance to Home after the celebration plays
    setTimeout(() => {
      haptic.medium();
      onNext();
    }, 1900);
  };

  // Build a small bubble cluster from the picked emojis (repeat to fill)
  const bubbles = useMemo(() => {
    if (rows.length === 0) return [];
    const palette = ['#A98AF0', '#F08AB5', '#FFB347', '#5BB7F0', '#5BD0A8'];
    const items: { emoji: string; left: number; top: number; size: number; delay: number; color: string }[] = [];
    const count = 22;
    for (let i = 0; i < count; i++) {
      const r = rows[i % rows.length];
      // Cluster around top-center, ~ 60% width / 35% height area
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + Math.random() * 110;
      const left = 50 + Math.cos(angle) * (radius / 3.2);
      const top = 28 + Math.sin(angle) * (radius / 5);
      items.push({
        emoji: r.emoji,
        left,
        top,
        size: 38 + Math.random() * 18,
        delay: Math.random() * 0.35,
        color: palette[i % palette.length],
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
            className="flex-1 flex flex-col px-7 pt-20 pb-8"
          >
            <h1
              className="text-[40px] leading-[1.05] font-bold text-black mb-8"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {step.title || 'Lastly, commit to get this done!'}
            </h1>

            <div className="flex-1 overflow-y-auto -mx-2 px-2">
              <ul className="space-y-3">
                {rows.map((r, i) => (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.32, delay: 0.08 + i * 0.05 }}
                    className="flex items-center gap-3 text-[20px] text-black"
                  >
                    <FluentEmoji emoji={r.emoji} size={26} />
                    <span className="font-medium">{r.title}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Swipe-to-confirm pill */}
            <div
              ref={trackRef}
              className="relative h-[64px] w-full rounded-full bg-black mt-6 select-none"
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