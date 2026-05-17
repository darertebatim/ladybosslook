import { useMemo } from "react";
import { Plus } from "lucide-react";
import type { FriendProfile } from "@/hooks/useFriends";

/** 9 fixed star positions, normalized 0-1 inside the scene box. */
const SPOTS: Array<{ x: number; y: number; size: number }> = [
  { x: 0.20, y: 0.18, size: 1.0 },
  { x: 0.52, y: 0.08, size: 1.15 },
  { x: 0.82, y: 0.20, size: 0.95 },
  { x: 0.30, y: 0.40, size: 1.05 },
  { x: 0.72, y: 0.42, size: 1.0 },
  { x: 0.14, y: 0.62, size: 0.9 },
  { x: 0.52, y: 0.58, size: 1.2 },
  { x: 0.86, y: 0.66, size: 0.95 },
  { x: 0.40, y: 0.82, size: 1.0 },
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
    <div className="relative w-full" style={{ aspectRatio: "1 / 0.72" }}>
      {/* Soft background nebulas */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 30% 25%, rgba(235,94,51,0.18), transparent 60%), radial-gradient(ellipse 55% 40% at 75% 70%, rgba(178,140,255,0.22), transparent 60%), radial-gradient(ellipse 70% 50% at 50% 95%, rgba(255,170,120,0.14), transparent 60%)",
        }}
      />
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
        {/* Glow halo */}
        <div
          aria-hidden
          className="absolute inset-[-30%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,210,161,0.55) 0%, rgba(235,94,51,0.25) 35%, transparent 70%)",
            filter: "blur(2px)",
          }}
        />
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
        {/* Tiny sparkle */}
        <span
          aria-hidden
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ background: "#FFD2A1", boxShadow: "0 0 10px 2px rgba(255,210,161,0.9)" }}
        />
      </div>
      <span className="mt-1.5 text-[12px] font-semibold text-white/95 truncate max-w-[88px] text-center" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
        {friend.full_name || "Friend"}
      </span>
    </>
  );
}

function EmptyStar({ size, delay }: { size: number; delay: number }) {
  return (
    <div
      className="rounded-full grid place-items-center"
      style={{
        width: size,
        height: size,
        background: "rgba(255,255,255,0.04)",
        border: "1.5px dashed rgba(255,255,255,0.28)",
        animation: `hub-pulse 4.5s ease-in-out ${delay}s infinite`,
      }}
    >
      <svg width={size * 0.35} height={size * 0.35} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3l2.2 5.4 5.8.5-4.4 3.9 1.4 5.7L12 15.8 6.9 18.5l1.4-5.7L4 8.9l5.8-.5L12 3z"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.6"
          strokeLinejoin="round"
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