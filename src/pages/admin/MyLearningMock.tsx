// MyLearningMock — visual mockup of the "My Learning" section on Path.
// Self-contained demo: no real data, isolated styling, for review only.
import { motion } from 'framer-motion';
import {
  Play, Calendar, ChevronRight, Check, Flame, Award,
  Headphones, BookOpen, Folder, Headset, GraduationCap, Sparkles,
  Music, Video,
} from 'lucide-react';
import appIcon from '@/assets/app-icon.png';

const O = {
  bg: '#FFF8F3',
  card: '#FFFFFF',
  fg: '#2D1A0E',
  fgMuted: '#8B6E5A',
  primary: '#EB5E33',
  primaryL: '#F5A623',
  peach: '#FFE6C9',
  peachMid: '#FFD2A1',
  yellow: '#FFF492',
  lavender: '#F0E3FF',
  mint: '#E2F9F0',
  pink: '#FFE0F5',
  border: '#F5DCC8',
};

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.06 * i, duration: 0.35, ease: 'easeOut' as const },
});

function MyLearningCard({ firstOpen }: { firstOpen: boolean }) {
  return (
    <motion.div
      {...fadeUp(0)}
      style={{
        borderRadius: 24,
        background: `linear-gradient(160deg, #FFF3E6 0%, ${O.card} 55%)`,
        border: `1.5px solid ${O.border}`,
        boxShadow: '0 10px 28px -14px rgba(235,94,51,0.28)',
        overflow: 'hidden',
      }}
    >
      {/* Greeting */}
      <div style={{ padding: '16px 16px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: O.primary, margin: 0 }}>
            {firstOpen ? "You're in 🎉" : 'My Learning'}
          </p>
          <h3 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 800, color: O.fg }}>
            {firstOpen ? 'Welcome to Instagram Ads Pro, Sara' : 'Welcome back, Sara'}
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: O.fgMuted }}>
            Instagram Ads Pro · Round 3 · West
          </p>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 14px -6px rgba(235,94,51,0.5)',
        }}>
          <GraduationCap size={20} color="#fff" strokeWidth={2.2} />
        </div>
      </div>

      {/* Continue where you left off */}
      <div style={{ margin: '6px 12px 0', borderRadius: 18, background: O.card, border: `1px solid ${O.border}`, overflow: 'hidden' }}>
        <div style={{
          aspectRatio: '16 / 6',
          background: `linear-gradient(135deg, ${O.primaryL} 0%, ${O.primary} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <GraduationCap size={40} color="rgba(255,255,255,0.9)" />
          <span style={{
            position: 'absolute', bottom: 8, right: 10, fontSize: 10, fontWeight: 700,
            background: 'rgba(0,0,0,0.35)', color: '#fff', padding: '3px 8px', borderRadius: 999,
          }}>Module 2 · Lesson 4</span>
        </div>
        <div style={{ padding: '12px 14px 14px' }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: O.fgMuted }}>
            Continue where you left off
          </p>
          <p style={{ margin: '4px 0 10px', fontSize: 14.5, fontWeight: 700, color: O.fg, lineHeight: 1.3 }}>
            Setting Up Your First Campaign
          </p>
          <button style={{
            width: '100%', height: 44, borderRadius: 14, border: 'none',
            background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`,
            color: '#fff', fontWeight: 800, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 18px -8px rgba(235,94,51,0.55)',
          }}>
            <Play size={16} fill="#fff" /> Continue Lesson
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '12px 16px 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: O.fgMuted, marginBottom: 6 }}>
          <span style={{ color: O.fg }}>7 of 18 lessons done</span>
          <span>3 unlocked &amp; waiting</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: O.peach, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '39%' }}
            transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${O.primaryL}, ${O.primary})` }}
          />
        </div>
      </div>

      {/* Next live session */}
      <div style={{ margin: '10px 12px 0', borderRadius: 16, padding: '11px 13px', background: O.peach, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 12, background: O.card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Calendar size={17} color={O.primary} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: O.fg }}>Next live session</p>
          <p style={{ margin: '1px 0 0', fontSize: 11.5, color: O.fgMuted }}>Fri, Sep 12 · 10:00 AM your time</p>
        </div>
        <button style={{
          border: 'none', borderRadius: 999, padding: '7px 12px', fontSize: 11.5, fontWeight: 800,
          background: O.card, color: O.primary, boxShadow: '0 2px 8px -2px rgba(0,0,0,0.12)', flexShrink: 0,
        }}>
          Add to calendar
        </button>
      </div>

      {/* Just unlocked */}
      <div style={{ margin: '10px 12px 0', borderRadius: 16, padding: '11px 13px', background: O.mint, border: '1px solid #C3F1E1' }}>
        <p style={{ margin: '0 0 7px', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F7B5C', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={13} /> Just unlocked
        </p>
        {[
          { icon: <Play size={13} />, text: 'Module 3: Targeting Like a Pro' },
          { icon: <Headphones size={13} />, text: 'Playlist: Ad Copy Swipe Files' },
        ].map((u) => (
          <div key={u.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: O.fg, padding: '3px 0' }}>
            <span style={{ color: '#0F7B5C' }}>{u.icon}</span>
            <span style={{ flex: 1 }}>{u.text}</span>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: O.primary }} />
          </div>
        ))}
      </div>

      {/* Materials row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '12px 12px 0' }}>
        {[
          { icon: <BookOpen size={17} />, label: 'Course', bg: O.peach, fg: O.primary },
          { icon: <Music size={17} />, label: 'Audio', bg: O.lavender, fg: '#7C3AED' },
          { icon: <Video size={17} />, label: 'Video', bg: O.pink, fg: '#C2255C' },
          { icon: <Folder size={17} />, label: 'Files', bg: O.yellow, fg: '#A16207' },
        ].map((m) => (
          <div key={m.label} style={{
            borderRadius: 14, background: m.bg, padding: '10px 4px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          }}>
            <span style={{ color: m.fg }}>{m.icon}</span>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: O.fg }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Support */}
      <button style={{
        margin: '12px 12px 14px', width: 'calc(100% - 24px)', height: 40, borderRadius: 14,
        border: `1.5px dashed ${O.border}`, background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontSize: 12.5, fontWeight: 700, color: O.fgMuted,
      }}>
        <Headset size={15} /> Questions about the program? Chat with support
      </button>
    </motion.div>
  );
}

function ShortcutTile({ emoji, label, dim }: { emoji: string; label: string; dim?: boolean }) {
  return (
    <div style={{
      borderRadius: 18, background: O.card, border: `1.5px solid ${O.border}`,
      padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
      opacity: dim ? 0.45 : 1,
    }}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: O.fg, textAlign: 'center', lineHeight: 1.25 }}>{label}</span>
    </div>
  );
}

function PhoneScreen({ enrolled, firstOpen }: { enrolled: boolean; firstOpen?: boolean }) {
  return (
    <div style={{
      width: 340, borderRadius: 40, background: O.bg,
      border: `6px solid ${O.fg}`, overflow: 'hidden',
      boxShadow: '0 30px 70px -30px rgba(45,26,14,0.45)',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: O.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={appIcon} alt="Rilo" style={{ width: 30, height: 30, borderRadius: 9 }} />
          <span style={{ fontWeight: 800, fontSize: 15, color: O.fg }}>Path (My Rilo)</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: O.fgMuted, background: O.card, border: `1px solid ${O.border}`, borderRadius: 999, padding: '4px 9px' }}>
            <Award size={12} color={O.primary} /> 2
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: '#fff', background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`, borderRadius: 999, padding: '4px 9px' }}>
            <Flame size={12} /> 0
          </span>
        </div>
      </div>

      <div style={{ padding: '4px 12px 76px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 640, overflowY: 'auto' }}>
        {enrolled && <MyLearningCard firstOpen={firstOpen} />}

        {/* Shortcuts — hidden when enrolled */}
        {!enrolled && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <ShortcutTile emoji="🎓" label="My Programs" />
            <ShortcutTile emoji="✏️" label="Reflections Journal" />
            <ShortcutTile emoji="🍗" label="Protein Tracking" />
          </div>
        )}

        {/* Today's events */}
        <div>
          <p style={{ margin: '2px 0 8px', fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: O.primary }}>
            Today's Events
          </p>
          <motion.div {...fadeUp(2)} style={{ borderRadius: 18, background: O.yellow, padding: '14px 14px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🧘</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: O.fg }}>Morning Meditation</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: O.fgMuted }}>🌅 7:00 AM · Daily</p>
            </div>
            <Check size={16} color={O.fg} />
          </motion.div>
          <motion.div {...fadeUp(3)} style={{ borderRadius: 18, background: O.lavender, padding: '14px 14px 12px', display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <span style={{ fontSize: 20 }}>📖</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: O.fg }}>Read 20 Pages</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: O.fgMuted }}>☀️ 9:30 AM · Weekdays</p>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 8, border: `2px solid ${O.fg}`, opacity: 0.35 }} />
          </motion.div>
        </div>

        {/* Explore Rilo (enrolled only) */}
        {enrolled && (
          <motion.div {...fadeUp(4)} style={{
            borderRadius: 18, background: O.card, border: `1.5px solid ${O.border}`,
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <img src={appIcon} alt="" style={{ width: 34, height: 34, borderRadius: 11 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: O.fg }}>Explore the rest of Rilo</p>
              <p style={{ margin: '1px 0 0', fontSize: 11, color: O.fgMuted }}>Tools, playlists, breathing, journaling…</p>
            </div>
            <ChevronRight size={16} color={O.fgMuted} />
          </motion.div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, right: 12, borderRadius: 999,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 30px -12px rgba(45,26,14,0.25)',
        display: 'flex', justifyContent: 'space-around', padding: '10px 8px',
      }}>
        {[
          { icon: <GraduationCap size={19} />, label: enrolled ? 'Path' : 'Path', on: true },
          { icon: <Sparkles size={19} />, label: 'Tools' },
          { icon: <Headphones size={19} />, label: 'Listen' },
          { icon: <Headset size={19} />, label: 'Chats' },
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: t.on ? O.primary : O.fgMuted }}>
            {t.icon}
            <span style={{ fontSize: 9, fontWeight: 800 }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyLearningMock() {

  return (
    <div style={{ minHeight: '100vh', background: '#FBF1E9', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: O.primary, margin: 0 }}>
          Mockup · not live
        </p>
        <h1 style={{ margin: '6px 0 4px', fontSize: 26, fontWeight: 800, color: O.fg }}>
          My Learning on Path
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: O.fgMuted, maxWidth: 560 }}>
          What a program buyer sees when they open the app. Their course sits on top of Path, shortcuts are replaced, and the rest of the app stays untouched. Compare with what a regular user sees today.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'center', alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'center' }}>
            <PhoneScreen enrolled firstOpen />
            <p style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: O.fgMuted }}>New buyer — first impression</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <PhoneScreen enrolled={false} />
            <p style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: O.fgMuted }}>Regular user — unchanged</p>
          </div>
        </div>

        {/* One-time welcome sheet preview */}
        <h2 style={{ margin: '48px 0 4px', fontSize: 18, fontWeight: 800, color: O.fg }}>First-open welcome sheet</h2>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: O.fgMuted }}>Shows once, the first time an enrolled user opens the app after purchase.</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 340, borderRadius: 28, background: O.card, overflow: 'hidden',
            border: `1.5px solid ${O.border}`, boxShadow: '0 24px 60px -24px rgba(45,26,14,0.35)',
          }}>
            <div style={{ background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`, padding: '26px 20px', textAlign: 'center' }}>
              <GraduationCap size={34} color="#fff" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: 18 }}>You're in! 🎉</p>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Instagram Ads Pro · Round 3</p>
            </div>
            <div style={{ padding: '18px 20px 20px' }}>
              {[
                { icon: <BookOpen size={15} />, text: 'Lessons unlock as you go — start with Lesson 1' },
                { icon: <Calendar size={15} />, text: 'Live sessions are added to your calendar' },
                { icon: <Headphones size={15} />, text: 'Your audio & video playlists are in My Learning' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', fontSize: 13, fontWeight: 600, color: O.fg }}>
                  <span style={{ width: 30, height: 30, borderRadius: 10, background: O.peach, color: O.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.icon}</span>
                  {r.text}
                </div>
              ))}
              <button style={{
                marginTop: 14, width: '100%', height: 46, borderRadius: 14, border: 'none',
                background: `linear-gradient(135deg, ${O.primaryL}, ${O.primary})`,
                color: '#fff', fontWeight: 800, fontSize: 14,
                boxShadow: '0 10px 20px -8px rgba(235,94,51,0.55)',
              }}>
                Start learning
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
