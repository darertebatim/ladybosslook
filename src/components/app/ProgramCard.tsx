import { memo } from 'react';
import { CheckCircle2, BookOpen, Users, UserCheck, Headphones, Video, Calendar, Sparkles, Dumbbell, Waves, Heart, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PersianFlag } from '@/components/ui/PersianFlag';
import { CachedImage } from '@/components/ui/CachedImage';

const LANG_FLAGS: Record<string, string> = {
  all: '🌐',
  american: '🇺🇸',
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

const typeConfig: Record<string, { label: string; icon: typeof BookOpen }> = {
  'course': { label: 'Course', icon: BookOpen },
  'group-coaching': { label: 'Coaching', icon: Users },
  '1o1-session': { label: '1-on-1', icon: UserCheck },
  'audiobook': { label: 'Audiobook', icon: Headphones },
  'meditate': { label: 'Meditate', icon: Sparkles },
  'workout': { label: 'Workout', icon: Dumbbell },
  'soundscape': { label: 'Soundscape', icon: Waves },
  'affirmations': { label: 'Affirmations', icon: Heart },
  'webinar': { label: 'Webinar', icon: Video },
  'event': { label: 'Event', icon: Calendar },
  'subscription': { label: 'Club', icon: Sparkles },
};

export const ProgramCard = memo(function ProgramCard({
  title,
  image,
  type,
  language,
  isFree,
  isEnrolled,
  onClick,
}: ProgramCardProps) {
  const typeInfo = type ? typeConfig[type] : null;
  const TypeIcon = typeInfo?.icon || Sparkles;

  return (
    <button
      onClick={onClick}
      className="relative w-full text-left rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98] bg-muted/50 border border-border/50"
    >
      <div className="flex gap-3 p-3">
        {/* Square thumbnail */}
        <div className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden">
          {image ? (
            <CachedImage
              src={image}
              alt={title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <TypeIcon className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          {/* Meta line: type */}
          {typeInfo && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <TypeIcon className="h-3 w-3" />
              <span>{typeInfo.label}</span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
            {title}
          </h3>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {isEnrolled && (
              <Badge className="bg-green-500 hover:bg-green-500 text-white rounded-full text-[10px] px-1.5 py-0 gap-0.5 shadow-sm h-4">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Enrolled
              </Badge>
            )}
            {isFree && !isEnrolled && (
              <Badge className="bg-primary hover:bg-primary text-primary-foreground rounded-full text-[10px] px-1.5 py-0 shadow-sm h-4 font-semibold">
                FREE
              </Badge>
            )}
            {language && language !== 'all' && (
              language === 'persian'
                ? <PersianFlag size={10} />
                : LANG_FLAGS[language] && <span className="text-[10px] flex-shrink-0 leading-none">{LANG_FLAGS[language]}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
});
