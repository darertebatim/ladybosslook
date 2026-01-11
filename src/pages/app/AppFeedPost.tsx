import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeedPost, useMarkPostRead } from '@/hooks/useFeed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Megaphone, Music, Calendar, FileText, MessageSquare } from 'lucide-react';
import { FeedReactions } from '@/components/feed/FeedReactions';
import { FeedComments } from '@/components/feed/FeedComments';
import { FeedActionButton } from '@/components/feed/FeedActionButton';
import { SEOHead } from '@/components/SEOHead';

const POST_TYPE_ICONS = {
  announcement: Megaphone,
  drip_unlock: Music,
  session_reminder: Calendar,
  media: FileText,
  discussion: MessageSquare,
};

const POST_TYPE_LABELS = {
  announcement: 'Announcement',
  drip_unlock: 'New Content',
  session_reminder: 'Session',
  media: 'Media',
  discussion: 'Discussion',
};

export default function AppFeedPost() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  
  const { data: post, isLoading } = useFeedPost(postId || '');
  const markPostRead = useMarkPostRead();

  // Mark post as read
  useEffect(() => {
    if (post) {
      markPostRead.mutate(post.id);
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/app/feed')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Post not found</h1>
          </div>
        </header>
        <main className="p-4">
          <p className="text-muted-foreground text-center py-12">
            This post doesn't exist or you don't have access to it.
          </p>
        </main>
      </div>
    );
  }

  const Icon = POST_TYPE_ICONS[post.post_type] || Megaphone;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={post.title || 'Post'} 
        description={post.content.slice(0, 160)}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/feed')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {post.channel?.name || 'Post'}
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-24">
        <div className="space-y-4">
          {/* Author info */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback>
                  {post.author?.full_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {post.author?.full_name || 'Admin'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            {post.is_pinned && (
              <Pin className="h-5 w-5 text-primary" />
            )}
          </div>

          {/* Post type badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Icon className="h-3 w-3" />
              {POST_TYPE_LABELS[post.post_type]}
            </Badge>
          </div>

          {/* Title */}
          {post.title && (
            <h2 className="font-bold text-2xl">{post.title}</h2>
          )}

          {/* Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap text-base leading-relaxed">{post.content}</p>
          </div>

          {/* Image */}
          {post.image_url && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={post.image_url} 
                alt="" 
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Video embed */}
          {post.video_url && (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              {post.video_url.includes('youtube') || post.video_url.includes('youtu.be') ? (
                <iframe
                  src={getYouTubeEmbedUrl(post.video_url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video 
                  src={post.video_url} 
                  controls 
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          )}

          {/* Action button */}
          {post.action_type !== 'none' && (
            <div className="pt-2">
              <FeedActionButton 
                actionType={post.action_type} 
                actionData={post.action_data} 
              />
            </div>
          )}

          {/* Reactions */}
          <div className="pt-4 border-t">
            <FeedReactions
              postId={post.id}
              reactionsCount={post.reactions_count || {}}
              userReactions={post.user_reactions || []}
              allowReactions={post.channel?.allow_reactions ?? true}
            />
          </div>

          {/* Comments - expanded by default on detail view */}
          <div className="pt-4">
            <h3 className="font-semibold mb-3">Comments</h3>
            <FeedComments
              postId={post.id}
              commentsCount={post.comments_count || 0}
              allowComments={post.channel?.allow_comments ?? true}
              expanded={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function getYouTubeEmbedUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}
