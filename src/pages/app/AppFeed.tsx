import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChannels, useFeedPosts, useMarkPostRead } from '@/hooks/useFeed';
import { useFeedRealtime } from '@/hooks/useFeedRealtime';
import { FeedChannelTabs } from '@/components/feed/FeedChannelTabs';
import { FeedMessage } from '@/components/feed/FeedMessage';
import { FeedThread } from '@/components/feed/FeedThread';
import { SEOHead } from '@/components/SEOHead';

export default function AppFeed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialChannel = searchParams.get('channel');
  
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [threadPost, setThreadPost] = useState<any>(null);
  
  const { data: channels, isLoading: channelsLoading } = useChannels();
  const { data: posts, isLoading: postsLoading } = useFeedPosts(selectedChannelId || undefined);
  const markPostRead = useMarkPostRead();

  // Subscribe to real-time updates
  useFeedRealtime(selectedChannelId || undefined);

  // Set initial channel from URL params
  useEffect(() => {
    if (initialChannel && channels) {
      const channel = channels.find(c => c.slug === initialChannel || c.id === initialChannel);
      if (channel) {
        setSelectedChannelId(channel.id);
      }
    }
  }, [initialChannel, channels]);

  // Mark posts as read when viewed
  useEffect(() => {
    if (posts) {
      posts.forEach(post => {
        markPostRead.mutate(post.id);
      });
    }
  }, [posts]);

  const selectedChannel = channels?.find(c => c.id === selectedChannelId);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Community" 
        description="Stay connected with announcements, content updates, and community discussions"
      />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/home')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Community</h1>
        </div>

        {/* Channel tabs */}
        {!channelsLoading && channels && channels.length > 0 && (
          <div className="px-4 pb-3">
            <FeedChannelTabs
              channels={channels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={setSelectedChannelId}
            />
          </div>
        )}
      </header>

      {/* Messages stream */}
      <main className="divide-y pb-24">
        {postsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <FeedMessage
              key={post.id}
              post={post}
              allowReactions={selectedChannel?.allow_reactions ?? true}
              showChannelBadge={!selectedChannelId}
              commentsCount={post.comments_count || 0}
              onOpenThread={() => setThreadPost(post)}
            />
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back later for updates
            </p>
          </div>
        )}
      </main>

      {/* Thread sheet */}
      {threadPost && (
        <FeedThread
          post={threadPost}
          open={!!threadPost}
          onOpenChange={(open) => !open && setThreadPost(null)}
        />
      )}
    </div>
  );
}
