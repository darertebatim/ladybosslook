import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { Menu, Flame, ChevronLeft, ChevronRight, Star, CalendarDays, BookOpen, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompletedDates, useUserStreak } from '@/hooks/useTaskPlanner';
import { useProgramEventDates } from '@/hooks/usePlannerProgramEvents';
import { useNewHomeData } from '@/hooks/useNewHomeData';
import { MonthCalendar } from '@/components/app/MonthCalendar';
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { CompactStatsPills } from '@/components/dashboard/CompactStatsPills';
import { ActiveRoundsCarousel } from '@/components/dashboard/ActiveRoundsCarousel';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { HomeSkeleton } from '@/components/app/skeletons';

const AppHi = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  // Fetch home data for stats and rounds
  const { 
    isLoading: homeLoading,
    listeningMinutes, 
    unreadPosts, 
    completedTracks, 
    journalStreak,
    activeRounds,
    nextSessionMap 
  } = useNewHomeData();

  // Fetch streak data
  const { data: streak } = useUserStreak();

  // Generate week days based on selected date's week
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [selectedDate]);

  // Calculate date range for indicators
  const dateRange = useMemo(() => {
    if (showCalendar) {
      return {
        start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }),
        end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 }),
      };
    } else {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      return {
        start: weekStart,
        end: addDays(weekStart, 6),
      };
    }
  }, [showCalendar, currentMonth, selectedDate]);

  // Fetch completed dates and program event dates for indicators
  const { data: completedDates } = useCompletedDates(dateRange.start, dateRange.end);
  const { data: programEventDates } = useProgramEventDates(dateRange.start, dateRange.end);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  }, []);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);

  const handleToggleCalendar = useCallback(() => {
    if (!showCalendar) {
      setCurrentMonth(startOfMonth(selectedDate));
    }
    setShowCalendar(!showCalendar);
  }, [showCalendar, selectedDate]);

  const handleOpenPlanner = useCallback(() => {
    const dateParam = format(selectedDate, 'yyyy-MM-dd');
    navigate(`/app/planner?date=${dateParam}`);
  }, [navigate, selectedDate]);

  if (homeLoading) {
    return <HomeSkeleton />;
  }

  return (
    <>
      <SEOHead 
        title="Home - LadyBoss" 
        description="Your personal dashboard"
      />
      
      <div className="flex flex-col h-full bg-background">
        {/* Fixed header with integrated week strip */}
        <header 
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-violet-100 to-background dark:from-violet-950/50"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
        >
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 h-12">
            {/* Menu button */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2 -ml-2 text-foreground/70 hover:text-foreground">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="p-6" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
                  <h2 className="text-lg font-semibold mb-4">LadyBoss</h2>
                  <nav className="space-y-2">
                    <button 
                      onClick={() => {
                        navigate('/app/planner');
                        setMenuOpen(false);
                      }}
                      className="w-full text-left py-2 px-3 rounded-lg hover:bg-muted flex items-center gap-2"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Full Planner
                    </button>
                    <button 
                      onClick={() => {
                        navigate('/app/journal');
                        setMenuOpen(false);
                      }}
                      className="w-full text-left py-2 px-3 rounded-lg hover:bg-muted flex items-center gap-2"
                    >
                      <PenLine className="h-4 w-4" />
                      Journal
                    </button>
                    <button 
                      onClick={() => {
                        navigate('/app/inspire');
                        setMenuOpen(false);
                      }}
                      className="w-full text-left py-2 px-3 rounded-lg hover:bg-muted flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Inspire
                    </button>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Title - changes to month/year when expanded */}
            {showCalendar ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-bold text-foreground min-w-[140px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </h1>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <h1 className="text-lg font-bold text-foreground">
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')}
              </h1>
            )}

            {/* Streak badge */}
            <button 
              onClick={() => setShowStreakModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-sm"
            >
              <Flame className="h-4 w-4 fill-current" />
              <span className="text-sm font-semibold">{streak?.current_streak || 0}</span>
            </button>
          </div>

          {/* Calendar area */}
          <div className="px-4 py-3 border-b">
            {/* Weekday headers */}
            <div className="flex">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="flex-1 text-center text-xs text-muted-foreground font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Day rows */}
            {showCalendar ? (
              <MonthCalendar
                selectedDate={selectedDate}
                currentMonth={currentMonth}
                onDateSelect={handleDateSelect}
                completedDates={completedDates}
                programEventDates={programEventDates}
              />
            ) : (
              // Week row
              <div className="flex mt-2">
                {weekDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const hasCompletions = completedDates?.has(dateStr);
                  const hasProgramEvents = programEventDates?.has(dateStr);
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className="flex-1 flex justify-center"
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all relative',
                          isSelected
                            ? 'bg-violet-600 text-white shadow-md'
                            : isTodayDate
                              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300'
                              : 'hover:bg-muted/50'
                        )}
                      >
                        {hasCompletions && (
                          <Flame className={cn(
                            "absolute h-7 w-7",
                            isSelected ? "text-orange-300 opacity-70" : "text-orange-400 opacity-50"
                          )} />
                        )}
                        {hasProgramEvents && (
                          <Star className={cn(
                            "absolute -top-0.5 -right-0.5 h-3 w-3",
                            isSelected ? "text-indigo-300 fill-indigo-300" : "text-indigo-500 fill-indigo-500"
                          )} />
                        )}
                        <span className="relative z-10">{format(day, 'd')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Calendar expand/collapse handle */}
            <button 
              onClick={handleToggleCalendar}
              className="w-full flex justify-center pt-2 mt-1"
            >
              <div className="flex gap-0.5">
                <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
                <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
              </div>
            </button>
          </div>
        </header>

        {/* Spacer for fixed header */}
        <div 
          className="transition-all duration-200"
          style={{ 
            height: showCalendar 
              ? 'calc(48px + 340px + max(12px, env(safe-area-inset-top)))' 
              : 'calc(48px + 100px + max(12px, env(safe-area-inset-top)))' 
          }} 
        />

        {/* Open Planner Button */}
        <div className="px-4 py-4">
          <Button 
            onClick={handleOpenPlanner}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-md"
            size="lg"
          >
            <CalendarDays className="h-5 w-5 mr-2" />
            Open Planner
          </Button>
        </div>

        {/* Content area - scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe space-y-6">
          {/* Compact Stats Pills */}
          <CompactStatsPills
            listeningMinutes={listeningMinutes}
            unreadPosts={unreadPosts}
            completedTracks={completedTracks}
            journalStreak={journalStreak}
          />

          {/* Active Rounds Carousel */}
          <ActiveRoundsCarousel
            activeRounds={activeRounds}
            nextSessionMap={nextSessionMap}
          />
        </div>

        {/* Streak Celebration Modal */}
        <StreakCelebration
          open={showStreakModal}
          onClose={() => setShowStreakModal(false)}
        />
      </div>
    </>
  );
};

export default AppHi;
