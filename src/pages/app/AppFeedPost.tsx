import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Pin, Megaphone, Music, Calendar, FileText, MessageSquare } from 'lucide-react';
import { BackButton } from '@/components/app/BackButton';
import { useFeedPost, usePostComments, useAddComment, useDeleteComment, useMarkPostRead } from '@/hooks/useFeed';
import { useFeedRealtime, usePostCommentsRealtime } from '@/hooks/useFeedRealtime';
import { useAuth } from '@/hooks/useAuth';
import { useKeyboard } from '@/hooks/useKeyboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { FeedReactions } from '@/components/feed/FeedReactions';
import { FeedActionButton } from '@/components/feed/FeedActionButton';
import { FeedReplyInput } from '@/components/feed/FeedReplyInput';
import { SEOHead } from '@/components/SEOHead';
import { cn } from '@/lib/utils';
import { useBilingualText } from '@/components/ui/BilingualText';

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

function getYouTubeEmbedUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

// Separate component for comment bubble to use hooks properly
function CommentBubble({ 
  comment, 
  isFollowUp, 
  isOwn, 
  onDelete, 
  deleteDisabled 
}: { 
  comment: { id: string; content: string; created_at: string; user?: { full_name?: string; avatar_url?: string } };
  isFollowUp: boolean;
  isOwn: boolean;
  onDelete: () => void;
  deleteDisabled: boolean;
}) {
  const { isPersian, direction, className: bilingualClassName } = useBilingualText(comment.content);

  return (
    <div 
      className={cn(
        "flex gap-2.5 group py-1",
        !isFollowUp && "pt-3"
      )}
    >
      {/* Avatar - hidden for follow-ups */}
      {!isFollowUp ? (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.user?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-muted">
            {comment.user?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 shrink-0" />
      )}

      {/* Comment bubble */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "bg-muted rounded-2xl rounded-tl-md px-3 py-2 max-w-[85%] inline-block",
          isOwn && "bg-primary/10"
        )}>
          {/* Header - hidden for follow-ups */}
          {!isFollowUp && (
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm">
                {comment.user?.full_name || 'User'}
              </span>
            </div>
          )}
          <p 
            className={cn("text-sm text-foreground whitespace-pre-wrap break-words", bilingualClassName)}
            dir={direction}
          >
            {comment.content}
          </p>
          {/* Timestamp in bubble */}
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(comment.created_at), 'HH:mm')}
            </span>
            {isOwn && (
              <button
                onClick={onDelete}
                disabled={deleteDisabled}
                className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppFeedPost() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { isKeyboardOpen } = useKeyboard();
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  
  const { data: post, isLoading: postLoading } = useFeedPost(postId || '');
  const { data: comments, isLoading: commentsLoading } = usePostComments(postId || '');
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const markPostRead = useMarkPostRead();

  // Subscribe to real-time updates
  useFeedRealtime();
  usePostCommentsRealtime(postId || '');

  // Bilingual support - MUST be called before any early returns
  const { direction: contentDirection, className: contentBilingualClassName } = useBilingualText(post?.content || '');
  const { direction: titleDirection, className: titleBilingualClassName } = useBilingualText(post?.title || '');

  // Mark post as read
  useEffect(() => {
    if (post) {
      markPostRead.mutate(post.id);
    }
  }, [post]);

  // Auto-scroll to bottom when comments change or keyboard opens
  useEffect(() => {
    if (comments && comments.length > 0) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [comments?.length, isKeyboardOpen]);

  // Handle sending a comment using ChatInput
  const handleSend = async (content: string) => {
    if (!content.trim() || !postId) return;
    
    setSending(true);
    try {
      await addComment.mutateAsync({ postId, content: content.trim() });
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    navigate('/app/channels');
  };

  // Simple scroll padding - input bar is ~80px, plus buffer
  const scrollPaddingBottom = 100;

  const isLoading = postLoading;

  if (isLoading) {
    return (
      <div 
        className="flex flex-col bg-background"
        style={{ height: '100dvh' }}
      >
        <header 
          className="bg-background/80 backdrop-blur-xl border-b shrink-0 z-10"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-1 pt-3 pb-2 px-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Post</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div 
        className="flex flex-col bg-background"
        style={{ height: '100dvh' }}
      >
        <header 
          className="bg-background/80 backdrop-blur-xl border-b shrink-0 z-10"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-1 pt-3 pb-2 px-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Post not found</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <p className="text-muted-foreground text-center">
            This post doesn't exist or you don't have access to it.
          </p>
        </main>
      </div>
    );
  }

  const Icon = POST_TYPE_ICONS[post.post_type as keyof typeof POST_TYPE_ICONS] || Megaphone;
  const senderName = post.display_name || post.author?.full_name || 'Admin';

  // Group comments by date for chat-style display
  const groupedComments = comments?.reduce((acc, comment, index, arr) => {
    const commentDate = new Date(comment.created_at);
    const dateLabel = getDateLabel(commentDate);
    
    // Check if we need a new date group
    if (index === 0 || dateLabel !== getDateLabel(new Date(arr[index - 1].created_at))) {
      acc.push({ type: 'date' as const, label: dateLabel, id: `date-${comment.id}` });
    }
    
    // Check if this is a follow-up message (same author within 5 minutes)
    let isFollowUp = false;
    if (index > 0) {
      const prevComment = arr[index - 1];
      const prevDate = new Date(prevComment.created_at);
      const sameAuthor = comment.user_id === prevComment.user_id;
      const withinFiveMinutes = Math.abs(differenceInMinutes(commentDate, prevDate)) <= 5;
      isFollowUp = sameAuthor && withinFiveMinutes;
    }
    
    acc.push({ type: 'comment' as const, comment, isFollowUp, id: comment.id });
    return acc;
  }, [] as Array<{ type: 'date'; label: string; id: string } | { type: 'comment'; comment: typeof comments[0]; isFollowUp: boolean; id: string }>) || [];

  return (
    <div 
      className="flex flex-col bg-background"
      style={{ height: '100dvh' }}
    >
      <SEOHead 
        title={post.title || 'Post'} 
        description={post.content.slice(0, 160)}
      />

      {/* iOS-style Header */}
      <header 
        className="bg-background/80 backdrop-blur-xl border-b shrink-0 z-10"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-1 pt-3 pb-2 px-4">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {post.channel?.name || 'Post'}
            </h1>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: scrollPaddingBottom }}
      >
        {/* Original Post */}
        <div className="p-4 border-b bg-card/50">
          {/* Author info */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {senderName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{senderName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            {post.is_pinned && (
              <Pin className="h-4 w-4 text-primary" />
            )}
          </div>

          {/* Post type badge */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Icon className="h-3 w-3" />
              {POST_TYPE_LABELS[post.post_type as keyof typeof POST_TYPE_LABELS]}
            </Badge>
          </div>

          {/* Title */}
          {post.title && (
            <h2 
              className={cn("font-bold text-xl mb-2", titleBilingualClassName)}
              dir={titleDirection}
            >
              {post.title}
            </h2>
          )}

          {/* Content */}
          <p 
            className={cn("text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed", contentBilingualClassName)}
            dir={contentDirection}
          >
            {post.content}
          </p>

          {/* Image */}
          {post.image_url && (
            <div className="rounded-xl overflow-hidden mt-3">
              <img 
                src={post.image_url} 
                alt="" 
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Video embed */}
          {post.video_url && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted mt-3">
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
            <div className="mt-3">
              <FeedActionButton 
                actionType={post.action_type} 
                actionData={post.action_data} 
              />
            </div>
          )}

          {/* Reactions */}
          <div className="mt-4 pt-3 border-t">
            <FeedReactions
              postId={post.id}
              reactionsCount={post.reactions_count || {}}
              userReactions={post.user_reactions || []}
              allowReactions={post.channel?.allow_reactions ?? true}
            />
          </div>
        </div>

        {/* Comments Section */}
        <div className="px-4 pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">
            {comments?.length || 0} {(comments?.length || 0) === 1 ? 'Reply' : 'Replies'}
          </h3>

          {commentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : groupedComments.length > 0 ? (
            <div className="space-y-1">
              {groupedComments.map((item) => {
                if (item.type === 'date') {
                  return (
                    <div key={item.id} className="flex justify-center py-3">
                      <Badge 
                        variant="secondary" 
                        className="bg-muted/80 text-xs font-normal"
                      >
                        {item.label}
                      </Badge>
                    </div>
                  );
                }

                const { comment, isFollowUp } = item;
                const isOwn = user?.id === comment.user_id;

                return (
                  <CommentBubble 
                    key={comment.id}
                    comment={comment}
                    isFollowUp={isFollowUp}
                    isOwn={isOwn}
                    onDelete={() => deleteComment.mutate(comment.id)}
                    deleteDisabled={deleteComment.isPending}
                  />
                );
              })}
              <div ref={commentsEndRef} />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No replies yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to reply!</p>
            </div>
          )}
        </div>
      </div>

      {/* Input Bar - Flexbox positioned like AppChat */}
      <div 
        className="shrink-0 bg-background/95 backdrop-blur-xl border-t"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="px-4">
          <FeedReplyInput
            onSend={handleSend}
            placeholder="Write a reply..."
            disabled={sending}
          />
        </div>
      </div>
    </div>
  );
}
