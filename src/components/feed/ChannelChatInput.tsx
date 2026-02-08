import { useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateUserPost } from '@/hooks/useFeed';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChannelChatInputProps {
  channelId: string;
}

export function ChannelChatInput({ channelId }: ChannelChatInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createPost = useCreateUserPost();

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || createPost.isPending) return;

    try {
      await createPost.mutateAsync({
        channelId,
        content: trimmedContent,
      });
      setContent('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
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
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const canSend = content.trim().length > 0 && !createPost.isPending;

  return (
    <div 
      className="sticky bottom-0 bg-background border-t border-border/50 px-3 py-2"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Message..."
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
