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
        style={{ borderRadius: '28px 28px 0 0', height: '82vh' }}
      >
        <div
          className="relative flex flex-col h-full overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, hsl(25 95% 58%) 0%, hsl(15 90% 50%) 45%, hsl(5 85% 43%) 100%)',
          }}
        >
          {/* Noise texture */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Glow orbs */}
          <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-white/15 blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 -left-20 w-56 h-56 rounded-full bg-yellow-300/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-24 right-0 w-48 h-48 rounded-full bg-red-900/20 blur-2xl pointer-events-none" />

          {/* Drag handle */}
          <div className="flex justify-center pt-4 relative z-10">
            <div className="w-10 h-[5px] rounded-full bg-white/30" />
          </div>

          {/* Emoji cluster — centered row, large sticker style */}
          <div className="relative z-10 flex justify-center items-end mt-10 mb-0 px-6">
            <div className="flex items-end justify-center gap-0">
              {EMOJIS.map((emoji, i) => {
                const transforms = [
                  { rotate: '-14deg', scale: 0.88, y: 4 },
                  { rotate: '6deg',  scale: 0.96, y: 0 },
                  { rotate: '-5deg', scale: 1.08, y: -6 },
                  { rotate: '8deg',  scale: 1.12, y: -8 },
                  { rotate: '-7deg', scale: 0.94, y: 2 },
                  { rotate: '11deg', scale: 0.85, y: 6 },
                ];
                const t = transforms[i];
                return (
                  <div
                    key={i}
                    className="relative"
                    style={{
                      transform: `rotate(${t.rotate}) scale(${t.scale}) translateY(${t.y}px)`,
                      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
                      zIndex: i === 3 ? 10 : i,
                      marginLeft: i === 0 ? 0 : '-6px',
                    }}
                  >
                    <FluentEmoji emoji={emoji} size={64} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Copy */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-7 text-center">
            <h2
              className="text-white leading-tight mb-4"
              style={{
                fontSize: '2.1rem',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.12,
                textShadow: '0 2px 20px rgba(0,0,0,0.2)',
              }}
            >
              You've got a great list going! Want to keep piling on?
            </h2>
            <p
              className="text-white/75 leading-relaxed max-w-[270px]"
              style={{ fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 }}
            >
              Committing to too many habits can lower the chance of success.
            </p>
          </div>

          {/* CTAs */}
          <div className="relative z-10 px-5 pb-10 pt-2 flex flex-col gap-2">
            <button
              onClick={handleKeepSimple}
              className="w-full font-bold text-lg transition-all active:scale-[0.97]"
              style={{
                background: 'rgba(255,255,255,0.97)',
                color: 'hsl(15 90% 44%)',
                borderRadius: 100,
                padding: '18px 24px',
                boxShadow: '0 6px 32px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.4) inset',
                fontSize: '1.05rem',
                letterSpacing: '-0.01em',
              }}
            >
              Keep it simple
            </button>

            <button
              onClick={handleChallenge}
              className="w-full py-4 font-semibold text-white/80 text-base transition-opacity active:opacity-50"
              style={{ letterSpacing: '0.01em' }}
            >
              I'll take the challenge
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

