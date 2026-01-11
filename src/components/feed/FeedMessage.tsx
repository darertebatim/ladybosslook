import { FeedPost } from '@/hooks/useFeed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Check, CheckCheck } from 'lucide-react';
import { FeedReactions } from './FeedReactions';
import { FeedActionButton } from './FeedActionButton';
import { FeedVoiceMessage } from './FeedVoiceMessage';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface FeedMessageProps {
  post: FeedPost;
  allowReactions?: boolean;
  showChannelBadge?: boolean;
  onOpenThread?: () => void;
  commentsCount?: number;
}

export function FeedMessage({ 
  post, 
  allowReactions = true, 
  showChannelBadge = false,
  onOpenThread,
  commentsCount = 0
}: FeedMessageProps) {
  const navigate = useNavigate();
  const isVoiceMessage = post.post_type === 'voice_message' || post.audio_url;

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('audio')) {
      return;
    }
    navigate(`/app/feed/post/${post.id}`);
  };

  return (
    <div 
      className={cn(
        "group relative px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer",
        post.is_pinned && "bg-primary/5"
      )}
      onClick={handleClick}
    >
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 text-xs text-primary mb-2 ml-12">
          <Pin className="h-3 w-3" />
          <span>Pinned message</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={post.author?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {post.author?.full_name?.charAt(0) || 'A'}
          </AvatarFallback>
        </Avatar>

        {/* Message content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">
              {post.author?.full_name || 'Admin'}
            </span>
            {showChannelBadge && post.channel && (
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {post.channel.name}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Title */}
          {post.title && (
            <h3 className="font-semibold text-base leading-snug">{post.title}</h3>
          )}

          {/* Voice message */}
          {isVoiceMessage && post.audio_url && (
            <FeedVoiceMessage 
              audioUrl={post.audio_url} 
              duration={post.audio_duration || 0}
            />
          )}

          {/* Text content */}
          {post.content && !isVoiceMessage && (
            <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
              {post.content}
            </p>
          )}

          {/* Caption for voice message */}
          {isVoiceMessage && post.content && (
            <p className="text-sm text-muted-foreground mt-2">
              {post.content}
            </p>
          )}

          {/* Image */}
          {post.image_url && (
            <div className="rounded-xl overflow-hidden mt-2 max-w-md">
              <img 
                src={post.image_url} 
                alt="" 
                className="w-full max-h-72 object-cover"
              />
            </div>
          )}

          {/* Video embed */}
          {post.video_url && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted mt-2 max-w-md">
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
          {post.action_type && post.action_type !== 'none' && (
            <div className="pt-2">
              <FeedActionButton 
                actionType={post.action_type} 
                actionData={post.action_data} 
              />
            </div>
          )}

          {/* Footer: Reactions + Comments */}
          <div className="flex items-center gap-4 pt-2">
            <FeedReactions
              postId={post.id}
              reactionsCount={post.reactions_count || {}}
              userReactions={post.user_reactions || []}
              allowReactions={allowReactions}
            />
            
            {commentsCount > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenThread?.();
                }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {commentsCount} {commentsCount === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getYouTubeEmbedUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}
