import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronRight, Play, Sparkles } from 'lucide-react';
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
      to={`/app/course/${enrollment.program_slug}`}
      onClick={onView}
      className="block"
    >
      <div className={`relative w-[280px] h-[140px] rounded-xl overflow-hidden shadow-md transition-transform active:scale-[0.98] ${
        isUnseen ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}>
        {/* Background */}
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={enrollment.course_name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        
        {/* Content */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between">
          {/* Top: Badges */}
          <div className="flex items-center gap-2">
            {isUnseen && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                New
              </Badge>
            )}
            <Badge 
              className={`text-[10px] px-1.5 py-0.5 ${
                isActive 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/20 text-white backdrop-blur-sm'
              }`}
            >
              {round.status}
            </Badge>
          </div>
          
          {/* Bottom: Info */}
          <div className="space-y-0.5">
            {/* Course name */}
            <h3 className="text-white font-semibold text-[13px] line-clamp-1">
              {enrollment.course_name}
            </h3>
            
            {/* Round name + View schedule link */}
            <div className="flex items-center gap-1 text-[11px] text-white/70">
              <span className="truncate">{round.round_name}</span>
              <span>•</span>
              <span className="flex items-center whitespace-nowrap">
                View schedule
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
            
            {/* Next session info */}
            {displayDate && (
              <p className={`text-[11px] ${isSessionToday ? 'text-green-300' : 'text-white/80'}`}>
                {isSessionToday 
                  ? `Your next session: Today at ${format(new Date(displayDate), 'h:mm a')}`
                  : isUpcoming 
                    ? `Starts: ${format(new Date(displayDate), 'EEE, MMM d • h:mm a')}`
                    : `Your next session: ${format(new Date(displayDate), 'EEE, MMM d • h:mm a')}`
                }
              </p>
            )}
            
            {/* Important note (if exists) */}
            {importantNote && (
              <div className="flex items-center gap-1 text-[10px] text-amber-300">
                <AlertCircle className="h-2.5 w-2.5 flex-shrink-0" />
                <span className="line-clamp-1">{importantNote}</span>
              </div>
            )}
          </div>
        </div>

        {/* Play icon overlay */}
        {thumbnailUrl && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40">
            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="h-4 w-4 text-black ml-0.5" fill="black" />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
