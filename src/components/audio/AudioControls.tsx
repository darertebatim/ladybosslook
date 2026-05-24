import { Play, Pause, RotateCcw, RotateCw, Loader2, Moon } from "lucide-react";
import { GlassButton } from "./GlassButton";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAudioPlayer, SleepMode } from "@/contexts/AudioPlayerContext";

interface AudioControlsProps {
  isPlaying: boolean;
  isBuffering?: boolean;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  variant?: "default" | "glass";
}

export const AudioControls = ({
  isPlaying,
  isBuffering = false,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  playbackRate,
  onPlaybackRateChange,
  variant = "default",
}: AudioControlsProps) => {
  const isGlass = variant === "glass";
  
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const currentRateIndex = playbackRates.indexOf(playbackRate);
  const nextRate = playbackRates[(currentRateIndex + 1) % playbackRates.length];

  const { sleepMode, sleepRemainingSeconds, setSleepMode, hasNextTrack } = useAudioPlayer();
  const [sleepOpen, setSleepOpen] = useState(false);

  const sleepActive = sleepMode.kind !== 'off';
  const sleepLabel =
    sleepMode.kind === 'timer' && sleepRemainingSeconds != null
      ? formatRemaining(sleepRemainingSeconds)
      : sleepMode.kind === 'end-of-track'
      ? 'Track'
      : 'Off';

  const handlePlayPause = () => {
    haptic.light();
    onPlayPause();
  };

  const handleSkipBack = () => {
    haptic.selection();
    onSkipBack();
  };

  const handleSkipForward = () => {
    haptic.selection();
    onSkipForward();
  };

  const handleRateChange = () => {
    haptic.selection();
    onPlaybackRateChange(nextRate);
  };

  const openSleep = () => {
    haptic.selection();
    setSleepOpen(true);
  };

  const pickSleep = (mode: SleepMode) => {
    haptic.light();
    setSleepMode(mode);
    setSleepOpen(false);
  };

  if (isGlass) {
    return (
      <div className="flex items-center justify-center gap-6 py-4">
      {/* Skip Back */}
        <div className="flex flex-col items-center gap-1">
          <GlassButton
            onClick={handleSkipBack}
            size="md"
            className="bg-white/10 hover:bg-white/20"
          >
            <RotateCcw className="h-5 w-5" />
          </GlassButton>
          <span className="text-xs text-white/60 font-medium">10s</span>
        </div>

        {/* Play/Pause - Large Central Button */}
        <GlassButton
          onClick={handlePlayPause}
          size="xl"
          variant="primary"
          className="h-20 w-20 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          {isBuffering ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </GlassButton>

        {/* Skip Forward */}
        <div className="flex flex-col items-center gap-1">
          <GlassButton
            onClick={handleSkipForward}
            size="md"
            className="bg-white/10 hover:bg-white/20"
          >
            <RotateCw className="h-5 w-5" />
          </GlassButton>
          <span className="text-xs text-white/60 font-medium">10s</span>
        </div>

        {/* Speed Button */}
        <div className="flex flex-col items-center gap-1">
          <GlassButton
            onClick={handleRateChange}
            size="md"
            className="bg-white/10 hover:bg-white/20 font-semibold text-sm"
          >
            {playbackRate}x
          </GlassButton>
          <span className="text-xs text-white/60 font-medium">Speed</span>
        </div>

        {/* Sleep Button */}
        <div className="flex flex-col items-center gap-1">
          <GlassButton
            onClick={openSleep}
            size="md"
            className={cn(
              "bg-white/10 hover:bg-white/20",
              sleepActive && "bg-white/25"
            )}
          >
            <Moon className="h-5 w-5" />
          </GlassButton>
          <span className="text-xs text-white/60 font-medium">
            {sleepActive ? sleepLabel : 'Sleep'}
          </span>
        </div>
      </div>
      <SleepSheet
        open={sleepOpen}
        onOpenChange={setSleepOpen}
        sleepMode={sleepMode}
        onPick={pickSleep}
      />
      </>
    );
  }

  return (
    <>
    <div className="flex items-center justify-center gap-6 py-4">
      {/* Skip Back */}
      <button
        onClick={handleSkipBack}
        className={cn(
          "flex flex-col items-center gap-1 p-3 rounded-2xl",
          "hover:bg-foreground/10 transition-colors",
          "active:scale-95"
        )}
      >
        <RotateCcw className="h-6 w-6 text-fg-warm" />
        <span className="text-xs text-fg-warm/60 font-medium">10s</span>
      </button>

      {/* Play/Pause - Large Central Button */}
      <button
        onClick={handlePlayPause}
        className={cn(
          "h-20 w-20 rounded-full flex items-center justify-center",
          "bg-fg-warm text-bg-warm",
          "shadow-lg hover:shadow-xl transition-all",
          "active:scale-95 hover:scale-105"
        )}
      >
        {isBuffering ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-8 w-8" />
        ) : (
          <Play className="h-8 w-8 ml-1" />
        )}
      </button>

      {/* Skip Forward */}
      <button
        onClick={handleSkipForward}
        className={cn(
          "flex flex-col items-center gap-1 p-3 rounded-2xl",
          "hover:bg-foreground/10 transition-colors",
          "active:scale-95"
        )}
      >
        <RotateCw className="h-6 w-6 text-fg-warm" />
        <span className="text-xs text-fg-warm/60 font-medium">10s</span>
      </button>

      {/* Speed Button */}
      <button
        onClick={handleRateChange}
        className={cn(
          "flex flex-col items-center gap-1 p-3 rounded-2xl min-w-[52px]",
          "hover:bg-foreground/10 transition-colors",
          "active:scale-95"
        )}
      >
        <span className="text-sm font-bold text-fg-warm">{playbackRate}x</span>
        <span className="text-xs text-fg-warm/60 font-medium">Speed</span>
      </button>

      {/* Sleep Button */}
      <button
        onClick={openSleep}
        className={cn(
          "flex flex-col items-center gap-1 p-3 rounded-2xl min-w-[52px]",
          "hover:bg-foreground/10 transition-colors",
          "active:scale-95",
          sleepActive && "bg-foreground/10"
        )}
      >
        <Moon className={cn("h-5 w-5", sleepActive ? "text-fg-warm" : "text-fg-warm")} />
        <span className="text-xs text-fg-warm/60 font-medium">
          {sleepActive ? sleepLabel : 'Sleep'}
        </span>
      </button>
    </div>
    <SleepSheet
      open={sleepOpen}
      onOpenChange={setSleepOpen}
      sleepMode={sleepMode}
      onPick={pickSleep}
    />
    </>
  );
};

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 1) return `${m}m`;
  return `${s}s`;
}

