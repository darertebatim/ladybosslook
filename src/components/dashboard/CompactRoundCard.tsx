import { Badge } from '@/components/ui/badge';
import { Calendar, Play, Sparkles, BookOpen } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
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
  const sessionDate = displayDate ? new Date(displayDate) : null;
  const isSessionToday = sessionDate && isToday(sessionDate);
  const isSessionTomorrow = sessionDate && isTomorrow(sessionDate);

  // Get first sentence of important message
  const importantNote = round.important_message;
  const firstSentence = importantNote 
    ? importantNote.split(/[.!?]/)[0]?.trim() + (importantNote.match(/[.!?]/) ? importantNote.match(/[.!?]/)[0] : '')
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

  // Format session date text
  const getSessionText = () => {
    if (!sessionDate) return null;
    if (isSessionToday) {
      return `Today at ${format(sessionDate, 'h:mm a')}`;
    }
    if (isSessionTomorrow) {
      return `Tomorrow at ${format(sessionDate, 'h:mm a')}`;
    }
    if (isUpcoming) {
      return `Starts ${format(sessionDate, 'MMM d')} at ${format(sessionDate, 'h:mm a')}`;
    }
    return `${format(sessionDate, 'EEE, MMM d')} at ${format(sessionDate, 'h:mm a')}`;
  };

  return (
    <Link 
      to={`/app/course/${enrollment.program_slug}`}
      onClick={onView}
      className="block"
    >
      <div className={`relative w-[300px] rounded-xl overflow-hidden shadow-md transition-transform active:scale-[0.98] ${
        isUnseen ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}>
        {/* Top: Image section */}
        <div className="relative h-[100px]">
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
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
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
          
          {/* Course name overlay */}
          <div className="absolute bottom-2 left-3 right-3">
            <h3 className="text-white font-semibold text-sm line-clamp-1">
              {enrollment.course_name}
            </h3>
            <p className="text-white/80 text-xs">
              {round.round_name}
            </p>
          </div>

          {/* Play icon overlay */}
          {thumbnailUrl && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50">
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="h-4 w-4 text-black ml-0.5" fill="black" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Info section */}
        <div className="bg-card p-3 space-y-2">
          {/* Next session */}
          {sessionDate && (
            <div className={`flex items-center gap-2 text-xs font-medium ${
              isSessionToday ? 'text-green-600' : 'text-foreground'
            }`}>
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                {isSessionToday || isSessionTomorrow ? 'Next session: ' : ''}
                {getSessionText()}
              </span>
            </div>
          )}

          {/* Important note excerpt */}
          {firstSentence && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {firstSentence}
            </p>
          )}

          {/* View schedule link */}
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium pt-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>View schedule & materials</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
