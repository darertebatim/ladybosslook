import { memo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Clock, Music, Lock, CheckCircle2, ChevronRight, Crown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { PersianFlag } from '@/components/ui/PersianFlag';
import { CachedImage } from '@/components/ui/CachedImage';
import { cn } from '@/lib/utils';

const LANG_FLAGS: Record<string, string> = {
  all: '🌐',
  american: '🇺🇸',
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
  isSubscribed?: boolean;
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
  isSubscribed,
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

  const handleClick = () => {
    haptic.light();
    if (isFree) {
      navigate(`/app/player/playlist/${id}`, { state: { from } });
      return;
    }
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

  const tourClass = isFree && !isLocked ? 'tour-free-playlist' : isLocked ? 'tour-locked-playlist' : '';

  return (
    <div className={`relative ${tourClass}`}>
      {/* PLUS badge - outside card, top-left */}
      {requiresSubscription && (
        <Badge className="absolute -top-2.5 -left-2 z-30 bg-amber-200 text-amber-700 hover:bg-amber-200 rounded-full text-xs gap-1 shadow-sm">
          <Crown className="h-3 w-3" />
          PLUS
        </Badge>
      )}
      {/* FREE badge */}
      {isFree && !isLocked && !requiresSubscription && (
        <Badge className="absolute -top-2.5 -left-2 z-30 bg-green-500 hover:bg-green-500 text-white rounded-full text-xs shadow-sm">
          FREE
        </Badge>
      )}

      <button
        className="overflow-hidden cursor-pointer transition-all active:scale-[0.98] w-full text-left rounded-2xl shadow-lg border border-border/50"
        onClick={handleClick}
      >
        {/* Title Header Section */}
        <div className="px-3 py-3 rounded-t-2xl h-[3.75rem] flex items-start bg-muted/50">
          <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
            {name}
          </h3>
        </div>

        {/* Square Image Container */}
        <div className="relative aspect-square w-full overflow-hidden">
          {coverImageUrl ? (
            <CachedImage
              src={coverImageUrl}
              alt={name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Music className="h-16 w-16 text-primary/40" />
            </div>
          )}

          {/* Lock overlay */}
          {isLocked && !isFree && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          {/* Bottom info bar */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6">
            <div className="flex items-center justify-between text-[11px] text-white/90">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <Music className="h-3 w-3" />
                  {trackCount}
                </span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {formatDuration(totalDuration)}
                </span>
                {language && language !== 'all' && (
                  language === 'persian'
                    ? <PersianFlag size={10} />
                    : LANG_FLAGS[language] && <span className="text-[10px] flex-shrink-0 leading-none">{LANG_FLAGS[language]}</span>
                )}
              </div>
              {(!isLocked || isFree) && progressPercentage > 0 ? (
                <span className="flex items-center gap-0.5 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  {Math.round(progressPercentage)}%
                </span>
              ) : (requiresSubscription && !isSubscribed) ? (
                <FluentEmoji emoji="🔒" size={14} />
              ) : null}
            </div>
          </div>

          {/* Progress bar */}
          {(!isLocked || isFree) && progressPercentage > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}

        </div>

        {/* Enroll CTA for locked playlists */}
        {isLocked && !isFree && programSlug && (
          <div className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-foreground text-background text-xs font-medium rounded-b-2xl">
            <span>Tap to enroll</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        )}
      </button>
    </div>
  );
});
