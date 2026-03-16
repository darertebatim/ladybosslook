import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Calendar, Headphones, BookOpen, Heart, Sparkles, ChevronRight, Check, Sun, Moon, Droplets, Wind, Home, Compass, CalendarPlus, Music, Users } from 'lucide-react';
import appIcon from '@/assets/app-icon.png';

// ─── Orange Palette Tokens (inline for isolated mock) ───
const O = {
  bg:       '#FFF8F3',
  bgWarm:   '#FFF4ED',
  card:     '#FFFFFF',
  fg:       '#2D1A0E',
  fgMuted:  '#8B6E5A',
  primary:  '#EB5E33',
  primaryL: '#F5A623',
  primaryD: '#D94B2B',
  accent:   '#C2255C',
  peach:    '#FFE6C9',
  peachMid: '#FFD2A1',
  yellow:   '#FFF492',
  yellowMid:'#FFEA4E',
  pink:     '#FFE0F5',
  pinkMid:  '#FFC2EA',
  lavender: '#F0E3FF',
  mint:     '#E2F9F0',
  border:   '#F5DCC8',
  success:  '#22C55E',
};

const TASKS = [
  { emoji: '🧘', title: 'Morning Meditation', time: '7:00 AM', done: true, color: O.peach, colorDark: O.peachMid },
  { emoji: '💧', title: 'Drink Water', time: '8:00 AM', done: true, color: O.mint, colorDark: '#C3F1E1' },
  { emoji: '📖', title: 'Read 20 Pages', time: '9:30 AM', done: false, color: O.lavender, colorDark: '#DEC1FF' },
  { emoji: '🏃‍♀️', title: 'Evening Run', time: '6:00 PM', done: false, color: O.yellow, colorDark: O.yellowMid },
  { emoji: '✍️', title: 'Journal Entry', time: '9:00 PM', done: false, color: O.pink, colorDark: O.pinkMid },
];

const QUICK_TOOLS = [
  { icon: Headphones, label: 'Listen', bg: O.peach },
  { icon: BookOpen, label: 'Journal', bg: O.lavender },
  { icon: Wind, label: 'Breathe', bg: O.mint },
  { icon: Heart, label: 'Mood', bg: O.pink },
];

const TaskCard = ({ task, index }: { task: typeof TASKS[0]; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 + index * 0.06 }}
    className="relative overflow-hidden rounded-2xl"
    style={{ background: O.card, border: `1px solid ${O.border}` }}
  >
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-xl">{task.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: task.done ? O.fgMuted : O.fg, textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</p>
        <p className="text-xs" style={{ color: O.fgMuted }}>{task.time}</p>
      </div>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
        style={{
          background: task.done ? O.primary : 'transparent',
          border: task.done ? 'none' : `2px solid ${O.border}`,
        }}
      >
        {task.done && <Check className="w-4 h-4 text-white" />}
      </div>
    </div>
    {/* Bottom color strip */}
    <div className="h-1" style={{ background: `linear-gradient(90deg, ${task.color}, ${task.colorDark})` }} />
  </motion.div>
);

