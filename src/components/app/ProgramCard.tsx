import { CheckCircle2, BookOpen, Users, UserCheck, Headphones, Video, Calendar, Sparkles, Dumbbell, Waves, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const LANG_FLAGS: Record<string, string> = {
  all: '🌐',
  american: '🇺🇸',
  persian: '🦁',
  turkish: '🇹🇷',
  spanish: '🇪🇸',
};

interface ProgramCardProps {
  title: string;
  image?: string;
  type?: string;
  language?: string;
  isFree?: boolean;
  isEnrolled?: boolean;
  onClick?: () => void;
}

const typeConfig: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  'course': { label: 'Course', icon: BookOpen, color: 'bg-purple-500' },
  'group-coaching': { label: 'Coaching', icon: Users, color: 'bg-pink-500' },
  '1o1-session': { label: '1-on-1', icon: UserCheck, color: 'bg-blue-500' },
  'audiobook': { label: 'Audiobook', icon: Headphones, color: 'bg-amber-500' },
  'meditate': { label: 'Meditate', icon: Sparkles, color: 'bg-teal-500' },
  'workout': { label: 'Workout', icon: Dumbbell, color: 'bg-rose-500' },
  'soundscape': { label: 'Soundscape', icon: Waves, color: 'bg-blue-400' },
  'affirmations': { label: 'Affirmations', icon: Heart, color: 'bg-pink-400' },
  'webinar': { label: 'Webinar', icon: Video, color: 'bg-green-500' },
  'event': { label: 'Event', icon: Calendar, color: 'bg-rose-500' },
};

export const ProgramCard = ({
  title,
  image,
  type,
  language,
  isFree,
  isEnrolled,
  onClick,
}: ProgramCardProps) => {
  const typeInfo = type ? typeConfig[type] : null;
  const TypeIcon = typeInfo?.icon || Sparkles;

  return (
    <button
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden w-full aspect-square active:scale-[0.98] transition-transform duration-150 shadow-lg group"
    >
      {/* Cover Image */}
      {image ? (
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          <TypeIcon className="h-16 w-16 text-primary/40" />
        </div>
      )}

      {/* Full gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Top Right: Language flag + Enrolled badge */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        {language && LANG_FLAGS[language] && (
          <span className="text-sm bg-white/80 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
            {LANG_FLAGS[language]}
          </span>
        )}
        {isEnrolled && (
          <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs rounded-full">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Enrolled
          </Badge>
        )}
      </div>

      {/* FREE Badge - Top Left */}
      {isFree && !isEnrolled && (
        <Badge className="absolute top-2 left-2 bg-primary hover:bg-primary text-primary-foreground text-xs rounded-full z-10">
          FREE
        </Badge>
      )}

      {/* Type Badge - Top Left (if not free) */}
      {typeInfo && !isFree && !isEnrolled && (
        <Badge className={`absolute top-2 left-2 ${typeInfo.color} text-white text-xs rounded-full z-10`}>
          <TypeIcon className="h-3 w-3 mr-1" />
          {typeInfo.label}
        </Badge>
      )}

      {/* Title & Type Overlay - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <h3 className="font-semibold text-white text-sm line-clamp-2 drop-shadow-md text-left">
          {title}
        </h3>
        {typeInfo && (
          <p className="text-xs text-white/70 mt-1 text-left flex items-center gap-1">
            <TypeIcon className="h-3 w-3" />
            {typeInfo.label}
          </p>
        )}
      </div>
    </button>
  );
};
