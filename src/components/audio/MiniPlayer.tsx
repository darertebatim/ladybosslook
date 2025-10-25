import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Headphones } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface MiniPlayerProps {
  audioId: string;
  title: string;
  coverImageUrl?: string;
  isPlaying: boolean;
  progress: number;
  onPlayPause: () => void;
  playlistName?: string;
  trackPosition?: string;
}

export const MiniPlayer = ({
  audioId,
  title,
  coverImageUrl,
  isPlaying,
  progress,
  onPlayPause,
  playlistName,
  trackPosition,
}: MiniPlayerProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="fixed bottom-16 left-0 right-0 z-40 rounded-none border-x-0 border-b-0 cursor-pointer"
      onClick={() => navigate(`/app/player/${audioId}`)}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="relative h-12 w-12 rounded overflow-hidden flex-shrink-0">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Headphones className="h-6 w-6 text-primary/40" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {playlistName && (
            <p className="text-xs text-muted-foreground truncate">{playlistName}</p>
          )}
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{title}</p>
            {trackPosition && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {trackPosition}
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-1 mt-1" />
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onPlayPause();
          }}
          className="flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
      </div>
    </Card>
  );
};