export default function BrandMock() {
  const [darkMode, setDarkMode] = useState(false);

  const bg = darkMode ? '#1A0F08' : O.bg;
  const cardBg = darkMode ? '#2A1A10' : O.card;
  const fg = darkMode ? '#FFF4ED' : O.fg;
  const fgMuted = darkMode ? '#BFA08A' : O.fgMuted;
  const border = darkMode ? '#3D2A1A' : O.border;

  return (
    <div className="p-6 max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🍊 Orange Theme Mock</h1>
          <p className="text-muted-foreground text-sm mt-1">Creative home screen concept using the App Orange Palette</p>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
          style={{ borderColor: O.border, color: O.fgMuted }}
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {darkMode ? 'Light' : 'Dark'}
        </button>
      </div>

      {/* ── Phone Frame ── */}
      <div className="flex justify-center">
        <div
          className="relative w-[375px] rounded-[40px] shadow-2xl overflow-hidden transition-colors duration-500"
          style={{
            background: bg,
            border: `3px solid ${darkMode ? '#3D2A1A' : '#E8D6C8'}`,
            minHeight: 780,
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-8 pt-4 pb-2">
            <span className="text-xs font-semibold" style={{ color: fgMuted }}>9:41</span>
            <div className="flex gap-1.5">
              <div className="w-4 h-2 rounded-sm" style={{ background: fgMuted }} />
              <div className="w-4 h-2 rounded-sm" style={{ background: fgMuted }} />
            </div>
          </div>

          {/* ─── Header ─── */}
          <div className="px-5 pt-2 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.img
                  src={appIcon}
                  alt="Simora"
                  className="w-10 h-10 rounded-xl shadow-md"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
                <div>
                  <p className="text-xs" style={{ color: fgMuted }}>Good morning ☀️</p>
                  <p className="text-lg font-bold" style={{ color: fg }}>Sarah</p>
                </div>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: darkMode ? '#3D2A1A' : O.peach }}
              >
                <Flame className="w-4 h-4" style={{ color: O.primary }} />
                <span className="text-sm font-bold" style={{ color: O.primary }}>12</span>
              </motion.div>
            </div>

            {/* ─── Hero Card ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl p-5 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${O.primary} 0%, ${O.primaryL} 100%)`,
              }}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
                style={{ background: 'white' }} />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
                style={{ background: 'white' }} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-white/80" />
                  <span className="text-white/80 text-xs font-medium">Today's Intention</span>
                </div>
                <p className="text-white font-bold text-base leading-snug">
                  "I choose to show up fully for myself today"
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex -space-x-1">
                    {['🧘', '📖', '🏃‍♀️'].map((e, i) => (
                      <span key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)' }}>
                        {e}
                      </span>
                    ))}
                  </div>
                  <span className="text-white/70 text-xs">5 actions planned</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ─── Quick Tools ─── */}
          <div className="px-5 pb-3">
            <div className="flex gap-3">
              {QUICK_TOOLS.map((tool, i) => (
                <motion.div
                  key={tool.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl cursor-pointer"
                  style={{ background: darkMode ? '#2A1A10' : tool.bg, border: `1px solid ${border}` }}
                >
                  <tool.icon className="w-5 h-5" style={{ color: O.primary }} />
                  <span className="text-[10px] font-medium" style={{ color: fgMuted }}>{tool.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ─── Week Strip ─── */}
          <div className="px-5 py-3">
            <div className="flex gap-1.5 justify-between">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const isToday = i === 2;
                const isPast = i < 2;
                return (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.03 }}
                    className="flex flex-col items-center gap-1 flex-1"
                  >
                    <span className="text-[10px] font-medium" style={{ color: fgMuted }}>{day}</span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        background: isToday ? O.primary : 'transparent',
                        color: isToday ? '#fff' : isPast ? O.fgMuted : fg,
                        border: isToday ? 'none' : `1.5px solid ${border}`,
                      }}
                    >
                      {12 + i}
                    </div>
                    {isPast && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: O.success }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ─── Tasks ─── */}
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: fg }}>Today's Actions</p>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: darkMode ? '#3D2A1A' : O.peach, color: O.primary }}>
                2/5
              </span>
            </div>
            <div className="space-y-2.5">
              {TASKS.map((task, i) => (
                <TaskCard key={task.title} task={task} index={i} />
              ))}
            </div>
          </div>

          {/* ─── FAB ─── */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
            className="absolute bottom-6 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${O.primary}, ${O.primaryD})`,
              boxShadow: `0 8px 24px -4px ${O.primary}66`,
            }}
          >
            <Plus className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </div>

      {/* Color reference */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        All colors sourced from the <span className="font-mono font-medium">App Orange Palette</span> defined above
      </div>
    </div>
  );
}
