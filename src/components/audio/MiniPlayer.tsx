import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Headphones, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

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
    <Card 
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-2 right-2 z-40 rounded-xl border shadow-lg cursor-pointer animate-in slide-in-from-bottom-4 duration-300"
      onClick={() => navigate(`/app/player/${currentTrack.id}`)}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
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
        
        <div className="flex-1 min-w-0">
          {currentTrack.playlistName && (
            <p className="text-xs text-muted-foreground truncate">{currentTrack.playlistName}</p>
          )}
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
            {currentTrack.trackPosition && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {currentTrack.trackPosition}
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-1 mt-1" />
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={handlePlayPause}
          className="flex-shrink-0 h-10 w-10"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={handleClose}
          className="flex-shrink-0 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
