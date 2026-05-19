import { useMemo } from "react";
import { Plus } from "lucide-react";
import type { FriendProfile } from "@/hooks/useFriends";

/**
 * 9 positions arranged as two gentle arcs (a half-moon constellation).
 * Top arc: 5 slots curving across the top.
 * Bottom arc: 4 slots curving below, offset between top ones.
 */
const SPOTS: Array<{ x: number; y: number; size: number }> = [
  // Top arc (left -> right), gentle dip in the middle
  { x: 0.10, y: 0.30, size: 0.95 },
  { x: 0.30, y: 0.18, size: 1.05 },
  { x: 0.50, y: 0.12, size: 1.2 },
  { x: 0.70, y: 0.18, size: 1.05 },
  { x: 0.90, y: 0.30, size: 0.95 },
  // Bottom arc, offset between
  { x: 0.20, y: 0.62, size: 1.0 },
  { x: 0.40, y: 0.55, size: 1.1 },
  { x: 0.60, y: 0.55, size: 1.1 },
  { x: 0.80, y: 0.62, size: 1.0 },
];

interface Props {
  friends: FriendProfile[];
  onAdd: () => void;
}

export function Constellation({ friends, onAdd }: Props) {
  const slots = useMemo(() => {
    return SPOTS.map((spot, i) => ({ ...spot, friend: friends[i] ?? null }));
  }, [friends]);

  return (
    <div className="relative w-full" style={{ aspectRatio: "1 / 0.78" }}>
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
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden viewBox="0 0 100 78" preserveAspectRatio="none">
        <path d="M 10 30 Q 50 4 90 30" stroke="rgba(255,255,255,0.18)" strokeWidth="0.3" strokeDasharray="0.8 1.2" fill="none" />
        <path d="M 20 62 Q 50 46 80 62" stroke="rgba(255,255,255,0.14)" strokeWidth="0.3" strokeDasharray="0.8 1.2" fill="none" />
      </svg>
      {/* Tiny twinkle stars */}
      <TwinkleField />

      {slots.map((s, i) => {
        const left = `${s.x * 100}%`;
        const top = `${s.y * 100}%`;
        const size = 46 * s.size;
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left, top, width: size + 12 }}
          >
            {s.friend ? (
              <FilledStar friend={s.friend} size={size} delay={i * 0.18} />
            ) : (
              <EmptyStar size={size} delay={i * 0.18} />
            )}
          </div>
        );
      })}

      {/* Center add friend pill */}
      <button
        onClick={onAdd}
        className="absolute left-1/2 -translate-x-1/2 bottom-[-18px] inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white shadow-ios active:scale-95 transition-transform"
        style={{ color: "#EB5E33" }}
      >
        <span className="grid place-items-center w-6 h-6 rounded-full" style={{ backgroundColor: "#EB5E33" }}>
          <Plus className="w-3.5 h-3.5" color="#FFFFFF" strokeWidth={3} />
        </span>
        <span className="text-[14px] font-bold">Add friend</span>
      </button>
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

function EmptyStar({ size, delay }: { size: number; delay: number }) {
  // Real 5-point star outline at full slot size, no surrounding circle
  return (
    <div
      className="grid place-items-center"
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
    </div>
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