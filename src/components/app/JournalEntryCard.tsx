import { format, isToday, isYesterday } from 'date-fns';
import { getMoodEmoji } from './MoodSelector';
import { Card, CardContent } from '@/components/ui/card';

interface JournalEntryCardProps {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  createdAt: string;
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

export const JournalEntryCard = ({
  title,
  content,
  mood,
  createdAt,
  onClick,
}: JournalEntryCardProps) => {
  const plainContent = stripHtml(content);
  const preview = plainContent.length > 100 ? plainContent.slice(0, 100) + '...' : plainContent;
  const moodEmoji = getMoodEmoji(mood);

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors active:scale-[0.98]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">
              {title || 'Untitled Entry'}
            </h3>
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
};

export const formatDateGroup = (dateString: string): string => {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d');
};
