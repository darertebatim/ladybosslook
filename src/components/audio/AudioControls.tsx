import { Play, Pause, RotateCcw, RotateCw } from "lucide-react";
import { GlassButton } from "./GlassButton";
import { cn } from "@/lib/utils";

interface AudioControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  variant?: "default" | "glass";
}

export const AudioControls = ({
  isPlaying,
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

  if (isGlass) {
    return (
      <div className="flex items-center justify-center gap-6 py-4">
        {/* Skip Back */}
        <div className="flex flex-col items-center gap-1">
          <GlassButton
            onClick={onSkipBack}
            size="md"
            className="bg-white/10 hover:bg-white/20"
          >
            <RotateCcw className="h-5 w-5" />
          </GlassButton>
          <span className="text-xs text-white/60 font-medium">10s</span>
        </div>

        {/* Play/Pause - Large Central Button */}
        <GlassButton
          onClick={onPlayPause}
          size="xl"
          variant="primary"
          className="h-20 w-20 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </GlassButton>

        {/* Skip Forward */}
        <div className="flex flex-col items-center gap-1">
          <GlassButton
            onClick={onSkipForward}
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
            onClick={() => onPlaybackRateChange(nextRate)}
            size="md"
            className="bg-white/10 hover:bg-white/20 font-semibold text-sm"
          >
            {playbackRate}x
          </GlassButton>
          <span className="text-xs text-white/60 font-medium">Speed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-6 py-4">
      {/* Skip Back */}
      <button
        onClick={onSkipBack}
        className={cn(
          "flex flex-col items-center gap-1 p-3 rounded-2xl",
          "bg-secondary/50 hover:bg-secondary transition-colors",
          "active:scale-95"
        )}
      >
        <RotateCcw className="h-6 w-6" />
        <span className="text-xs text-muted-foreground font-medium">10s</span>
      </button>

      {/* Play/Pause - Large Central Button */}
      <button
        onClick={onPlayPause}
        className={cn(
          "h-20 w-20 rounded-full flex items-center justify-center",
          "bg-primary text-primary-foreground",
          "shadow-lg hover:shadow-xl transition-all",
          "active:scale-95 hover:scale-105"
        )}
      >
        {isPlaying ? (
          <Pause className="h-8 w-8" />
        ) : (
          <Play className="h-8 w-8 ml-1" />
        )}
      </button>

      {/* Skip Forward */}
      <button
        onClick={onSkipForward}
        className={cn(
          "flex flex-col items-center gap-1 p-3 rounded-2xl",
          "bg-secondary/50 hover:bg-secondary transition-colors",
          "active:scale-95"
        )}
      >
        <RotateCw className="h-6 w-6" />
        <span className="text-xs text-muted-foreground font-medium">10s</span>
      </button>

      {/* Speed Button */}
      <button
        onClick={() => onPlaybackRateChange(nextRate)}
        className={cn(
          "flex flex-col items-center gap-1 p-3 rounded-2xl min-w-[52px]",
          "bg-secondary/50 hover:bg-secondary transition-colors",
          "active:scale-95"
        )}
      >
        <span className="text-sm font-bold">{playbackRate}x</span>
        <span className="text-xs text-muted-foreground font-medium">Speed</span>
      </button>
    </div>
  );
};
