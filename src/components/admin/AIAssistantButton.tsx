import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { cn } from '@/lib/utils';

export function AIAssistantButton() {
  const { isOpen, setIsOpen } = useAIAssistant();

  return (
    <Button
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
        "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
        "transition-all duration-300 ease-out",
        isOpen && "scale-90 opacity-70"
      )}
      size="icon"
      aria-label="Toggle AI Assistant"
    >
      <Sparkles className="h-6 w-6" />
    </Button>
  );
}
