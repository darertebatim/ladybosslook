import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotebookPen, Calendar, TrendingUp, ChevronRight, Sparkles } from 'lucide-react';
import { useJournalEntries, JournalEntry } from '@/hooks/useJournal';
import { format, startOfMonth, startOfDay, subDays, isAfter } from 'date-fns';
import { getMoodEmoji } from './MoodSelector';

interface JournalStatsProps {
  className?: string;
}

/**
 * Calculate monthly presence - unique days with entries this month
 * Replaces streak calculation (strength-first philosophy)
 */
const calculateMonthlyPresence = (entries: JournalEntry[]): number => {
  if (!entries || entries.length === 0) return 0;

  const monthStart = startOfMonth(new Date());
  
  // Get unique days this month
  const uniqueDays = new Set<string>();
  
  entries.forEach(entry => {
    const entryDate = new Date(entry.created_at);
    if (entryDate >= monthStart) {
      uniqueDays.add(format(entryDate, 'yyyy-MM-dd'));
    }
  });

  return uniqueDays.size;
};

const getMoodStats = (entries: JournalEntry[]): { emoji: string; count: number }[] => {
  if (!entries || entries.length === 0) return [];

  const moodCounts: Record<string, number> = {};
  entries.forEach(entry => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
  });

  return Object.entries(moodCounts)
    .map(([mood, count]) => ({ emoji: getMoodEmoji(mood), count }))
    .filter(m => m.emoji)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
};

/**
 * Journal Stats - Strength-first metrics
 * Replaced "Day Streak" with "Days This Month" (depth of return)
 */
export const JournalStats = ({ className }: JournalStatsProps) => {
  const navigate = useNavigate();
  const { data: entries, isLoading } = useJournalEntries();

  const stats = useMemo(() => {
    if (!entries) return { totalEntries: 0, daysThisMonth: 0, thisMonth: 0, moodStats: [] };

    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 30);
    
    const thisMonth = entries.filter(e => 
      isAfter(new Date(e.created_at), thirtyDaysAgo)
    ).length;

    return {
      totalEntries: entries.length,
      daysThisMonth: calculateMonthlyPresence(entries),
      thisMonth,
      moodStats: getMoodStats(entries),
    };
  }, [entries]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <NotebookPen className="h-5 w-5" />
            My Journal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} id="journal-section">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <NotebookPen className="h-5 w-5" />
            My Journal
          </CardTitle>
          <CardDescription>Your personal reflections</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/journal')}>
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.totalEntries === 0 ? (
          <div className="text-center py-4">
            <NotebookPen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Start journaling today</p>
            <Button size="sm" onClick={() => navigate('/app/journal/new')}>
              Write First Entry
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Grid - Strength-first: no streak, just presence */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-primary mb-1">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold">{stats.totalEntries}</p>
                <p className="text-xs text-muted-foreground">Total Entries</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-violet-500 mb-1">
                  <Calendar className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold">{stats.daysThisMonth}</p>
                <p className="text-xs text-muted-foreground">Days This Month</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold">{stats.thisMonth}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>

            {/* Mood Trends */}
            {stats.moodStats.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Your mood trends</p>
                <div className="flex items-center gap-3">
                  {stats.moodStats.map((mood, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <span className="text-lg">{mood.emoji}</span>
                      <span className="text-sm text-muted-foreground">×{mood.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action */}
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate('/app/journal/new')}
            >
              <NotebookPen className="h-4 w-4 mr-2" />
              Write Today's Entry
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
