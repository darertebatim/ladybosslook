import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';

import journalImg from '@/assets/mood-card-journal.png';
import breathingImg from '@/assets/mood-card-breathing.png';
import emotionImg from '@/assets/mood-card-emotion.png';
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
const CALM_BREATHING_ID = '00218ce1-be10-4670-8644-cfdb7fe94c20';

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
    label: 'Name My Emotion',
    image: emotionImg,
    route: '/app/emotion?step=select',
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
  onActionClick?: (route: string) => boolean; // return true to intercept navigation
}

export function MoodCelebrationSheet({
  open,
  onOpenChange,
  mood,
  onDone,
  onActionClick,
}: MoodCelebrationSheetProps) {
  const navigate = useNavigate();
  const moodData = mood ? MOOD_CONFIG[mood] : null;

  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void; completeTask: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* provider not available */ }
  const hasActivePlayer = routinePlayer?.isActive && routinePlayer?.isMinimized;

  const handleAction = (action: typeof ACTIONS[number]) => {
    haptic.medium();
    const route = action.routeKey === 'journal' 
      ? `/app/reflections/free-form?mood=${mood}` 
      : action.route || '/app/home';
    
    // If interceptor returns true, don't navigate yet
    if (onActionClick?.(route)) {
      onOpenChange(false);
      return;
    }
    
    onOpenChange(false);
    navigate(route, { replace: true });
  };

  const handleDone = () => {
    haptic.light();
    onOpenChange(false);
    if (hasActivePlayer) {
      navigate('/app/home');
      routinePlayer!.maximize();
      return;
    }
    if (onActionClick?.('/app/home')) {
      return;
    }
    onDone();
  };

  if (!moodData) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleDone();
        }
        onOpenChange(isOpen);
      }}>
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
          {hasActivePlayer ? 'Continue Routine ▶' : 'Back to Home'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
