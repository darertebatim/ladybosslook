import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { Share2 } from 'lucide-react';
import { useShareContent } from '@/hooks/useShareContent';
import { triggerSoftReview } from '@/lib/appReview';

import journalImg from '@/assets/mood-card-journal.png';
import breathingImg from '@/assets/mood-card-breathing.png';
import reflectImg from '@/assets/mood-card-reflect.png';
import talkImg from '@/assets/mood-card-talk.png';

interface MoodData {
  value: string;
  emoji: string;
  bgColor: string;
}

const MOOD_CONFIG: Record<string, MoodData> = {
  great: { value: 'great', emoji: '😄', bgColor: 'bg-yellow-100' },
  good: { value: 'good', emoji: '🙂', bgColor: 'bg-green-100' },
  okay: { value: 'okay', emoji: '😐', bgColor: 'bg-blue-100' },
  not_great: { value: 'not_great', emoji: '😔', bgColor: 'bg-purple-100' },
  bad: { value: 'bad', emoji: '😢', bgColor: 'bg-red-100' },
};

const ACTIONS = [
  { labelKey: 'moodPage.celebration.actions.journal', image: journalImg, routeKey: 'journal' as const, route: undefined as string | undefined },
  { labelKey: 'moodPage.celebration.actions.breathe', image: breathingImg, route: '/app/breathe', routeKey: undefined as 'journal' | undefined },
  { labelKey: 'moodPage.celebration.actions.reflect', image: reflectImg, route: '/app/reflections', routeKey: undefined as 'journal' | undefined },
  { labelKey: 'moodPage.celebration.actions.talk', image: talkImg, route: '/app/channels', routeKey: undefined as 'journal' | undefined },
];

interface MoodCelebrationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mood: string | null;
  onDone: () => void;
  onActionClick?: (route: string) => boolean; // return true to intercept navigation
  submoods?: string[];
}

export function MoodCelebrationSheet({
  open,
  onOpenChange,
  mood,
  onDone,
  onActionClick,
  submoods,
}: MoodCelebrationSheetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const moodData = mood ? MOOD_CONFIG[mood] : null;
  const moodLabel = mood ? t(`moodPage.moods.${mood}`, { defaultValue: mood }) : '';
  const celebrationText = mood ? t(`moodPage.celebration.${mood}`, { defaultValue: '' }) : '';
  const accentWord = (submoods && submoods.length > 0 ? submoods[0] : moodLabel).toLowerCase();
  const accentColor = mood === 'great' ? '#CA8A04'
    : mood === 'good' ? '#16A34A'
    : mood === 'okay' ? '#2563EB'
    : mood === 'not_great' ? '#9333EA'
    : mood === 'bad' ? '#DC2626'
    : '#000';

  // Fire only for positive moods (great/good) — avoid prompting after negative check-ins
  useEffect(() => {
    if (!open || !mood) return;
    const positive = ['great', 'good', 'amazing', 'happy'];
    if (positive.includes(mood.toLowerCase())) {
      setTimeout(() => triggerSoftReview('mood_positive'), 1500);
    }
  }, [open, mood]);

  const { handleShare } = useShareContent({
    title: t('moodPage.celebration.shareTitle'),
    text: mood
      ? t('moodPage.celebration.shareText', { mood: moodLabel.toLowerCase() })
      : t('moodPage.celebration.shareTextFallback'),
    source: 'mood_checkin',
    contentId: mood ?? undefined,
  });

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
          <p className="text-base font-semibold text-black mb-1">
            {celebrationText}
          </p>
          <h2 className="text-xl font-bold text-foreground leading-snug">
            What's making you feel{' '}
            <span style={{ color: accentColor }}>{accentWord}</span>?
          </h2>
        </div>

        {/* 2×2 Cards with illustrations */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {ACTIONS.map((action) => {
            const label = t(action.labelKey);
            return (
            <button
              key={action.labelKey}
              onClick={() => handleAction(action)}
              className={cn(
                "flex flex-col items-center rounded-2xl p-3 pt-4",
                "bg-background/90 backdrop-blur-sm",
                "active:scale-[0.96] transition-all",
              )}
            >
              <img 
                src={action.image} 
                alt={label}
                className="w-24 h-24 object-contain mb-2"
              />
              <span className="text-sm font-semibold text-foreground text-center leading-tight">
                {label}
              </span>
            </button>
            );
          })}
        </div>

        {/* Maybe later + Share */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => { haptic.light(); handleShare(); }}
            className="h-11 px-4 rounded-full bg-white text-black hover:bg-white/90 text-sm font-semibold shadow-sm"
            aria-label={t('moodPage.celebration.shareAria')}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={handleDone}
            className="flex-1 h-11 rounded-full bg-white text-black hover:bg-white/90 text-sm font-semibold shadow-sm"
          >
            {hasActivePlayer ? t('moodPage.celebration.continueRoutine') : t('moodPage.celebration.backToHomePlanner')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
