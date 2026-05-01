import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { X, Search, BookOpen, NotebookPen, CalendarPlus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JournalPromptMarquee } from '@/components/app/JournalPromptMarquee';
import { Input } from '@/components/ui/input';
import { useJournalEntries } from '@/hooks/useJournal';
import { JournalEntryCard, formatDateGroup } from '@/components/app/JournalEntryCard';
import { JournalSkeleton } from '@/components/app/skeletons/JournalSkeleton';
import { useJournalRoutine } from '@/components/app/JournalReminderSettings';
import { RoutinePreviewSheet } from '@/components/app/RoutinePreviewSheet';
import { BackButton } from '@/components/app/BackButton';
import { SEOHead } from '@/components/SEOHead';
import { JournalTour, TourHelpButton } from '@/components/app/tour';
import { JournalHeaderStats } from '@/components/app/JournalHeaderStats';
import { JournalCalendar } from '@/components/app/JournalCalendar';
import { haptic } from '@/lib/haptics';
import { format, startOfDay, startOfMonth, subDays, isAfter } from 'date-fns';


const calculateMonthlyPresence = (entries: any[]): number => {
  if (!entries || entries.length === 0) return 0;
  const monthStart = startOfMonth(new Date());
  const uniqueDays = new Set<string>();
  entries.forEach(entry => {
    const entryDate = new Date(entry.created_at);
    if (entryDate >= monthStart) {
      uniqueDays.add(format(entryDate, 'yyyy-MM-dd'));
    }
  });
  return uniqueDays.size;
};

