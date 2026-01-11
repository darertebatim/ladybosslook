import { useState } from 'react';
import { usePostComments, useAddComment, useDeleteComment } from '@/hooks/useFeed';
import { usePostCommentsRealtime } from '@/hooks/useFeedRealtime';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send, Loader2 } from 'lucide-react';

interface FeedCommentsProps {
  postId: string;
  commentsCount: number;
  allowComments?: boolean;
  expanded?: boolean;
}

export function FeedComments({ 
  postId, 
  commentsCount, 
  allowComments = true,
  expanded = false 
}: FeedCommentsProps) {
  const [showComments, setShowComments] = useState(expanded);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const { data: comments, isLoading } = usePostComments(postId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  // Subscribe to real-time comment updates
  usePostCommentsRealtime(postId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addComment.mutateAsync({ postId, content: newComment.trim() });
    setNewComment('');
  };

  if (!allowComments) return null;

  return (
    <div className="space-y-3">
      {/* Toggle button */}
      {!expanded && (
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
        </button>
      )}

      {/* Comments section */}
      {(showComments || expanded) && (
        <div className="space-y-4 pt-2 border-t">
          {/* Comments list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {comment.user?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <p className="text-sm font-medium">
                        {comment.user?.full_name || 'User'}
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => deleteComment.mutate(comment.id)}
                          disabled={deleteComment.isPending}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No comments yet. Be the first to comment!
            </p>
          )}

          {/* Add comment form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[60px] resize-none"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newComment.trim() || addComment.isPending}
              className="shrink-0"
            >
              {addComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
