import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FeedChannel } from '@/hooks/useFeed';

interface FeedChannelTabsProps {
  channels: FeedChannel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string | null) => void;
}

export function FeedChannelTabs({ channels, selectedChannelId, onSelectChannel }: FeedChannelTabsProps) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        <button
          onClick={() => onSelectChannel(null)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            selectedChannelId === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
        >
          All
        </button>
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onSelectChannel(channel.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedChannelId === channel.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {channel.name}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
