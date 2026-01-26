import { useState, useRef, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { haptic } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedReplyInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function FeedReplyInput({ onSend, disabled, placeholder = "Write a reply..." }: FeedReplyInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      // Haptic feedback on iOS/Android
      haptic.light();
      
      const textarea = textareaRef.current;
      
      onSend(message.trim());
      setMessage("");
      
      // Keep keyboard open
      const keepKeyboardOpen = () => {
        if (textarea) {
          textarea.focus();
        }
        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
          Keyboard.show().catch(() => {});
        }
      };
      
      requestAnimationFrame(() => {
        keepKeyboardOpen();
        setTimeout(keepKeyboardOpen, 50);
        setTimeout(keepKeyboardOpen, 150);
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-background/80 backdrop-blur-xl py-2">
      <div className="flex items-center bg-muted/50 rounded-full border border-border/30 pl-4 pr-1">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[32px] max-h-24 resize-none text-[15px] leading-[22px] bg-transparent border-0 focus-visible:ring-0 p-0 py-1"
          rows={1}
        />
        
        <Button 
          onClick={handleSend} 
          disabled={disabled || !message.trim()}
          size="icon"
          className={cn(
            "shrink-0 h-7 w-7 rounded-full transition-all duration-200 ml-1",
            message.trim() 
              ? "bg-primary hover:bg-primary/90 scale-100 opacity-100" 
              : "bg-primary/40 scale-90 opacity-60"
          )}
        >
          {disabled ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
