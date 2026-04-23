import { Badge } from '@/components/ui/badge';
import { Sparkles, GraduationCap } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Link } from 'react-router-dom';
import { CachedImage } from '@/components/ui/CachedImage';
import { cn } from '@/lib/utils';

// Mirrors FeaturedRoutineCard `colorBackgrounds` palette
const PROGRAM_CARD_BACKGROUNDS: string[] = [
  'bg-purple-50 border-purple-200/60',
  'bg-sky-50 border-sky-200/60',
  'bg-teal-50 border-teal-200/60',
  'bg-orange-50 border-orange-200/60',
  'bg-pink-50 border-pink-200/60',
  'bg-lime-50 border-lime-200/60',
  'bg-amber-50 border-amber-200/60',
];

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

  const paletteClass = PROGRAM_CARD_BACKGROUNDS[colorIndex % PROGRAM_CARD_BACKGROUNDS.length];

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
      <div className={cn(
        "relative w-[280px] rounded-2xl overflow-hidden shadow-sm transition-transform active:scale-[0.98] border",
        paletteClass,
        isUnseen && "ring-2 ring-primary ring-offset-2"
      )}>
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
                    ? 'bg-emerald-500 text-white hover:bg-emerald-500'
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
                  isSessionToday ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground/70'
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
