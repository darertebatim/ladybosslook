import { Sheet, SheetContent } from '@/components/ui/sheet';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

const EMOJIS = ['🧘', '💧', '🌱', '😊', '📖', '🌬️'];

const LS_KEY = 'simora_action_limit_soft_shown';

export function hasSeenActionLimitSoft(): boolean {
  return localStorage.getItem(LS_KEY) === '1';
}

export function markActionLimitSoftSeen() {
  localStorage.setItem(LS_KEY, '1');
}

export function resetActionLimitSoftSeen() {
  localStorage.removeItem(LS_KEY);
}

interface ActionLimitSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user taps "I'll take the challenge" — show paywall */
  onTakeChallenge: () => void;
}

export function ActionLimitSheet({ open, onOpenChange, onTakeChallenge }: ActionLimitSheetProps) {
  const handleKeepSimple = () => onOpenChange(false);

  const handleChallenge = () => {
    onOpenChange(false);
    onTakeChallenge();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 border-0 overflow-hidden focus:outline-none [&>button]:hidden"
        style={{ borderRadius: '28px 28px 0 0', height: '80vh' }}
      >
        {/* Full gradient background matching app theme */}
        <div className="relative flex flex-col h-full overflow-hidden"
          style={{
            background: 'linear-gradient(175deg, hsl(250 60% 78%) 0%, hsl(265 55% 62%) 35%, hsl(275 60% 50%) 100%)',
          }}
        >
          {/* Subtle noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Drag handle */}
          <div className="flex justify-center pt-4 pb-0 relative z-10">
            <div className="w-9 h-1 rounded-full bg-white/40" />
          </div>

          {/* Blurred circle decorations */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-32 -left-16 w-48 h-48 rounded-full bg-purple-300/20 blur-2xl pointer-events-none" />

          {/* Emoji cluster — large, overlapping, sticker style */}
          <div className="relative z-10 flex justify-center mt-10 mb-2">
            <div className="relative w-72 h-28">
              {EMOJIS.map((emoji, i) => {
                const offsets = [
                  { left: '0%',  top: '10%',  rotate: '-12deg', scale: 1.05 },
                  { left: '16%', top: '0%',   rotate: '5deg',   scale: 1.15 },
                  { left: '32%', top: '8%',   rotate: '-6deg',  scale: 1.2  },
                  { left: '48%', top: '0%',   rotate: '10deg',  scale: 1.1  },
                  { left: '63%', top: '12%',  rotate: '-8deg',  scale: 1.0  },
                  { left: '78%', top: '2%',   rotate: '7deg',   scale: 1.12 },
                ];
                const o = offsets[i];
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: o.left,
                      top: o.top,
                      transform: `rotate(${o.rotate}) scale(${o.scale})`,
                      filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))',
                      zIndex: i + 1,
                    }}
                  >
                    <FluentEmoji emoji={emoji} size={52} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Copy block */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-7 text-center">
            <h2
              className="text-white leading-tight mb-5"
              style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}
            >
              You've got a great list going! Want to keep piling on?
            </h2>
            <p
              className="text-white/70 leading-relaxed max-w-[280px]"
              style={{ fontSize: '1rem', fontWeight: 400 }}
            >
              Committing to too many habits can lower the chance of success.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="relative z-10 px-5 pb-10 space-y-2">
            {/* Primary pill */}
            <button
              onClick={handleKeepSimple}
              className="w-full font-bold text-lg transition-transform active:scale-[0.97]"
              style={{
                background: 'white',
                color: 'hsl(265 55% 50%)',
                borderRadius: 100,
                padding: '18px 24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              }}
            >
              Keep it simple
            </button>

            {/* Ghost text button */}
            <button
              onClick={handleChallenge}
              className="w-full py-4 text-white/75 font-medium text-base transition-opacity active:opacity-50"
              style={{ fontSize: '1rem', letterSpacing: '0.01em' }}
            >
              I'll take the challenge
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
