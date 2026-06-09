import { GraduationCap, ChevronRight } from 'lucide-react';
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
    <div className="relative pl-[60px] mb-3">
      {/* Checkpoint dot (matches InlinePathRow) */}
      <div
        className="absolute left-[22px] top-4 w-[26px] h-[26px] rounded-full flex items-center justify-center"
        style={{ background: '#FFFFFF', border: '2px solid #F5DCC8' }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FFD2A1' }} />
      </div>

      <Link
        to={`/app/myprograms/${enrollment.program_slug}${round?.id ? `/${round.id}` : ''}`}
        onClick={onView}
        className={cn(
          'w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-2xl active:scale-[0.99] transition-transform',
          isUnseen && 'ring-2 ring-brand'
        )}
        style={{ background: '#FFFFFF', border: '1px solid #F5DCC8' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: '#FFE6C9' }}
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
            <GraduationCap className="h-5 w-5" style={{ color: '#8B6E5A' }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] font-bold uppercase tracking-wider truncate"
            style={{ color: isActive ? '#EB5E33' : '#8B6E5A' }}
          >
            {isActive ? 'Active Program' : round.status}
          </div>
          <div
            className="text-[13.5px] font-semibold leading-tight mt-0.5 truncate"
            style={{ color: '#2D1A0E' }}
          >
            {enrollment.course_name}
          </div>
          {displayDate && (
            <div
              className="text-[11px] mt-0.5 truncate"
              style={{ color: isSessionToday ? '#EB5E33' : '#8B6E5A' }}
            >
              {isSessionToday
                ? `Today · ${format(new Date(displayDate), 'h:mm a')}`
                : isUpcoming
                  ? format(new Date(displayDate), 'MMM d')
                  : format(new Date(displayDate), 'MMM d · h:mm a')}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#8B6E5A' }} />
      </Link>
    </div>
  );
}
