import { cn } from '@/lib/utils';
import { EMOJI_OPTIONS, useToggleReaction } from '@/hooks/useFeed';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SmilePlus } from 'lucide-react';
import { useState } from 'react';

interface FeedReactionsProps {
  postId: string;
  reactionsCount: Record<string, number>;
  userReactions: string[];
  allowReactions?: boolean;
}

export function FeedReactions({ 
  postId, 
  reactionsCount, 
  userReactions, 
  allowReactions = true 
}: FeedReactionsProps) {
  const [open, setOpen] = useState(false);
  const toggleReaction = useToggleReaction();

  const handleReaction = (emoji: string) => {
    toggleReaction.mutate({ postId, emoji });
    setOpen(false);
  };

  if (!allowReactions) return null;

  const hasReactions = Object.keys(reactionsCount).length > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Existing reactions */}
      {EMOJI_OPTIONS.map((option) => {
        const count = reactionsCount[option.key] || 0;
        if (count === 0) return null;

        const isUserReaction = userReactions.includes(option.key);

        return (
          <button
            key={option.key}
            onClick={() => handleReaction(option.key)}
            disabled={toggleReaction.isPending}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors",
              isUserReaction
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            <span>{option.emoji}</span>
            <span className="font-medium">{count}</span>
          </button>
        );
      })}

      {/* Add reaction button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 rounded-full",
              !hasReactions && "text-muted-foreground"
            )}
          >
            <SmilePlus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {EMOJI_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => handleReaction(option.key)}
                disabled={toggleReaction.isPending}
                className={cn(
                  "p-2 rounded-lg hover:bg-muted transition-colors text-xl",
                  userReactions.includes(option.key) && "bg-primary/20"
                )}
                title={option.label}
              >
                {option.emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
