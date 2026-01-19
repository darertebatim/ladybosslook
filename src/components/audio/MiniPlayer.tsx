import { Play, Pause, Headphones, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { AudioEqualizer } from "./AudioEqualizer";
import { cn } from "@/lib/utils";

// Format duration in minutes
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
};

export const MiniPlayer = () => {
  const navigate = useNavigate();
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    pause, 
    resume, 
    stop,
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
        // Position: bottom, above tab bar (64px tab + safe area)
        "fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-3 right-3 z-40",
        "rounded-2xl overflow-hidden cursor-pointer",
        "animate-in slide-in-from-bottom-4 duration-300",
        // Glass effect
        "bg-card/90 dark:bg-card/95 backdrop-blur-xl",
        "border border-border/50",
        "shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
      )}
      onClick={() => navigate(`/app/player/${currentTrack.id}`)}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Cover Art - Larger size */}
        <div className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
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
              <Headphones className="h-7 w-7 text-primary/40" />
            </div>
          )}
          
          {/* Playing indicator overlay */}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <AudioEqualizer isPlaying={true} size="sm" className="text-white" />
            </div>
          )}
        </div>
        
        {/* Track Info - Me+ style with duration and category */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate">{currentTrack.title}</p>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {formatDuration(duration)} {currentTrack.playlistName && `· ${currentTrack.playlistName}`}
          </p>
        </div>

        {/* Play/Pause Button - Larger */}
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
            "flex-shrink-0 h-9 w-9 rounded-full",
            "flex items-center justify-center",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted/50 transition-colors",
            "active:scale-95"
          )}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Progress bar at bottom */}
      <div className="h-1 bg-muted/30 w-full">
        <div 
          className="h-full bg-primary"
          style={{ 
            width: `${progress}%`,
            transition: 'width 0.5s linear'
          }}
        />
      </div>
    </div>
  );
};