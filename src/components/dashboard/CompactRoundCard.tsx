import { Badge } from '@/components/ui/badge';
import { Sparkles, GraduationCap } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Link } from 'react-router-dom';
import { CachedImage } from '@/components/ui/CachedImage';
import { cn } from '@/lib/utils';
import { pickPeach } from '@/lib/peachPalette';

interface CompactRoundCardProps {
  enrollment: any;
  nextSessionDate?: string | null;
  isUnseen?: boolean;
  onView?: () => void;
  colorIndex?: number;
  programImage?: string | null;
}

export function CompactRoundCard({ 
  enrollment, 
  nextSessionDate,
  isUnseen,
  onView,
  colorIndex = 0,
  programImage,
}: CompactRoundCardProps) {
  const round = enrollment.program_rounds;
  if (!round) return null;

  const isActive = round.status === 'active';
  const isUpcoming = round.status === 'upcoming';
  const displayDate = nextSessionDate || round.first_session_date;
  const isSessionToday = displayDate && isToday(new Date(displayDate));

  const peachBg = pickPeach(enrollment.program_slug || enrollment.id || String(colorIndex));

  // Get video thumbnail
  let thumbnailUrl = programImage || '';
  if (!thumbnailUrl && round.video_url) {
    if (round.video_url.includes('youtube.com/watch')) {
      const videoId = round.video_url.split('v=')[1]?.split('&')[0];
      thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } else if (round.video_url.includes('youtu.be/')) {
      const videoId = round.video_url.split('youtu.be/')[1]?.split('?')[0];
      thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } else if (round.video_url.includes('vimeo.com/')) {
      const videoId = round.video_url.split('vimeo.com/')[1]?.split('?')[0].replace('video/', '');
      thumbnailUrl = `https://vumbnail.com/${videoId}.jpg`;
    }
  }

  return (
    <Link 
      to={`/app/myprograms/${enrollment.program_slug}${round?.id ? `/${round.id}` : ''}`}
      onClick={onView}
      className="block"
    >
      <div
        className={cn(
          "relative w-[280px] rounded-2xl overflow-hidden shadow-ios transition-transform active:scale-[0.98]",
          isUnseen && "ring-2 ring-brand ring-offset-2"
        )}
        style={{ backgroundColor: peachBg }}
      >
        <div className="flex gap-3 p-2">
          {/* Square thumbnail */}
          <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-background/40">
            {thumbnailUrl ? (
              <CachedImage
                src={thumbnailUrl}
                alt={enrollment.course_name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                <GraduationCap className="h-8 w-8 text-foreground/40" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            {/* Badges + round name (above title) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {isUnseen && (
                <Badge className="bg-primary text-primary-foreground rounded-full text-[10px] px-1.5 py-0 h-4 gap-0.5 border-0">
                  <Sparkles className="h-2.5 w-2.5" />
                  New
                </Badge>
              )}
              <Badge
                className={cn(
                  "rounded-full text-[10px] px-1.5 py-0 h-4 border-0 capitalize",
                  isActive
                    ? 'bg-brand text-white hover:bg-brand'
                    : 'bg-foreground/10 text-foreground/70 hover:bg-foreground/10'
                )}
              >
                {round.status}
              </Badge>
              {round.round_name && (
                <span className="text-[11px] text-foreground/80 truncate">{round.round_name}</span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
              {enrollment.course_name}
            </h3>

            {/* Next session */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {displayDate && (
                <span className={cn(
                  "text-[10px] font-medium truncate",
                  isSessionToday ? 'text-brand' : 'text-foreground/70'
                )}>
                  {isSessionToday
                    ? `Today · ${format(new Date(displayDate), 'h:mm a')}`
                    : isUpcoming
                      ? `${format(new Date(displayDate), 'MMM d')}`
                      : `${format(new Date(displayDate), 'MMM d · h:mm a')}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
