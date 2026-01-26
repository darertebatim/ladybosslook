import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronRight, Sparkles } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Link } from 'react-router-dom';

interface CompactRoundCardProps {
  enrollment: any;
  nextSessionDate?: string | null;
  isUnseen?: boolean;
  onView?: () => void;
}

export function CompactRoundCard({ 
  enrollment, 
  nextSessionDate,
  isUnseen,
  onView 
}: CompactRoundCardProps) {
  const round = enrollment.program_rounds;
  if (!round) return null;

  const isActive = round.status === 'active';
  const isUpcoming = round.status === 'upcoming';
  const displayDate = nextSessionDate || round.first_session_date;
  const isSessionToday = displayDate && isToday(new Date(displayDate));

  // Get first sentence of important_message
  const importantNote = round.important_message
    ? round.important_message.split(/[.!?]/)[0]?.trim()
    : null;

  // Get video thumbnail
  let thumbnailUrl = '';
  if (round.video_url) {
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
      to={`/app/course/${enrollment.program_slug}${round?.id ? `/${round.id}` : ''}`}
      onClick={onView}
      className="block"
    >
      <div className={`relative w-[260px] h-[88px] rounded-xl overflow-hidden shadow-sm transition-transform active:scale-[0.98] ring-1 ring-border/60 ${
        isActive 
          ? 'bg-violet-50 dark:bg-violet-950/30' 
          : 'bg-muted/50 dark:bg-muted/30'
      } ${isUnseen ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
        {/* Content */}
        <div className="absolute inset-0 p-2.5 flex flex-col justify-end">
          {/* Course name with badges inline */}
          <div className="flex items-center gap-1.5 mb-0.5">
            {isUnseen && (
              <Badge className="bg-primary text-primary-foreground text-[9px] px-1 py-0 h-4">
                <Sparkles className="h-2 w-2 mr-0.5" />
                New
              </Badge>
            )}
            <Badge 
              className={`text-[9px] px-1 py-0 h-4 ${
                isActive 
                  ? 'bg-green-500 text-white' 
                  : 'bg-muted-foreground/20 text-muted-foreground'
              }`}
            >
              {round.status}
            </Badge>
            <h3 className="text-foreground font-semibold text-[12px] line-clamp-1 flex-1">
              {enrollment.course_name}
            </h3>
          </div>
          
          {/* Round name + View schedule link */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="truncate">{round.round_name}</span>
            <span>•</span>
            <span className="flex items-center whitespace-nowrap text-primary">
              View schedule
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
          
          {/* Next session info */}
          {displayDate && (
            <p className={`text-[10px] ${isSessionToday ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
              {isSessionToday 
                ? `Next: Today at ${format(new Date(displayDate), 'h:mm a')}`
                : isUpcoming 
                  ? `Starts: ${format(new Date(displayDate), 'EEE, MMM d • h:mm a')}`
                  : `Next: ${format(new Date(displayDate), 'EEE, MMM d • h:mm a')}`
              }
            </p>
          )}
          
          {/* Important note (if exists) */}
          {importantNote && (
            <div className="flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-2 w-2 flex-shrink-0" />
              <span className="line-clamp-1">{importantNote}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
