import { useState, useRef, useCallback } from 'react';
import { Send, Mic, MicOff, Square, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { CoachMode } from './AICoachHeader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useKeyboardScroll } from '@/hooks/useKeyboardScroll';

const PLACEHOLDERS: Record<CoachMode, string> = {
  coach: 'Ask your coach...',
  assistant: 'What do you need help with?',
  companion: 'How are you feeling?',
};

interface Props {
  mode: CoachMode;
  isLoading: boolean;
  onSend: (text: string, imageBase64?: string) => void;
  onStop: () => void;
}

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

export function AICoachInput({ mode, isLoading, onSend, onStop }: Props) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { handleFocus } = useKeyboardScroll(textareaRef);

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if ((!text && !imageBase64) || isLoading) return;
    setInput('');
    onSend(text || 'What do you see in this image?', imageBase64 || undefined);
    setImagePreview(null);
    setImageBase64(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, onSend, imageBase64]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image is too large (max 4MB)');
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 data (remove data:image/xxx;base64, prefix)
      setImageBase64(result);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    e.target.value = '';
  }, []);

  const removeImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageBase64(null);
  }, [imagePreview]);

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
    <div className="px-4 py-3 border-t bg-card/80 backdrop-blur-md safe-area-inset-bottom">
      {isLoading && (
        <div className="flex justify-center mb-2">
          <Button variant="outline" size="sm" className="text-xs rounded-full h-7 gap-1" onClick={onStop}>
            <Square className="h-3 w-3" /> Stop generating
          </Button>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img
            src={imagePreview}
            alt="Attached"
            className="h-20 w-20 object-cover rounded-xl border border-border/50"
          />
          <button
            onClick={removeImage}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        {/* Image upload button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageSelect}
        />


        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={imagePreview ? 'Describe what to do with this image...' : PLACEHOLDERS[mode]}
            disabled={isLoading}
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none rounded-2xl pr-12 py-2.5 text-sm bg-muted/50 border-border/50 focus:border-primary/30"
          />
          <Button
            type="button"
            size="icon"
            className="absolute right-1.5 bottom-1 h-8 w-8 rounded-full"
            disabled={isLoading || (!input.trim() && !imageBase64)}
            onClick={handleSubmit}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
