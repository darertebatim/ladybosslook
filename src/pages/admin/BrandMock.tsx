import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Calendar, Headphones, BookOpen, Heart, Sparkles, ChevronRight, Check, Sun, Moon, Droplets, Wind, Home, Compass, CalendarPlus, Music, Users, Menu, Headset, Star, Zap, Settings2, Search } from 'lucide-react';
import { Globe, Lock } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
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
  lavenderMid:'#DEC1FF',
  mint:     '#E2F9F0',
  mintMid:  '#C3F1E1',
  limeMid:  '#C9F588',
  skyMid:   '#B9D6FF',
  border:   '#F5DCC8',
  success:  '#22C55E',
  // Dark mode task card colors — deep jewel-toned variants
  peachDark:    '#3D2A1A',
  mintDark:     '#1A2E26',
  lavenderDark: '#2A1F3A',
  yellowDark:   '#3A3010',
  pinkDark:     '#3A1A2A',
  skyDark:      '#1A2638',
  limeDark:     '#1E3020',
};

const TASKS = [
  { emoji: '🧘', title: 'Morning Meditation', time: '🌅 7:00 AM', repeat: 'Daily', done: true, color: O.peach, darkColor: O.peachDark, completedColor: O.peachMid, completedDarkColor: O.peachDark },
  { emoji: '💧', title: 'Drink Water', time: '☀️ 8:00 AM', repeat: 'Daily', done: true, color: O.mint, darkColor: O.mintDark, completedColor: O.mintMid, completedDarkColor: O.mintDark, goal: '6/8 cups' },
  { emoji: '📖', title: 'Read 20 Pages', time: '☀️ 9:30 AM', repeat: 'Weekdays', done: false, color: O.lavender, darkColor: O.lavenderDark, completedColor: O.lavenderMid, completedDarkColor: O.lavenderDark },
  { emoji: '🏃‍♀️', title: 'Evening Run', time: '🌆 6:00 PM', repeat: 'Weekly', done: false, color: O.yellow, darkColor: O.yellowDark, completedColor: O.yellowMid, completedDarkColor: O.yellowDark, goal: '0/30 min' },
  { emoji: '✍️', title: 'Journal Entry', time: '🌙 9:00 PM', repeat: 'Daily', done: false, color: O.pink, darkColor: O.pinkDark, completedColor: O.pinkMid, completedDarkColor: O.pinkDark },
];

const TOOL_SHORTCUTS = [
  { emoji: '📖', label: 'Journal', color: O.lavender, darkColor: O.lavenderDark },
  { emoji: '🌬️', label: 'Breathe', color: O.mint,     darkColor: O.mintDark },
  { emoji: '💧', label: 'Water',   color: O.peach,    darkColor: O.peachDark },
  { emoji: '💜', label: 'Mood',    color: O.pink,     darkColor: O.pinkDark },
];

