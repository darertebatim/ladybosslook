import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AudioControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
}

export const AudioControls = ({
  isPlaying,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  playbackRate,
  onPlaybackRateChange,
}: AudioControlsProps) => {
  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={onSkipBack}
        className="h-10 w-10"
      >
        <SkipBack className="h-5 w-5" />
      </Button>

      <Button
        size="icon"
        onClick={onPlayPause}
        className="h-14 w-14"
      >
        {isPlaying ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6 ml-0.5" />
        )}
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onSkipForward}
        className="h-10 w-10"
      >
        <SkipForward className="h-5 w-5" />
      </Button>

      <Select
        value={playbackRate.toString()}
        onValueChange={(value) => onPlaybackRateChange(parseFloat(value))}
      >
        <SelectTrigger className="w-20 h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.5">0.5x</SelectItem>
          <SelectItem value="0.75">0.75x</SelectItem>
          <SelectItem value="1">1x</SelectItem>
          <SelectItem value="1.25">1.25x</SelectItem>
          <SelectItem value="1.5">1.5x</SelectItem>
          <SelectItem value="2">2x</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
