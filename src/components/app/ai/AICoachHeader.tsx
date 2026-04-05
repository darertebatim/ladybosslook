import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { cn } from '@/lib/utils';

export type CoachMode = 'coach' | 'assistant' | 'companion';

const MODES: { id: CoachMode; label: string; emoji: string; color: string }[] = [
  { id: 'coach', label: 'Coach', emoji: '💪', color: 'from-purple-500 to-violet-600' },
  { id: 'assistant', label: 'Assistant', emoji: '📋', color: 'from-blue-500 to-cyan-600' },
  { id: 'companion', label: 'Companion', emoji: '💜', color: 'from-pink-500 to-rose-600' },
];

const MODE_BG: Record<CoachMode, string> = {
  coach: 'from-purple-600 via-violet-600 to-indigo-700',
  assistant: 'from-blue-600 via-cyan-600 to-teal-700',
  companion: 'from-pink-500 via-rose-500 to-fuchsia-600',
};

interface Props {
  mode: CoachMode;
  setMode: (m: CoachMode) => void;
  onClear: () => void;
}

export function AICoachHeader({ mode, setMode, onClear }: Props) {
  const navigate = useNavigate();

  return (
    <div className={cn("safe-area-inset-top relative overflow-hidden bg-gradient-to-br", MODE_BG[mode])}>
      {/* Animated mesh overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-white/90 hover:bg-white/10" onClick={() => navigate('/app/home')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2.5">
            {/* Pulsing AI orb */}
            <div className="relative">
            <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <FluentEmoji emoji="✨" size={20} />
            </div>
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Ladybosslook AI</h1>
              <p className="text-[10px] text-white/70 font-medium">{MODES.find(m => m.id === mode)?.label} Mode</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="h-9 w-9 text-white/90 hover:bg-white/10" onClick={onClear}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode pills */}
        <div className="flex gap-1.5 px-4 pb-3">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300",
                mode === m.id
                  ? "bg-white text-foreground shadow-lg shadow-black/10 scale-[1.02]"
                  : "bg-white/15 text-white/90 hover:bg-white/25 backdrop-blur-sm"
              )}
            >
              <FluentEmoji emoji={m.emoji} size={18} />
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
