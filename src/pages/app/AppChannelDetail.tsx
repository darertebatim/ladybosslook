import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, Megaphone, Users, GraduationCap, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useChannels, useFeedPosts, useMarkPostRead, FeedPost } from '@/hooks/useFeed';
import { useFeedRealtime } from '@/hooks/useFeedRealtime';
import { FeedMessage } from '@/components/feed/FeedMessage';
import { ChannelChatInput } from '@/components/feed/ChannelChatInput';
import { SEOHead } from '@/components/SEOHead';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

interface PostGroup {
  dateLabel: string;
  posts: Array<FeedPost & { isFollowUp: boolean }>;
}

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  general: Megaphone,
  program: GraduationCap,
  round: Users,
};

export default function AppChannelDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);
  const [replyTo, setReplyTo] = useState<FeedPost | null>(null);

  // Scroll to bottom when keyboard opens (iOS)
  const handleKeyboardChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      // Delay to let keyboard animation complete
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);
  
  const { data: channels, isLoading: channelsLoading } = useChannels();
  
  // Find channel by slug
  const selectedChannel = channels?.find(c => c.slug === slug);
  const selectedChannelId = selectedChannel?.id;
  
  const { data: posts, isLoading: postsLoading } = useFeedPosts(selectedChannelId || undefined);
  const markPostRead = useMarkPostRead();

  // Subscribe to real-time updates for this channel
  useFeedRealtime(selectedChannelId || undefined);

  // Build a map of posts by ID for reply lookups
  const postsById = useMemo(() => {
    if (!posts) return new Map<string, FeedPost>();
    return new Map(posts.map(p => [p.id, p]));
  }, [posts]);

  // Scroll to bottom when posts load (only first time)
  useEffect(() => {
    if (posts && posts.length > 0 && !postsLoading && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      });
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [posts, postsLoading]);

  // Reset scroll flag when channel changes
  useEffect(() => {
    hasScrolledRef.current = false;
  }, [selectedChannelId]);

  // Mark posts as read when viewed
  useEffect(() => {
    if (posts) {
      posts.forEach(post => {
        markPostRead.mutate(post.id);
      });
    }
  }, [posts]);

  // Group posts by date and identify follow-up messages
  const groupedPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];

    const groups: PostGroup[] = [];
    let currentDateLabel = '';

    posts.forEach((post, index) => {
      const postDate = new Date(post.created_at);
      let dateLabel: string;

      if (isToday(postDate)) {
        dateLabel = 'Today';
      } else if (isYesterday(postDate)) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = format(postDate, 'MMM d, yyyy');
      }

      // Check if this is a follow-up message
      let isFollowUp = false;
      if (index > 0) {
        const prevPost = posts[index - 1];
        const prevPostDate = new Date(prevPost.created_at);
        const sameAuthor = post.author_id === prevPost.author_id;
        const sameDay = format(postDate, 'yyyy-MM-dd') === format(prevPostDate, 'yyyy-MM-dd');
        const withinFiveMinutes = Math.abs(differenceInMinutes(postDate, prevPostDate)) <= 5;
        
        isFollowUp = sameAuthor && sameDay && withinFiveMinutes && !post.is_pinned && !prevPost.is_pinned;
      }

      if (dateLabel !== currentDateLabel) {
        groups.push({ dateLabel, posts: [] });
        currentDateLabel = dateLabel;
      }

      groups[groups.length - 1].posts.push({ ...post, isFollowUp });
    });

    return groups;
  }, [posts]);

  const Icon = selectedChannel ? CHANNEL_ICONS[selectedChannel.type] || Megaphone : Megaphone;
  const isGroupChat = selectedChannel?.allow_comments ?? false;

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedChannel) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-muted-foreground">Channel not found</p>
        <button
          onClick={() => navigate('/app/channels')}
          className="mt-4 text-primary hover:underline"
        >
          Back to channels
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-muted/30">
      <SEOHead 
        title={selectedChannel.name} 
        description={`Channel: ${selectedChannel.name}`}
      />

      {/* Header */}
      <header 
        className="sticky top-0 z-10 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-2 px-2 pt-2 pb-3">
          <button
            onClick={() => navigate('/app/channels')}
            className="p-2 -ml-1 hover:bg-black/5 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
            selectedChannel.type === 'general' && "bg-primary/20 text-primary",
            selectedChannel.type === 'program' && "bg-accent/20 text-accent-foreground",
            selectedChannel.type === 'round' && "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{selectedChannel.name}</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isGroupChat ? (
                <>
                  <MessageSquare className="h-3 w-3" />
                  <span>Group chat</span>
                </>
              ) : (
                <span>Broadcast channel</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="pb-safe">
          {postsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : groupedPosts.length > 0 ? (
            groupedPosts.map((group) => (
              <div key={group.dateLabel}>
                {/* Date separator */}
                <div className="flex justify-center py-3">
                  <Badge 
                    variant="secondary" 
                    className="bg-background/80 backdrop-blur-sm shadow-sm border text-xs font-normal"
                  >
                    {group.dateLabel}
                  </Badge>
                </div>

                {/* Posts in this date group */}
                {group.posts.map((post, postIndex) => {
                  // Check if this is the last message in the entire channel
                  const isLastInGroup = postIndex === group.posts.length - 1;
                  const isLastGroup = groupedPosts.indexOf(group) === groupedPosts.length - 1;
                  const isLastMessage = isLastInGroup && isLastGroup;
                  
                  return (
                    <FeedMessage
                      key={post.id}
                      post={post}
                      allowReactions={selectedChannel.allow_reactions}
                      isFollowUp={post.isFollowUp}
                      onReply={isGroupChat ? setReplyTo : undefined}
                      replyToPost={post.reply_to_post_id ? postsById.get(post.reply_to_post_id) : null}
                      isLastMessage={isLastMessage}
                    />
                  );
                })}
              </div>
            ))
          ) : (
            <div className="text-center py-12 px-4">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isGroupChat ? 'Be the first to say something!' : 'Check back later for updates'}
              </p>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Chat input for group channels */}
      {isGroupChat && selectedChannelId && (
        <ChannelChatInput 
          channelId={selectedChannelId} 
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onKeyboardChange={handleKeyboardChange}
        />
      )}
    </div>
  );
}
