import { cn } from '@/lib/utils';
import { EMOJI_OPTIONS, useToggleReaction } from '@/hooks/useFeed';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';
import { useState } from 'react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

interface FeedReactionsProps {
  postId: string;
  reactionsCount: Record<string, number>;
  userReactions: string[];
  allowReactions?: boolean;
  compact?: boolean;
}

export function FeedReactions({ 
  postId, 
  reactionsCount, 
  userReactions, 
  allowReactions = true,
  compact = true
}: FeedReactionsProps) {
  const [open, setOpen] = useState(false);
  const toggleReaction = useToggleReaction();

  const handleReaction = (emoji: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toggleReaction.mutate({ postId, emoji });
    setOpen(false);
  };

  if (!allowReactions) return null;

  const hasReactions = Object.keys(reactionsCount).length > 0;
  const totalReactions = Object.values(reactionsCount).reduce((a, b) => a + b, 0);

  // Compact mode: show combined reactions inline
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {/* Existing reactions - compact inline */}
        {hasReactions && (
          <div className="flex items-center gap-0.5">
            {EMOJI_OPTIONS.filter(opt => (reactionsCount[opt.key] || 0) > 0)
              .slice(0, 3)
              .map((option, idx) => (
                <button
                  key={option.key}
                  onClick={(e) => handleReaction(option.key, e)}
                  disabled={toggleReaction.isPending}
                  className={cn(
                    "active:scale-110 transition-transform leading-none",
                    userReactions.includes(option.key) && "drop-shadow-sm"
                  )}
                >
                  <FluentEmoji emoji={option.emoji} size={22} />
                </button>
              ))}
            {totalReactions > 0 && (
              <span className="text-xs text-muted-foreground ml-1">{totalReactions}</span>
            )}
          </div>
        )}

        {/* Add reaction button - compact */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "p-1.5 rounded-full active:bg-muted transition-colors",
                "text-muted-foreground hover:text-foreground"
              )}
            >
              <SmilePlus className="h-[18px] w-[18px]" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1.5" align="start" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-0.5">
              {EMOJI_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={(e) => handleReaction(option.key, e)}
                  disabled={toggleReaction.isPending}
                  className={cn(
                    "p-1.5 rounded-lg active:bg-muted transition-colors",
                    userReactions.includes(option.key) && "bg-primary/20"
                  )}
                  title={option.label}
                >
                  <FluentEmoji emoji={option.emoji} size={28} />
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Full mode: show individual reaction buttons
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {EMOJI_OPTIONS.map((option) => {
        const count = reactionsCount[option.key] || 0;
        if (count === 0) return null;

        const isUserReaction = userReactions.includes(option.key);

        return (
          <button
            key={option.key}
            onClick={(e) => handleReaction(option.key, e)}
            disabled={toggleReaction.isPending}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors",
              isUserReaction
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            <FluentEmoji emoji={option.emoji} size={18} />
            <span className="font-medium">{count}</span>
          </button>
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "h-7 px-2 rounded-full hover:bg-muted transition-colors",
              "text-muted-foreground"
            )}
          >
            <SmilePlus className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1">
            {EMOJI_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={(e) => handleReaction(option.key, e)}
                disabled={toggleReaction.isPending}
                className={cn(
                  "p-2 rounded-lg active:bg-muted transition-colors",
                  userReactions.includes(option.key) && "bg-primary/20"
                )}
                title={option.label}
              >
                <FluentEmoji emoji={option.emoji} size={28} />
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
