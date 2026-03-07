import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReflectionPages, useSaveReflectionResponse } from '@/hooks/useReflections';
import { useAutoCompleteProTask } from '@/hooks/useAutoCompleteProTask';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useBilingualText } from '@/components/ui/BilingualText';
import { cn } from '@/lib/utils';

export default function AppReflectionFlow() {
  const { reflectionId } = useParams<{ reflectionId: string }>();
  const navigate = useNavigate();
  const { data: pages, isLoading } = useReflectionPages(reflectionId);
  const saveResponse = useSaveReflectionResponse();
  const { autoCompleteReflection } = useAutoCompleteProTask();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const totalPages = pages?.length || 0;
  const page = pages?.[currentIndex];
  const isLast = currentIndex === totalPages - 1;
  const progress = totalPages > 0 ? ((currentIndex + 1) / totalPages) * 100 : 0;

  // Auto-focus textarea on question pages
  useEffect(() => {
    if (page?.type === 'question') {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [currentIndex, page?.type]);

  const handleNext = async () => {
    if (!page || !reflectionId) return;

    try {
      // Save response for question pages
      if (page.type === 'question') {
        await saveResponse.mutateAsync({
          reflectionId,
          pageId: page.id,
          responseText: answers[page.id] || '',
          isCompleted: isLast,
        });
      } else if (isLast) {
        // Save a marker for the last page even if it's a message
        await saveResponse.mutateAsync({
          reflectionId,
          pageId: page.id,
          isCompleted: true,
        });
      }

      if (isLast) {
        toast.success('Reflection completed ✨');
        // Auto-complete any pro-linked tasks for this reflection
        if (reflectionId) {
          autoCompleteReflection(reflectionId);
        }
        navigate(-1);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    } catch (error) {
      console.error('Failed to save reflection response:', error);
      toast.error('Failed to save. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="h-full bg-background flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground">This reflection has no pages yet.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary underline">Go back</button>
      </div>
    );
  }

  // Bilingual detection for content text
  const { className: contentBiClassName, direction: contentDir } = useBilingualText(page?.content || '');
  const { className: descBiClassName, direction: descDir } = useBilingualText(page?.description || '');
  const { className: answerBiClassName, direction: answerDir } = useBilingualText(answers[page?.id || ''] || '');

  return (
    <div
      className="h-[100dvh] bg-background flex flex-col overflow-hidden"
    >
      {/* Top bar: back + progress */}
      <div
        className="px-4 pb-2 flex items-center gap-3 shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button onClick={handleBack} className="shrink-0 active:scale-95 transition-transform p-1">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto overscroll-contain">
        <p className={cn("text-xl font-bold leading-snug", contentBiClassName)} dir={contentDir}>{page?.content}</p>
        {page?.description && (
          <p className={cn("mt-4 text-sm text-foreground leading-relaxed whitespace-pre-line", descBiClassName)} dir={descDir}>{page.description}</p>
        )}

        {page?.type === 'question' && (
          <textarea
            ref={textareaRef}
            value={answers[page.id] || ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [page.id]: e.target.value }))}
            placeholder="پاسخ خود را بنویسید…"
            className={cn("mt-6 w-full bg-transparent border-0 border-b-2 border-muted-foreground/20 focus:border-primary outline-none resize-none text-base min-h-[120px] placeholder:text-muted-foreground/50 transition-colors", answerBiClassName)}
            dir={answerDir}
          />
        )}
      </div>

      {/* FAB */}
      <div
        className="p-6 flex justify-start shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        <button
          onClick={handleNext}
          disabled={saveResponse.isPending}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {isLast ? <Check className="h-6 w-6" /> : <ArrowRight className="h-6 w-6 rotate-180" />}
        </button>
      </div>
    </div>
  );
}
