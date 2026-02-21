import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { BookOpen, Wind, ListChecks, MessageCircle } from 'lucide-react';
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

// Calm Breathing exercise ID (passed as query param)
const CALM_BREATHING_ID = 'd5f63835-1fe7-4ae3-b4e2-543b64855a6b';

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

  const handleAction = (route: string) => {
    haptic.medium();
    onOpenChange(false);
    navigate(route);
  };

  const handleDone = () => {
    haptic.light();
    onOpenChange(false);
    onDone();
  };

  if (!moodData) return null;

  const actions = [
    {
      icon: BookOpen,
      label: 'Write in Journal',
      description: 'Express your thoughts',
      route: `/app/journal/new?mood=${mood}`,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      icon: Wind,
      label: 'Calm Breathing',
      description: 'Take a moment to breathe',
      route: `/app/breathe?exercise=${CALM_BREATHING_ID}`,
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
    },
    {
      icon: ListChecks,
      label: 'Start My Plan',
      description: 'Check off your rituals',
      route: '/app/home',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: MessageCircle,
      label: 'Talk it Out',
      description: 'Connect with community',
      route: '/app/channels',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className={cn(
          "rounded-t-3xl border-0 px-5 pt-6 pb-6",
          moodData.bgColor
        )}
        style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Emoji + Celebration Text */}
        <div className="flex items-center gap-4 mb-5">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center shrink-0",
            moodData.bgColor.replace('100', '200')
          )}>
            <FluentEmoji emoji={moodData.emoji} size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground leading-tight">
              {moodData.celebrationText}
            </h2>
            <p className="text-sm text-foreground/60 mt-0.5">
              What would you like to do next?
            </p>
          </div>
        </div>

        {/* 4 Action Cards - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleAction(action.route)}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-2xl",
                "bg-background/80 backdrop-blur-sm",
                "active:scale-[0.97] transition-all",
                "text-left"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                action.iconBg
              )}>
                <action.icon className={cn("h-5 w-5", action.iconColor)} />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground block leading-tight">
                  {action.label}
                </span>
                <span className="text-xs text-foreground/50 leading-tight">
                  {action.description}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Maybe later */}
        <Button
          variant="ghost"
          onClick={handleDone}
          className="w-full h-11 rounded-full text-foreground/50 hover:bg-foreground/5 text-sm"
        >
          Maybe later
        </Button>
      </SheetContent>
    </Sheet>
  );
}
