import { useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/app/BackButton';
import { MoodCalendar } from '@/components/mood/MoodCalendar';
import { SEOHead } from '@/components/SEOHead';
import { MoodDay } from '@/hooks/useMoodLogs';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { cn } from '@/lib/utils';

// Mood to emoji mapping
const MOOD_EMOJI: Record<string, string> = {
  great: '😄',
  good: '🙂',
  okay: '😐',
  not_great: '😔',
  bad: '😢',
};

const MOOD_KEYS = ['great', 'good', 'okay', 'not_great', 'bad'] as const;

const MOOD_BG: Record<string, string> = {
  great: 'bg-yellow-100',
  good: 'bg-green-100',
  okay: 'bg-blue-100',
  not_great: 'bg-purple-100',
  bad: 'bg-red-100',
};

export default function AppMoodHistory() {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState<{ date: Date; mood: MoodDay } | null>(null);

  const handleDaySelect = (date: Date, mood: MoodDay | undefined) => {
    if (mood) {
      setSelectedDay({ date, mood });
    }
  };

  return (
    <>
      <SEOHead 
        title={t('moodPage.historySeoTitle')}
        description={t('moodPage.historySeoDescription')}
      />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
        {/* Header */}
        <header 
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-amber-50/95 to-yellow-50/95 dark:from-amber-950/90 dark:to-yellow-950/90 backdrop-blur-sm"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton to="/app/mood" />
            <h1 className="text-xl font-semibold flex-1">{t('moodPage.history')}</h1>
          </div>
        </header>

        {/* Spacer for fixed header */}
        <div style={{ height: 'calc(52px + env(safe-area-inset-top, 0px))' }} />

        {/* Content */}
        <div className="px-4 pb-safe space-y-4">
          {/* Calendar */}
          <MoodCalendar onDaySelect={handleDaySelect} />

          {/* Selected Day Details */}
          {selectedDay && (
            <div className={cn(
              'rounded-2xl p-4 border border-border/50',
              MOOD_BG[selectedDay.mood.mood] || 'bg-muted'
            )}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
                  <FluentEmoji emoji={MOOD_EMOJI[selectedDay.mood.mood] || '😐'} size={32} />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {format(selectedDay.date, 'EEEE, MMMM d')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('moodPage.feeling', { mood: t(`moodPage.moods.${selectedDay.mood.mood}`, { defaultValue: selectedDay.mood.mood }) })}
                    {selectedDay.mood.count > 1 && ` • ${t('moodPage.checkInsCount', { count: selectedDay.mood.count })}`}
                  </p>
                </div>
              </div>

              {selectedDay.mood.entries && selectedDay.mood.entries.length > 0 && (
                <div className="mt-4 space-y-3">
                  {selectedDay.mood.entries
                    .slice()
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((entry) => {
                      const hasSubmoods = (entry.submoods?.length ?? 0) > 0;
                      const hasContexts = (entry.contexts?.length ?? 0) > 0;
                      const hasNote = !!entry.notes?.trim();
                      return (
                        <div key={entry.id} className="rounded-xl bg-white/60 dark:bg-white/5 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <FluentEmoji emoji={MOOD_EMOJI[entry.mood] || '😐'} size={18} />
                            <span className="text-xs font-medium text-foreground/80">
                              {format(new Date(entry.created_at), 'h:mm a')}
                            </span>
                          </div>
                          {hasSubmoods && (
                            <div className="flex flex-wrap gap-1.5">
                              {entry.submoods!.map((s) => (
                                <span key={`s-${s}`} className="text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-white/10 text-foreground/90 font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                          {hasContexts && (
                            <div className="flex flex-wrap gap-1.5">
                              {entry.contexts!.map((c) => (
                                <span key={`c-${c}`} className="text-xs px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/80">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                          {hasNote && (
                            <p className="text-sm text-foreground/80 leading-snug">"{entry.notes}"</p>
                          )}
                          {!hasSubmoods && !hasContexts && !hasNote && (
                            <p className="text-xs text-muted-foreground italic">{t('moodPage.feeling', { mood: t(`moodPage.moods.${entry.mood}`, { defaultValue: entry.mood }) })}</p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="bg-card rounded-2xl p-4 shadow-ios border border-border/50">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('moodPage.moodLegend')}</h3>
            <div className="flex flex-wrap gap-2">
              {MOOD_KEYS.map((value) => (
                <div key={value} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50">
                  <FluentEmoji emoji={MOOD_EMOJI[value]} size={16} />
                  <span className="text-xs font-medium">{t(`moodPage.moods.${value}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
