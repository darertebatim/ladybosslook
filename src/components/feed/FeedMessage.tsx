import { memo } from 'react';
import { FeedPost } from '@/hooks/useFeed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Pin, CheckCheck, ExternalLink } from 'lucide-react';
import { FeedReactions } from './FeedReactions';
import { FeedActionButton } from './FeedActionButton';
import { FeedVoiceMessage } from './FeedVoiceMessage';
import { cn } from '@/lib/utils';
import { detectVideoType, getVideoEmbedUrl } from '@/lib/videoUtils';
import { useBilingualText } from '@/components/ui/BilingualText';
import { useAuth } from '@/hooks/useAuth';
import appIcon from '@/assets/app-icon.png';

interface FeedMessageProps {
  post: FeedPost;
  allowReactions?: boolean;
  isFollowUp?: boolean;
}

export const FeedMessage = memo(function FeedMessage({ 
  post, 
  allowReactions = true, 
  isFollowUp = false
}: FeedMessageProps) {
  const { user } = useAuth();
  const isVoiceMessage = post.post_type === 'voice_message' || post.audio_url;
  
  // Check if this is a system/admin-panel message (announcements, system posts, etc.)
  // These should always show as "Simora" on the left, never as current user
  const isSystemMessage = post.is_system || post.post_type !== 'discussion';
  
  // Only treat as current user's message if it's a discussion post they authored
  const isCurrentUser = !isSystemMessage && user?.id === post.author_id;
  
  // System messages show as "Simora", otherwise use author info
  const senderName = isSystemMessage 
    ? 'Simora' 
    : (post.display_name || post.author?.full_name || 'User');
  
  // Detect Persian text for proper font and direction
  const { direction, className: bilingualClassName } = useBilingualText(post.content || '');

  // Dynamic border radius based on message type (Telegram-style)
  const getBubbleRadius = () => {
    if (isCurrentUser) {
      // User messages on right - tail on right
      return "rounded-2xl rounded-br-md";
    } else {
      // Admin/other user messages on left - tail on left
      return "rounded-2xl rounded-tl-md";
    }
  };

  return (
    <div 
      className={cn(
        "group relative px-4 py-1",
        post.is_pinned && "bg-primary/5",
        !isFollowUp && "pt-2"
      )}
    >
      {/* Pinned indicator */}
      {post.is_pinned && !isFollowUp && (
        <div className={cn(
          "flex items-center gap-1.5 text-xs text-primary mb-2",
          isCurrentUser ? "justify-end mr-2" : "ml-12"
        )}>
          <Pin className="h-3 w-3" />
          <span>Pinned message</span>
        </div>
      )}

      <div className={cn(
        "flex gap-2 items-end",
        isCurrentUser && "flex-row-reverse"
      )}>
        {/* Avatar - hidden for follow-up messages and current user */}
        {!isCurrentUser && (
          !isFollowUp ? (
            <Avatar className="h-8 w-8 shrink-0">
            {isSystemMessage ? (
                <AvatarImage src={appIcon} alt="Simora" />
              ) : (
                <AvatarImage src={post.author?.avatar_url || undefined} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {senderName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-8 shrink-0" /> // Spacer for alignment
          )
        )}

        {/* Message bubble */}
        <div className={cn(
          "flex-1 min-w-0 max-w-[80%]",
          getBubbleRadius(),
          "shadow-sm px-3.5 py-2.5",
          // Different colors for user vs admin/others
          isCurrentUser 
            ? "bg-primary text-primary-foreground" 
            : isSystemMessage
              ? "bg-card border border-border/50"
              : "bg-muted/80",
          // Align bubbles
          isCurrentUser && "ml-auto"
        )}>
          {/* Header - show sender name for non-current-user messages, hidden for follow-ups */}
          {!isFollowUp && !isCurrentUser && (
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn(
                "font-semibold text-sm",
                isSystemMessage ? "text-primary" : "text-foreground"
              )}>
                {senderName}
              </span>
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
              isCurrentUser={isCurrentUser}
            />
          )}

          {/* Text content */}
          {post.content && !isVoiceMessage && (
            <p 
              className={cn(
                "text-[15px] whitespace-pre-wrap break-words leading-relaxed", 
                bilingualClassName
              )}
              dir={direction}
            >
              {post.content}
            </p>
          )}

          {/* Caption for voice message */}
          {isVoiceMessage && post.content && (
            <p 
              className={cn(
                "text-sm mt-2",
                isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground",
                bilingualClassName
              )}
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
                      className="flex items-center justify-center h-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-primary-foreground"
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
                      className="flex items-center justify-center h-full bg-foreground text-background"
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
          <div className={cn(
            "flex items-center gap-1.5 mt-1.5 text-[11px]",
            isCurrentUser 
              ? "justify-end text-primary-foreground/60" 
              : "justify-end text-muted-foreground"
          )}>
            <span>{format(new Date(post.created_at), 'HH:mm')}</span>
            {isCurrentUser && (
              <CheckCheck className="h-3 w-3" />
            )}
          </div>
        </div>
      </div>

      {/* Reactions - outside the bubble */}
      {Object.keys(post.reactions_count || {}).length > 0 && (
        <div className={cn(
          "flex items-center gap-4 mt-1",
          isCurrentUser ? "justify-end mr-2" : "ml-10"
        )}>
          <FeedReactions
            postId={post.id}
            reactionsCount={post.reactions_count || {}}
            userReactions={post.user_reactions || []}
            allowReactions={allowReactions}
          />
        </div>
      )}
    </div>
  );
});
