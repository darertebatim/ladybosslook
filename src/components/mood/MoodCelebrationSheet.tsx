import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';

interface MoodData {
  value: string;
  emoji: string;
  label: string;
  bgColor: string;
  celebrationText: string;
}

const MOOD_CONFIG: Record<string, MoodData> = {
  great: {
    value: 'great',
    emoji: '😄',
    label: 'Great',
    bgColor: 'bg-yellow-100',
    celebrationText: 'Amazing! You feel great!',
  },
  good: {
    value: 'good',
    emoji: '🙂',
    label: 'Good',
    bgColor: 'bg-green-100',
    celebrationText: "Nice! You're feeling good!",
  },
  okay: {
    value: 'okay',
    emoji: '😐',
    label: 'Okay',
    bgColor: 'bg-blue-100',
    celebrationText: "You're feeling okay.",
  },
  not_great: {
    value: 'not_great',
    emoji: '😔',
    label: 'Not Great',
    bgColor: 'bg-purple-100',
    celebrationText: "It's okay to feel not great.",
  },
  bad: {
    value: 'bad',
    emoji: '😢',
    label: 'Bad',
    bgColor: 'bg-red-100',
    celebrationText: "It's okay to have tough days.",
  },
};

interface MoodCelebrationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mood: string | null;
  onDone: () => void;
}

export function MoodCelebrationSheet({
  open,
  onOpenChange,
  mood,
  onDone,
}: MoodCelebrationSheetProps) {
  const navigate = useNavigate();
  const moodData = mood ? MOOD_CONFIG[mood] : null;

  const handleWriteJournal = () => {
    haptic.medium();
    onOpenChange(false);
    // Navigate to new journal entry with mood pre-selected
    navigate(`/app/journal/new?mood=${mood}`);
  };

  const handleDone = () => {
    haptic.light();
    onOpenChange(false);
    onDone();
  };

  if (!moodData) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className={cn(
          "rounded-t-3xl border-0 px-6 pt-8 pb-10",
          moodData.bgColor
        )}
        style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Emoji */}
        <div className="flex justify-center mb-6">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center",
            moodData.bgColor.replace('100', '200')
          )}>
            <FluentEmoji emoji={moodData.emoji} size={64} />
          </div>
        </div>

        {/* Celebration Text */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-bold text-foreground">
            {moodData.celebrationText}
          </h2>
          <p className="text-base text-foreground/70">
            Would you like to write about it in your journal?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleWriteJournal}
            className="w-full h-14 rounded-full bg-foreground text-background hover:bg-foreground/90 text-lg font-semibold"
          >
            Write in Journal ✍️
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleDone}
            className="w-full h-12 rounded-full text-foreground/70 hover:bg-foreground/10 text-base"
          >
            Maybe later
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