const AppJournal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* not available */ }

  const goHome = useCallback(() => {
    if (routinePlayer?.isActive && routinePlayer?.isMinimized) {
      routinePlayer.maximize();
      return;
    }
    navigate('/app/home');
  }, [routinePlayer, navigate]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [startTour, setStartTour] = useState<(() => void) | null>(null);

  const handleTourReady = useCallback((tourStart: () => void) => {
    setStartTour(() => tourStart);
  }, []);

  const handleToggleSearch = useCallback(() => {
    setShowSearch((prev) => {
      const next = !prev;
      if (!next) setSearchQuery('');
      return next;
    });
    haptic.light();
  }, []);

  const { data: entries, isLoading } = useJournalEntries(searchQuery);

  // Routine integration
  const {
    isAdded,
    showRoutineSheet,
    setShowRoutineSheet,
    handleSaveRoutine,
    tasksToShow,
    routineTitle,
    isSaving,
  } = useJournalRoutine();

  const handleRoutineClick = () => {
    haptic.light();
    if (isAdded) {
      goHome();
    } else {
      setShowRoutineSheet(true);
    }
  };

  // Stats
  const stats = useMemo(() => {
    if (!entries) return { totalEntries: 0, daysThisMonth: 0, thisMonth: 0, streak: 0, journalDays: new Set<string>() };
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 30);
    const thisMonth = entries.filter(e => isAfter(new Date(e.created_at), thirtyDaysAgo)).length;

    // Build set of unique journal days
    const journalDays = new Set<string>();
    entries.forEach(entry => {
      journalDays.add(format(startOfDay(new Date(entry.created_at)), 'yyyy-MM-dd'));
    });

    // Calculate streak (consecutive days with entries ending today or yesterday)
    let streak = 0;
    let checkDate = today;
    // Allow streak to start from yesterday if no entry today
    const todayKey = format(today, 'yyyy-MM-dd');
    if (!journalDays.has(todayKey)) {
      checkDate = subDays(today, 1);
    }
    while (journalDays.has(format(checkDate, 'yyyy-MM-dd'))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }

    return {
      totalEntries: entries.length,
      daysThisMonth: calculateMonthlyPresence(entries),
      thisMonth,
      streak,
      journalDays,
    };
  }, [entries]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    if (!entries) return {};
    const groups: Record<string, typeof entries> = {};
    entries.forEach((entry) => {
      const dateKey = format(startOfDay(new Date(entry.created_at)), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(entry);
    });
    return groups;
  }, [entries]);

  const dateKeys = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  // ─── STATS SCREEN ───
  if (showStats) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div
          className="flex items-center justify-between px-4 pb-2"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
        >
          <button onClick={() => setShowStats(false)} className="p-2 -ml-2">
            <X className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">{t('journal.stats')}</h1>
          <div className="w-9" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-safe">
          <JournalHeaderStats
            totalEntries={stats.totalEntries}
            thisMonth={stats.daysThisMonth}
            streak={stats.streak}
          />
          <JournalCalendar journalDays={stats.journalDays} />
        </div>
      </div>
    );
  }

  // ─── LOADING ───
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div
          className="flex items-center justify-between px-4 pb-2"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
        >
          <button onClick={goHome} className="p-2 -ml-2">
            <X className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">{t('journal.myJournal')}</h1>
          <div className="w-9" />
        </div>
        <JournalSkeleton />
      </div>
    );
  }

  // ─── MAIN SCREEN ───
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title={t('journal.seoTitle')} description={t('journal.seoDesc')} />

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <button onClick={goHome} className="p-2 -ml-2">
          <X className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{t('journal.myJournal')}</h1>
        <button onClick={() => { setShowStats(true); haptic.light(); }} className="p-2 -mr-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 7h18" />
            <path d="M8 3v4" />
            <path d="M16 3v4" />
            <rect x="7" y="11" width="3" height="8" rx="0.5" fill="currentColor" stroke="none" />
            <rect x="11.5" y="13" width="3" height="6" rx="0.5" fill="currentColor" stroke="none" />
            <rect x="16" y="15" width="3" height="4" rx="0.5" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 pb-3">
          <Input
            placeholder={t('journal.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            autoFocus
          />
        </div>
      )}

      {/* Scrollable entries */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 pb-32 space-y-6">
          {/* Journaling Prompts — marquee */}
          <JournalPromptMarquee onSelect={(prompt) => {
              haptic.light();
              navigate('/app/journal/new', { state: { prefillTitle: prompt } });
            }} />
          {entries && entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-medium mb-2">{t('journal.startYourJournal')}</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                {t('journal.captureThoughts')}
              </p>
            </div>
          ) : (
            dateKeys.map((dateKey) => (
              <div key={dateKey} className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {formatDateGroup(dateKey)}
                </h2>
                <div className="space-y-3">
                  {groupedEntries[dateKey].map((entry) => (
                    <JournalEntryCard
                      key={entry.id}
                      id={entry.id}
                      title={entry.title}
                      content={entry.content}
                      mood={entry.mood}
                      createdAt={entry.created_at}
                      onClick={() => navigate(`/app/journal/${entry.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom bar — matches timer layout */}
      <div
        className="px-6 pt-4 flex items-center gap-3 bg-background border-t border-border/50"
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={handleToggleSearch}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
            showSearch ? "bg-foreground/10" : "bg-muted"
          )}
        >
          <Search className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          onClick={() => navigate('/app/journal/new')}
          className="tour-new-entry flex-1 h-12 rounded-full bg-foreground text-background font-semibold text-base transition-transform active:scale-[0.97] flex items-center justify-center gap-2"
        >
          <NotebookPen className="h-4 w-4" />
          {t('journal.writeTodaysEntry')}
        </button>

        <button
          onClick={handleRoutineClick}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
            isAdded ? "bg-success/20" : "bg-urgency"
          )}
        >
          {isAdded ? (
            <Check className="h-5 w-5 text-success" />
          ) : (
            <CalendarPlus className="h-5 w-5 text-urgency-foreground" />
          )}
        </button>
      </div>

      {/* Routine Preview Sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={tasksToShow}
        routineTitle={routineTitle}
        defaultTag="Journal"
        onSave={handleSaveRoutine}
        isSaving={isSaving}
      />

      {/* Feature Tour */}
      <JournalTour isFirstVisit={true} onTourReady={handleTourReady} />
    </div>
  );
};

export default AppJournal;
