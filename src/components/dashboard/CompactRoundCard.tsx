import { Badge } from '@/components/ui/badge';
import { Calendar, Play, Sparkles } from 'lucide-react';
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        
        {/* Content */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
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
          <div className="space-y-1">
            <h3 className="text-white font-semibold text-sm line-clamp-1">
              {enrollment.course_name}
            </h3>
            <p className="text-white/80 text-xs">
              {round.round_name}
            </p>
            
            {displayDate && (
              <div className={`flex items-center gap-1.5 text-xs ${
                isSessionToday ? 'text-green-300' : 'text-white/70'
              }`}>
                <Calendar className="h-3 w-3" />
                <span>
                  {isSessionToday 
                    ? `Today at ${format(new Date(displayDate), 'h:mm a')}`
                    : isUpcoming 
                      ? `Starts ${format(new Date(displayDate), 'MMM d')}`
                      : format(new Date(displayDate), 'MMM d • h:mm a')
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Play icon overlay */}
        {thumbnailUrl && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="h-5 w-5 text-black ml-0.5" fill="black" />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
