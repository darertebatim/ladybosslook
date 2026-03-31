import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useBilingualText } from '@/components/ui/BilingualText';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { useAutoCompleteProTask } from '@/hooks/useAutoCompleteProTask';
import { format } from 'date-fns';
import { Lightbulb } from 'lucide-react';
import { JournalPromptMarquee } from '@/components/app/JournalPromptMarquee';
import { MoodSelector } from '@/components/app/MoodSelector';

const BULLET_COLOR = 'hsl(var(--muted-foreground) / 0.4)';

function BulletLineInput({ inputRef, value, onChange, onKeyDown, placeholder }: {
  inputRef: (el: HTMLInputElement | null) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  const { className: biClass, direction: dir } = useBilingualText(value);
  const isRtl = dir === 'rtl';
  return (
    <div className={cn("flex items-start gap-3 w-full", isRtl && "flex-row-reverse")}>
      <div
        className="w-3 h-3 rounded-sm mt-[5px] shrink-0 transition-colors"
        style={{ backgroundColor: BULLET_COLOR }}
      />
      <input
        ref={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        dir={dir}
        className={cn("flex-1 bg-transparent border-0 outline-none text-base placeholder:text-muted-foreground/40", biClass)}
      />
    </div>
  );
}

export default function AppFreeFormReflection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { autoCompleteJournal } = useAutoCompleteProTask();
  const [searchParams] = useSearchParams();

  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* not available */ }
  const hasActivePlayer = routinePlayer?.isActive && routinePlayer?.isMinimized;

  const [title, setTitle] = useState('');
  const [lines, setLines] = useState<string[]>(['']);
  const [mood, setMood] = useState<string | null>(searchParams.get('mood') || null);
  const [showPrompts, setShowPrompts] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const lineRefs = useRef<(HTMLInputElement | null)[]>([]);
  const justAddedLine = useRef(false);

  const { className: titleBiClass, direction: titleDir } = useBilingualText(title);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 200);
  }, []);

  // Focus newly added line
  useEffect(() => {
    if (justAddedLine.current) {
      const lastRef = lineRefs.current[lines.length - 1];
      lastRef?.focus();
      justAddedLine.current = false;
    }
  }, [lines.length]);

  const contentForSave = lines.filter(l => l.trim()).join('\n');

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!title.trim() && !contentForSave) throw new Error('Please write something');
      const finalTitle = title.trim() || `Reflection`;
      const { error } = await supabase
        .from('free_form_reflections' as any)
        .insert({ user_id: user.id, title: finalTitle, content: contentForSave, mood: mood || null } as any);
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['reflection-notes'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      await autoCompleteJournal();
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

  const handleLineChange = useCallback((index: number, value: string) => {
    setLines(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleLineKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setLines(prev => {
        const next = [...prev];
        next.splice(index + 1, 0, '');
        return next;
      });
      justAddedLine.current = true;
    } else if (e.key === 'Backspace' && lines[index] === '' && index > 0) {
      e.preventDefault();
      setLines(prev => {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });
      // Focus previous line
      setTimeout(() => lineRefs.current[index - 1]?.focus(), 0);
    }
  }, [lines]);

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
          disabled={saveMutation.isPending || (!title.trim() && !contentForSave)}
          className="px-5 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40"
        >
          Done
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-4 overflow-y-auto overscroll-contain" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        {/* Date */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          TODAY, {today.toUpperCase()}
        </p>

        {/* Title row with lamp button */}
        <div className="flex items-start gap-2">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reflections"
            rows={1}
            className={cn(
              "flex-1 bg-transparent border-0 outline-none resize-none text-2xl font-bold mt-1 placeholder:text-foreground/30",
              titleBiClass
            )}
            dir={titleDir}
            style={{ minHeight: '40px' }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = t.scrollHeight + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                lineRefs.current[0]?.focus();
              }
            }}
          />
          {!title.trim() && (
            <button
              onClick={() => setShowPrompts(prev => !prev)}
              className={cn(
                "mt-2 p-2 rounded-full transition-colors shrink-0",
                showPrompts ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"
              )}
            >
              <Lightbulb className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Prompt box */}
        {showPrompts && (
          <div className="mt-2">
            <JournalPromptMarquee onSelect={(prompt) => {
              setTitle(prompt);
              setShowPrompts(false);
              titleRef.current?.focus();
            }} />
          </div>
        )}

        {/* Bullet entries */}
        <div className="mt-3 space-y-1.5">
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div
                className="w-3 h-3 rounded-sm mt-[5px] shrink-0 transition-colors"
                style={{ backgroundColor: BULLET_COLOR }}
              />
              <BulletLineInput
                inputRef={(el) => { lineRefs.current[idx] = el; }}
                value={line}
                onChange={(e) => handleLineChange(idx, e.target.value)}
                onKeyDown={(e) => handleLineKeyDown(idx, e)}
                placeholder={idx === 0 ? 'Write your thoughts…' : ''}
              />
            </div>
          ))}
        </div>

        {/* Mood selector */}
        <div className="mt-6">
          <p className="text-xs font-medium text-muted-foreground mb-2">How are you feeling?</p>
          <MoodSelector value={mood} onChange={(m) => setMood(m)} showHeader={false} />
        </div>
      </div>
    </div>
  );
}
