import { memo } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { getMoodEmoji } from './MoodSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Share2 } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface JournalEntryCardProps {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  createdAt: string;
  sharedWithAdmin?: boolean | null;
  onClick: () => void;
}

const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const formatEntryTime = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'h:mm a');
};

// Get display title - use first line of content or date if no title
const getDisplayTitle = (title: string | null, content: string, createdAt: string): string => {
  if (title && title.trim()) return title;
  
  // Get first line of content (like iPhone Journal)
  const plainContent = stripHtml(content);
  const firstLine = plainContent.split('\n')[0]?.trim();
  if (firstLine && firstLine.length > 0) {
    return firstLine.length > 40 ? firstLine.slice(0, 40) + '...' : firstLine;
  }
  
  // Fallback to date
  const date = new Date(createdAt);
  return format(date, 'EEEE, MMMM d');
};

export const JournalEntryCard = memo(function JournalEntryCard({
  title,
  content,
  mood,
  createdAt,
  sharedWithAdmin,
  onClick,
}: JournalEntryCardProps) {
  const plainContent = stripHtml(content);
  const displayTitle = getDisplayTitle(title, content, createdAt);
  const preview = plainContent.length > 100 ? plainContent.slice(0, 100) + '...' : plainContent;
  const moodEmoji = getMoodEmoji(mood);

  const handleClick = () => {
    haptic.light();
    onClick();
  };

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors active:scale-[0.98]"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">
                {displayTitle}
              </h3>
              {sharedWithAdmin && (
                <Share2 className="h-3 w-3 text-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {preview || 'No content'}
            </p>
          </div>
          {moodEmoji && (
            <span className="text-xl flex-shrink-0">{moodEmoji}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {formatEntryTime(createdAt)}
        </p>
      </CardContent>
    </Card>
  );
});

export const formatDateGroup = (dateString: string): string => {
  // Use parseISO for consistent timezone handling with Supabase timestamps
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d');
};
