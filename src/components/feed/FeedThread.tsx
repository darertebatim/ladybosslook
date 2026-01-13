import { useState, useRef, useEffect } from 'react';
import { usePostComments, useAddComment, useDeleteComment, FeedPost } from '@/hooks/useFeed';
import { usePostCommentsRealtime } from '@/hooks/useFeedRealtime';
import { useAuth } from '@/hooks/useAuth';
import { useKeyboard } from '@/hooks/useKeyboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';
import { X, Send, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedThreadProps {
  post: FeedPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Constants for layout calculations
const INPUT_BAR_HEIGHT = 72; // Height of the input area
const TAB_BAR_HEIGHT = 72; // Height of the bottom tab bar

export function FeedThread({ post, open, onOpenChange }: FeedThreadProps) {
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const { keyboardHeight, isKeyboardOpen } = useKeyboard();
  const { data: comments, isLoading } = usePostComments(post.id);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time comment updates
  usePostCommentsRealtime(post.id);

  // Auto-scroll when keyboard opens or new comments arrive
  useEffect(() => {
    if (open && comments && comments.length > 0) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [open, comments?.length, isKeyboardOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addComment.mutateAsync({ postId: post.id, content: newComment.trim() });
    setNewComment('');
  };

  // Calculate dynamic bottom offset for the input bar
  // When keyboard is open: position above keyboard
  // When keyboard is closed: position above the tab bar (the sheet is inside the app layout)
  const inputBottomOffset = isKeyboardOpen 
    ? keyboardHeight 
    : 0; // Sheet is modal, doesn't need tab bar offset

  // Calculate scroll container padding to keep comments visible
  const scrollPaddingBottom = isKeyboardOpen 
    ? keyboardHeight + INPUT_BAR_HEIGHT 
    : INPUT_BAR_HEIGHT + 16; // Extra padding when keyboard closed

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-3xl p-0 flex flex-col"
        hideCloseButton
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">
              Replies ({comments?.length || 0})
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        {/* Original post preview */}
        <div className="px-4 py-3 border-b bg-muted/30 shrink-0">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {post.author?.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{post.author?.full_name || 'Admin'}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {post.content}
              </p>
            </div>
          </div>
        </div>

        {/* Comments list with dynamic padding */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4"
          style={{ paddingBottom: scrollPaddingBottom }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments && comments.length > 0 ? (
            <>
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={comment.user?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {comment.user?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {comment.user?.full_name || 'User'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => deleteComment.mutate(comment.id)}
                          disabled={deleteComment.isPending}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words mt-0.5">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No replies yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to reply!</p>
            </div>
          )}
        </div>

        {/* Fixed comment input - positioned at bottom of sheet */}
        <div 
          className="absolute left-0 right-0 border-t bg-background"
          style={{ 
            bottom: inputBottomOffset,
            transition: 'bottom 0.25s ease-out'
          }}
        >
          <form onSubmit={handleSubmit} className="px-4 py-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a reply..."
                  rows={1}
                  className={cn(
                    "w-full resize-none rounded-2xl border bg-muted/50 px-4 py-2.5",
                    "text-sm placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    "max-h-32 overflow-y-auto"
                  )}
                  style={{ minHeight: '42px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
              </div>
              <Button 
                type="submit" 
                size="icon"
                disabled={!newComment.trim() || addComment.isPending}
                className="h-10 w-10 rounded-full shrink-0"
              >
                {addComment.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
