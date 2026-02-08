import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

// 5-level mood system inspired by Me+ and Finch
// Uses Fluent 3D emoji faces with colored backgrounds
const MOODS = [
  { 
    value: 'great', 
    emoji: '😄', 
    label: 'Great',
    color: 'bg-yellow-100 border-yellow-300',
    selectedColor: 'bg-yellow-200 border-yellow-400 ring-2 ring-yellow-400/50',
  },
  { 
    value: 'good', 
    emoji: '🙂', 
    label: 'Good',
    color: 'bg-green-100 border-green-300',
    selectedColor: 'bg-green-200 border-green-400 ring-2 ring-green-400/50',
  },
  { 
    value: 'okay', 
    emoji: '😐', 
    label: 'Okay',
    color: 'bg-blue-100 border-blue-300',
    selectedColor: 'bg-blue-200 border-blue-400 ring-2 ring-blue-400/50',
  },
  { 
    value: 'not_great', 
    emoji: '😔', 
    label: 'Not Great',
    color: 'bg-purple-100 border-purple-300',
    selectedColor: 'bg-purple-200 border-purple-400 ring-2 ring-purple-400/50',
  },
  { 
    value: 'bad', 
    emoji: '😢', 
    label: 'Bad',
    color: 'bg-red-100 border-red-300',
    selectedColor: 'bg-red-200 border-red-400 ring-2 ring-red-400/50',
  },
];

// Legacy mood mapping for backward compatibility
const LEGACY_MOOD_MAP: Record<string, string> = {
  'happy': 'great',
  'peaceful': 'good',
  'grateful': 'good',
  'motivated': 'great',
  'reflective': 'okay',
  'challenged': 'not_great',
};

interface MoodSelectorProps {
  value: string | null;
  onChange: (mood: string | null) => void;
  className?: string;
  showHeader?: boolean;
}

export const MoodSelector = ({ value, onChange, className, showHeader = true }: MoodSelectorProps) => {
  // Map legacy values to new system
  const normalizedValue = value && LEGACY_MOOD_MAP[value] ? LEGACY_MOOD_MAP[value] : value;
  
  const handleClick = (mood: string) => {
    haptic.selection();
    if (normalizedValue === mood) {
      onChange(null);
    } else {
      onChange(mood);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header question */}
      {showHeader && (
        <p className="text-center text-base font-medium text-foreground">
          How are you feeling?
        </p>
      )}
      
      {/* Mood buttons in a row */}
      <div className="flex justify-center gap-2">
        {MOODS.map((mood) => {
          const isSelected = normalizedValue === mood.value;
          
          return (
            <button
              key={mood.value}
              type="button"
              onClick={() => handleClick(mood.value)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                'border-2 min-w-[56px]',
                isSelected ? mood.selectedColor : mood.color,
                'hover:scale-105 active:scale-95'
              )}
            >
              <FluentEmoji emoji={mood.emoji} size={28} />
              <span className={cn(
                'text-[10px] font-medium leading-tight',
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const getMoodEmoji = (mood: string | null): string => {
  if (!mood) return '';
  // Handle legacy values
  const normalizedMood = LEGACY_MOOD_MAP[mood] || mood;
  const found = MOODS.find((m) => m.value === normalizedMood);
  return found?.emoji || '';
};

export const getMoodLabel = (mood: string | null): string => {
  if (!mood) return '';
  // Handle legacy values
  const normalizedMood = LEGACY_MOOD_MAP[mood] || mood;
  const found = MOODS.find((m) => m.value === normalizedMood);
  return found?.label || '';
};

export const getMoodColor = (mood: string | null): string => {
  if (!mood) return '';
  const normalizedMood = LEGACY_MOOD_MAP[mood] || mood;
  const found = MOODS.find((m) => m.value === normalizedMood);
  return found?.color || '';
};

// Export moods for external use
export const MOOD_OPTIONS = MOODS;
