import { Play, Pause, Headphones, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { AudioEqualizer } from "./AudioEqualizer";
import { cn } from "@/lib/utils";

export const MiniPlayer = () => {
  const navigate = useNavigate();
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    pause, 
    resume, 
    stop 
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
        "fixed top-[calc(76px+env(safe-area-inset-top))] left-2 right-2 z-40",
        "rounded-2xl overflow-hidden cursor-pointer",
        "animate-in slide-in-from-top-4 duration-300",
        // Glass effect
        "bg-card/80 dark:bg-card/90 backdrop-blur-xl",
        "border border-border/50",
        "shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      )}
      onClick={() => navigate(`/app/player/${currentTrack.id}`)}
    >
      {/* Progress bar at top */}
      <div className="h-1 bg-muted/30 w-full">
        <div 
          className="h-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 p-3">
        {/* Cover Art */}
        <div className="relative h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
          {currentTrack.coverImageUrl ? (
            <img 
              src={currentTrack.coverImageUrl} 
              alt={currentTrack.title} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Headphones className="h-6 w-6 text-primary/40" />
            </div>
          )}
        </div>
        
        {/* Track Info */}
        <div className="flex-1 min-w-0">
          {currentTrack.playlistName && (
            <p className="text-xs text-muted-foreground truncate mb-0.5">
              {currentTrack.playlistName}
            </p>
          )}
          <div className="flex items-center gap-2 h-5">
            <AudioEqualizer 
              isPlaying={isPlaying} 
              size="sm" 
              className={cn("flex-shrink-0 transition-opacity", isPlaying ? "opacity-100" : "opacity-0")} 
            />
            <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
          </div>
          {currentTrack.trackPosition && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Track {currentTrack.trackPosition}
            </p>
          )}
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className={cn(
            "flex-shrink-0 h-12 w-12 rounded-full",
            "flex items-center justify-center",
            "bg-primary text-primary-foreground",
            "shadow-md hover:shadow-lg transition-all",
            "active:scale-95 hover:scale-105"
          )}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className={cn(
            "flex-shrink-0 h-8 w-8 rounded-full",
            "flex items-center justify-center",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted/50 transition-colors",
            "active:scale-95"
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
