import { format } from 'date-fns';
import type { EmotionLog } from '@/hooks/useEmotionLogs';
import type { Valence } from '@/lib/emotionData';
import { cn } from '@/lib/utils';

interface EmotionLogCardProps {
  log: EmotionLog;
  compact?: boolean;
  onDelete?: (id: string) => void;
}

// Get emoji based on valence
const getValenceEmoji = (valence: Valence): string => {
  switch (valence) {
    case 'pleasant':
      return '😊';
    case 'neutral':
      return '😐';
    case 'unpleasant':
      return '😔';
    default:
      return '💭';
  }
};

// Get valence color classes
const getValenceColors = (valence: Valence) => {
  switch (valence) {
    case 'pleasant':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        badge: 'bg-amber-500/20 text-amber-700',
      };
    case 'neutral':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        badge: 'bg-slate-500/20 text-slate-700',
      };
    case 'unpleasant':
      return {
        bg: 'bg-violet-100',
        text: 'text-violet-700',
        badge: 'bg-violet-500/20 text-violet-700',
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        badge: 'bg-gray-500/20 text-gray-700',
      };
  }
};

// Parse emotion string (can be comma-separated for multiple emotions)
const parseEmotions = (emotionStr: string): string[] => {
  return emotionStr.split(',').map(e => e.trim()).filter(Boolean);
};

// Capitalize first letter
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
};

export const EmotionLogCard = ({ log, compact = false, onDelete }: EmotionLogCardProps) => {
  const valence = log.valence as Valence;
  const colors = getValenceColors(valence);
  const emoji = getValenceEmoji(valence);
  const emotions = parseEmotions(log.emotion);
  const emotionDisplay = emotions.map(capitalize).join(', ');
  const timeDisplay = format(new Date(log.created_at), 'h:mm a');
  
  if (compact) {
    // Compact version for dashboard
    return (
      <div className="flex items-center gap-2 text-white/90">
        <span className="text-lg">{emoji}</span>
        <span className="flex-1 text-sm truncate">{emotionDisplay}</span>
        <span className="text-xs text-white/60">{timeDisplay}</span>
      </div>
    );
  }

  // Full card version for history
  return (
    <div className={cn(
      "rounded-xl p-4 mb-3",
      colors.bg
    )}>
      <div className="flex items-start gap-3">
        {/* Emoji */}
        <div className="text-2xl shrink-0">{emoji}</div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Emotions */}
          <p className={cn("font-medium", colors.text)}>
            {emotionDisplay}
          </p>
          
          {/* Category badge */}
          <span className={cn(
            "inline-block text-xs px-2 py-0.5 rounded-full mt-1",
            colors.badge
          )}>
            {capitalize(log.category)}
          </span>
          
          {/* Context tags */}
          {log.contexts && log.contexts.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {log.contexts.map((context) => (
                <span 
                  key={context}
                  className="text-xs px-2 py-0.5 rounded-full bg-white/60 text-gray-600"
                >
                  {capitalize(context)}
                </span>
              ))}
            </div>
          )}
          
          {/* Notes */}
          {log.notes && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {log.notes}
            </p>
          )}
        </div>
        
        {/* Time */}
        <div className="text-xs text-gray-500 shrink-0">
          {timeDisplay}
        </div>
      </div>
    </div>
  );
};
