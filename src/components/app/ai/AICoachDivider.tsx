import type { CoachMode } from './AICoachHeader';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const MODE_INFO: Record<CoachMode, { labelKey: string; emoji: string; color: string }> = {
  coach: { labelKey: 'aiCoach.modeCoach', emoji: '💪', color: 'text-purple-500 border-purple-200 dark:border-purple-800' },
  assistant: { labelKey: 'aiCoach.modeAssistant', emoji: '📋', color: 'text-blue-500 border-blue-200 dark:border-blue-800' },
  companion: { labelKey: 'aiCoach.modeCompanion', emoji: '💜', color: 'text-pink-500 border-pink-200 dark:border-pink-800' },
};

interface Props {
  mode: CoachMode;
}

export function AICoachDivider({ mode }: Props) {
  const { t } = useTranslation();
  const info = MODE_INFO[mode];

  return (
    <div className="flex items-center gap-3 py-4 animate-fade-in">
      <div className={cn("flex-1 h-px border-t", info.color)} />
      <div className={cn("flex items-center gap-1.5 text-xs font-medium", info.color)}>
        <FluentEmoji emoji={info.emoji} size={14} />
        <span>{t('aiCoach.switchedTo', { mode: t(info.labelKey) })}</span>
      </div>
      <div className={cn("flex-1 h-px border-t", info.color)} />
    </div>
  );
}
