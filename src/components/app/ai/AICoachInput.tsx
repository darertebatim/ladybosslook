import { useState, useRef, useCallback } from 'react';
import { Send, Mic, MicOff, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { CoachMode } from './AICoachHeader';
import { cn } from '@/lib/utils';

const PLACEHOLDERS: Record<CoachMode, string> = {
  coach: 'Ask your coach...',
  assistant: 'What do you need help with?',
  companion: 'How are you feeling?',
};

interface Props {
  mode: CoachMode;
  isLoading: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function AICoachInput({ mode, isLoading, onSend, onStop }: Props) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    onSend(text);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const toggleVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setInput(prev => prev + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  return (
    <div className="px-4 py-3 border-t bg-card/80 backdrop-blur-md safe-area-bottom">
      {isLoading && (
        <div className="flex justify-center mb-2">
          <Button variant="outline" size="sm" className="text-xs rounded-full h-7 gap-1" onClick={onStop}>
            <Square className="h-3 w-3" /> Stop generating
          </Button>
        </div>
      )}
      <div className="flex gap-2 items-end">
        <Button
          type="button"
          variant={isListening ? "default" : "ghost"}
          size="icon"
          className={cn("h-10 w-10 shrink-0 rounded-full", isListening && "animate-pulse")}
          onClick={toggleVoice}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDERS[mode]}
            disabled={isLoading}
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none rounded-2xl pr-12 py-2.5 text-sm bg-muted/50 border-border/50 focus:border-primary/30"
          />
          <Button
            type="button"
            size="icon"
            className="absolute right-1.5 bottom-1 h-8 w-8 rounded-full"
            disabled={isLoading || !input.trim()}
            onClick={handleSubmit}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