const TaskCard = ({ task, index, darkMode }: { task: typeof TASKS[0]; index: number; darkMode?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 + index * 0.06 }}
    className="rounded-3xl overflow-hidden"
    style={{
      background: darkMode
        ? (task.done ? task.completedDarkColor : '#1F140B')
        : (task.done ? task.completedColor : '#FFFDFB'),
      boxShadow: darkMode
        ? '0 1px 2px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)'
        : '0 1px 2px rgba(60,30,10,0.06), 0 6px 18px rgba(60,30,10,0.08)',
    }}
  >
    <div className="flex items-center gap-2 pl-3 pr-4 py-5">
      {/* 3D Fluent Emoji in colored circle */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: darkMode ? task.darkColor : task.color }}
      >
        <FluentEmoji emoji={task.emoji} size={26} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Subtitle line */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)' }}>{task.time}</span>
          <span className="text-[11px]" style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)' }}>•</span>
          <span className="text-[11px]" style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)' }}>{task.repeat}</span>
          {task.goal && (
            <>
              <span className="text-[11px]" style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)' }}>•</span>
              <span className="text-[11px] font-medium" style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)' }}>{task.goal}</span>
            </>
          )}
        </div>
        {/* Title */}
        <p className={`text-[15px] font-semibold leading-tight ${task.done ? 'line-through' : ''}`}
          style={{ color: darkMode ? '#FAFAFA' : '#000000' }}>
          {task.title}
        </p>
      </div>

      {/* Completion button */}
      <div className="w-9 h-9 flex items-center justify-center shrink-0">
        {task.done ? (
          /* SealCheck — matches src/components/app/SealCheck.tsx */
          <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9 text-teal-400" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 3c1.2 0 2.1.9 3 1.6.8.6 1.8 1.1 2.8 1 1-.1 1.9-.6 2.9-.9 1-.3 2.2-.3 3 .4.8.7 1 1.8 1.2 2.8.2 1 .2 2 .8 2.8.6.9 1.5 1.4 2.1 2.3.6.8.9 1.9.6 2.9-.3 1-.9 1.8-1 2.8-.1 1 .2 2 .1 3-.1 1-.7 1.9-1.4 2.7-.7.8-1.5 1.4-2 2.3-.4.9-.4 1.9-.8 2.8-.4.9-1.2 1.6-2.1 2-.9.4-1.9.4-2.9.5-1 .1-1.9.4-2.8.9-.9.5-1.6 1.3-2.5 1.6-.9.3-2 .3-2.9 0-.9-.3-1.6-1.1-2.5-1.6-.9-.5-1.8-.8-2.8-.9-1-.1-2-.1-2.9-.5-.9-.4-1.7-1.1-2.1-2-.4-.9-.4-1.9-.8-2.8-.5-.9-1.3-1.5-2-2.3-.7-.8-1.3-1.7-1.4-2.7-.1-1 .2-2 .1-3-.1-1-.7-1.8-1-2.8-.3-1 0-2.1.6-2.9.6-.9 1.5-1.4 2.1-2.3.6-.8.6-1.8.8-2.8.2-1 .4-2.1 1.2-2.8.8-.7 2-.7 3-.4 1 .3 1.9.8 2.9.9 1 .1 2-.4 2.8-1C17.9 3.9 18.8 3 20 3z"
              fill="currentColor"
            />
            <path
              d="M14 20.5l4 4 8.5-8.5"
              stroke="white"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span className="w-9 h-9 rounded-full border-2 bg-transparent" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.4)' : '#000000' }} />
        )}
      </div>
    </div>
  </motion.div>
);

