import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';

interface StreakGoalConfirmationProps {
  open: boolean;
  goal: number;
  onClose: () => void;
}

const MESSAGE = {
  heading: "Great! Small steps build big momentum. Even one is enough—Just don't break the streak.",
  sub: "Your streak challenge starts now. Show up daily.",
};

export function StreakGoalConfirmation({ open, goal, onClose }: StreakGoalConfirmationProps) {
  if (!open) return null;

  const msg = MESSAGE;

  const handleClose = () => {
    haptic.light();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{
        background: 'linear-gradient(160deg, hsl(25 95% 60%) 0%, hsl(15 88% 50%) 50%, hsl(5 80% 42%) 100%)',
      }}
    >
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.055] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glow orbs */}
      <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-24 w-64 h-64 rounded-full bg-yellow-200/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-56 h-56 rounded-full bg-red-900/20 blur-2xl pointer-events-none" />

      {/* Floating sparkle dots */}
      <div className="absolute top-16 left-10 w-2 h-2 rounded-full bg-white/40" />
      <div className="absolute top-28 right-16 w-1.5 h-1.5 rounded-full bg-white/30" />
      <div className="absolute top-44 left-20 w-1 h-1 rounded-full bg-white/25" />
      <div className="absolute top-56 right-10 w-2.5 h-2.5 rounded-full bg-white/20" />
      <div className="absolute bottom-48 left-14 w-1.5 h-1.5 rounded-full bg-white/30" />
      <div className="absolute bottom-64 right-24 w-1 h-1 rounded-full bg-white/25" />

      {/* Safe area top spacer */}
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />

      {/* Emoji illustration — large centered cluster */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        {/* Big fire + flame cluster */}
        <div className="relative flex items-end justify-center mb-12">
          <div
            style={{
              transform: 'rotate(-10deg) scale(0.85)',
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
              marginRight: '-8px',
            }}
          >
            <FluentEmoji emoji="⚡" size={80} />
          </div>
          <div
            style={{
              transform: 'scale(1.3)',
              filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.35))',
              zIndex: 10,
            }}
          >
            <FluentEmoji emoji="🔥" size={96} />
          </div>
          <div
            style={{
              transform: 'rotate(10deg) scale(0.82)',
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
              marginLeft: '-8px',
            }}
          >
            <FluentEmoji emoji="✨" size={80} />
          </div>
        </div>

        {/* Goal pill */}
        <div
          className="flex items-center gap-2 px-5 py-2 rounded-full mb-8"
          style={{
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <span className="text-white/90 font-semibold text-sm tracking-wide">
            {goal}-day streak challenge — accepted! 🏆
          </span>
        </div>

        {/* Main heading */}
        <h1
          className="text-white text-center leading-tight mb-4"
          style={{
            fontSize: '1.85rem',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            textShadow: '0 2px 24px rgba(0,0,0,0.2)',
          }}
        >
          {msg.heading}
        </h1>

        {/* Subtitle */}
        <p
          className="text-white/70 text-center leading-relaxed"
          style={{ fontSize: '1rem', fontWeight: 400, lineHeight: 1.6, maxWidth: 260 }}
        >
          {msg.sub}
        </p>
      </div>

      {/* CTA */}
      <div
        className="relative z-10 px-5 pb-6 flex flex-col gap-3"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <button
          onClick={handleClose}
          className="w-full font-bold text-lg transition-all active:scale-[0.97]"
          style={{
            background: 'rgba(0,0,0,0.85)',
            color: 'white',
            borderRadius: 100,
            padding: '18px 24px',
            boxShadow: '0 6px 32px rgba(0,0,0,0.3)',
            fontSize: '1.05rem',
            letterSpacing: '-0.01em',
          }}
        >
          I will definitely keep going!
        </button>
      </div>
    </div>
  );
}
