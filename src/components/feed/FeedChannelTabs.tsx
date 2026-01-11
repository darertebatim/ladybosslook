import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FeedChannel } from '@/hooks/useFeed';
import { Megaphone, Users, GraduationCap, Hash } from 'lucide-react';

interface FeedChannelTabsProps {
  channels: FeedChannel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string | null) => void;
  unreadCounts?: Record<string, number>;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  general: <Megaphone className="h-3.5 w-3.5" />,
  program: <GraduationCap className="h-3.5 w-3.5" />,
  round: <Users className="h-3.5 w-3.5" />,
};

export function FeedChannelTabs({ 
  channels, 
  selectedChannelId, 
  onSelectChannel,
  unreadCounts = {}
}: FeedChannelTabsProps) {
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        {/* All channels */}
        <button
          onClick={() => onSelectChannel(null)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
            selectedChannelId === null
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
        >
          <Hash className="h-3.5 w-3.5" />
          <span>All</span>
          {totalUnread > 0 && selectedChannelId !== null && (
            <span className="ml-1 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>

        {/* Individual channels */}
        {channels.map((channel) => {
          const unreadCount = unreadCounts[channel.id] || 0;
          const icon = CHANNEL_ICONS[channel.type] || <Hash className="h-3.5 w-3.5" />;

          return (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all relative",
                selectedChannelId === channel.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {icon}
              <span>{channel.name}</span>
              {unreadCount > 0 && selectedChannelId !== channel.id && (
                <span className={cn(
                  "ml-1 h-5 min-w-5 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center",
                  "bg-primary text-primary-foreground"
                )}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
