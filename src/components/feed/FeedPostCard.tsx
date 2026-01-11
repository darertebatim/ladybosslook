import { FeedPost } from '@/hooks/useFeed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Megaphone, Music, Calendar, FileText, MessageSquare } from 'lucide-react';
import { FeedReactions } from './FeedReactions';
import { FeedComments } from './FeedComments';
import { FeedActionButton } from './FeedActionButton';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface FeedPostCardProps {
  post: FeedPost;
  allowReactions?: boolean;
  allowComments?: boolean;
  showChannelBadge?: boolean;
}

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

export function FeedPostCard({ 
  post, 
  allowReactions = true, 
  allowComments = true,
  showChannelBadge = false 
}: FeedPostCardProps) {
  const navigate = useNavigate();
  const Icon = POST_TYPE_ICONS[post.post_type] || Megaphone;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('textarea')) {
      return;
    }
    navigate(`/app/feed/post/${post.id}`);
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
        post.is_pinned && "border-primary/50 bg-primary/5"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback>
                {post.author?.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {post.author?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.is_pinned && (
              <Pin className="h-4 w-4 text-primary" />
            )}
            {showChannelBadge && post.channel && (
              <Badge variant="secondary" className="text-xs">
                {post.channel.name}
              </Badge>
            )}
          </div>
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
          <h3 className="font-semibold text-lg">{post.title}</h3>
        )}

        {/* Content */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="rounded-lg overflow-hidden">
            <img 
              src={post.image_url} 
              alt="" 
              className="w-full max-h-80 object-cover"
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
        <FeedReactions
          postId={post.id}
          reactionsCount={post.reactions_count || {}}
          userReactions={post.user_reactions || []}
          allowReactions={allowReactions}
        />

        {/* Comments */}
        <FeedComments
          postId={post.id}
          commentsCount={post.comments_count || 0}
          allowComments={allowComments}
        />
      </CardContent>
    </Card>
  );
}

function getYouTubeEmbedUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}
