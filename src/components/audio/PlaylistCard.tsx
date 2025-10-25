import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Music, Lock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface PlaylistCardProps {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  category?: string;
  isFree: boolean;
  isLocked: boolean;
  programSlug?: string;
  trackCount: number;
  completedTracks: number;
  totalDuration: number;
}

export const PlaylistCard = ({
  id,
  name,
  description,
  coverImageUrl,
  category,
  isFree,
  isLocked,
  programSlug,
  trackCount,
  completedTracks,
  totalDuration,
}: PlaylistCardProps) => {
  const navigate = useNavigate();
  
  const progressPercentage = trackCount > 0 ? (completedTracks / trackCount) * 100 : 0;
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'audiobook': return 'Audiobook';
      case 'course_supplement': return 'Course';
      case 'podcast': return 'Podcast';
      default: return 'Audio';
    }
  };

  const handleClick = () => {
    if (isLocked) return;
    navigate(`/app/player/playlist/${id}`);
  };

  return (
    <Card 
      className={`overflow-hidden ${isLocked ? 'opacity-60' : 'cursor-pointer hover:shadow-lg transition-shadow'}`}
      onClick={handleClick}
    >
      <div className="relative aspect-square">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Music className="h-16 w-16 text-primary/40" />
          </div>
        )}
        
        {isLocked && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        {isFree && !isLocked && (
          <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
            FREE
          </Badge>
        )}
        
        {category && (
          <Badge variant="secondary" className="absolute top-2 left-2">
            {getCategoryLabel()}
          </Badge>
        )}
      </div>
      
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{name}</h3>
        
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        )}
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Music className="h-3 w-3" />
            <span>{trackCount} tracks</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(totalDuration)}</span>
          </div>
        </div>
        
        {!isLocked && progressPercentage > 0 && (
          <div className="space-y-1">
            <Progress value={progressPercentage} className="h-1.5" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              <span>{completedTracks}/{trackCount} completed • {Math.round(progressPercentage)}%</span>
            </div>
          </div>
        )}
        
        {isLocked && programSlug && (
          <p className="text-xs text-muted-foreground italic">
            Enroll to unlock
          </p>
        )}
      </div>
    </Card>
  );
};