export default function BrandMock() {
  const [darkMode, setDarkMode] = useState(false);

  const bg = darkMode ? '#1A0F08' : '#FFFFFF';
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
          {/* ─── Glass Header (matches AppHome) ─── */}
          <div
            className="px-4 pt-1 pb-2 rounded-b-2xl mx-0"
            style={{
              background: darkMode ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.35)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            }}
          >
            {/* Title row: menu + support / center date / streak */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center h-9">
              <div className="flex items-center gap-1">
                <button className="p-1.5 -ml-1" style={{ color: fg }}>
                  <Menu className="w-[18px] h-[18px]" />
                </button>
                <button className="p-1.5" style={{ color: fg }}>
                  <Headset className="w-[18px] h-[18px]" />
                </button>
              </div>
              <div className="flex justify-center">
                <h1 className="text-[15px] font-bold flex items-center gap-1" style={{ color: fg }}>
                  Today
                  <Star className="w-2.5 h-2.5" fill="#EF4444" stroke="#EF4444" />
                </h1>
              </div>
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`,
                  color: '#fff',
                }}
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span className="text-[13px] font-bold">12</span>
              </motion.button>
            </div>

            {/* Compact week strip */}
            <div className="flex gap-1 justify-between mt-1.5 pb-0.5">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                const isTodayDay = i === 2;
                const isPast = i < 2;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 + i * 0.025 }}
                    className="flex flex-col items-center gap-0.5 flex-1"
                  >
                    <span className="text-[9px] font-medium" style={{ color: fgMuted }}>{day}</span>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                      style={{
                        background: isTodayDay ? O.primary : 'transparent',
                        color: isTodayDay ? '#fff' : isPast ? O.fgMuted : fg,
                        border: isTodayDay ? 'none' : `1.5px solid ${border}`,
                      }}
                    >
                      {12 + i}
                    </div>
                    {isPast && (
                      <div className="w-1 h-1 rounded-full" style={{ background: O.success }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ─── Self-Care Quiz Banner ─── */}
          <div className="px-4 pt-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl p-3.5 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${O.primary} 0%, ${O.primaryL} 100%)`,
                boxShadow: '0 4px 14px rgba(235,94,51,0.25)',
              }}
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20" style={{ background: '#fff' }} />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.25)' }}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] font-bold leading-tight">What's missing in your self-care?</p>
                  <p className="text-white/80 text-[10px] mt-0.5">Take the 2-min Self-Care Quiz</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/90 shrink-0" />
              </div>
            </motion.div>
          </div>

          {/* ─── Tool Shortcuts (My Shortcuts) ─── */}
          <div className="px-4 pt-3">
            <div className="grid grid-cols-4 gap-2">
              {TOOL_SHORTCUTS.map((tool, i) => (
                <motion.div
                  key={tool.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-2xl"
                  style={{
                    background: darkMode ? '#1F140B' : '#FFFDFB',
                    boxShadow: darkMode
                      ? '0 1px 2px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)'
                      : '0 1px 2px rgba(60,30,10,0.06), 0 6px 18px rgba(60,30,10,0.08)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: darkMode ? tool.darkColor : tool.color }}
                  >
                    <FluentEmoji emoji={tool.emoji} size={22} />
                  </div>
                  <span className="text-[9px] font-medium" style={{ color: darkMode ? '#E0CFB8' : '#6B4D33' }}>
                    {tool.label}
                  </span>
                  <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: i < 2 ? O.success : 'transparent' }} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* ─── 2-Pill Switcher (Routines / Tasks) ─── */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="relative inline-flex rounded-full p-0.5" style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
                <button
                  className="relative z-10 px-3 py-1 rounded-full text-[11px] font-semibold"
                  style={{ color: fgMuted }}
                >
                  My Routines
                </button>
                <button
                  className="relative z-10 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1"
                  style={{
                    background: darkMode ? '#1A0F08' : '#fff',
                    color: fg,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  My Tasks
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: darkMode ? O.peachDark : O.peach, color: O.primary }}>
                  2/5
                </div>
                <button
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: O.primary,
                    boxShadow: darkMode
                      ? '0 1px 2px rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.35)'
                      : '0 1px 2px rgba(60,30,10,0.06), 0 4px 10px rgba(60,30,10,0.12)',
                  }}
                  aria-label="Add task"
                >
                  <Plus className="w-3.5 h-3.5" style={{ color: '#fff' }} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {/* ─── Tasks ─── */}
          <div className="px-4 pb-4">
            <div className="space-y-2">
              {TASKS.map((task, i) => (
                <TaskCard key={task.title} task={task} index={i} darkMode={darkMode} />
              ))}
            </div>

            {/* Manage / Browse footer buttons */}
            <div className="flex gap-2 mt-3">
              <div className="flex-1 rounded-3xl py-2 px-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold"
                style={{
                  background: darkMode ? '#1F140B' : '#FFFDFB',
                  color: fg,
                  boxShadow: darkMode
                    ? '0 1px 2px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)'
                    : '0 1px 2px rgba(60,30,10,0.06), 0 6px 18px rgba(60,30,10,0.08)',
                }}>
                <Settings2 className="w-3 h-3" style={{ color: O.primary }} />
                Manage Routines
              </div>
              <div className="flex-1 rounded-3xl py-2 px-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold"
                style={{
                  background: darkMode ? '#1F140B' : '#FFFDFB',
                  color: fg,
                  boxShadow: darkMode
                    ? '0 1px 2px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)'
                    : '0 1px 2px rgba(60,30,10,0.06), 0 6px 18px rgba(60,30,10,0.08)',
                }}>
                <Search className="w-3 h-3" style={{ color: O.primary }} />
                Browse Library
              </div>
            </div>
          </div>

          {/* ─── Bottom padding for nav ─── */}
          <div className="h-24" />

          {/* ─── iOS 26 Liquid Glass Nav Bar ─── */}
          <div className="absolute bottom-0 left-0 right-0">
            {/* iOS 26 — separated nav pill + detached FAB */}
            <div className="mx-3 mb-3 flex items-end gap-2">
              {/* Main nav pill (4 items) */}
              <div
                className="flex-1 rounded-[28px] px-2 py-2"
                style={{
                  background: darkMode
                    ? 'linear-gradient(180deg, rgba(60,40,25,0.55) 0%, rgba(40,25,15,0.65) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(255,248,243,0.72) 100%)',
                  backdropFilter: 'blur(40px) saturate(1.8)',
                  WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
                  border: darkMode
                    ? '0.5px solid rgba(255,200,160,0.18)'
                    : '0.5px solid rgba(255,255,255,0.65)',
                  boxShadow: darkMode
                    ? '0 -4px 30px rgba(0,0,0,0.35), inset 0 0.5px 0 rgba(255,200,160,0.12)'
                    : '0 -4px 30px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.8)',
                }}
              >
                <div className="grid grid-cols-4 items-center">
                  {[
                    { icon: Home, label: 'Home', active: true },
                    { icon: Compass, label: 'Explore', active: false },
                    { icon: Music, label: 'Listen', active: false },
                    { icon: Users, label: 'Chats', active: false, badge: 3 },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.04 }}
                      className="flex flex-col items-center gap-0.5 relative"
                    >
                      {item.active && (
                        <motion.div
                          layoutId="nav-active"
                          className="absolute -top-0.5 w-10 h-10 rounded-2xl"
                          style={{
                            background: darkMode ? 'rgba(235,94,51,0.15)' : 'rgba(235,94,51,0.10)',
                            border: `0.5px solid ${O.primary}25`,
                            boxShadow: `0 0 12px ${O.primary}15`,
                          }}
                        />
                      )}
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        <item.icon
                          className="w-[22px] h-[22px] transition-all"
                          style={{
                            color: item.active ? O.primary : fgMuted,
                            strokeWidth: item.active ? 2.2 : 1.6,
                          }}
                        />
                        {item.badge && (
                          <div
                            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
                            style={{
                              background: O.accent,
                              boxShadow: `0 1px 4px ${O.accent}66`,
                            }}
                          >
                            <span className="text-[9px] font-bold text-white">{item.badge}</span>
                          </div>
                        )}
                      </div>
                      <span
                        className="text-[10px] leading-tight"
                        style={{
                          color: item.active ? O.primary : fgMuted,
                          fontWeight: item.active ? 600 : 400,
                        }}
                      >
                        {item.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Detached FAB — separate liquid-glass circle */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, type: 'spring', stiffness: 300 }}
                className="shrink-0 w-[60px] h-[60px] rounded-full flex items-center justify-center relative"
                style={{
                  background: `linear-gradient(135deg, ${O.primary}, ${O.primaryD})`,
                  boxShadow: `0 8px 24px -4px ${O.primary}80, 0 3px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.28)`,
                  border: darkMode
                    ? '0.5px solid rgba(255,200,160,0.25)'
                    : '0.5px solid rgba(255,255,255,0.7)',
                }}
              >
                <Plus className="w-6 h-6 text-white relative z-10" strokeWidth={2.5} />
                {/* Glass shine */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <div
                    className="absolute top-0 left-0 right-0 h-[50%] rounded-t-full"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)',
                    }}
                  />
                </div>
              </motion.button>
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── Explore Page Phone Frame ── */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="pt-8">
        <h2 className="text-xl font-bold text-foreground text-center mb-6">🍊 Explore Page — Orange Theme</h2>
      </div>
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

          {/* ─── Explore Header ─── */}
          <div className="px-5 pt-2 pb-3">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold"
              style={{ color: fg }}
            >
              Explore Rilo
            </motion.h1>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl"
              style={{
                background: darkMode ? '#2A1A10' : '#FFE6C9',
                boxShadow: darkMode
                  ? '0 2px 12px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.05)'
                  : '0 2px 10px rgba(0,0,0,0.08)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={fgMuted} strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <span className="text-sm" style={{ color: fgMuted }}>Search tools, programs…</span>
            </motion.div>
          </div>

          {/* ─── Tools Section ─── */}
          <div className="px-5 pt-2 pb-1">
            <p className="text-sm font-semibold mb-2.5" style={{ color: fg }}>Tools</p>

            {/* Row 1: Free tools */}
            <div className="flex gap-2.5 overflow-x-auto pb-2.5 scrollbar-hide -mx-1 px-1">
              {[
                { emoji: '💜', label: 'Emotions', bg: '#FFE6C9', darkBg: '#3D2A1A' },
                { emoji: '📋', label: 'Routines', bg: '#FFD2A1', darkBg: '#3A2515' },
                { emoji: '⏱️', label: 'Timer', bg: '#FFF4ED', darkBg: '#2E1E14' },
                { emoji: '🧘', label: 'Meditate', bg: '#FFE0D0', darkBg: '#352018' },
                { emoji: '🌊', label: 'Sounds', bg: '#FFE6C9', darkBg: '#3D2A1A' },
                { emoji: '🫧', label: 'Mood', bg: '#FFF4ED', darkBg: '#2E1E14' },
                { emoji: '🎬', label: 'Videos', bg: '#FFD2A1', darkBg: '#3A2515' },
              ].map((tool, i) => (
                <motion.div
                  key={tool.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  className="shrink-0 w-[68px] flex flex-col items-center gap-1"
                >
                  <div
                    className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center"
                    style={{
                      background: darkMode ? tool.darkBg : tool.bg,
                      boxShadow: darkMode
                        ? '0 2px 12px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.05)'
                        : '0 2px 10px rgba(0,0,0,0.08)',
                    }}
                  >
                    <FluentEmoji emoji={tool.emoji} size={32} />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: fgMuted }}>{tool.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Row 2: Plus tools */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 mt-1">
              {[
                { emoji: '⏳', label: 'Fasting', bg: '#FFE6C9', darkBg: '#3D2A1A' },
                { emoji: '💧', label: 'Water', bg: '#FFD2A1', darkBg: '#3A2515' },
                { emoji: '🩸', label: 'Period', bg: '#FFE0D0', darkBg: '#352018' },
              ].map((tool, i) => (
                <motion.div
                  key={tool.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className="shrink-0 w-[68px] flex flex-col items-center gap-1 relative"
                >
                  <div
                    className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: darkMode ? tool.darkBg : tool.bg,
                      boxShadow: darkMode
                        ? '0 2px 12px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.05)'
                        : '0 2px 10px rgba(0,0,0,0.08)',
                    }}
                  >
                    <FluentEmoji emoji={tool.emoji} size={32} />
                  </div>
                  {/* PLUS badge */}
                  <div
                    className="absolute -top-1 -left-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                    style={{
                      background: darkMode ? '#5C3D10' : '#FFEA4E',
                      color: darkMode ? '#FFD280' : '#8B6E00',
                    }}
                  >
                    👑 PLUS
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: fgMuted }}>{tool.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ─── Programs Section ─── */}
          <div className="px-5 pt-3 pb-1">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-sm font-semibold" style={{ color: fg }}>Explore Programs</p>
              <span className="text-xs font-medium" style={{ color: O.primary }}>All →</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {[
                { title: 'Empowered Woman', color: '#FFE6C9', darkColor: '#3D2A1A', emoji: '💪' },
                { title: 'Courageous Living', color: '#FFD2A1', darkColor: '#3A2515', emoji: '🦁' },
                { title: 'Business Growth', color: '#FFF4ED', darkColor: '#2E1E14', emoji: '🚀' },
              ].map((prog, i) => (
                <motion.div
                  key={prog.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="shrink-0 w-[120px]"
                >
                  <div
                    className="h-[120px] w-[120px] rounded-2xl flex items-center justify-center mb-1.5"
                    style={{
                      background: darkMode ? prog.darkColor : prog.color,
                      boxShadow: darkMode
                        ? '0 2px 12px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.05)'
                        : '0 2px 10px rgba(0,0,0,0.08)',
                    }}
                  >
                    <FluentEmoji emoji={prog.emoji} size={44} />
                  </div>
                  <p className="text-xs font-medium leading-tight" style={{ color: fg }}>{prog.title}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ─── Reflections Section ─── */}
          <div className="px-5 pt-3 pb-1">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-sm font-semibold" style={{ color: fg }}>Guided Reflections</p>
              <span className="text-xs font-medium" style={{ color: O.primary }}>All →</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {[
                { title: 'Self Discovery', color: '#FFE0D0', darkColor: '#352018', emoji: '🪞' },
                { title: 'Gratitude', color: '#FFE6C9', darkColor: '#3D2A1A', emoji: '🙏' },
                { title: 'Inner Peace', color: '#FFF4ED', darkColor: '#2E1E14', emoji: '🕊️' },
                { title: 'Vision Board', color: '#FFD2A1', darkColor: '#3A2515', emoji: '✨' },
              ].map((ref, i) => (
                <motion.div
                  key={ref.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="shrink-0 w-[120px]"
                >
                  <div
                    className="h-[120px] w-[120px] rounded-2xl flex items-center justify-center mb-1.5"
                    style={{
                      background: darkMode ? ref.darkColor : ref.color,
                      boxShadow: darkMode
                        ? '0 2px 12px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.05)'
                        : '0 2px 10px rgba(0,0,0,0.08)',
                    }}
                  >
                    <FluentEmoji emoji={ref.emoji} size={44} />
                  </div>
                  <p className="text-xs font-medium leading-tight" style={{ color: fg }}>{ref.title}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ─── Breathe Section ─── */}
          <div className="px-5 pt-3 pb-1">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-sm font-semibold" style={{ color: fg }}>Breathe Practice</p>
              <span className="text-xs font-medium" style={{ color: O.primary }}>All →</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {[
                { title: 'Box Breathing', emoji: '🌬️' },
                { title: '4-7-8 Relax', emoji: '😌' },
                { title: 'Energy Boost', emoji: '⚡' },
                { title: 'Deep Calm', emoji: '🧘' },
              ].map((ex, i) => (
                <motion.div
                  key={ex.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  className="shrink-0 w-[88px] text-center"
                >
                  <div
                    className="h-[88px] w-[88px] rounded-2xl flex items-center justify-center mb-1.5"
                    style={{
                      background: darkMode ? '#3D2A1A' : '#FFE6C9',
                      boxShadow: darkMode
                        ? '0 2px 12px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.05)'
                        : '0 2px 10px rgba(0,0,0,0.08)',
                    }}
                  >
                    <FluentEmoji emoji={ex.emoji} size={36} />
                  </div>
                  <p className="text-[10px] font-medium leading-tight" style={{ color: fg }}>{ex.title}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ─── CTA ─── */}
          <div className="px-5 pt-4 pb-6">
            <p className="text-xs" style={{ color: fgMuted }}>Not finding what you need?</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: O.primary }}>Tell us what you want →</p>
          </div>

          {/* ─── Bottom padding for nav ─── */}
          <div className="h-20" />

          {/* ─── iOS 26 Liquid Glass Nav Bar (same as home) ─── */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="mx-3 mb-3 flex items-end gap-2">
              {/* Main nav pill (4 items) */}
              <div
                className="flex-1 rounded-[28px] px-2 py-2"
                style={{
                  background: darkMode
                    ? 'linear-gradient(180deg, rgba(60,40,25,0.55) 0%, rgba(40,25,15,0.65) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(255,248,243,0.72) 100%)',
                  backdropFilter: 'blur(40px) saturate(1.8)',
                  WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
                  border: darkMode
                    ? '0.5px solid rgba(255,200,160,0.18)'
                    : '0.5px solid rgba(255,255,255,0.65)',
                  boxShadow: darkMode
                    ? '0 -4px 30px rgba(0,0,0,0.35), inset 0 0.5px 0 rgba(255,200,160,0.12)'
                    : '0 -4px 30px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.8)',
                }}
              >
                <div className="grid grid-cols-4 items-center">
                  {[
                    { icon: Home, label: 'Home', active: false },
                    { icon: Compass, label: 'Explore', active: true },
                    { icon: Music, label: 'Listen', active: false },
                    { icon: Users, label: 'Chats', active: false },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-0.5 relative">
                      {item.active && (
                        <div className="absolute -top-0.5 w-10 h-10 rounded-2xl"
                          style={{
                            background: darkMode ? 'rgba(235,94,51,0.15)' : 'rgba(235,94,51,0.10)',
                            border: `0.5px solid ${O.primary}25`,
                            boxShadow: `0 0 12px ${O.primary}15`,
                          }} />
                      )}
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        <item.icon className="w-[22px] h-[22px]"
                          style={{ color: item.active ? O.primary : fgMuted, strokeWidth: item.active ? 2.2 : 1.6 }} />
                      </div>
                      <span className="text-[10px] leading-tight"
                        style={{ color: item.active ? O.primary : fgMuted, fontWeight: item.active ? 600 : 400 }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detached FAB */}
              <button
                className="shrink-0 w-[60px] h-[60px] rounded-full flex items-center justify-center relative"
                style={{
                  background: `linear-gradient(135deg, ${O.primary}, ${O.primaryD})`,
                  boxShadow: `0 8px 24px -4px ${O.primary}80, 0 3px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.28)`,
                  border: darkMode
                    ? '0.5px solid rgba(255,200,160,0.25)'
                    : '0.5px solid rgba(255,255,255,0.7)',
                }}
              >
                <Plus className="w-6 h-6 text-white relative z-10" strokeWidth={2.5} />
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-0 right-0 h-[50%] rounded-t-full"
                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)' }} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* ── Listen page (proposed redesign)                       ── */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="pt-8">
        <h2 className="text-lg font-bold text-foreground mb-1">🎧 Listen — proposed redesign</h2>
        <p className="text-muted-foreground text-xs mb-4">
          Drops storm/cloud video & dark <code>#132240</code> bg. Pure white surface (matches Home <code>--background</code>),
          glassy rounded header, light filter pills, white playlist cards. Toggles with the dark-mode button above.
        </p>
      </div>

      <div className="flex justify-center">
        <ListenPhoneFrame darkMode={darkMode} />
      </div>

      {/* Color reference */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        All colors sourced from the <span className="font-mono font-medium">App Orange Palette</span> defined above
      </div>
    </div>
  );
}

/* ───────────────────────── Listen phone frame ───────────────────────── */

const LISTEN_CATEGORIES = ['All', 'Meditate', 'Workout', 'Soundscape', 'Affirmations', 'Audiobooks', 'Course', 'Podcast'];
const LISTEN_STATUS = ['All', 'In Progress', 'Completed'];
const LISTEN_PLAYLISTS = [
  { id: 1, type: 'Meditate', dur: '28m',    title: 'Meditation Level 1 with Razie (FA)', emoji: '🧘‍♀️', free: true,  locked: false, color: O.lavender, darkColor: O.lavenderDark },
  { id: 2, type: 'Course',   dur: '4h 19m', title: '5 Languages of Strength (Farsi)',    emoji: '💪',   free: false, locked: true,  color: O.pink,     darkColor: O.pinkDark },
  { id: 3, type: 'Course',   dur: '7h 27m', title: 'Empowered Woman (Farsi)',            emoji: '🌟',   free: false, locked: true,  color: O.peach,    darkColor: O.peachDark },
  { id: 4, type: 'Podcast',  dur: '1m',     title: 'Goals from Our Podcast',             emoji: '🎙️',   free: true,  locked: false, color: O.mint,     darkColor: O.mintDark },
];

function ListenPhoneFrame({ darkMode }: { darkMode: boolean }) {
  // Pure white (light) / near-black (dark) — matches `--background` on Home.
  const bg       = darkMode ? '#0A0A0A' : '#FFFFFF';
  const cardBg   = darkMode ? '#1A1410' : '#FFFFFF';
  const fg       = darkMode ? '#FFF4ED' : O.fg;
  const fgMuted  = darkMode ? '#BFA08A' : O.fgMuted;
  const border   = darkMode ? '#3D2A1A' : O.border;
  const peachBg  = darkMode ? O.peachDark : O.peach;
  const ctaBg    = darkMode ? '#2A1A10'   : '#FFF1E8';
  const shadow   = darkMode
    ? '0 1px 2px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)'
    : '0 1px 2px rgba(60,30,10,0.06), 0 6px 18px rgba(60,30,10,0.08)';
  const glassBg  = darkMode ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.55)';

  return (
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

      {/* Glassy rounded header — matches AppHome */}
      <div
        className="px-4 pt-2 pb-3 rounded-b-2xl"
        style={{
          background: glassBg,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center justify-between min-h-[44px]">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: fg }}>Listen</h1>
          <button
            className="h-9 w-9 rounded-full flex items-center justify-center"
            style={{ background: cardBg, color: O.primary, boxShadow: shadow }}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-2" style={{ scrollbarWidth: 'none' }}>
          {LISTEN_CATEGORIES.map((c, i) => {
            const active = i === 0;
            return (
              <button
                key={c}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap"
                style={{
                  background: active ? O.primary : peachBg,
                  color: active ? '#fff' : fgMuted,
                  boxShadow: active ? shadow : 'none',
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Status row + globe */}
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex gap-1.5">
            {LISTEN_STATUS.map((s, i) => {
              const active = i === 0;
              return (
                <button
                  key={s}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style={{
                    background: active ? cardBg : 'transparent',
                    color: active ? fg : fgMuted,
                    boxShadow: active ? shadow : 'none',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <button
            className="h-9 w-9 rounded-full flex items-center justify-center"
            style={{ background: cardBg, color: O.primary, boxShadow: shadow }}
          >
            <Globe className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Section heading */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[11px] font-bold tracking-[0.12em]" style={{ color: fgMuted }}>
          ALL PLAYLISTS
        </p>
      </div>

      {/* Playlist cards */}
      <div className="px-4 space-y-3 pb-6">
        {LISTEN_PLAYLISTS.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: cardBg, boxShadow: shadow }}
          >
            <div className="flex items-center gap-3 p-3">
              <div
                className="relative h-16 w-16 rounded-xl shrink-0 flex items-center justify-center"
                style={{ background: darkMode ? p.darkColor : p.color }}
              >
                <FluentEmoji emoji={p.emoji} size={36} />
                {p.locked && (
                  <div
                    className="absolute bottom-1 left-1 h-5 w-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.55)' }}
                  >
                    <Lock className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: fgMuted }}>
                  <span className="font-medium">{p.type}</span>
                  <span>·</span>
                  <span>{p.dur}</span>
                </div>
                <h3 className="text-[14px] font-bold leading-tight mt-0.5 line-clamp-2" style={{ color: fg }}>
                  {p.title}
                </h3>
                <div className="mt-1 flex items-center gap-1.5">
                  {p.free && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: darkMode ? O.mintDark : '#E2F9F0', color: darkMode ? '#A7F3D0' : '#065F46' }}
                    >
                      🔥 FREE
                    </span>
                  )}
                  <span className="text-[13px]">🇮🇷</span>
                </div>
              </div>
            </div>
            {p.locked && (
              <button
                className="w-full py-2.5 text-[12px] font-bold flex items-center justify-center gap-1"
                style={{ background: ctaBg, color: O.primary, borderTop: `1px solid ${border}` }}
              >
                Tap to enroll <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
