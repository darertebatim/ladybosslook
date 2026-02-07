import { memo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Music, Lock, CheckCircle2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { haptic } from '@/lib/haptics';

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

export const PlaylistCard = memo(function PlaylistCard({
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
}: PlaylistCardProps) {
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
      case 'meditate': return 'Meditate';
      case 'workout': return 'Workout';
      case 'soundscape': return 'Soundscape';
      case 'affirmation': return 'Affirmations';
      default: return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Audio';
    }
  };

  const handleClick = () => {
    haptic.light();
    if (isLocked && programSlug) {
      // Navigate to course detail page where user can enroll
      navigate(`/app/course/${programSlug}`);
      return;
    }
    if (isLocked) return; // No programSlug, can't navigate
    navigate(`/app/player/playlist/${id}`);
  };

  // Determine tour class for first free or first locked playlist
  const tourClass = isFree && !isLocked ? 'tour-free-playlist' : isLocked ? 'tour-locked-playlist' : '';

  return (
    <Card 
      className={`overflow-hidden rounded-2xl border-border/50 cursor-pointer hover:shadow-lg hover:border-border transition-all hover:scale-[1.02] active:scale-[0.98] ${
        isLocked ? 'opacity-80' : ''
      } ${tourClass}`}
      onClick={handleClick}
    >
      <div className="relative aspect-square">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt={name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Music className="h-16 w-16 text-primary/40" />
          </div>
        )}
        
        {/* Bottom Gradient for Title Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {isLocked && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        {isFree && !isLocked && (
          <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 rounded-full">
            FREE
          </Badge>
        )}
        
        {category && (
          <Badge variant="secondary" className="absolute top-2 left-2 rounded-full">
            {getCategoryLabel()}
          </Badge>
        )}
        
        {/* Title Overlay */}
        <h3 className="absolute bottom-2 left-2 right-2 font-semibold text-sm text-white line-clamp-2 drop-shadow-md z-10">
          {name}
        </h3>
        
        {/* Progress overlay at bottom */}
        {!isLocked && progressPercentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30 z-20">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </div>
      
      <div className="p-3 space-y-2">
        
        {description && (
          <p className={`text-xs line-clamp-2 ${isLocked ? 'text-muted-foreground' : 'text-foreground/80'}`}>{description}</p>
        )}
        
        <div className={`flex items-center gap-2 text-xs ${isLocked ? 'text-muted-foreground' : 'text-foreground/70'}`}>
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
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-primary font-medium">
              <CheckCircle2 className="h-3 w-3" />
              <span>{completedTracks}/{trackCount}</span>
            </div>
            <span className="text-muted-foreground">• {Math.round(progressPercentage)}% complete</span>
          </div>
        )}
        
        {isLocked && programSlug && (
          <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-foreground text-background rounded-lg text-xs font-medium">
            <span>Tap to enroll</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </Card>
  );
});
