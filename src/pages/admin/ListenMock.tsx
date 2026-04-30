import { Search, Globe, Lock, ChevronRight } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

/**
 * ListenMock — proposed redesign of /app/player using the new
 * iOS 18 / Liquid Glass warm-light language (no clouds, no dark hero).
 *
 * Goal: bring Listen in line with Home / Tools / Channels:
 *  - bg: warm `#FFF8F3` (matches `bg-background` token)
 *  - sticky glassy rounded header `rounded-b-2xl`
 *  - light filter pills (peach inactive / brand active)
 *  - light playlist cards with `shadow-card-warm`, orange "Tap to enroll"
 *  - bottom safe space — no dark bleed under the floating tab bar
 */

const O = {
  bg:       '#FFF8F3',
  card:     '#FFFFFF',
  fg:       '#2D1A0E',
  fgMuted:  '#8B6E5A',
  primary:  '#EB5E33',
  peach:    '#FFE6C9',
  border:   '#F5DCC8',
  shadow:   '0 4px 14px rgba(45, 26, 14, 0.06), 0 1px 2px rgba(45, 26, 14, 0.04)',
  glassBg:  'rgba(255, 255, 255, 0.55)',
};

const CATEGORIES = ['All', 'Meditate', 'Workout', 'Soundscape', 'Affirmations', 'Audiobooks', 'Course', 'Podcast'];
const STATUS = ['All', 'In Progress', 'Completed'] as const;

const PLAYLISTS = [
  { id: 1, type: 'Meditate', dur: '28m', title: 'Meditation Level 1 with Razie (FA)', emoji: '🧘‍♀️', free: true, locked: false, color: '#F0E3FF' },
  { id: 2, type: 'Course',  dur: '4h 19m', title: '5 Languages of Strength (Farsi)', emoji: '💪', free: false, locked: true, color: '#FFE0F5' },
  { id: 3, type: 'Course',  dur: '7h 27m', title: 'Empowered Woman (Farsi)',         emoji: '🌟', free: false, locked: true, color: '#FFE6C9' },
  { id: 4, type: 'Podcast', dur: '1m',     title: 'Goals from Our Podcast',          emoji: '🎙️', free: true, locked: false, color: '#E2F9F0' },
];

export default function ListenMock() {
  return (
    <div className="min-h-screen w-full" style={{ background: O.bg, color: O.fg }}>
      {/* Phone frame for review */}
      <div className="mx-auto max-w-[420px] min-h-screen relative" style={{ background: O.bg }}>

        {/* ── Glassy rounded header (matches Home pattern) ── */}
        <header
          className="sticky top-0 z-30 backdrop-blur-xl rounded-b-2xl"
          style={{
            background: O.glassBg,
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          <div className="px-4 pt-3 pb-3 flex items-center justify-between min-h-[52px]">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: O.fg }}>Listen</h1>
            <button
              className="h-9 w-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: O.card, color: O.primary, boxShadow: O.shadow }}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* Category row */}
          <div className="px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {CATEGORIES.map((c, i) => {
                const active = i === 0;
                return (
                  <button
                    key={c}
                    className="shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap active:scale-95 transition-transform"
                    style={{
                      background: active ? O.primary : O.peach,
                      color: active ? '#fff' : O.fgMuted,
                      boxShadow: active ? O.shadow : 'none',
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status row + language */}
          <div className="px-4 pb-3 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {STATUS.map((s, i) => {
                const active = i === 0;
                return (
                  <button
                    key={s}
                    className="px-3 py-1.5 rounded-full text-[12px] font-semibold active:scale-95 transition-transform"
                    style={{
                      background: active ? O.card : 'transparent',
                      color: active ? O.fg : O.fgMuted,
                      boxShadow: active ? O.shadow : 'none',
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <button
              className="h-9 w-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: O.card, color: O.primary, boxShadow: O.shadow }}
              aria-label="Language"
            >
              <Globe className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* ── Section heading ── */}
        <section className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-bold tracking-[0.12em]" style={{ color: O.fgMuted }}>
            ALL PLAYLISTS
          </p>
        </section>

        {/* ── Playlist cards ── */}
        <section className="px-4 space-y-3 pb-32">
          {PLAYLISTS.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: O.card, boxShadow: O.shadow }}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Cover */}
                <div
                  className="relative h-20 w-20 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ background: p.color }}
                >
                  <FluentEmoji emoji={p.emoji} size={42} />
                  {p.locked && (
                    <div
                      className="absolute bottom-1 left-1 h-6 w-6 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.55)' }}
                    >
                      <Lock className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: O.fgMuted }}>
                    <span className="font-medium">{p.type}</span>
                    <span>·</span>
                    <span>{p.dur}</span>
                  </div>
                  <h3 className="text-[15px] font-bold leading-tight mt-0.5 line-clamp-2" style={{ color: O.fg }}>
                    {p.title}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {p.free && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: '#E2F9F0', color: '#065F46' }}
                      >
                        🔥 FREE
                      </span>
                    )}
                    <span className="text-[14px]">🇮🇷</span>
                  </div>
                </div>
              </div>

              {/* CTA strip for locked items */}
              {p.locked && (
                <button
                  className="w-full py-3 text-[13px] font-bold flex items-center justify-center gap-1 active:scale-[0.99] transition-transform"
                  style={{
                    background: '#FFF1E8',
                    color: O.primary,
                    borderTop: `1px solid ${O.border}`,
                  }}
                >
                  Tap to enroll <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </section>

        {/* ── Bottom-bar safe space — warm bg, no dark bleed ── */}
        <div
          className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${O.bg} 60%)`,
          }}
        />
      </div>

      {/* ── Notes panel ── */}
      <div className="mx-auto max-w-[420px] mt-6 mb-12 px-4">
        <div
          className="rounded-2xl p-4 text-[13px] leading-relaxed"
          style={{ background: O.card, color: O.fg, boxShadow: O.shadow }}
        >
          <p className="font-bold mb-2">Listen — proposed redesign</p>
          <ul className="space-y-1.5" style={{ color: O.fgMuted }}>
            <li>• Drops storm/cloud video & dark <code>#132240</code> bg.</li>
            <li>• Warm <code>bg-background</code> matches Home, Tools, Channels.</li>
            <li>• Sticky glassy rounded header (<code>rounded-b-2xl</code>).</li>
            <li>• Light filter pills (peach inactive / brand-orange active).</li>
            <li>• White playlist cards with soft warm shadow.</li>
            <li>• Orange "Tap to enroll" strip on locked items.</li>
            <li>• Bottom fade keeps tab bar consistent — no dark bleed.</li>
            <li>• Clouds can return later as an optional hero strip on top.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}