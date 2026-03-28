import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useBilingualText } from '@/components/ui/BilingualText';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';

export default function AppFreeFormReflection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* not available */ }
  const hasActivePlayer = routinePlayer?.isActive && routinePlayer?.isMinimized;

  const [step, setStep] = useState<'title' | 'content'>('title');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const { className: titleBiClass, direction: titleDir } = useBilingualText(title);
  const { className: contentBiClass, direction: contentDir } = useBilingualText(content);

  const progress = step === 'title' ? 50 : 100;

  useEffect(() => {
    setTimeout(() => {
      if (step === 'title') titleRef.current?.focus();
      else contentRef.current?.focus();
    }, 200);
  }, [step]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('free_form_reflections' as any)
        .insert({ user_id: user.id, title: title.trim(), content: content.trim() } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflection-notes'] });
      toast.success('Reflection saved ✨');
      if (hasActivePlayer) {
        navigate('/app/home');
        routinePlayer!.maximize();
      } else {
        navigate(-1);
      }
    },
    onError: () => toast.error('Failed to save'),
  });

  const handleNext = () => {
    if (step === 'title') {
      if (!title.trim()) {
        toast.error('Please write a title');
        return;
      }
      setStep('content');
    } else {
      saveMutation.mutate();
    }
  };

  const handleBack = () => {
    if (step === 'content') {
      setStep('title');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
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
        {step === 'title' ? (
          <>
            <p className="text-xl font-bold leading-snug">What's on your mind?</p>
            <p className="mt-2 text-sm text-muted-foreground">Give your reflection a title</p>
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Today's gratitude, A lesson I learned…"
              className={cn(
                "mt-6 w-full bg-transparent border-0 border-b-2 border-muted-foreground/20 focus:border-primary outline-none resize-none text-base min-h-[80px] placeholder:text-muted-foreground/50 transition-colors",
                titleBiClass
              )}
              dir={titleDir}
            />
          </>
        ) : (
          <>
            <p className="text-xl font-bold leading-snug">{title}</p>
            <p className="mt-2 text-sm text-muted-foreground">Write your thoughts freely</p>
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your reflection…"
              className={cn(
                "mt-6 w-full bg-transparent border-0 border-b-2 border-muted-foreground/20 focus:border-primary outline-none resize-none text-base min-h-[200px] placeholder:text-muted-foreground/50 transition-colors",
                contentBiClass
              )}
              dir={contentDir}
            />
          </>
        )}
      </div>

      {/* FAB */}
      <div
        className="p-6 flex justify-end shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        <button
          onClick={handleNext}
          disabled={saveMutation.isPending}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {step === 'content' ? <Check className="h-6 w-6" /> : <span className="text-lg">→</span>}
        </button>
      </div>
    </div>
  );
}
