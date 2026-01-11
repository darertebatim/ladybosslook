import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bookmark, Trash2, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface BookmarkItem {
  id: string;
  timestamp_seconds: number;
  note: string | null;
  created_at: string;
}

interface BookmarksListProps {
  bookmarks: BookmarkItem[];
  onSeek: (timestampSeconds: number) => void;
  onDelete: (bookmarkId: string) => void;
  isDeleting?: boolean;
}

export function BookmarksList({
  bookmarks,
  onSeek,
  onDelete,
  isDeleting,
}: BookmarksListProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="h-4 w-4" />
          <span>Bookmarks</span>
          {bookmarks.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {bookmarks.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[60vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Bookmarks ({bookmarks.length})
          </SheetTitle>
        </SheetHeader>
        
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
            <Bookmark className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">No bookmarks yet</p>
            <p className="text-sm text-center mt-1">
              Tap the bookmark icon to save important moments
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(60vh-80px)] mt-4">
            <div className="space-y-2 pr-4">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => onSeek(bookmark.timestamp_seconds)}
                >
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-16 rounded bg-primary/10 text-primary font-mono text-sm">
                    {formatTime(bookmark.timestamp_seconds)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {bookmark.note ? (
                      <p className="text-sm line-clamp-2">{bookmark.note}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No note</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(bookmark.id);
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