interface SleepSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sleepMode: SleepMode;
  onPick: (mode: SleepMode) => void;
}

function SleepSheet({ open, onOpenChange, sleepMode, onPick }: SleepSheetProps) {
  const options: { label: string; build: () => SleepMode }[] = [
    { label: '5 minutes', build: () => ({ kind: 'timer', minutes: 5, endsAt: Date.now() + 5 * 60 * 1000 }) },
    { label: '10 minutes', build: () => ({ kind: 'timer', minutes: 10, endsAt: Date.now() + 10 * 60 * 1000 }) },
    { label: '15 minutes', build: () => ({ kind: 'timer', minutes: 15, endsAt: Date.now() + 15 * 60 * 1000 }) },
    { label: '30 minutes', build: () => ({ kind: 'timer', minutes: 30, endsAt: Date.now() + 30 * 60 * 1000 }) },
    { label: '45 minutes', build: () => ({ kind: 'timer', minutes: 45, endsAt: Date.now() + 45 * 60 * 1000 }) },
    { label: '60 minutes', build: () => ({ kind: 'timer', minutes: 60, endsAt: Date.now() + 60 * 60 * 1000 }) },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-0 pb-8">
        <SheetHeader>
          <SheetTitle className="text-fg-warm text-center">Sleep timer</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          <button
            onClick={() => onPick({ kind: 'end-of-track' })}
            className={cn(
              "w-full text-left px-4 py-4 rounded-2xl active:scale-[0.99] transition",
              sleepMode.kind === 'end-of-track'
                ? "bg-fg-warm text-bg-warm"
                : "bg-foreground/5 text-fg-warm"
            )}
          >
            <div className="font-semibold">End of this audio</div>
            <div className="text-xs opacity-70 mt-0.5">Pause when current track finishes</div>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => {
              const active = sleepMode.kind === 'timer' && sleepMode.minutes === opt.build().minutes;
              return (
                <button
                  key={opt.label}
                  onClick={() => onPick(opt.build())}
                  className={cn(
                    "px-4 py-4 rounded-2xl text-center font-semibold active:scale-[0.99] transition",
                    active
                      ? "bg-fg-warm text-bg-warm"
                      : "bg-foreground/5 text-fg-warm"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {sleepMode.kind !== 'off' && (
            <button
              onClick={() => onPick({ kind: 'off' })}
              className="w-full mt-3 px-4 py-3 rounded-2xl text-center font-semibold text-fg-warm/80 active:scale-[0.99] transition border border-foreground/10"
            >
              Turn off sleep timer
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
