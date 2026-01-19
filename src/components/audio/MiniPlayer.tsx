import { Play, Pause, Headphones, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { cn } from "@/lib/utils";

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
};

export const MiniPlayer = () => {
  const navigate = useNavigate();
  const { 
    currentTrack, 
    isPlaying, 
    duration, 
    pause, 
    resume, 
    stop,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    stop();
  };

  return (
    <div 
      className={cn(
        "fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-2 right-2 z-40",
        "rounded-xl overflow-hidden cursor-pointer",
        "animate-in slide-in-from-bottom-4 duration-300",
        "bg-card/95 backdrop-blur-lg",
        "border border-border/30",
        "shadow-lg"
      )}
      onClick={() => navigate(`/app/player/${currentTrack.id}`)}
    >
      <div className="flex items-center gap-2.5 p-2">
        {/* Compact Cover Art - 44px */}
        <div className="relative h-11 w-11 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
          {currentTrack.coverImageUrl ? (
            <img 
              src={currentTrack.coverImageUrl} 
              alt={currentTrack.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Headphones className="h-5 w-5 text-primary/40" />
            </div>
          )}
        </div>
        
        {/* Compact Track Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{currentTrack.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {formatDuration(duration)}{currentTrack.playlistName ? ` • ${currentTrack.playlistName}` : ''}
          </p>
        </div>

        {/* Compact Play/Pause Button - outlined style */}
        <button
          onClick={handlePlayPause}
          className={cn(
            "flex-shrink-0 h-9 w-9 rounded-full",
            "flex items-center justify-center",
            "border-2 border-foreground/30",
            "hover:border-foreground/50 transition-colors",
            "active:scale-95"
          )}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>

        {/* Compact Close Button */}
        <button
          onClick={handleClose}
          className={cn(
            "flex-shrink-0 h-7 w-7 rounded-full",
            "flex items-center justify-center",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted/50 transition-colors",
            "active:scale-95"
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
