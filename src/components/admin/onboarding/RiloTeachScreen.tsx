import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { OnboardingStep } from '@/types/onboarding';
import { haptic } from '@/lib/haptics';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
}

/**
 * Custom "What is Rilo?" teach flow screens.
 * Variant is encoded in `step.illustrationLabel`:
 *   'planner' | 'routine' | 'task-details' | 'tools-hub' | 'suggest'
 * No inputs, no questions — single tap to advance.
 */
export function RiloTeachScreen({ step, onNext }: Props) {
  const variant = step.illustrationLabel || 'planner';

  const handleTap = () => {
    haptic.light();
    onNext();
  };

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-b from-[#FFF7F0] to-white">
      {/* Visual area */}
      <div className="flex-1 flex items-center justify-center px-6 pt-6 pb-4">
        {variant === 'planner' && <PlannerVisual />}
        {variant === 'routine' && <RoutineVisual />}
        {variant === 'task-details' && <TaskDetailsVisual />}
        {variant === 'tools-hub' && <ToolsHubVisual />}
        {variant === 'suggest' && <SuggestVisual />}
      </div>

      {/* Text + CTA */}
      <div className="shrink-0 px-6 pb-10">
        <motion.h1
          key={`title-${step.id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="text-[26px] leading-[1.2] font-bold text-[#1a1f3d] text-center"
        >
          {step.title}
        </motion.h1>
        {step.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18 }}
            className="mt-3 text-[15px] leading-snug text-[#1a1f3d]/70 text-center"
          >
            {step.subtitle}
          </motion.p>
        )}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.28 }}
          onClick={handleTap}
          className="mt-7 w-full h-[56px] rounded-2xl bg-[#1a1f3d] text-white font-semibold text-[16px] active:opacity-80 transition-opacity"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {step.buttonLabel || 'Continue'}
        </motion.button>
      </div>
    </div>
  );
}

/* ---------- Visual 1: Planner with 3 colored task blocks ---------- */
function PlannerVisual() {
  const blocks = [
    { time: '8:00', title: 'Morning stretch', color: '#FFD6A5', dot: '#F08A3E' },
    { time: '12:30', title: 'Gratitude break', color: '#CDE7FF', dot: '#3E8AF0' },
    { time: '20:00', title: 'Wind-down read', color: '#E5D6FF', dot: '#8A5CF0' },
  ];
  return (
    <div className="w-full max-w-[300px] mx-auto">
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(26,31,61,0.25)] p-5 border border-black/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1a1f3d]/50">Today</p>
            <p className="text-[18px] font-bold text-[#1a1f3d]">Wed, Apr 29</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#1a1f3d] text-white flex items-center justify-center text-[14px] font-bold">R</div>
        </div>
        <div className="space-y-2.5">
          {blocks.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.35 }}
              className="flex items-center gap-3 rounded-2xl px-3.5 py-3"
              style={{ background: b.color }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.dot }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#1a1f3d]/60">{b.time}</p>
                <p className="text-[14px] font-semibold text-[#1a1f3d] truncate">{b.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Visual 2: Routine with 3 mini-tasks ticking off ---------- */
function RoutineVisual() {
  const tasks = [
    { emoji: '💧', title: 'Drink a glass of water' },
    { emoji: '🧘', title: '2 min of deep breathing' },
    { emoji: '📝', title: 'Write one good thing' },
  ];
  return (
    <div className="w-full max-w-[300px] mx-auto">
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(26,31,61,0.25)] p-5 border border-black/5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[20px]">🌅</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1a1f3d]/50">Morning routine</p>
            <p className="text-[16px] font-bold text-[#1a1f3d]">3 small wins</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {tasks.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.18, duration: 0.3 }}
              className="flex items-center gap-3 rounded-2xl px-3.5 py-3 bg-[#F4F2EF]"
            >
              <motion.div
                initial={{ scale: 0.6, background: '#FFFFFF' }}
                animate={{ scale: 1, background: '#22C55E' }}
                transition={{ delay: 0.5 + i * 0.35, duration: 0.3 }}
                className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#22C55E] shrink-0"
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.35, duration: 0.25 }}
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </motion.span>
              </motion.div>
              <span className="text-[18px]">{t.emoji}</span>
              <motion.p
                initial={{ opacity: 1 }}
                animate={{ opacity: 0.55 }}
                transition={{ delay: 0.6 + i * 0.35, duration: 0.3 }}
                className="flex-1 text-[14px] font-semibold text-[#1a1f3d] line-through decoration-[#1a1f3d]/40"
              >
                {t.title}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Visual 3: Suggested first routine + swap chip ---------- */
function SuggestVisual() {
  return (
    <div className="w-full max-w-[300px] mx-auto">
      <div className="relative bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(26,31,61,0.25)] p-5 border border-black/5">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFE6CC] text-[#B8590E] text-[10px] font-bold uppercase tracking-wider">
            ✨ Suggested
          </span>
        </div>
        <p className="text-[18px] font-bold text-[#1a1f3d] leading-tight">Your first routine</p>
        <p className="text-[12px] text-[#1a1f3d]/60 mt-0.5">Morning · 5 min</p>

        <div className="mt-4 space-y-2">
          {[
            { emoji: '💧', title: 'Drink water' },
            { emoji: '🧘', title: 'Deep breathing' },
            { emoji: '📝', title: 'One good thing' },
          ].map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-[#F4F2EF]"
            >
              <span className="text-[18px]">{t.emoji}</span>
              <p className="flex-1 text-[14px] font-semibold text-[#1a1f3d]">{t.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Swap chip floating */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4, type: 'spring' }}
          className="absolute -right-2 -bottom-2 px-3 py-2 rounded-full bg-[#1a1f3d] text-white text-[12px] font-semibold shadow-lg flex items-center gap-1.5"
        >
          <span>🔄</span> Swap any task
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Visual 3 (A): Task settings (control your routine) ---------- */
function TaskDetailsVisual() {
  const colors = ['#F08A3E', '#3E8AF0', '#8A5CF0', '#22C55E', '#EC4899'];
  const settings = [
    { icon: '🕗', label: 'Time', value: '8:00 AM', bg: '#FFE6C9' },
    { icon: '📅', label: 'Date', value: 'Today', bg: '#D7E9FF' },
    { icon: '🔁', label: 'Repeat', value: 'Weekdays', bg: '#E0FBB8' },
    { icon: '🔔', label: 'Reminder', value: '10 min before', bg: '#F0E3FF' },
  ];
  const subtasks = [
    { title: 'Neck rolls', done: true },
    { title: 'Shoulder stretch', done: true },
    { title: 'Touch your toes', done: false },
  ];
  return (
    <div className="w-full max-w-[300px] mx-auto">
      <div className="relative bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(26,31,61,0.25)] p-4 border border-black/5">
        {/* Header: emoji + title + color dots */}
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            initial={{ scale: 0.7, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, duration: 0.35, type: 'spring' }}
            className="w-11 h-11 rounded-2xl bg-[#FFD6A5] flex items-center justify-center text-[22px]"
          >
            🧘
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#1a1f3d] truncate">Morning stretch</p>
            <div className="flex items-center gap-1 mt-1">
              {colors.map((c, i) => (
                <motion.span
                  key={c}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.25 }}
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: c,
                    boxShadow: i === 0 ? '0 0 0 2px white, 0 0 0 3.5px #1a1f3d' : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Settings rows */}
        <div className="space-y-1.5">
          {settings.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.28 }}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
              style={{ background: s.bg }}
            >
              <span className="text-[14px]">{s.icon}</span>
              <span className="text-[11px] font-semibold text-[#1a1f3d]/70 flex-1">{s.label}</span>
              <span className="text-[12px] font-bold text-[#1a1f3d]">{s.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Subtasks */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.3 }}
          className="mt-3 rounded-xl bg-[#F4F2EF] px-3 py-2.5"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1a1f3d]/50 mb-1.5">Subtasks</p>
          <div className="space-y-1.5">
            {subtasks.map((st, i) => (
              <div key={st.title} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: st.done ? '#22C55E' : 'transparent',
                    border: st.done ? '0' : '1.5px solid rgba(26,31,61,0.3)',
                  }}
                >
                  {st.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                </div>
                <span
                  className={`text-[12px] font-medium text-[#1a1f3d] ${st.done ? 'line-through opacity-50' : ''}`}
                >
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.3 }}
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 bg-[#FFF7E6] border border-[#F0C674]/40"
        >
          <span className="text-[14px]">📝</span>
          <span className="text-[11px] text-[#8B6914] italic truncate">Felt lighter after this 🌟</span>
        </motion.div>

        {/* Floating "all yours" badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -6 }}
          transition={{ delay: 1.1, duration: 0.4, type: 'spring' }}
          className="absolute -right-2 -top-2 px-2.5 py-1 rounded-full bg-[#1a1f3d] text-white text-[10px] font-bold shadow-lg"
        >
          ✨ All yours
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Visual 4 (B): "5 apps in one" — outcome orbit ---------- */
function ToolsHubVisual() {
  // Each card = an outcome people download separate apps for.
  // Positioned around a central Rilo badge. Bobbing motion adds life.
  const cards = [
    {
      emoji: '🧘',
      title: 'Calmer mind',
      sub: 'Meditations & breathing',
      replaces: 'instead of Calm',
      bg: '#E5D6FF',
      fg: '#5B2BB8',
      // grid placement
      style: { top: '0%', left: '0%' },
      rotate: -6,
      delay: 0.15,
    },
    {
      emoji: '💪',
      title: 'Stronger body',
      sub: 'Workouts & movement',
      replaces: 'instead of Nike',
      bg: '#FFD9E5',
      fg: '#B8295C',
      style: { top: '4%', right: '0%' },
      rotate: 5,
      delay: 0.28,
    },
    {
      emoji: '🌙',
      title: 'Better sleep',
      sub: 'Soundscapes & wind-down',
      replaces: 'instead of Headspace',
      bg: '#CDE7FF',
      fg: '#1E5BB8',
      style: { bottom: '8%', left: '-2%' },
      rotate: -8,
      delay: 0.41,
    },
    {
      emoji: '✏️',
      title: 'Clearer thoughts',
      sub: 'Journal & reflection',
      replaces: 'instead of Stoic',
      bg: '#E0FBB8',
      fg: '#3E7A1E',
      style: { bottom: '4%', right: '-2%' },
      rotate: 7,
      delay: 0.54,
    },
    {
      emoji: '💼',
      title: 'Focused work',
      sub: 'Goals & deep work',
      replaces: 'instead of Notion',
      bg: '#FFE6C9',
      fg: '#B8590E',
      style: { top: '46%', left: '50%', transform: 'translate(-50%, -50%)' },
      rotate: -3,
      delay: 0.67,
    },
  ];

  return (
    <div className="w-full max-w-[320px] mx-auto">
      {/* Outcome orbit */}
      <div className="relative w-full aspect-[1/1.05]">
        {/* Soft radial glow */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-60"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, #FFE6C9 0%, #FFD6E8 35%, transparent 70%)',
          }}
        />

        {/* Cards */}
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, scale: 0.6, rotate: 0, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: c.rotate,
              y: [0, -4, 0],
            }}
            transition={{
              opacity: { delay: c.delay, duration: 0.4 },
              scale: { delay: c.delay, duration: 0.45, type: 'spring', stiffness: 180 },
              rotate: { delay: c.delay, duration: 0.45 },
              y: {
                delay: c.delay + 0.6,
                duration: 3 + i * 0.3,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            className="absolute w-[44%] rounded-2xl bg-white shadow-[0_12px_30px_-10px_rgba(26,31,61,0.25)] border border-black/5 p-2.5"
            style={c.style as React.CSSProperties}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[20px] mb-1.5"
              style={{ background: c.bg }}
            >
              {c.emoji}
            </div>
            <p className="text-[12px] font-bold text-[#1a1f3d] leading-tight">{c.title}</p>
            <p className="text-[9.5px] text-[#1a1f3d]/55 mt-0.5 leading-tight">{c.sub}</p>
            <p
              className="text-[8.5px] font-semibold mt-1 italic"
              style={{ color: c.fg }}
            >
              {c.replaces}
            </p>
          </motion.div>
        ))}

        {/* Connecting dotted lines from center outward (subtle) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {[
            { x: 22, y: 18 },
            { x: 78, y: 20 },
            { x: 18, y: 80 },
            { x: 82, y: 78 },
          ].map((p, i) => (
            <motion.line
              key={i}
              x1="50"
              y1="50"
              x2={p.x}
              y2={p.y}
              stroke="#1a1f3d"
              strokeWidth="0.4"
              strokeDasharray="1 2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.9 + i * 0.1, duration: 0.6 }}
            />
          ))}
        </svg>
      </div>

      {/* Tagline strip below */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="mt-2 flex items-center justify-center gap-2"
      >
        <span className="text-[12px] text-[#1a1f3d]/40 line-through">Calm</span>
        <span className="text-[12px] text-[#1a1f3d]/40 line-through">Headspace</span>
        <span className="text-[12px] text-[#1a1f3d]/40 line-through">Stoic</span>
        <span className="text-[14px] font-bold text-[#1a1f3d]">→ Rilo</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.25, duration: 0.4, type: 'spring' }}
        className="mt-2 flex items-center justify-center"
      >
        <div className="px-3 py-1 rounded-full bg-[#1a1f3d] text-white text-[11px] font-bold flex items-center gap-1.5">
          <span>🎁</span> 5 apps. One Rilo. Free.
        </div>
      </motion.div>
    </div>
  );
}