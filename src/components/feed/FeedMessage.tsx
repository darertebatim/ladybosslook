import { memo } from 'react';
import { FeedPost } from '@/hooks/useFeed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Pin, CheckCheck, ExternalLink } from 'lucide-react';
import { FeedReactions } from './FeedReactions';
import { FeedActionButton } from './FeedActionButton';
import { FeedVoiceMessage } from './FeedVoiceMessage';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { detectVideoType, getVideoEmbedUrl, getVideoPlatformLabel } from '@/lib/videoUtils';
import { useBilingualText } from '@/components/ui/BilingualText';

interface FeedMessageProps {
  post: FeedPost;
  allowReactions?: boolean;
  showChannelBadge?: boolean;
  commentsCount?: number;
  isFollowUp?: boolean;
}

export const FeedMessage = memo(function FeedMessage({ 
  post, 
  allowReactions = true, 
  showChannelBadge = false,
  commentsCount = 0,
  isFollowUp = false
}: FeedMessageProps) {
  const navigate = useNavigate();
  const isVoiceMessage = post.post_type === 'voice_message' || post.audio_url;

  // Use display_name if set, otherwise fallback to author's name or 'Admin'
  const senderName = post.display_name || post.author?.full_name || 'Admin';
  
  // Detect Persian text for proper font and direction
  const { isPersian, direction, className: bilingualClassName } = useBilingualText(post.content || '');

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('audio')) {
      return;
    }
    navigate(`/app/channels/post/${post.id}`);
  };

  return (
    <div 
      className={cn(
        "group relative px-4 py-2 cursor-pointer",
        post.is_pinned && "bg-primary/5",
        !isFollowUp && "pt-3"
      )}
      onClick={handleClick}
    >
      {/* Pinned indicator */}
      {post.is_pinned && !isFollowUp && (
        <div className="flex items-center gap-1.5 text-xs text-primary mb-2 ml-12">
          <Pin className="h-3 w-3" />
          <span>Pinned message</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar - hidden for follow-up messages */}
        {!isFollowUp ? (
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={post.author?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {senderName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-10 shrink-0" /> // Spacer for alignment
        )}

        {/* Message bubble */}
        <div className={cn(
          "flex-1 min-w-0",
          "bg-card rounded-2xl rounded-tl-md shadow-sm border border-border/50",
          "px-4 py-3 max-w-[85%]"
        )}>
          {/* Header - hidden for follow-up messages */}
          {!isFollowUp && (
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="font-semibold text-sm text-foreground">
                {senderName}
              </span>
              {showChannelBadge && post.channel && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {post.channel.name}
                </Badge>
              )}
            </div>
          )}

          {/* Title */}
          {post.title && (
            <h3 className="font-semibold text-base leading-snug mb-1">{post.title}</h3>
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
            <p 
              className={cn("text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed", bilingualClassName)}
              dir={direction}
            >
              {post.content}
            </p>
          )}

          {/* Caption for voice message */}
          {isVoiceMessage && post.content && (
            <p 
              className={cn("text-sm text-muted-foreground mt-2", bilingualClassName)}
              dir={direction}
            >
              {post.content}
            </p>
          )}

          {/* Image */}
          {post.image_url && (
            <div className="rounded-xl overflow-hidden mt-2">
              <img 
                src={post.image_url} 
                alt="" 
                loading="lazy"
                decoding="async"
                className="w-full max-h-72 object-cover"
              />
            </div>
          )}

          {/* Video embed */}
          {post.video_url && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted mt-2">
              {(() => {
                const videoType = detectVideoType(post.video_url);
                const embedUrl = getVideoEmbedUrl(post.video_url, videoType);
                
                if (videoType === 'youtube' || videoType === 'vimeo') {
                  return (
                    <iframe
                      src={embedUrl || post.video_url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                } else if (videoType === 'instagram') {
                  return (
                    <a 
                      href={post.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-center">
                        <ExternalLink className="h-8 w-8 mx-auto mb-2" />
                        <span className="font-medium">View on Instagram</span>
                      </div>
                    </a>
                  );
                } else if (videoType === 'tiktok') {
                  return (
                    <a 
                      href={post.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-full bg-black text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-center">
                        <ExternalLink className="h-8 w-8 mx-auto mb-2" />
                        <span className="font-medium">View on TikTok</span>
                      </div>
                    </a>
                  );
                } else {
                  // Direct video (MP4, WebM, etc.)
                  return (
                    <video 
                      src={post.video_url} 
                      controls 
                      className="w-full h-full object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                  );
                }
              })()}
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

          {/* Footer: Timestamp + Read indicator */}
          <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-muted-foreground">
            <span>{format(new Date(post.created_at), 'HH:mm')}</span>
            <CheckCheck className="h-3 w-3 text-primary" />
          </div>
        </div>
      </div>

      {/* Reactions + Comments - outside the bubble */}
      {(Object.keys(post.reactions_count || {}).length > 0 || commentsCount > 0) && (
        <div className="flex items-center gap-4 mt-2 ml-[52px]">
          <FeedReactions
            postId={post.id}
            reactionsCount={post.reactions_count || {}}
            userReactions={post.user_reactions || []}
            allowReactions={allowReactions}
          />
          
          {commentsCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {commentsCount} {commentsCount === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>
      )}
    </div>
  );
});
