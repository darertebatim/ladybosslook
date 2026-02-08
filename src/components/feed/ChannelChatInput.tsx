import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateUserPost, FeedPost } from '@/hooks/useFeed';
import { useKeyboard } from '@/hooks/useKeyboard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChannelChatInputProps {
  channelId: string;
  replyTo?: FeedPost | null;
  onCancelReply?: () => void;
  onKeyboardChange?: (isOpen: boolean) => void;
  onMessageSent?: () => void;
}

export function ChannelChatInput({ channelId, replyTo, onCancelReply, onKeyboardChange, onMessageSent }: ChannelChatInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const createPost = useCreateUserPost();
  const { isKeyboardOpen } = useKeyboard();

  // Notify parent when keyboard state changes
  useEffect(() => {
    onKeyboardChange?.(isKeyboardOpen);
  }, [isKeyboardOpen, onKeyboardChange]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);

  // Scroll input into view when focused on iOS
  const handleFocus = () => {
    // Delay to let iOS keyboard animation complete
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || createPost.isPending) return;

    // Keep keyboard open using requestAnimationFrame trick
    const activeElement = document.activeElement;
    
    try {
      await createPost.mutateAsync({
        channelId,
        content: trimmedContent,
        replyToPostId: replyTo?.id,
      });
      setContent('');
      onCancelReply?.();
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Keep focus on input to prevent keyboard dismissal
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
        // Notify parent to scroll to bottom after sending
        onMessageSent?.();
      });
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error?.message || 'Failed to send message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Cancel reply on Escape
    if (e.key === 'Escape' && replyTo) {
      onCancelReply?.();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const canSend = content.trim().length > 0 && !createPost.isPending;

  const replyToName = replyTo?.display_name || replyTo?.author?.full_name || 'Simora';

  return (
    <div 
      ref={containerRef}
      className="shrink-0 bg-background border-t border-border/50"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
          <div className="flex-1 pl-2 border-l-2 border-primary text-xs">
            <div className="font-medium text-primary truncate">
              Replying to {replyToName}
            </div>
            <div className="text-muted-foreground truncate">
              {replyTo.content?.slice(0, 60)}{replyTo.content && replyTo.content.length > 60 ? '...' : ''}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onFocus={handleFocus}
          placeholder={replyTo ? `Reply to ${replyToName}...` : "Message..."}
          className={cn(
            "min-h-[40px] max-h-[120px] resize-none py-2.5 px-3",
            "rounded-2xl border-border/50 bg-muted/50",
            "focus-visible:ring-1 focus-visible:ring-primary"
          )}
          rows={1}
        />
        <Button
          onClick={handleSubmit}
          disabled={!canSend}
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full shrink-0 transition-all",
            canSend 
              ? "bg-primary hover:bg-primary/90" 
              : "bg-muted text-muted-foreground"
          )}
        >
          {createPost.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
