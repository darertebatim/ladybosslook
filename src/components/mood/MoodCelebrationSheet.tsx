import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';

import journalImg from '@/assets/mood-card-journal.png';
import breathingImg from '@/assets/mood-card-breathing.png';
import planImg from '@/assets/mood-card-plan.png';
import talkImg from '@/assets/mood-card-talk.png';

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

// Calm Breathing exercise ID
const CALM_BREATHING_ID = 'd5f63835-1fe7-4ae3-b4e2-543b64855a6b';

const ACTIONS = [
  {
    label: 'Write in Journal',
    image: journalImg,
    routeKey: 'journal',
  },
  {
    label: 'Calm Breathing',
    image: breathingImg,
    route: `/app/breathe?exercise=${CALM_BREATHING_ID}`,
  },
  {
    label: 'Start My Plan',
    image: planImg,
    route: '/app/home',
  },
  {
    label: 'Talk it Out',
    image: talkImg,
    route: '/app/channels',
  },
];

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

  const handleAction = (action: typeof ACTIONS[number]) => {
    haptic.medium();
    onOpenChange(false);
    if (action.routeKey === 'journal') {
      navigate(`/app/journal/new?mood=${mood}`);
    } else if (action.route) {
      navigate(action.route);
    }
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
          "rounded-t-3xl border-0 px-5 pt-8 pb-6",
          moodData.bgColor
        )}
        style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Header: Emoji + Text */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mb-3",
            moodData.bgColor.replace('100', '200')
          )}>
            <FluentEmoji emoji={moodData.emoji} size={40} />
          </div>
          <p className="text-sm font-medium text-foreground/50 mb-1">
            {moodData.celebrationText}
          </p>
          <h2 className="text-xl font-bold text-foreground leading-snug">
            Something may Help you<br />feel Stronger
          </h2>
        </div>

        {/* 2×2 Cards with illustrations */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleAction(action)}
              className={cn(
                "flex flex-col items-center rounded-2xl p-3 pt-4",
                "bg-background/90 backdrop-blur-sm",
                "active:scale-[0.96] transition-all",
              )}
            >
              <img 
                src={action.image} 
                alt={action.label}
                className="w-24 h-24 object-contain mb-2"
              />
              <span className="text-sm font-semibold text-foreground text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Maybe later */}
        <Button
          variant="ghost"
          onClick={handleDone}
          className="w-full h-10 rounded-full text-foreground/40 hover:bg-foreground/5 text-sm"
        >
          Maybe later
        </Button>
      </SheetContent>
    </Sheet>
  );
}
