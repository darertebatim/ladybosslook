import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { provisionRiloPicks } from '@/lib/onboarding/provisionRiloPicks';
import confetti from 'canvas-confetti';
import { requestAppReview } from '@/lib/appReview';
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

    // Fire native iOS/Android review prompt at peak satisfaction —
    // after the confetti bursts but before auto-advance to Home.
    // No-ops on web; system-throttled on native (3x/year on iOS).
    setTimeout(() => {
      requestAppReview('onboarding_commit').catch(() => {});
    }, 1800);
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
            className="absolute inset-0 flex flex-col items-center justify-start"
          >
            {/* Soft radial wash that warms up behind the celebration */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(120% 70% at 50% 30%, #FFF1E6 0%, #FFE4F0 35%, #F1E6FF 65%, #FFFFFF 100%)',
              }}
            />

            {/* Expanding glow rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`ring-${i}`}
                initial={{ scale: 0.2, opacity: 0.55 }}
                animate={{ scale: 2.6, opacity: 0 }}
                transition={{ duration: 1.6, delay: 0.05 + i * 0.25, ease: 'easeOut' }}
                className="absolute pointer-events-none rounded-full"
                style={{
                  top: '34%',
                  left: '50%',
                  width: 240,
                  height: 240,
                  marginLeft: -120,
                  marginTop: -120,
                  border: '2px solid rgba(169,138,240,0.55)',
                }}
              />
            ))}

            {/* Bubble fountain */}
            <div className="relative w-full" style={{ height: '58%', marginTop: '8%' }}>
              {bubbles.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 0,
                    scale: 0.2,
                    x: b.fromX,
                    y: b.fromY,
                    rotate: b.rotate,
                  }}
                  animate={{
                    opacity: [0, 1, 1, 1],
                    scale: [0.2, 1.15, 1, 1],
                    x: 0,
                    y: [b.fromY, -8, 0, 0],
                    rotate: [b.rotate, b.rotate * 0.3, 0, 0],
                  }}
                  transition={{
                    duration: 1.1,
                    delay: b.delay,
                    ease: [0.18, 0.9, 0.34, 1.15],
                    times: [0, 0.55, 0.78, 1],
                  }}
                  className="absolute rounded-full flex items-center justify-center shadow-[0_8px_22px_-8px_rgba(0,0,0,0.25)]"
                  style={{
                    left: `${b.left}%`,
                    top: `${b.top}%`,
                    width: b.size,
                    height: b.size,
                    background: b.color,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Inner gentle floating loop after landing */}
                  <motion.div
                    animate={{ y: [0, -4, 0, 4, 0] }}
                    transition={{
                      duration: 2.2,
                      delay: b.delay + 1.0,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="flex items-center justify-center"
                  >
                    <FluentEmoji emoji={b.emoji} size={b.size * 0.62} />
                  </motion.div>
                </motion.div>
              ))}

              {/* Sparkle accents */}
              {['✨', '⭐', '💫', '✨', '⭐'].map((s, i) => {
                const positions = [
                  { left: '18%', top: '20%' },
                  { left: '78%', top: '15%' },
                  { left: '12%', top: '60%' },
                  { left: '85%', top: '55%' },
                  { left: '50%', top: '8%' },
                ];
                return (
                  <motion.div
                    key={`sp-${i}`}
                    initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
                    animate={{
                      opacity: [0, 1, 1, 0.6],
                      scale: [0.4, 1.2, 1, 1.1],
                      rotate: [-30, 10, 0, -10],
                    }}
                    transition={{
                      duration: 1.6,
                      delay: 0.6 + i * 0.12,
                      ease: 'easeOut',
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                    className="absolute text-[22px]"
                    style={positions[i]}
                  >
                    {s}
                  </motion.div>
                );
              })}
            </div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="relative px-7 text-center"
            >
              <motion.h2
                initial={{ scale: 0.6, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{
                  duration: 0.7,
                  delay: 1.0,
                  type: 'spring',
                  stiffness: 220,
                  damping: 16,
                }}
                className="text-[44px] leading-[1.05] font-bold text-center"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  background:
                    'linear-gradient(90deg, #1a1f3d 0%, #6B43D1 50%, #1a1f3d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                You've got this!
              </motion.h2>
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.55, delay: 1.55, ease: 'easeOut' }}
                className="mx-auto mt-3 h-[3px] w-[120px] rounded-full origin-center"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, #A98AF0 50%, transparent 100%)',
                }}
              />
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.7 }}
                className="mt-3 text-[15px] text-[#1a1f3d]/60 font-medium"
              >
                Taking you to your day…
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}