import { useNavigate } from 'react-router-dom';
import { Loader2, Megaphone, Users, GraduationCap, MessageSquare, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useChannels, useChannelSummaries } from '@/hooks/useFeed';
import { useFeedRealtime } from '@/hooks/useFeedRealtime';
import { SEOHead } from '@/components/SEOHead';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  general: Megaphone,
  program: GraduationCap,
  round: Users,
};

function formatLastMessageTime(date: Date): string {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d');
  }
}

export default function AppChannelsList() {
  const navigate = useNavigate();
  const { data: channels, isLoading: channelsLoading } = useChannels();
  const { data: summaries, isLoading: summariesLoading } = useChannelSummaries();

  // Subscribe to real-time updates for all channels
  useFeedRealtime();

  const handleChannelClick = (slug: string) => {
    navigate(`/app/channels/${slug}`);
  };

  const isLoading = channelsLoading || summariesLoading;

  return (
    <div className="flex flex-col h-full bg-background">
      <SEOHead 
        title="Channels" 
        description="Stay connected with announcements, content updates, and community discussions"
      />

      {/* Header */}
      <header 
        className="sticky top-0 z-10 bg-accent dark:bg-accent rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-4 pt-3 pb-4">
          <h1 className="text-2xl font-bold">Channels</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your community spaces
          </p>
        </div>
      </header>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : channels && channels.length > 0 ? (
          <div className="divide-y divide-border/50">
            {/* Sort channels by last message time (most recent first) */}
            {[...channels]
              .sort((a, b) => {
                const aLastMsg = summaries?.[a.id]?.lastMessage?.created_at;
                const bLastMsg = summaries?.[b.id]?.lastMessage?.created_at;
                // Channels with messages come first, sorted by most recent
                if (!aLastMsg && !bLastMsg) return 0;
                if (!aLastMsg) return 1;
                if (!bLastMsg) return -1;
                return new Date(bLastMsg).getTime() - new Date(aLastMsg).getTime();
              })
              .map((channel) => {
              const summary = summaries?.[channel.id];
              const Icon = CHANNEL_ICONS[channel.type] || Megaphone;
              const unreadCount = summary?.unreadCount || 0;
              const lastMessage = summary?.lastMessage;
              const lastMessageTime = lastMessage?.created_at 
                ? formatLastMessageTime(new Date(lastMessage.created_at))
                : null;

              return (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel.slug)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors text-left"
                >
                  {/* Channel icon */}
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                    channel.type === 'general' && "bg-primary/10 text-primary",
                    channel.type === 'program' && "bg-accent/10 text-accent-foreground",
                    channel.type === 'round' && "bg-muted text-muted-foreground",
                    !['general', 'program', 'round'].includes(channel.type) && "bg-muted text-muted-foreground"
                  )}>
                    {channel.cover_image_url ? (
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={channel.cover_image_url} />
                        <AvatarFallback>
                          <Icon className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Channel info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {channel.name}
                      </span>
                      {channel.allow_comments && (
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    {lastMessage && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {lastMessage.display_name || lastMessage.author?.full_name || 'Admin'}: {lastMessage.content}
                      </p>
                    )}
                    {!lastMessage && (
                      <p className="text-sm text-muted-foreground/60 mt-0.5">
                        No messages yet
                      </p>
                    )}
                  </div>

                  {/* Right side: time + unread badge */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {lastMessageTime && (
                      <span className="text-xs text-muted-foreground">
                        {lastMessageTime}
                      </span>
                    )}
                    {unreadCount > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No channels available</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Check back later for community updates
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
