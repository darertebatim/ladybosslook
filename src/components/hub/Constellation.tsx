import { useMemo } from "react";
import { Plus } from "lucide-react";
import type { FriendProfile } from "@/hooks/useFriends";

/**
 * 9 positions arranged as two gentle arcs (a half-moon constellation).
 * Top arc: 5 slots curving across the top.
 * Bottom arc: 4 slots curving below, offset between top ones.
 */
// 3 rows revealed progressively. Filled order = middle (3) → bottom (2) → top (4).
// SPOTS are listed in fill order so friends[i] maps naturally.
const SPOTS: Array<{ x: number; y: number; size: number }> = [
  // Tier 1 — middle row, 3 stars (always visible)
  { x: 0.22, y: 0.50, size: 1.1 },
  { x: 0.50, y: 0.46, size: 1.25 },
  { x: 0.78, y: 0.50, size: 1.1 },
  // Tier 2 — bottom row, 2 stars (revealed at 3 friends)
  { x: 0.34, y: 0.82, size: 1.1 },
  { x: 0.66, y: 0.82, size: 1.1 },
  // Tier 3 — top row, 4 stars (revealed at 5 friends)
  { x: 0.14, y: 0.18, size: 1.0 },
  { x: 0.38, y: 0.14, size: 1.15 },
  { x: 0.62, y: 0.14, size: 1.15 },
  { x: 0.86, y: 0.18, size: 1.0 },
];

function visibleCount(accepted: number): number {
  if (accepted >= 5) return 9;
  if (accepted >= 3) return 5;
  return 3;
}

interface Props {
  friends: FriendProfile[];
  onAdd: () => void;
  onFriendTap?: (friend: FriendProfile) => void;
}

export function Constellation({ friends, onAdd, onFriendTap }: Props) {
  const slots = useMemo(() => {
    const count = visibleCount(friends.length);
    return SPOTS.slice(0, count).map((spot, i) => ({ ...spot, friend: friends[i] ?? null }));
  }, [friends]);

  const showTier2 = friends.length >= 3;
  const showTier3 = friends.length >= 5;

  return (
    <div className="relative w-full" style={{ aspectRatio: "1 / 0.95" }}>
      {/* Subtle background nebula — dimmed so stars stay foreground */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(235,94,51,0.08), transparent 70%), radial-gradient(ellipse 70% 45% at 50% 90%, rgba(178,140,255,0.10), transparent 70%)",
        }}
      />
      {/* Connecting arc line behind the stars */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 22 50 Q 50 38 78 50" stroke="rgba(255,255,255,0.14)" strokeWidth="0.3" strokeDasharray="0.8 1.2" fill="none" />
        {showTier2 && (
          <path d="M 34 82 Q 50 74 66 82" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" strokeDasharray="0.8 1.2" fill="none" />
        )}
        {showTier3 && (
          <path d="M 14 18 Q 50 6 86 18" stroke="rgba(255,255,255,0.16)" strokeWidth="0.3" strokeDasharray="0.8 1.2" fill="none" />
        )}
      </svg>
      {/* Tiny twinkle stars */}
      <TwinkleField />

      {slots.map((s, i) => {
        const left = `${s.x * 100}%`;
        const top = `${s.y * 100}%`;
        const size = 64 * s.size;
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left, top, width: size + 12 }}
          >
            {s.friend ? (
              <FilledStar
                friend={s.friend}
                size={size}
                delay={i * 0.18}
                onTap={onFriendTap}
              />
            ) : (
              <EmptyStar size={size} delay={i * 0.18} onAdd={onAdd} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FilledStar({ friend, size, delay }: { friend: FriendProfile; size: number; delay: number }) {
  const initial = (friend.full_name || "?").charAt(0).toUpperCase();
  return (
    <>
      <div className="relative" style={{ width: size, height: size, animation: `hub-float 6s ease-in-out ${delay}s infinite` }}>
        {/* 4-point sparkle burst behind avatar */}
        <svg
          aria-hidden
          className="absolute inset-[-35%] w-[170%] h-[170%] pointer-events-none"
          viewBox="0 0 100 100"
        >
          <defs>
            <radialGradient id={`sparkGrad-${delay}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,220,170,0.85)" />
              <stop offset="40%" stopColor="rgba(235,94,51,0.35)" />
              <stop offset="100%" stopColor="rgba(235,94,51,0)" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="38" fill={`url(#sparkGrad-${delay})`} />
          {/* 4-point star burst */}
          <path
            d="M50 6 L54 46 L94 50 L54 54 L50 94 L46 54 L6 50 L46 46 Z"
            fill="rgba(255,230,190,0.55)"
          />
        </svg>
        {/* Avatar disc */}
        {friend.avatar_url ? (
          <img
            src={friend.avatar_url}
            alt=""
            className="relative w-full h-full rounded-full object-cover shadow-ios"
            style={{ border: "2px solid rgba(255,255,255,0.9)" }}
          />
        ) : (
          <div
            className="relative w-full h-full rounded-full grid place-items-center text-2xl font-bold text-black shadow-ios"
            style={{
              background: "linear-gradient(135deg, #FFE0B8 0%, #FFB088 60%, #EB5E33 100%)",
              border: "2px solid rgba(255,255,255,0.9)",
            }}
          >
            {initial}
          </div>
        )}
      </div>
      <span className="mt-1.5 text-[12px] font-semibold text-white/95 truncate max-w-[88px] text-center" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
        {friend.full_name || "Friend"}
      </span>
    </>
  );
}

function EmptyStar({ size, delay, onAdd }: { size: number; delay: number; onAdd: () => void }) {
  // Tappable 5-point star outline with a centered + to invite a friend
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label="Add friend"
      className="relative grid place-items-center active:scale-90 transition-transform"
      style={{
        width: size,
        height: size,
        animation: `hub-pulse 4.5s ease-in-out ${delay}s infinite`,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2.5l2.7 6.6 7.1.6-5.4 4.7 1.7 7L12 17.7 5.9 21.4l1.7-7L2.2 9.7l7.1-.6L12 2.5z"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.2"
          strokeLinejoin="round"
          fill="rgba(255,255,255,0.04)"
        />
      </svg>
      <Plus
        className="absolute"
        style={{ width: size * 0.32, height: size * 0.32, color: "rgba(255,255,255,0.85)" }}
        strokeWidth={2.5}
        aria-hidden
      />
    </button>
  );
}

function TwinkleField() {
  // Deterministic small stars
  const stars = useMemo(() => {
    const arr: Array<{ x: number; y: number; r: number; d: number; o: number }> = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 38; i++) {
      arr.push({ x: rand(), y: rand(), r: 0.6 + rand() * 1.6, d: rand() * 3, o: 0.35 + rand() * 0.5 });
    }
    return arr;
  }, []);
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={`${s.x * 100}%`}
          cy={`${s.y * 100}%`}
          r={s.r}
          fill="#FFFFFF"
          opacity={s.o}
          style={{ animation: `hub-twinkle 3.6s ease-in-out ${s.d}s infinite` }}
        />
      ))}
    </svg>
  );
}