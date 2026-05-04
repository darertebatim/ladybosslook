import { memo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Clock, Video, Lock, CheckCircle2, ChevronRight, Crown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { haptic } from '@/lib/haptics';
import { PersianFlag } from '@/components/ui/PersianFlag';
import { CachedImage } from '@/components/ui/CachedImage';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

const LANG_FLAGS: Record<string, string> = {
  all: '🌐', american: '🇺🇸', turkish: '🇹🇷', spanish: '🇪🇸',
};

interface VideoPlaylistCardProps {
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

export const VideoPlaylistCard = memo(function VideoPlaylistCard({
  id, name, coverImageUrl, language, isFree, isLocked, programSlug,
  requiresSubscription, isSubscribed, trackCount, completedTracks, totalDuration,
}: VideoPlaylistCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.pathname;
  const progress = trackCount > 0 ? (completedTracks / trackCount) * 100 : 0;

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleClick = () => {
    haptic.light();
    if (isFree || requiresSubscription || (!isLocked)) {
      navigate(`/app/watch/playlist/${id}`, { state: { from } });
      return;
    }
    if (isLocked && programSlug) {
      navigate(`/app/course/${programSlug}`, { state: { from } });
    }
  };

  return (
    <div className="relative">
      {requiresSubscription && !isSubscribed && (
        <Badge className="absolute -top-2.5 -left-2 z-30 bg-amber-200 text-amber-700 hover:bg-amber-200 rounded-full text-xs gap-1 shadow-sm">
          <Crown className="h-3 w-3" /> PLUS
        </Badge>
      )}
      {isFree && !isLocked && !requiresSubscription && (
        <Badge className="absolute -top-2.5 -left-2 z-30 bg-green-500 hover:bg-green-500 text-white rounded-full text-xs shadow-sm">FREE</Badge>
      )}

      <button className="overflow-hidden cursor-pointer transition-all active:scale-[0.98] w-full text-left rounded-2xl shadow-lg" onClick={handleClick}>
        {/* Portrait cover image (4:5 aspect ratio for vertical video) */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-2xl">
          {coverImageUrl ? (
            <CachedImage src={coverImageUrl} alt={name} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Video className="h-16 w-16 text-primary/40" />
            </div>
          )}

          {isLocked && !isFree && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          {/* Bottom gradient overlay with info */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2.5 pb-2.5 pt-10">
            <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug mb-1.5">{name}</h3>
            <div className="flex items-center justify-between text-[11px] text-white/90">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5"><Video className="h-3 w-3" />{trackCount}</span>
                <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{formatDuration(totalDuration)}</span>
                {language && language !== 'all' && (
                  language === 'persian' ? <PersianFlag size={10} /> : LANG_FLAGS[language] && <span className="text-[10px]">{LANG_FLAGS[language]}</span>
                )}
              </div>
              {(!isLocked || isFree) && progress > 0 ? (
                <span className="flex items-center gap-0.5 font-medium"><CheckCircle2 className="h-3 w-3" />{Math.round(progress)}%</span>
              ) : (requiresSubscription && !isSubscribed) ? (
                <FluentEmoji emoji="🔒" size={14} />
              ) : null}
            </div>
          </div>

          {/* Progress bar */}
          {(!isLocked || isFree) && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {isLocked && !isFree && programSlug && (
          <div className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-foreground text-background text-xs font-medium rounded-b-2xl">
            <span>Tap to enroll</span><ChevronRight className="h-3.5 w-3.5" />
          </div>
        )}
      </button>
    </div>
  );
});
