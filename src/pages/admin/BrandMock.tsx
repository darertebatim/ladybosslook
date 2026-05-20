import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Calendar, Headphones, BookOpen, Heart, Sparkles, ChevronRight, Check, Sun, Moon, Droplets, Wind, Home, Compass, CalendarPlus, Music, Users, Menu, Headset, Star, Zap, Settings2, Search } from 'lucide-react';
import { Globe, Lock, Mic, ArrowUp, Play, ChevronDown } from 'lucide-react';
import heroStormVideo from '@/assets/watch-hero-storm.mp4';
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

  // (PathStep is defined above this component)

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

      {/* ═══════════════════════════════════════════════ */}
      {/* ── 🆕 My Rilo — PATH version (v3, dynamic timeline) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-foreground text-center mb-1">🛤️ My Rilo — Path (v3)</h2>
        <p className="text-center text-muted-foreground text-sm mb-6 max-w-[600px] mx-auto">
          A dynamic, hand-picked path for today. Pulls from <strong>My Rilo Self Care</strong>, the <strong>Self-Care Quiz</strong>, <strong>Playlists & tracks</strong>, <strong>Routines</strong>, and <strong>Reads</strong>. Like BetterMe/Calm "My plan" — but for mental health, with Rilo as the guide.
        </p>
      </div>
      <div className="flex justify-center">
        <div
          className="relative w-[375px] rounded-[40px] shadow-2xl overflow-hidden transition-colors duration-500 flex flex-col"
          style={{
            background: darkMode
              ? 'linear-gradient(180deg, #1A0F08 0%, #221310 60%, #1A0F08 100%)'
              : `linear-gradient(180deg, ${O.bgWarm} 0%, #FFFFFF 50%, ${O.bgWarm} 100%)`,
            border: `3px solid ${darkMode ? '#3D2A1A' : '#E8D6C8'}`,
            minHeight: 880,
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

          {/* Soft warm halo behind hero greeting */}
          <div
            className="absolute top-12 -right-16 w-56 h-56 rounded-full opacity-50 pointer-events-none"
            style={{
              background: darkMode
                ? `radial-gradient(circle, ${O.primaryD} 0%, transparent 70%)`
                : `radial-gradient(circle, ${O.peachMid} 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />

          {/* Header — title + streak */}
          <div className="px-5 pt-2 pb-1 grid grid-cols-[auto_1fr_auto] items-center relative z-10">
            <button className="p-1.5 -ml-1" style={{ color: fg }}>
              <Menu className="w-[18px] h-[18px]" />
            </button>
            <div className="text-center text-[13px] font-bold tracking-tight" style={{ color: fg }}>My Rilo</div>
            <button
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`,
                color: '#fff',
                boxShadow: '0 2px 8px rgba(235,94,51,0.35)',
              }}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span className="text-[13px] font-bold">12</span>
            </button>
          </div>

          {/* Hero greeting */}
          <div className="px-5 pt-4 pb-3 relative z-10">
            <div className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: O.primary }}>
              Wednesday · May 20
            </div>
            <div className="text-[28px] font-bold leading-[1.05] mt-1.5" style={{ color: fg }}>
              Your path for today
            </div>
            <div className="text-[13px] mt-1.5" style={{ color: fgMuted }}>
              5 small steps · ~18 min total · pick your pace
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mt-3">
              {[true, true, false, false, false].map((done, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full"
                  style={{
                    background: done ? O.primary : (darkMode ? 'rgba(255,255,255,0.10)' : O.border),
                  }}
                />
              ))}
              <span className="text-[11px] font-bold ml-1" style={{ color: fgMuted }}>2/5</span>
            </div>
          </div>

          {/* ── THE PATH ── */}
          <div className="px-4 pt-3 pb-4 relative">
            {/* Vertical dotted spine */}
            <div
              className="absolute left-[34px] top-8 bottom-8 w-px"
              style={{
                backgroundImage: `linear-gradient(${darkMode ? 'rgba(255,200,160,0.25)' : O.peachMid} 50%, transparent 50%)`,
                backgroundSize: '1px 6px',
              }}
            />

            {/* ── MORNING section ── */}
            <div className="flex items-center gap-2 mb-3 pl-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: fgMuted }}>
                ☀️ Morning · done
              </div>
              <div className="flex-1 h-px" style={{ background: darkMode ? 'rgba(255,200,160,0.12)' : O.border }} />
            </div>

            {/* Step 1 — completed: Mood check-in */}
            <PathStep
              done
              icon="💛"
              accent={O.yellowMid}
              accentDark={O.yellowDark}
              kicker="Mood check-in"
              kickerColor="#A86C1A"
              kickerColorDark="#E8C879"
              title="Feeling: Calm"
              meta="1 min · logged at 7:42"
              darkMode={darkMode}
              fg={fg}
              fgMuted={fgMuted}
              border={border}
              cardBg={cardBg}
              O={O}
            />

            {/* Step 2 — completed: Breath */}
            <PathStep
              done
              icon="🌬️"
              accent={O.mintMid}
              accentDark={O.mintDark}
              kicker="Breathwork"
              kickerColor="#1F7A5A"
              kickerColorDark="#7FD9B5"
              title="2-min reset breath"
              meta="2 min · Calm pattern"
              darkMode={darkMode}
              fg={fg}
              fgMuted={fgMuted}
              border={border}
              cardBg={cardBg}
              O={O}
            />

            {/* ── RIGHT NOW section ── */}
            <div className="flex items-center gap-2 mb-3 mt-5 pl-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: O.primary }}>
                ✨ Right now
              </div>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${O.primary}55, transparent)` }} />
            </div>

            {/* Step 3 — ACTIVE big card: Self-Care Quiz suggestion */}
            <div className="relative pl-[60px] mb-5">
              {/* Active checkpoint */}
              <div
                className="absolute left-[18px] top-6 w-[34px] h-[34px] rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`,
                  boxShadow: `0 0 0 5px ${darkMode ? 'rgba(235,94,51,0.18)' : 'rgba(235,94,51,0.15)'}, 0 6px 16px rgba(235,94,51,0.4)`,
                }}
              >
                <Play className="w-3.5 h-3.5 text-white" fill="#fff" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[28px] p-5 relative overflow-hidden"
                style={{
                  background: darkMode
                    ? `linear-gradient(160deg, ${O.peachDark} 0%, #2A1810 100%)`
                    : `linear-gradient(160deg, ${O.peach} 0%, ${O.peachMid} 100%)`,
                  boxShadow: darkMode
                    ? '0 14px 36px rgba(0,0,0,0.5)'
                    : '0 14px 36px rgba(235,94,51,0.22)',
                }}
              >
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-40" style={{ background: darkMode ? O.primaryD : '#fff', filter: 'blur(24px)' }} />

                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3 h-3" style={{ color: O.primary }} />
                    <div className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: O.primary }}>
                      Rilo picked this for you
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: darkMode ? '#1A0F08' : '#fff', boxShadow: '0 6px 14px rgba(0,0,0,0.10)' }}
                    >
                      <FluentEmoji emoji="🧠" size={40} />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: darkMode ? '#D9B89A' : '#8A5A30' }}>
                        From your quiz
                      </div>
                      <div className="text-[20px] font-bold leading-[1.15] mt-0.5" style={{ color: fg }}>
                        Quiet the inner critic
                      </div>
                      <div className="text-[12px] mt-1 leading-snug" style={{ color: darkMode ? '#D9B89A' : '#6B4D33' }}>
                        A 5-min guided reframe · Self-talk
                      </div>
                    </div>
                  </div>

                  <button
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15px] font-bold"
                    style={{
                      background: O.primary,
                      color: '#fff',
                      boxShadow: '0 8px 18px rgba(235,94,51,0.4)',
                    }}
                  >
                    <Play className="w-[16px] h-[16px]" fill="#fff" />
                    Start now · 5 min
                  </button>

                  <div className="flex items-center justify-center gap-4 mt-2.5">
                    <button className="text-[11.5px] font-semibold" style={{ color: darkMode ? '#D9B89A' : '#6B4D33' }}>Swap →</button>
                    <div className="w-px h-3" style={{ background: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)' }} />
                    <button className="text-[11.5px] font-semibold" style={{ color: darkMode ? '#D9B89A' : '#6B4D33' }}>Snooze 15m</button>
                    <div className="w-px h-3" style={{ background: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)' }} />
                    <button className="text-[11.5px] font-semibold" style={{ color: darkMode ? '#D9B89A' : '#6B4D33' }}>Skip</button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── LATER section ── */}
            <div className="flex items-center gap-2 mb-3 pl-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: fgMuted }}>
                🌙 Later today
              </div>
              <div className="flex-1 h-px" style={{ background: darkMode ? 'rgba(255,200,160,0.12)' : O.border }} />
            </div>

            {/* Step 4 — upcoming: Playlist track */}
            <PathStep
              icon="🎧"
              accent={O.lavenderMid}
              accentDark={O.lavenderDark}
              kicker="Listen · Playlist"
              kickerColor="#6B3FA0"
              kickerColorDark="#C9A8FF"
              title="Soft Focus — Track 3"
              meta="6 min · from your Calm playlist"
              darkMode={darkMode}
              fg={fg}
              fgMuted={fgMuted}
              border={border}
              cardBg={cardBg}
              O={O}
            />

            {/* Step 5 — upcoming: Read */}
            <PathStep
              icon="📖"
              accent={O.skyMid}
              accentDark={O.skyDark}
              kicker="Read"
              kickerColor="#2B5A9E"
              kickerColorDark="#9EC2FF"
              title="When 'enough' feels impossible"
              meta="4 min read · from Rilo Stories"
              darkMode={darkMode}
              fg={fg}
              fgMuted={fgMuted}
              border={border}
              cardBg={cardBg}
              O={O}
            />

            {/* End-of-path reward */}
            <div className="relative pl-[60px] mt-4">
              <div
                className="absolute left-[22px] top-3 w-[26px] h-[26px] rounded-full flex items-center justify-center"
                style={{ background: darkMode ? '#3D2A1A' : '#fff', border: `2px dashed ${O.primary}`}}
              >
                <FluentEmoji emoji="🏆" size={14} />
              </div>
              <div
                className="rounded-2xl p-3 flex items-center gap-2.5"
                style={{
                  background: darkMode ? 'rgba(255,255,255,0.04)' : '#FFF8F3',
                  border: `1px dashed ${darkMode ? '#3D2A1A' : O.peachMid}`,
                }}
              >
                <div className="flex-1 text-[12px] leading-snug" style={{ color: fg }}>
                  Finish the path → <strong>+1 day streak</strong> & a new affirmation 🧡
                </div>
              </div>
            </div>
          </div>

          {/* Talk to Rilo */}
          <div className="px-4 pb-4 pt-2 mt-auto relative z-10">
            <button
              className="w-full flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5"
              style={{
                background: darkMode ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#3D2A1A' : O.border}`,
                boxShadow: darkMode ? 'none' : '0 6px 18px rgba(60,30,10,0.08)',
              }}
            >
              <span className="text-[13px] flex-1 text-left py-1.5" style={{ color: fgMuted }}>
                Ask Rilo to change your path…
              </span>
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: O.primary, color: '#fff', boxShadow: '0 2px 8px rgba(235,94,51,0.35)' }}
              >
                <ArrowUp className="w-[18px] h-[18px]" />
              </span>
            </button>
          </div>

          {/* Bottom nav */}
          <div
            className="grid grid-cols-4 px-2 py-2 mx-3 mb-3 rounded-[28px]"
            style={{
              background: darkMode
                ? 'linear-gradient(180deg, rgba(60,40,25,0.55), rgba(40,25,15,0.65))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,248,243,0.72))',
              backdropFilter: 'blur(40px) saturate(1.8)',
              border: darkMode ? '0.5px solid rgba(255,200,160,0.18)' : '0.5px solid rgba(255,255,255,0.65)',
              boxShadow: '0 -4px 30px rgba(0,0,0,0.06)',
            }}
          >
            {[
              { icon: Sparkles, label: 'My Rilo', active: true },
              { icon: Calendar, label: 'Planner' },
              { icon: Music, label: 'Listen' },
              { icon: Users, label: 'Chats', badge: 3 },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-0.5 relative">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  {item.active && (
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: darkMode ? 'rgba(235,94,51,0.15)' : 'rgba(235,94,51,0.10)',
                        border: `0.5px solid ${O.primary}25`,
                      }}
                    />
                  )}
                  <item.icon
                    className="w-[22px] h-[22px] relative"
                    style={{ color: item.active ? O.primary : fgMuted, strokeWidth: item.active ? 2.2 : 1.6 }}
                  />
                  {item.badge && (
                    <div
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
                      style={{ background: O.accent }}
                    >
                      <span className="text-[9px] font-bold text-white">{item.badge}</span>
                    </div>
                  )}
                </div>
                <span
                  className="text-[10px] leading-tight"
                  style={{ color: item.active ? O.primary : fgMuted, fontWeight: item.active ? 600 : 400 }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[640px] mx-auto pt-2 pb-4 text-[13px] leading-relaxed text-muted-foreground space-y-2">
        <p><strong className="text-foreground">A path, not a list.</strong> Vertical timeline with checkpoints. Each step is a real piece of content: mood, breath, quiz suggestion, playlist track, read, routine.</p>
        <p><strong className="text-foreground">Sections compress overwhelm.</strong> "Done · Right now · Later" replaces 12 task rows. Only the <em>Right now</em> card is big — everything else is a small peek you can tap.</p>
        <p><strong className="text-foreground">Dynamic & hand-picked.</strong> Rilo picks the active card from: quiz priorities, My Rilo routine, today's recommended playlist track, stories, and breathwork. Swap / Snooze / Skip lets the user steer.</p>
        <p><strong className="text-foreground">Ends with a reward.</strong> Streak bump + affirmation at the end of the path — a clear finish line, ADHD-friendly.</p>
        <p className="text-xs italic">Below: the older "single hero" v2 sketch and the legacy planner.</p>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── My Rilo Home v2 (single-hero version) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-foreground text-center mb-1">🧡 My Rilo — new default home</h2>
        <p className="text-center text-muted-foreground text-sm mb-6 max-w-[560px] mx-auto">
          Replaces the Planner as the home tab. ADHD-friendly: one hero, one decision, no list to scroll. Planner moves to its own tab.
        </p>
      </div>
      <div className="flex justify-center">
        <div
          className="relative w-[375px] rounded-[40px] shadow-2xl overflow-hidden transition-colors duration-500 flex flex-col"
          style={{
            background: darkMode
              ? 'linear-gradient(180deg, #1A0F08 0%, #251510 100%)'
              : `linear-gradient(180deg, ${O.bgWarm} 0%, #FFFFFF 55%)`,
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

          {/* Header — minimal: menu / brand mark / streak */}
          <div className="px-5 pt-1 pb-2 grid grid-cols-[auto_1fr_auto] items-center h-10">
            <button className="p-1.5 -ml-1" style={{ color: fg }}>
              <Menu className="w-[18px] h-[18px]" />
            </button>
            <div className="flex justify-center items-center gap-1.5">
              <span className="text-[14px] font-bold tracking-tight" style={{ color: fg }}>My Rilo</span>
            </div>
            <button
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`,
                color: '#fff',
                boxShadow: '0 2px 8px rgba(235,94,51,0.35)',
              }}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span className="text-[13px] font-bold">12</span>
            </button>
          </div>

          {/* Greeting — warm, single line */}
          <div className="px-5 pt-3 pb-1">
            <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: O.primary }}>
              Good morning, Sara
            </div>
            <div className="text-[22px] font-bold leading-tight mt-1" style={{ color: fg }}>
              One small thing — that's all.
            </div>
          </div>

          {/* HERO — the ONE focus card, dominant */}
          <div className="px-4 pt-4 pb-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] p-5 relative overflow-hidden"
              style={{
                background: darkMode
                  ? `linear-gradient(160deg, ${O.peachDark} 0%, #2A1810 100%)`
                  : `linear-gradient(160deg, ${O.peach} 0%, ${O.peachMid} 100%)`,
                boxShadow: darkMode
                  ? '0 16px 40px rgba(0,0,0,0.5)'
                  : '0 16px 40px rgba(235,94,51,0.25)',
                minHeight: 280,
              }}
            >
              {/* Soft halo */}
              <div
                className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-40"
                style={{ background: darkMode ? O.primaryD : '#FFFFFF', filter: 'blur(30px)' }}
              />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: O.primary }} />
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: O.primary }}>
                    Right now
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-5">
                  <div
                    className="w-[72px] h-[72px] rounded-3xl flex items-center justify-center shrink-0"
                    style={{
                      background: darkMode ? '#1A0F08' : '#FFFFFF',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.10)',
                    }}
                  >
                    <FluentEmoji emoji="🧘‍♀️" size={48} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="text-[24px] font-bold leading-[1.1]" style={{ color: fg }}>
                      2-min breath
                    </div>
                    <div className="text-[13px] mt-1.5 leading-snug" style={{ color: darkMode ? '#D9B89A' : '#6B4D33' }}>
                      Mornings feel rushed. Start tiny.
                    </div>
                  </div>
                </div>

                {/* Big Start button */}
                <button
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[16px] font-bold"
                  style={{
                    background: O.primary,
                    color: '#FFFFFF',
                    boxShadow: '0 8px 20px rgba(235,94,51,0.45)',
                  }}
                >
                  <Play className="w-[18px] h-[18px]" fill="#FFFFFF" />
                  Start now
                </button>

                {/* Tiny secondary actions */}
                <div className="flex items-center justify-center gap-5 mt-3 pt-1">
                  <button className="text-[12px] font-semibold" style={{ color: darkMode ? '#D9B89A' : '#6B4D33' }}>
                    Swap →
                  </button>
                  <div className="w-px h-3" style={{ background: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)' }} />
                  <button className="text-[12px] font-semibold" style={{ color: darkMode ? '#D9B89A' : '#6B4D33' }}>
                    Snooze 15m
                  </button>
                  <div className="w-px h-3" style={{ background: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)' }} />
                  <button className="text-[12px] font-semibold" style={{ color: darkMode ? '#D9B89A' : '#6B4D33' }}>
                    Done ✓
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 3 passive stat chips — at-a-glance, no pressure */}
          <div className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: '🔥', label: '12 day streak', value: '12d' },
                { icon: '✅', label: 'Done today', value: '2/5' },
                { icon: '💛', label: 'Mood', value: 'Calm' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl py-2.5 px-2 flex flex-col items-center"
                  style={{
                    background: darkMode ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                    border: `1px solid ${darkMode ? '#3D2A1A' : O.border}`,
                  }}
                >
                  <FluentEmoji emoji={s.icon} size={18} />
                  <div className="text-[13px] font-bold mt-0.5" style={{ color: fg }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Up-next peek — just ONE, collapsed, no checkbox */}
          <div className="px-5 pt-1 pb-2 flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: fgMuted }}>After this</div>
            <button className="text-[11px] font-semibold" style={{ color: O.primary }}>See plan →</button>
          </div>
          <div className="px-4 pb-3">
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
              style={{
                background: darkMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#3D2A1A' : O.border}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: darkMode ? O.skyDark : O.skyMid + '66' }}
              >
                <FluentEmoji emoji="💧" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold" style={{ color: fg }}>A glass of water</div>
                <div className="text-[11px]" style={{ color: fgMuted }}>1 min · easy win</div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: fgMuted }} />
            </div>
          </div>

          {/* Rilo note — single warm sentence */}
          <div className="px-4 pb-3">
            <div
              className="rounded-2xl p-3 flex gap-2.5 items-center"
              style={{
                background: darkMode ? 'rgba(255,255,255,0.04)' : '#FFF8F3',
                border: `1px dashed ${darkMode ? '#3D2A1A' : O.peachMid}`,
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})` }}
              >
                <FluentEmoji emoji="🧡" size={16} />
              </div>
              <div className="flex-1 text-[12.5px] leading-snug" style={{ color: fg }}>
                You showed up yesterday. That counts. 🧡
              </div>
            </div>
          </div>

          {/* Talk to Rilo — bottom entry */}
          <div className="px-4 pb-6 pt-1 mt-auto">
            <button
              className="w-full flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5"
              style={{
                background: darkMode ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#3D2A1A' : O.border}`,
                boxShadow: darkMode ? 'none' : '0 6px 18px rgba(60,30,10,0.08)',
              }}
            >
              <span className="text-[13px] flex-1 text-left py-1.5" style={{ color: fgMuted }}>
                Talk to Rilo…
              </span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ color: fgMuted }}>
                <Mic className="w-[18px] h-[18px]" />
              </span>
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: O.primary,
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(235,94,51,0.35)',
                }}
              >
                <ArrowUp className="w-[18px] h-[18px]" />
              </span>
            </button>
          </div>

          {/* Bottom nav — My Rilo replaces Home; Planner is its own tab */}
          <div
            className="grid grid-cols-4 px-2 py-2 mx-3 mb-3 rounded-[28px]"
            style={{
              background: darkMode
                ? 'linear-gradient(180deg, rgba(60,40,25,0.55), rgba(40,25,15,0.65))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,248,243,0.72))',
              backdropFilter: 'blur(40px) saturate(1.8)',
              border: darkMode ? '0.5px solid rgba(255,200,160,0.18)' : '0.5px solid rgba(255,255,255,0.65)',
              boxShadow: '0 -4px 30px rgba(0,0,0,0.06)',
            }}
          >
            {[
              { icon: Sparkles, label: 'My Rilo', active: true },
              { icon: Calendar, label: 'Planner' },
              { icon: Music, label: 'Listen' },
              { icon: Users, label: 'Chats', badge: 3 },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-0.5 relative">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  {item.active && (
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: darkMode ? 'rgba(235,94,51,0.15)' : 'rgba(235,94,51,0.10)',
                        border: `0.5px solid ${O.primary}25`,
                      }}
                    />
                  )}
                  <item.icon
                    className="w-[22px] h-[22px] relative"
                    style={{ color: item.active ? O.primary : fgMuted, strokeWidth: item.active ? 2.2 : 1.6 }}
                  />
                  {item.badge && (
                    <div
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
                      style={{ background: O.accent }}
                    >
                      <span className="text-[9px] font-bold text-white">{item.badge}</span>
                    </div>
                  )}
                </div>
                <span
                  className="text-[10px] leading-tight"
                  style={{ color: item.active ? O.primary : fgMuted, fontWeight: item.active ? 600 : 400 }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Concept notes */}
      <div className="max-w-[640px] mx-auto pt-2 pb-6 text-[13px] leading-relaxed text-muted-foreground space-y-2">
        <p><strong className="text-foreground">Home tab = My Rilo</strong>, not Planner. The full planner gets its own bottom tab.</p>
        <p><strong className="text-foreground">One hero, one decision.</strong> "Right now" is the only thing that competes for attention. Start / Swap / Snooze / Done — that's it.</p>
        <p><strong className="text-foreground">Stats are passive.</strong> 3 small chips, no progress pressure, no streaks at risk.</p>
        <p><strong className="text-foreground">After this</strong> shows exactly 1 next item with a tiny link to the full plan — for users who want to peek.</p>
        <p><strong className="text-foreground">Rilo note</strong> = one warm sentence, never a list of tips. Talk to Rilo lives at the bottom and expands into chat.</p>
        <p className="text-xs italic">Below: the older Coach Home sketch for comparison.</p>
      </div>

      {/* ── Original Phone Frame (legacy planner-style home) ── */}
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
      {/* ── Coach Home (AI-powered focused home) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="pt-8">
        <h2 className="text-xl font-bold text-foreground text-center mb-1">💬 Coach Home — AI-powered focused home</h2>
        <p className="text-center text-muted-foreground text-sm mb-6">
          A second home opposite the Planner: one greeting, one focus, one conversation with the instructor's AI clone.
        </p>
      </div>
      <div className="flex justify-center">
        <div
          className="relative w-[375px] rounded-[40px] shadow-2xl overflow-hidden transition-colors duration-500 flex flex-col"
          style={{
            background: darkMode
              ? 'linear-gradient(180deg, #1A0F08 0%, #2A1810 100%)'
              : `linear-gradient(180deg, ${O.bgWarm} 0%, #FFFFFF 60%)`,
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

          {/* Header — Plan ⇆ Coach pill switcher */}
          <div className="px-4 pt-1 pb-3">
            <div className="grid grid-cols-[auto_1fr_auto] items-center h-9">
              <button className="p-1.5 -ml-1" style={{ color: fg }}>
                <Menu className="w-[18px] h-[18px]" />
              </button>
              <div className="flex justify-center">
                <div
                  className="flex items-center rounded-full p-0.5"
                  style={{
                    background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  }}
                >
                  <button
                    className="text-[12px] font-semibold px-3 py-1 rounded-full"
                    style={{ color: fgMuted }}
                  >
                    Plan
                  </button>
                  <button
                    className="text-[12px] font-bold px-3 py-1 rounded-full"
                    style={{
                      background: O.primary,
                      color: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(235,94,51,0.35)',
                    }}
                  >
                    Coach
                  </button>
                </div>
              </div>
              <button className="p-1.5" style={{ color: fg }}>
                <Headset className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          {/* Hero greeting band — instructor + warm one-liner */}
          <div className="px-5 pt-1 pb-4 flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`,
                boxShadow: '0 6px 18px rgba(235,94,51,0.35)',
              }}
            >
              <FluentEmoji emoji="👩🏻‍🏫" size={36} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold tracking-wide uppercase" style={{ color: O.primary }}>
                Rilo · Morning
              </div>
              <div className="text-[18px] font-bold leading-tight" style={{ color: fg }}>
                Hi Sara — one thing at a time today.
              </div>
            </div>
          </div>

          {/* Pulse strip — at-a-glance stats (home-style) */}
          <div className="px-4 pb-3">
            <div
              className="grid grid-cols-3 rounded-2xl overflow-hidden"
              style={{
                background: darkMode ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#3D2A1A' : O.border}`,
              }}
            >
              {[
                { icon: '🔥', label: 'Streak', value: '12d' },
                { icon: '✅', label: 'Today', value: '1/3' },
                { icon: '💛', label: 'Mood', value: 'Calm' },
              ].map((s, i) => (
                <div key={s.label} className="py-2.5 px-2 text-center"
                  style={{ borderLeft: i > 0 ? `1px solid ${darkMode ? '#3D2A1A' : O.border}` : 'none' }}>
                  <FluentEmoji emoji={s.icon} size={20} />
                  <div className="text-[15px] font-bold mt-0.5" style={{ color: fg }}>{s.value}</div>
                  <div className="text-[10px]" style={{ color: fgMuted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* HERO Focus Card — the one move, big & dominant */}
          <div className="px-4 pb-3">
            <div
              className="rounded-[28px] p-5 relative overflow-hidden"
              style={{
                background: darkMode
                  ? `linear-gradient(135deg, ${O.peachDark}, #2A1810)`
                  : `linear-gradient(135deg, ${O.peach}, ${O.peachMid})`,
                boxShadow: darkMode
                  ? '0 12px 32px rgba(0,0,0,0.45)'
                  : '0 12px 32px rgba(235,94,51,0.22)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5" style={{ color: O.primary }} />
                <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: O.primary }}>
                  Rilo picked for you
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: darkMode ? '#1A0F08' : '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                >
                  <FluentEmoji emoji="🧘‍♀️" size={40} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[20px] font-bold leading-tight" style={{ color: fg }}>
                    2-min morning breath
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: fgMuted }}>
                    Mornings feel rushed — start small.
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl text-[15px] font-bold"
                  style={{
                    background: O.primary,
                    color: '#FFFFFF',
                    boxShadow: '0 6px 18px rgba(235,94,51,0.4)',
                  }}
                >
                  <Play className="w-4 h-4" fill="#FFFFFF" />
                  Start now
                </button>
                <button
                  className="px-4 py-3.5 rounded-2xl text-[13px] font-semibold"
                  style={{
                    background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
                    color: fg,
                  }}
                >
                  Swap
                </button>
              </div>
            </div>
          </div>

          {/* Section title */}
          <div className="px-5 pt-2 pb-2 flex items-center justify-between">
            <div className="text-[13px] font-bold" style={{ color: fg }}>Next up</div>
            <div className="text-[11px]" style={{ color: fgMuted }}>after this</div>
          </div>

          {/* Up-next list — small, calm, scannable */}
          <div className="px-4 pb-3 space-y-2">
            {[
              { emoji: '💧', title: 'Drink a glass of water', meta: '1 min · easy win', tint: O.skyMid },
              { emoji: '📓', title: 'Write 3 lines — what matters today', meta: '3 min · clarity', tint: O.lavenderMid },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
                style={{
                  background: darkMode ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                  border: `1px solid ${darkMode ? '#3D2A1A' : O.border}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : item.tint + '55' }}
                >
                  <FluentEmoji emoji={item.emoji} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold" style={{ color: fg }}>{item.title}</div>
                  <div className="text-[11px]" style={{ color: fgMuted }}>{item.meta}</div>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: fgMuted }} />
              </div>
            ))}
          </div>

          {/* Gentle nudge card from Rilo — feels like a note, not a chat */}
          <div className="px-4 pb-4">
            <div
              className="rounded-2xl p-3.5 flex gap-3"
              style={{
                background: darkMode ? 'rgba(255,255,255,0.04)' : '#FFF8F3',
                border: `1px dashed ${darkMode ? '#3D2A1A' : O.peachMid}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})` }}
              >
                <FluentEmoji emoji="👩🏻‍🏫" size={20} />
              </div>
              <div className="flex-1 text-[12.5px] leading-relaxed" style={{ color: fg }}>
                You skipped yesterday's reset — that's okay. We start fresh, gently. 🧡
              </div>
            </div>
          </div>

          {/* Floating "Talk to Rilo" pill — entry to chat, not chat itself */}
          <div className="px-4 pb-6 pt-1 mt-auto">
            <button
              className="w-full flex items-center gap-3 rounded-full pl-4 pr-1.5 py-1.5"
              style={{
                background: darkMode ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                border: `1px solid ${darkMode ? '#3D2A1A' : O.border}`,
                boxShadow: darkMode ? 'none' : '0 6px 18px rgba(60,30,10,0.08)',
              }}
            >
              <span className="text-[13px] flex-1 text-left py-1.5" style={{ color: fgMuted }}>
                Talk to Rilo…
              </span>
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ color: fgMuted }}
              >
                <Mic className="w-[18px] h-[18px]" />
              </span>
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: O.primary,
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(235,94,51,0.35)',
                }}
              >
                <ArrowUp className="w-[18px] h-[18px]" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Concept notes under the mock */}
      <div className="max-w-[640px] mx-auto pt-2 pb-4 text-[13px] leading-relaxed text-muted-foreground space-y-2">
        <p><strong className="text-foreground">Header:</strong> 2-pill switcher between <em>Plan</em> (current home) and <em>Coach</em> (this screen).</p>
        <p><strong className="text-foreground">Hero band:</strong> instructor's AI clone — avatar + warm one-liner pulling time of day & name. Compact, not a full splash.</p>
        <p><strong className="text-foreground">Pulse strip:</strong> 3 home-style stats (streak, today's progress, mood) so the page feels grounded in real data — not a chat.</p>
        <p><strong className="text-foreground">Hero Focus Card:</strong> THE single move Rilo picked, with reason + Start. Visually dominant — this is the page's gravity center.</p>
        <p><strong className="text-foreground">Next up:</strong> 2 small follow-on tasks. Optional, scannable, easy to ignore.</p>
        <p><strong className="text-foreground">Gentle nudge:</strong> a note from the instructor (not a chat bubble) — feels like a card, sits naturally on a home page.</p>
        <p><strong className="text-foreground">Talk to Rilo pill:</strong> bottom entry-point. Tap it to expand into the chat surface — chat is a destination, not the home itself.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">Without clouds</p>
          <ListenPhoneFrame darkMode={darkMode} clouds={false} />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">With clouds (hero strip)</p>
          <ListenPhoneFrame darkMode={darkMode} clouds={true} />
        </div>
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

function ListenPhoneFrame({ darkMode, clouds = false }: { darkMode: boolean; clouds?: boolean }) {
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
      {/* Optional cloud hero strip — top 320px, fades into white surface */}
      {clouds && (
        <div className="absolute top-0 left-0 right-0 h-[320px] overflow-hidden pointer-events-none z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            src={heroStormVideo}
            className="w-full h-full object-cover"
            style={{ opacity: darkMode ? 0.55 : 0.7 }}
          />
          {/* Seamless fade into page background — uses bg with alpha steps to avoid a dark band */}
          <div
            className="absolute inset-0"
            style={{
              background: darkMode
                ? `linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0) 60%, rgba(10,10,10,0.6) 85%, #0A0A0A 100%)`
                : `linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.6) 85%, #FFFFFF 100%)`,
            }}
          />
        </div>
      )}

      <div className="relative z-10">
      {/* Status bar */}
      <div className="flex items-center justify-between px-8 pt-4 pb-2">
        <span className="text-xs font-semibold" style={{ color: fgMuted }}>9:41</span>
        <div className="flex gap-1.5">
          <div className="w-4 h-2 rounded-sm" style={{ background: fgMuted }} />
          <div className="w-4 h-2 rounded-sm" style={{ background: fgMuted }} />
        </div>
      </div>

      {/* Glassy rounded header — matches AppHome. Fully transparent in cloud mode. */}
      <div
        className="px-4 pt-2 pb-3 rounded-b-2xl"
        style={{
          background: clouds ? 'transparent' : glassBg,
          backdropFilter: clouds ? 'none' : 'blur(20px)',
          boxShadow: clouds ? 'none' : '0 2px 10px rgba(0,0,0,0.06)',
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
    </div>
  );
}
