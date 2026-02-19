import { Sheet, SheetContent } from '@/components/ui/sheet';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

const EMOJIS = ['💻', '🪴', '💰', '😊', '🧘', '🌬️'];

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
  const handleKeepSimple = () => {
    onOpenChange(false);
  };

  const handleChallenge = () => {
    onOpenChange(false);
    onTakeChallenge();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[2rem] p-0 border-0 overflow-hidden focus:outline-none [&>button]:hidden"
        style={{ height: '75vh' }}
      >
        {/* Gradient background */}
        <div
          className="relative flex flex-col h-full"
          style={{
            background: 'linear-gradient(160deg, hsl(var(--primary) / 0.85) 0%, hsl(var(--primary)) 60%, hsl(270 60% 50%) 100%)',
          }}
        >
          {/* Blurred pill handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>

          {/* Floating emoji cluster */}
          <div className="flex items-center justify-center mt-8 mb-2">
            <div className="relative w-56 h-24">
              {EMOJIS.map((emoji, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${i * 17 + 2}%`,
                    top: i % 2 === 0 ? '0%' : '30%',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                    zIndex: i,
                  }}
                >
                  <FluentEmoji emoji={emoji} size={46} />
                </div>
              ))}
            </div>
          </div>

          {/* Copy */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
              You've got a great list going! Want to keep piling on?
            </h2>
            <p className="text-white/75 text-base leading-relaxed max-w-xs">
              Committing to too many habits can lower the chance of success.
            </p>
          </div>

          {/* Actions */}
          <div className="px-5 pb-10 space-y-3">
            <button
              onClick={handleKeepSimple}
              className="w-full py-4 rounded-2xl bg-white text-primary font-bold text-lg shadow-lg active:scale-[0.98] transition-transform"
            >
              Keep it simple
            </button>
            <button
              onClick={handleChallenge}
              className="w-full py-3 text-white/80 font-medium text-base active:opacity-70 transition-opacity"
            >
              I'll take the challenge
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
