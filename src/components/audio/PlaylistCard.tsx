import { memo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Music, Lock, CheckCircle2, ChevronRight, Crown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

const LANG_FLAGS: Record<string, string> = {
  all: '🌐',
  american: '🇺🇸',
  persian: '🇮🇷',
  turkish: '🇹🇷',
  spanish: '🇪🇸',
};

interface PlaylistCardProps {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  category?: string;
  language?: string;
  isFree: boolean;
  isLocked: boolean;
  programSlug?: string;
  requiresSubscription?: boolean;
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
  language,
  isFree,
  isLocked,
  programSlug,
  requiresSubscription,
  trackCount,
  completedTracks,
  totalDuration,
}: PlaylistCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.pathname;
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
    // Free playlists always navigate to playlist detail (gate is inside)
    if (isFree) {
      navigate(`/app/player/playlist/${id}`, { state: { from } });
      return;
    }
    // Plus playlists navigate to detail (paywall gate is inside)
    if (requiresSubscription) {
      navigate(`/app/player/playlist/${id}`, { state: { from } });
      return;
    }
    if (isLocked && programSlug) {
      navigate(`/app/course/${programSlug}`, { state: { from } });
      return;
    }
    if (isLocked) return;
    navigate(`/app/player/playlist/${id}`, { state: { from } });
  };

  // Determine tour class for first free or first locked playlist
  const tourClass = isFree && !isLocked ? 'tour-free-playlist' : isLocked ? 'tour-locked-playlist' : '';

  return (
    <div className={`relative ${tourClass}`}>
      {/* PLUS badge - outside card overflow */}
      {requiresSubscription && (
        <Badge className="absolute -top-2.5 -left-2 z-30 bg-amber-200 text-amber-700 hover:bg-amber-200 rounded-full text-xs gap-1 shadow-sm">
          <Crown className="h-3 w-3" />
          PLUS
        </Badge>
      )}
      <Card 
        className={`overflow-hidden rounded-2xl border-border/50 cursor-pointer shadow-lg border-border transition-all active:scale-[0.98] ${
          isLocked && !isFree ? 'opacity-80' : ''
        }`}
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
        
        {isLocked && !isFree && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Top-right: FREE badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          {isFree && !isLocked && (
            <Badge className="bg-green-500 hover:bg-green-600 rounded-full">
              FREE
            </Badge>
          )}
        </div>

        
        {category && (
          <Badge variant="secondary" className="absolute top-2 left-2 rounded-full">
            {getCategoryLabel()}
          </Badge>
        )}
        
        {/* Title Overlay with language flag */}
        <h3 className="absolute bottom-2 left-2 right-2 font-semibold text-sm text-white line-clamp-2 drop-shadow-md z-10 flex items-center gap-1">
          {language && LANG_FLAGS[language] && (
            <span className="text-sm flex-shrink-0">{LANG_FLAGS[language]}</span>
          )}
          <span>{name}</span>
        </h3>
        
        {/* Progress overlay at bottom */}
        {(!isLocked || isFree) && progressPercentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30 z-20">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </div>
      
      <div className="p-3 space-y-2 relative">
        
        {description && (
          <p className="text-xs text-black line-clamp-2">{description}</p>
        )}
        
        <div className="flex items-center gap-2 text-xs text-black">
          <div className="flex items-center gap-1">
            <Music className="h-3 w-3" />
            <span>{trackCount} tracks</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(totalDuration)}</span>
          </div>
        </div>
        
        {(!isLocked || isFree) && progressPercentage > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-primary font-medium">
              <CheckCircle2 className="h-3 w-3" />
              <span>{completedTracks}/{trackCount}</span>
            </div>
            <span className="text-muted-foreground">• {Math.round(progressPercentage)}% complete</span>
          </div>
        )}
        
        {isLocked && !isFree && programSlug && (
          <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-black text-white rounded-lg text-xs font-medium">
            <span>Tap to enroll</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        )}

        {requiresSubscription && (
          <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-amber-100">
            <FluentEmoji emoji="🔒" size={18} />
          </div>
        )}
      </div>
      </Card>
    </div>
  );
});
