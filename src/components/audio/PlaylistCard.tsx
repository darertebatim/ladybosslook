import { memo } from 'react';
import { Lock, ChevronRight, Crown, Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { PersianFlag } from '@/components/ui/PersianFlag';
import { CachedImage } from '@/components/ui/CachedImage';
import { HostBadges } from '@/components/app/HostBadges';
import { cn } from '@/lib/utils';

const LANG_FLAGS: Record<string, string> = {
  all: '🌐',
  american: '🇺🇸',
  turkish: '🇹🇷',
  spanish: '🇪🇸',
};

const LANG_LABELS: Record<string, string> = {
  all: 'All',
  american: 'American',
  persian: 'Persian',
  turkish: 'Türkçe',
  spanish: 'Español',
};

// Pastel tile palette (mirrors BrandMock O.* tokens) — keyed by category
const CATEGORY_TILE: Record<string, { bg: string; emoji: string }> = {
  meditate:    { bg: '#F0E3FF', emoji: '🧘‍♀️' }, // lavender
  workout:     { bg: '#FFE6C9', emoji: '💪'   }, // peach
  soundscape:  { bg: '#E2F9F0', emoji: '🌊'   }, // mint
  affirmation: { bg: '#FFE0F5', emoji: '💖'   }, // pink
  audiobook:   { bg: '#F0E3FF', emoji: '📖'   }, // lavender
  course:      { bg: '#FFE0F5', emoji: '🌟'   }, // pink
  podcast:     { bg: '#E2F9F0', emoji: '🎙️'  }, // mint
  default:     { bg: '#FFE6C9', emoji: '🎧'   },
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
  isFollowing?: boolean;
  categoryLabel?: string;
}

export const PlaylistCard = memo(function PlaylistCard({
  id,
  name,
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
  isFollowing,
  categoryLabel,
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
    if (isFree) return navigate(`/app/player/playlist/${id}`, { state: { from } });
    if (requiresSubscription) return navigate(`/app/player/playlist/${id}`, { state: { from } });
    if (isLocked && programSlug) return navigate(`/app/course/${programSlug}`, { state: { from } });
    if (isLocked) return;
    navigate(`/app/player/playlist/${id}`, { state: { from } });
  };

  const tile = CATEGORY_TILE[category || 'default'] || CATEGORY_TILE.default;
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
      <div className="flex items-center gap-3.5 p-2.5">
        {/* 96×96 tile — cover image when present, else solid color + emoji */}
        <div
          className="relative h-[96px] w-[96px] shrink-0 rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ background: tile.bg }}
        >
          {coverImageUrl ? (
            <CachedImage
              src={coverImageUrl}
              alt={name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <FluentEmoji emoji={tile.emoji} size={48} />
          )}

          {isLocked && !isFree && (
            <div className="absolute top-1.5 left-1.5 z-10 h-5 w-5 rounded-full bg-black/55 flex items-center justify-center">
              <Lock className="h-2.5 w-2.5 text-white" />
            </div>
          )}

          {/* Language pill — top right */}
          {language && language !== 'all' && (
            <div className="absolute top-1.5 right-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-md px-1.5 py-0.5">
              {language === 'persian'
                ? <PersianFlag size={12} />
                : LANG_FLAGS[language] && <span className="text-[11px] leading-none">{LANG_FLAGS[language]}</span>}
              <span className="text-[9px] font-semibold text-white leading-none">{LANG_LABELS[language]}</span>
            </div>
          )}

          {/* Category badge — bottom left */}
          {category && (
            <div className="absolute bottom-1.5 left-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-md px-1.5 py-0.5 max-w-[calc(100%-12px)]">
              <span className="text-[10px] leading-none shrink-0">{tile.emoji}</span>
              <span className="text-[9px] font-semibold text-white leading-none capitalize truncate">{categoryLabel || category}</span>
            </div>
          )}

          {(!isLocked || isFree) && progressPercentage > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/15 z-10">
              <div
                className="h-full bg-brand transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {totalDuration > 1 && (
            <div className="flex items-center gap-1.5 text-[12px] text-fg-warm-muted">
              <span>{formatDuration(totalDuration)}</span>
            </div>
          )}

          <h3 className="text-[16px] font-bold leading-tight mt-1 line-clamp-2 text-fg-warm">
            {name}
          </h3>

          <HostBadges
            contentType="playlist"
            contentId={id}
            size="sm"
            prefix="with"
            className="mt-1 text-fg-warm-muted"
          />

          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {isFollowing && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                <Check className="h-3 w-3" /> FOLLOWING
              </span>
            )}
            {requiresSubscription && !isSubscribed && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-700">
                <Crown className="h-3 w-3" /> PLUS
              </span>
            )}
            {isFree && !isLocked && !requiresSubscription && !isSubscribed && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E2F9F0] text-[#065F46]">
                🔥 FREE
              </span>
            )}
            {(!isLocked || isFree) && progressPercentage > 0 && (
              <span className="text-[11px] text-fg-warm-muted font-medium">
                {Math.round(progressPercentage)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Locked CTA footer — peach bg, brand text */}
      {isLocked && !isFree && programSlug && (
        <div className="w-full py-2.5 text-[12px] font-bold flex items-center justify-center gap-1 bg-peach text-brand border-t border-border">
          Tap to enroll <ChevronRight className="h-3.5 w-3.5" />
        </div>
      )}
    </button>
  );
});
