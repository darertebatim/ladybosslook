import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AITextGeneratorProps {
  context: string;
  fieldType: 'subtitle' | 'description' | 'section_content';
  onGenerate: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

const FIELD_PROMPTS: Record<string, string> = {
  subtitle: 'Generate a short, inspiring subtitle (max 60 characters) for this routine.',
  description: 'Generate a compelling description (2-3 sentences) explaining the benefits and what users will achieve.',
  section_content: 'Generate engaging content (2-4 sentences) that introduces this section, explains why it matters, and motivates the user.',
};

export function AITextGenerator({ 
  context, 
  fieldType, 
  onGenerate, 
  disabled = false,
  className 
}: AITextGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast.error('Please provide a title first');
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in');
        return;
      }

      const response = await supabase.functions.invoke('generate-routine-text', {
        body: {
          context,
          fieldType,
          prompt: FIELD_PROMPTS[fieldType],
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const generatedText = response.data?.text;
      if (generatedText) {
        onGenerate(generatedText);
        toast.success('Generated!');
      } else {
        throw new Error('No text generated');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate text');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleGenerate}
      disabled={disabled || isGenerating}
      className={cn("h-6 px-2 text-xs gap-1 text-primary hover:text-primary", className)}
    >
      {isGenerating ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      AI
    </Button>
  );
}
