import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

const MOODS = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'peaceful', emoji: '😌', label: 'Peaceful' },
  { value: 'grateful', emoji: '🙏', label: 'Grateful' },
  { value: 'motivated', emoji: '💪', label: 'Motivated' },
  { value: 'reflective', emoji: '💭', label: 'Reflective' },
  { value: 'challenged', emoji: '😔', label: 'Challenged' },
];

interface MoodSelectorProps {
  value: string | null;
  onChange: (mood: string | null) => void;
  className?: string;
}

export const MoodSelector = ({ value, onChange, className }: MoodSelectorProps) => {
  const handleClick = (mood: string) => {
    haptic.selection();
    if (value === mood) {
      onChange(null);
    } else {
      onChange(mood);
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          type="button"
          onClick={() => handleClick(mood.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all',
            'border hover:bg-accent',
            value === mood.value
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-background border-border text-muted-foreground'
          )}
        >
          <span className="text-lg">{mood.emoji}</span>
          <span className="hidden sm:inline">{mood.label}</span>
        </button>
      ))}
    </div>
  );
};

export const getMoodEmoji = (mood: string | null): string => {
  if (!mood) return '';
  const found = MOODS.find((m) => m.value === mood);
  return found?.emoji || '';
};

export const getMoodLabel = (mood: string | null): string => {
  if (!mood) return '';
  const found = MOODS.find((m) => m.value === mood);
  return found?.label || '';
};
