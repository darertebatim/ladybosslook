import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useBilingualText } from '@/components/ui/BilingualText';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { format } from 'date-fns';

export default function AppFreeFormReflection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* not available */ }
  const hasActivePlayer = routinePlayer?.isActive && routinePlayer?.isMinimized;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const { className: titleBiClass, direction: titleDir } = useBilingualText(title);
  const { className: contentBiClass, direction: contentDir } = useBilingualText(content);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 200);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!title.trim()) throw new Error('Please write a title');
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
    onError: (e: any) => toast.error(e.message || 'Failed to save'),
  });

  const today = format(new Date(), 'EEEE, MMM d');

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div
        className="px-4 pb-2 flex items-center justify-between shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground active:scale-95 transition-transform">
          Cancel
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !title.trim()}
          className="px-5 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40"
        >
          Done
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-4 overflow-y-auto overscroll-contain" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        {/* Date */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {today}
        </p>

        {/* Title */}
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Reflections"
          rows={1}
          className={cn(
            "w-full bg-transparent border-0 outline-none resize-none text-2xl font-bold mt-1 placeholder:text-foreground/30",
            titleBiClass
          )}
          dir={titleDir}
          style={{ minHeight: '40px' }}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = 'auto';
            t.style.height = t.scrollHeight + 'px';
          }}
        />

        {/* Content entries */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts…"
          className={cn(
            "w-full bg-transparent border-0 outline-none resize-none text-base mt-2 placeholder:text-muted-foreground/50 leading-relaxed",
            contentBiClass
          )}
          dir={contentDir}
          style={{ minHeight: '300px' }}
        />
      </div>
    </div>
  );
}
