import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, BookOpen, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useJournalEntries } from '@/hooks/useJournal';
import { JournalEntryCard, formatDateGroup } from '@/components/app/JournalEntryCard';
import { JournalSkeleton } from '@/components/app/skeletons/JournalSkeleton';
import { JournalReminderSettings } from '@/components/app/JournalReminderSettings';
import { SEOHead } from '@/components/SEOHead';
import { format, startOfDay } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Capacitor } from '@capacitor/core';

const AppJournal = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const { data: entries, isLoading } = useJournalEntries(searchQuery);

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
  const isNative = Capacitor.isNativePlatform();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/app/home')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">My Journal</h1>
            </div>
          </div>
        </div>
        <JournalSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEOHead title="My Journal" description="Your personal journal entries" />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/app/home')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
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
            {isNative && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto">
                  <SheetHeader>
                    <SheetTitle>Daily Reminder</SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                    <JournalReminderSettings />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/app/journal/new')}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
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

      {/* Content */}
      <div className="p-4 space-y-6">
        {entries && entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
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
                    sharedWithAdmin={entry.shared_with_admin}
                    onClick={() => navigate(`/app/journal/${entry.id}`)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      {entries && entries.length > 0 && (
        <Button
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg"
          onClick={() => navigate('/app/journal/new')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default AppJournal;
