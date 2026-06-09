import { Badge } from '@/components/ui/badge';
import { Sparkles, GraduationCap } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Link } from 'react-router-dom';
import { CachedImage } from '@/components/ui/CachedImage';
import { cn } from '@/lib/utils';

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
        style={{ background: 'linear-gradient(160deg, #FFE6C9 0%, #FFD2A1 100%)' }}
      >
        <div className="flex gap-3 p-2">
          {/* Square thumbnail */}
          <div
            className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden"
            style={{ background: '#FFFFFF', boxShadow: '0 6px 14px rgba(0,0,0,0.10)' }}
          >
            {thumbnailUrl ? (
              <CachedImage
                src={thumbnailUrl}
                alt={enrollment.course_name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: '#FFF4ED' }}>
                <GraduationCap className="h-8 w-8" style={{ color: '#8B6E5A' }} />
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
              <span
                className="text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ color: isActive ? '#EB5E33' : '#8B6E5A' }}
              >
                {isActive ? 'Active' : round.status}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-sm line-clamp-2 leading-snug" style={{ color: '#2D1A0E' }}>
              {enrollment.course_name}
            </h3>

            {/* Next session */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {displayDate && (
                <span
                  className="text-[11px] font-medium truncate"
                  style={{ color: isSessionToday ? '#EB5E33' : '#6B4D33' }}
                >
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
