import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { useFriendships, type FriendProfile } from "@/hooks/useFriends";
import { useMyRecentMoments } from "@/hooks/useMyRecentMoments";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { defaultEmojiForKind, labelForKind } from "@/lib/moments";

/**
 * A "window into the hub": night-sky preview card with friend stars
 * and the latest moment. Tapping opens /app/hub.
 */
export function HubPortalCard() {
  const navigate = useNavigate();
  const { data: friendships = [] } = useFriendships();
  const { data: moments = [] } = useMyRecentMoments();

  const friends: FriendProfile[] = useMemo(
    () =>
      friendships
        .filter((f) => f.friendship.status === "accepted")
        .map((f) => f.other)
        .slice(0, 5),
    [friendships],
  );
  const latest = moments[0] ?? null;

  // Deterministic background twinkle stars
  const twinkles = useMemo(() => {
    const arr: Array<{ x: number; y: number; r: number; d: number; o: number }> = [];
    let seed = 11;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 28; i++) {
      arr.push({ x: rand(), y: rand() * 0.85, r: 0.6 + rand() * 1.4, d: rand() * 3, o: 0.3 + rand() * 0.5 });
    }
    return arr;
  }, []);

  // Arc positions for up to 5 friend stars (left → right)
  const arc = [
    { x: 0.12, y: 0.45 },
    { x: 0.30, y: 0.28 },
    { x: 0.50, y: 0.22 },
    { x: 0.70, y: 0.28 },
    { x: 0.88, y: 0.45 },
  ];

  return (
    <button
      type="button"
      onClick={() => navigate("/app/hub")}
      aria-label="Open your friends hub"
      className="relative w-full rounded-3xl overflow-hidden text-left active:scale-[0.99] transition-transform shadow-ios"
      style={{
        aspectRatio: "1 / 1.05",
        background:
          "radial-gradient(ellipse 80% 55% at 50% 0%, #3A1E66 0%, #1A0E2E 55%, #0E0820 100%)",
      }}
    >
      <style>{`
        @keyframes hpc-twinkle { 0%,100% { opacity: 0.25; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes hpc-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes hpc-shoot { 0% { transform: translate(0,0) rotate(-18deg); opacity: 0; } 10% { opacity: 1; } 60% { opacity: 1; } 100% { transform: translate(220px,70px) rotate(-18deg); opacity: 0; } }
      `}</style>

      {/* Aurora nebula glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 35% at 30% 20%, rgba(235,94,51,0.20), transparent 65%), radial-gradient(ellipse 55% 35% at 75% 60%, rgba(178,140,255,0.22), transparent 65%)",
        }}
      />

      {/* Twinkle stars */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
        {twinkles.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x * 100}%`}
            cy={`${s.y * 100}%`}
            r={s.r}
            fill="#FFFFFF"
            opacity={s.o}
            style={{ animation: `hpc-twinkle 3.6s ease-in-out ${s.d}s infinite` }}
          />
        ))}
      </svg>

      {/* Shooting star */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: "-20px",
          top: "12%",
          width: "60px",
          height: "1.5px",
          background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,230,190,0.9) 100%)",
          borderRadius: "2px",
          animation: "hpc-shoot 5.5s ease-in-out 1.5s infinite",
          filter: "drop-shadow(0 0 4px rgba(255,210,161,0.8))",
        }}
      />

      {/* Top label */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-white/90" />
          <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-white/85">
            Friends hub
          </span>
        </div>
        <div className="w-7 h-7 grid place-items-center rounded-full bg-white/15 backdrop-blur-md">
          <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* Friend stars arc (mid area) */}
      <div className="absolute inset-0">
        {arc.map((p, i) => {
          const f = friends[i] ?? null;
          const left = `${p.x * 100}%`;
          const top = `${p.y * 100}%`;
          const size = i === 2 ? 44 : i === 1 || i === 3 ? 38 : 32;
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left, top, animation: `hpc-float 6s ease-in-out ${i * 0.25}s infinite` }}
            >
              {f ? (
                <FilledStar friend={f} size={size} />
              ) : (
                <EmptyStar size={size} />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom info: latest moment OR empty CTA */}
      <div className="absolute left-3 right-3 bottom-3">
        {latest ? (
          <div
            className="rounded-2xl p-2.5 flex items-center gap-2.5"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <div className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))] shrink-0">
              <FluentEmoji emoji={latest.emoji || defaultEmojiForKind(latest.kind)} size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] uppercase tracking-wider font-bold text-white/65">
                Latest · {labelForKind(latest.kind)}
              </div>
              <div className="text-[13px] font-semibold text-white leading-tight truncate mt-0.5">
                {latest.title}
              </div>
            </div>
            <span
              className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: "#EB5E33" }}
            >
              Inspire
            </span>
          </div>
        ) : (
          <div
            className="rounded-2xl px-3 py-2.5 text-center"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 100%)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <p className="text-white text-[13px] font-semibold leading-tight">
              Light up your sky
            </p>
            <p className="text-white/65 text-[11px] mt-0.5">
              Add friends · share moments · cheer each other on
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

function FilledStar({ friend, size }: { friend: FriendProfile; size: number }) {
  const initial = (friend.full_name || "?").charAt(0).toUpperCase();
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* sparkle burst behind */}
      <svg
        aria-hidden
        className="absolute inset-[-40%] w-[180%] h-[180%] pointer-events-none"
        viewBox="0 0 100 100"
      >
        <path
          d="M50 8 L54 46 L92 50 L54 54 L50 92 L46 54 L8 50 L46 46 Z"
          fill="rgba(255,230,190,0.5)"
        />
      </svg>
      {friend.avatar_url ? (
        <img
          src={friend.avatar_url}
          alt=""
          className="relative w-full h-full rounded-full object-cover"
          style={{ border: "1.5px solid rgba(255,255,255,0.9)" }}
        />
      ) : (
        <div
          className="relative w-full h-full rounded-full grid place-items-center text-black font-bold"
          style={{
            background: "linear-gradient(135deg, #FFE0B8 0%, #FFB088 60%, #EB5E33 100%)",
            border: "1.5px solid rgba(255,255,255,0.9)",
            fontSize: size * 0.42,
          }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}

function EmptyStar({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5l2.7 6.6 7.1.6-5.4 4.7 1.7 7L12 17.7 5.9 21.4l1.7-7L2.2 9.7l7.1-.6L12 2.5z"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="rgba(255,255,255,0.04)"
      />
    </svg>
  );
}