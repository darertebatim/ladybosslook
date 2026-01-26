import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ChevronRight, Sparkles, Unlock } from 'lucide-react';
import { format, isToday } from 'date-fns';

interface EnrolledProgramCardProps {
  enrollment: {
    id: string;
    course_name: string;
    program_slug: string;
    program_rounds?: {
      id: string;
      round_name: string;
      status: string;
      video_url?: string | null;
      first_session_date?: string | null;
      start_date?: string | null;
      important_message?: string | null;
    } | null;
    status?: string | null;
  };
  isCompleted?: boolean;
  nextSessionDate?: string | null;
  nextContent?: { title: string; countdownText: string } | null;
  hasNotification?: boolean;
  onMarkViewed?: () => void;
}

export const EnrolledProgramCard = memo(function EnrolledProgramCard({
  enrollment,
  isCompleted = false,
  nextSessionDate,
  nextContent,
  hasNotification = false,
  onMarkViewed,
}: EnrolledProgramCardProps) {
  const round = enrollment.program_rounds;
  const isSelfPaced = !round;

  const isUpcoming = round?.status === 'upcoming';
  const isActive = round?.status === 'active';
  
  const displayDate = nextSessionDate || round?.first_session_date;
  const isSessionToday = displayDate && isToday(new Date(displayDate));

  // Get first sentence of important_message
  const importantNote = round?.important_message
    ? round.important_message.split(/[.!?]/)[0]?.trim()
    : null;

  // Get video thumbnail
  let thumbnailUrl = '';
  if (round?.video_url) {
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
      onClick={onMarkViewed}
      className="block"
    >
      <div className={`relative w-full rounded-2xl overflow-hidden shadow-sm border border-border/50 transition-transform active:scale-[0.98] ${
        hasNotification && !isCompleted ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${isCompleted ? 'opacity-75' : ''}`}>
        {/* Background */}
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={enrollment.course_name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={`absolute inset-0 ${
            isCompleted 
              ? 'bg-muted/50 dark:bg-muted/30' 
              : 'bg-violet-50 dark:bg-violet-950/30'
          }`} />
        )}
        
        {/* Overlay - only for thumbnails */}
        {thumbnailUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />}
        
        {/* Content - compact for self-paced */}
        <div className={`relative p-4 flex flex-col justify-between ${isSelfPaced ? 'min-h-[72px]' : 'min-h-[120px]'}`}>
          {/* Top row: Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {hasNotification && !isCompleted && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 h-5">
                <Sparkles className="h-3 w-3 mr-1" />
                Updated
              </Badge>
            )}
            {isCompleted ? (
              <Badge className={`text-[10px] px-2 py-0.5 h-5 ${
                thumbnailUrl 
                  ? 'bg-white/20 text-white backdrop-blur-sm' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            ) : round ? (
              <Badge 
                className={`text-[10px] px-2 py-0.5 h-5 ${
                  isActive 
                    ? 'bg-green-500 text-white' 
                    : thumbnailUrl
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {round.status}
              </Badge>
            ) : (
              <Badge className={`text-[10px] px-2 py-0.5 h-5 ${
                thumbnailUrl 
                  ? 'bg-white/20 text-white backdrop-blur-sm' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                Self-Paced
              </Badge>
            )}
          </div>
          
          {/* Bottom content */}
          <div className="space-y-1">
            {/* Course name */}
            <h3 className={`font-bold text-base leading-tight line-clamp-1 ${thumbnailUrl ? 'text-white' : 'text-foreground'}`}>
              {enrollment.course_name}
            </h3>
            
            {/* Round name + View schedule link - only for cohort-based */}
            {round && (
              <div className={`flex items-center gap-1.5 text-xs ${thumbnailUrl ? 'text-white/80' : 'text-muted-foreground'}`}>
                <span className="truncate">{round.round_name}</span>
                <span>•</span>
                <span className={`flex items-center whitespace-nowrap font-medium ${thumbnailUrl ? 'text-white' : 'text-primary'}`}>
                  View schedule
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            )}
            
            {/* Next session info - only for cohort-based */}
            {!isCompleted && displayDate && (
              <p className={`text-xs font-medium ${
                isSessionToday 
                  ? (thumbnailUrl ? 'text-green-400' : 'text-green-600 dark:text-green-400')
                  : (thumbnailUrl ? 'text-white/90' : 'text-muted-foreground')
              }`}>
                {isSessionToday 
                  ? `Next: Today at ${format(new Date(displayDate), 'h:mm a')}`
                  : isUpcoming 
                    ? `Starts: ${format(new Date(displayDate), 'EEE, MMM d • h:mm a')}`
                    : `Next: ${format(new Date(displayDate), 'EEE, MMM d • h:mm a')}`
                }
              </p>
            )}
            
            {/* Next content unlock info - only for cohort-based */}
            {!isCompleted && nextContent && (
              <div className={`flex items-center gap-1.5 text-[11px] ${thumbnailUrl ? 'text-cyan-300' : 'text-cyan-600 dark:text-cyan-400'}`}>
                <Unlock className="h-3 w-3 flex-shrink-0" />
                <span className="line-clamp-1">
                  {nextContent.title} unlocks {nextContent.countdownText}
                </span>
              </div>
            )}
            
            {/* Important note (if exists) - only for cohort-based */}
            {!isCompleted && importantNote && (
              <div className={`flex items-center gap-1.5 text-[11px] ${thumbnailUrl ? 'text-amber-300' : 'text-amber-600 dark:text-amber-400'}`}>
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span className="line-clamp-1">{importantNote}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});
