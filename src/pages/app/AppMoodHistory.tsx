import { useState } from 'react';
import { format } from 'date-fns';
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

const MOOD_LABELS: Record<string, string> = {
  great: 'Great',
  good: 'Good',
  okay: 'Okay',
  not_great: 'Not Great',
  bad: 'Bad',
};

const MOOD_BG: Record<string, string> = {
  great: 'bg-yellow-100',
  good: 'bg-green-100',
  okay: 'bg-blue-100',
  not_great: 'bg-purple-100',
  bad: 'bg-red-100',
};

export default function AppMoodHistory() {
  const [selectedDay, setSelectedDay] = useState<{ date: Date; mood: MoodDay } | null>(null);

  const handleDaySelect = (date: Date, mood: MoodDay | undefined) => {
    if (mood) {
      setSelectedDay({ date, mood });
    }
  };

  return (
    <>
      <SEOHead 
        title="Mood History | Simora"
        description="View your mood tracking history"
      />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
        {/* Header */}
        <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 bg-gradient-to-br from-amber-50/95 to-yellow-50/95 dark:from-amber-950/90 dark:to-yellow-950/90 backdrop-blur-sm">
          <BackButton to="/app/mood" />
          <h1 className="text-xl font-semibold flex-1">Mood History</h1>
        </header>

        {/* Content */}
        <div className="px-4 pb-8 space-y-4">
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
                    Feeling {MOOD_LABELS[selectedDay.mood.mood] || selectedDay.mood.mood}
                    {selectedDay.mood.count > 1 && ` • ${selectedDay.mood.count} check-ins`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Mood Legend</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MOOD_LABELS).map(([value, label]) => (
                <div key={value} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50">
                  <FluentEmoji emoji={MOOD_EMOJI[value]} size={16} />
                  <span className="text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
