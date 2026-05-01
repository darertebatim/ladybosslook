import { FluentEmoji } from '@/components/ui/FluentEmoji';
import type { CoachMode } from './AICoachHeader';
import { useTranslation } from 'react-i18next';

const QUICK_CHIPS: Record<CoachMode, { emoji: string; labelKey: string; promptKey: string }[]> = {
  coach: [
    { emoji: '✨', labelKey: 'aiCoach.chipSuggestRoutine', promptKey: 'aiCoach.chipSuggestRoutinePrompt' },
    { emoji: '🔄', labelKey: 'aiCoach.chipReviewHabits', promptKey: 'aiCoach.chipReviewHabitsPrompt' },
    { emoji: '🌅', labelKey: 'aiCoach.chipMorningRoutine', promptKey: 'aiCoach.chipMorningRoutinePrompt' },
    { emoji: '📈', labelKey: 'aiCoach.chipWhatsWorking', promptKey: 'aiCoach.chipWhatsWorkingPrompt' },
  ],
  assistant: [
    { emoji: '📋', labelKey: 'aiCoach.chipPlanDay', promptKey: 'aiCoach.chipPlanDayPrompt' },
    { emoji: '🎯', labelKey: 'aiCoach.chipAddTask', promptKey: 'aiCoach.chipAddTaskPrompt' },
    { emoji: '⏰', labelKey: 'aiCoach.chipTimeBlock', promptKey: 'aiCoach.chipTimeBlockPrompt' },
    { emoji: '✅', labelKey: 'aiCoach.chipWhatsLeft', promptKey: 'aiCoach.chipWhatsLeftPrompt' },
  ],
  companion: [
    { emoji: '💭', labelKey: 'aiCoach.chipHowAmI', promptKey: 'aiCoach.chipHowAmIPrompt' },
    { emoji: '😮‍💨', labelKey: 'aiCoach.chipStressed', promptKey: 'aiCoach.chipStressedPrompt' },
    { emoji: '📝', labelKey: 'aiCoach.chipJournalPrompt', promptKey: 'aiCoach.chipJournalPromptText' },
    { emoji: '🫁', labelKey: 'aiCoach.chipBreathe', promptKey: 'aiCoach.chipBreathePrompt' },
  ],
};

const MODE_GREETINGS: Record<CoachMode, { titleKey: string; subtitleKey: string; emoji: string }> = {
  coach: { titleKey: 'aiCoach.greetingCoachTitle', subtitleKey: 'aiCoach.greetingCoachSubtitle', emoji: '💪' },
  assistant: { titleKey: 'aiCoach.greetingAssistantTitle', subtitleKey: 'aiCoach.greetingAssistantSubtitle', emoji: '📋' },
  companion: { titleKey: 'aiCoach.greetingCompanionTitle', subtitleKey: 'aiCoach.greetingCompanionSubtitle', emoji: '💜' },
};

interface Props {
  mode: CoachMode;
  userName?: string;
  onSend: (text: string) => void;
  inline?: boolean;
}

export function AICoachEmptyState({ mode, userName, onSend, inline }: Props) {
  const { t } = useTranslation();
  const greeting = MODE_GREETINGS[mode];
  const chips = QUICK_CHIPS[mode];

  if (inline) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 animate-fade-in">
        <div className="text-center space-y-1">
          <h3 className="flex items-center justify-center gap-1.5 text-sm font-semibold">
            <span>{t(greeting.titleKey)}</span>
            <FluentEmoji emoji={greeting.emoji} size={18} />
          </h3>
          <p className="text-xs text-muted-foreground">{t(greeting.subtitleKey)}</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 w-full max-w-sm">
          {chips.map(chip => (
            <button
              key={chip.labelKey}
              onClick={() => onSend(t(chip.promptKey))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border/50 text-left text-xs font-medium shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 active:scale-[0.98]"
            >
              <FluentEmoji emoji={chip.emoji} size={16} className="shrink-0" />
              <span>{t(chip.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 pb-8 px-4 animate-fade-in">
      {/* Animated AI avatar */}
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center backdrop-blur-sm border border-primary/10">
          <FluentEmoji emoji="✨" size={48} />
        </div>
        <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 animate-pulse blur-xl -z-10" />
      </div>

      <div className="text-center space-y-1.5">
        <h2 className="flex items-center justify-center gap-2 text-lg font-bold">
          <span>{userName ? t('aiCoach.heyName', { name: userName }) : ''}{t(greeting.titleKey)}</span>
          <FluentEmoji emoji={greeting.emoji} size={24} />
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(greeting.subtitleKey)}
        </p>
      </div>

      {/* Floating quick action cards */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {chips.map(chip => (
          <button
            key={chip.labelKey}
            onClick={() => onSend(t(chip.promptKey))}
            className="flex items-center gap-2 px-3 py-3 rounded-2xl bg-card border border-border/50 text-left text-xs font-medium shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 active:scale-[0.98]"
          >
            <FluentEmoji emoji={chip.emoji} size={18} className="shrink-0" />
            <span>{t(chip.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
