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
    <button
      className={cn(
        "relative w-full text-left rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98]",
        "bg-card shadow-ios",
        tourClass
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3 p-3">
        {/* Square thumbnail */}
        <div className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden">
          {coverImageUrl ? (
            <CachedImage
              src={coverImageUrl}
              alt={name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-bg-warm flex items-center justify-center">
              <Music className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          {/* Lock icon on thumbnail */}
          {isLocked && !isFree && (
            <div className="absolute bottom-1.5 left-1.5">
              <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Lock className="h-3 w-3 text-white/80" />
              </div>
            </div>
          )}

          {/* Progress bar on thumbnail */}
          {(!isLocked || isFree) && progressPercentage > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/15">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          {/* Meta line: category + duration */}
          <div className="flex items-center gap-1.5 text-[11px] text-fg-warm-muted">
            {category && (
              <span className="capitalize">{category}</span>
            )}
            {category && totalDuration > 0 && <span>·</span>}
            {totalDuration > 0 && (
              <span>{formatDuration(totalDuration)}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-fg-warm line-clamp-2 leading-snug">
            {name}
          </h3>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {requiresSubscription && (
              <Badge className="bg-amber-200 text-amber-700 hover:bg-amber-200 rounded-full text-[10px] px-1.5 py-0 gap-0.5 shadow-ios h-4">
                <Crown className="h-2.5 w-2.5" />
                PLUS
              </Badge>
            )}
            {isFree && !isLocked && !requiresSubscription && (
              <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-700 rounded-full text-[10px] px-1.5 py-0 shadow-ios h-4 font-semibold gap-0.5">
                🔥 FREE
              </Badge>
            )}
            {language && language !== 'all' && (
              language === 'persian'
                ? <PersianFlag size={10} />
                : LANG_FLAGS[language] && <span className="text-[10px] flex-shrink-0 leading-none">{LANG_FLAGS[language]}</span>
            )}
            {(!isLocked || isFree) && progressPercentage > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-fg-warm-muted font-medium">
                <CheckCircle2 className="h-3 w-3" />
                {Math.round(progressPercentage)}%
              </span>
            )}
            {(requiresSubscription && !isSubscribed) && (
              <FluentEmoji emoji="🔒" size={12} />
            )}
          </div>
        </div>
      </div>

      {/* Enroll CTA for locked playlists */}
      {isLocked && !isFree && programSlug && (
        <div className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-peach text-brand text-xs font-semibold border-t border-border">
          <span>Tap to enroll</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      )}
    </button>
  );
});
