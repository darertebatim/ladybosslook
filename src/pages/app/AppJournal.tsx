import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useJournalEntries } from '@/hooks/useJournal';
import { JournalEntryCard, formatDateGroup } from '@/components/app/JournalEntryCard';
import { JournalSkeleton } from '@/components/app/skeletons/JournalSkeleton';
import { JournalReminderSettings } from '@/components/app/JournalReminderSettings';
import { JournalHeaderStats } from '@/components/app/JournalHeaderStats';
import { BackButton } from '@/components/app/BackButton';
import { SEOHead } from '@/components/SEOHead';
import { format, startOfDay, differenceInDays, subDays, isAfter } from 'date-fns';

// Calculate streak from entries
const calculateStreak = (entries: any[]): number => {
  if (!entries || entries.length === 0) return 0;

  const sortedDates = entries
    .map(e => startOfDay(new Date(e.created_at)))
    .sort((a, b) => b.getTime() - a.getTime());

  const uniqueDates = sortedDates.filter((date, index, self) => 
    index === 0 || self[index - 1].getTime() !== date.getTime()
  );

  const today = startOfDay(new Date());
  const mostRecent = uniqueDates[0];
  if (differenceInDays(today, mostRecent) > 1) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = differenceInDays(uniqueDates[i - 1], uniqueDates[i]);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

const AppJournal = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const { data: entries, isLoading } = useJournalEntries(searchQuery);

  // Calculate stats
  const stats = useMemo(() => {
    if (!entries) return { totalEntries: 0, streak: 0, thisMonth: 0 };

    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 30);
    
    const thisMonth = entries.filter(e => 
      isAfter(new Date(e.created_at), thirtyDaysAgo)
    ).length;

    return {
      totalEntries: entries.length,
      streak: calculateStreak(entries),
      thisMonth,
    };
  }, [entries]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    if (!entries) return {};
    
    const groups: Record<string, typeof entries> = {};
    entries.forEach((entry) => {
      const dateKey = format(startOfDay(new Date(entry.created_at)), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });
    
    return groups;
  }, [entries]);

  const dateKeys = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div 
          className="fixed top-0 left-0 right-0 z-10 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-3">
              <BackButton to="/app/home" />
              <h1 className="text-xl font-semibold">My Journal</h1>
            </div>
          </div>
        </div>
        <div style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))' }} />
        <JournalSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <SEOHead title="My Journal" description="Your personal journal entries" />
      
      {/* Header */}
      <div 
        className="fixed top-0 left-0 right-0 z-10 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-3">
            <BackButton to="/app/home" />
            <h1 className="text-xl font-semibold">My Journal</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/app/journal/new')}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="px-4 pb-3">
          <JournalHeaderStats 
            totalEntries={stats.totalEntries}
            streak={stats.streak}
            thisMonth={stats.thisMonth}
          />
        </div>
        
        {/* Search bar */}
        {showSearch && (
          <div className="px-4 pb-4">
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Spacer for fixed header */}
      <div className="shrink-0" style={{ height: 'calc(90px + env(safe-area-inset-top, 0px))' }} />

      {/* Scroll container */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 pb-safe space-y-4">
        {/* Quick Actions Card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Write Today's Entry Button */}
            <Button 
              className="w-full bg-foreground hover:bg-foreground/90 text-background" 
              onClick={() => navigate('/app/journal/new')}
            >
              <NotebookPen className="h-4 w-4 mr-2" />
              Write Today's Entry
            </Button>

            {/* Add to Routine Button */}
            <JournalReminderSettings />
          </CardContent>
        </Card>

        {/* Entries List */}
        {entries && entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-medium mb-2">Start Your Journal</h2>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">
              Capture your thoughts, reflections, and daily moments in your personal journal.
            </p>
            <Button onClick={() => navigate('/app/journal/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Write First Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {dateKeys.map((dateKey) => (
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
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AppJournal;
