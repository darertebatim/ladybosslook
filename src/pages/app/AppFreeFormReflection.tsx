import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useGoBack } from '@/hooks/useGoBack';
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
import { ReflectionCelebrationSheet } from '@/components/reflection/ReflectionCelebrationSheet';
import { runWithOfflineFallback } from '@/lib/offline/runWithOfflineFallback';
import {
  WELLNESS_EXECUTOR_TYPES,
  type CreateReflectionPayload,
} from '@/lib/offline/executors/wellnessExecutors';
import { recordMoment } from '@/lib/moments';

const BULLET_COLOR = 'hsl(var(--muted-foreground) / 0.4)';

function BulletLineInput({ inputRef, value, onChange, onKeyDown, placeholder }: {
  inputRef: (el: HTMLTextAreaElement | null) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
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
      <textarea
        ref={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        dir={dir}
        rows={1}
        className={cn("flex-1 bg-transparent border-0 outline-none text-base placeholder:text-muted-foreground/40 resize-none overflow-hidden", biClass)}
        onInput={(e) => {
          const t = e.currentTarget;
          t.style.height = 'auto';
          t.style.height = t.scrollHeight + 'px';
        }}
      />
    </div>
  );
}

export default function AppFreeFormReflection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = useGoBack('/app/reflections');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { autoCompleteJournal } = useAutoCompleteProTask();
  const [searchParams] = useSearchParams();
  const promptPrefill = searchParams.get('prompt') || '';

  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* not available */ }
  const hasActivePlayer = routinePlayer?.isActive && routinePlayer?.isMinimized;

  const [title, setTitle] = useState(promptPrefill);
  const [lines, setLines] = useState<string[]>(['']);
  const [mood, setMood] = useState<string | null>(searchParams.get('mood') || null);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const lineRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const justAddedLine = useRef(false);

  const { className: titleBiClass, direction: titleDir } = useBilingualText(title);

  useEffect(() => {
    setTimeout(() => {
      if (titleRef.current) {
        titleRef.current.focus();
        titleRef.current.style.height = 'auto';
        titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
      }
    }, 200);
  }, []);

  useEffect(() => {
    if (promptPrefill && !title.trim()) {
      setTitle(promptPrefill);
    }
    // Auto-resize title when prefilled
    setTimeout(() => {
      if (titleRef.current) {
        titleRef.current.style.height = 'auto';
        titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
      }
    }, 50);
  }, [promptPrefill]);

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
      if (!title.trim() && !contentForSave) throw new Error(t('reflection.writeSomething'));
      const finalTitle = title.trim() || t('reflection.defaultTitle');
      const clientId = crypto.randomUUID();
      const payload: CreateReflectionPayload = {
        clientId,
        userId: user.id,
        title: finalTitle,
        content: contentForSave,
        mood: mood || null,
      };
      const nowIso = new Date().toISOString();
      await runWithOfflineFallback({
        type: WELLNESS_EXECUTOR_TYPES.CREATE_REFLECTION,
        payload,
        fastPath: async () => {
          const { error } = await supabase
            .from('free_form_reflections' as any)
            .insert({
              id: clientId,
              user_id: user.id,
              title: finalTitle,
              content: contentForSave,
              mood: mood || null,
            } as any);
          if (error) throw error;
          return null;
        },
      });

      void recordMoment({
        userId: user.id,
        kind: 'reflection',
        title: finalTitle,
        emoji: '✍️',
        payload: { ref_id: clientId },
      });

      // Optimistically inject this note into all reflection-notes caches so it
      // appears in the list instantly — even fully offline. The list query
      // re-reads from the cache via placeholderData, so any mutation here is
      // reflected on next render.
      const optimisticNote = {
        id: clientId,
        type: 'free' as const,
        title: finalTitle,
        cover: null,
        completed_at: nowIso,
        preview: contentForSave || null,
        mood: mood || null,
      };
      queryClient.setQueriesData<any[]>({ queryKey: ['reflection-notes'] }, (prev) => {
        if (!Array.isArray(prev)) return [optimisticNote];
        // Avoid duplicates if we somehow saved twice
        if (prev.some((n) => n.id === clientId)) return prev;
        return [optimisticNote, ...prev];
      });
      queryClient.setQueriesData<any[]>({ queryKey: ['journal-entries'] }, (prev) => {
        if (!Array.isArray(prev)) return prev;
        if (prev.some((n: any) => n.id === clientId)) return prev;
        return [
          {
            id: clientId,
            user_id: user.id,
            title: finalTitle,
            content: contentForSave,
            mood: mood || null,
            shared_with_admin: null,
            shared_at: null,
            created_at: nowIso,
            updated_at: nowIso,
          },
          ...prev,
        ];
      });
    },
    onSuccess: () => {
      // Show celebration immediately — saving the note is the success path.
      setShowCelebration(true);

      // Fire-and-forget: refresh from server when online, and try to mark any
      // linked "journal" pro-task as complete. Neither of these can block
      // the success UI (critical for offline mode where they would hang).
      queryClient.invalidateQueries({ queryKey: ['reflection-notes'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      void (async () => {
        try {
          await autoCompleteJournal();
        } catch (err) {
          // Non-fatal: pro-task completion will catch up next time we're online.
          console.warn('[Reflection] autoCompleteJournal deferred:', err);
        }
      })();
    },
    onError: (e: any) => toast.error(e.message || t('reflection.saveFailed')),
  });

  const handleLineChange = useCallback((index: number, value: string) => {
    setLines(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleLineKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.currentTarget;
      const cursorPos = target.selectionStart || 0;
      const currentValue = lines[index];
      const before = currentValue.slice(0, cursorPos);
      const after = currentValue.slice(cursorPos);
      setLines(prev => {
        const next = [...prev];
        next[index] = before;
        next.splice(index + 1, 0, after);
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
        <button onClick={() => goBack()} className="text-sm text-muted-foreground active:scale-95 transition-transform">
          {t('reflection.cancel')}
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || (!title.trim() && !contentForSave)}
          className="px-5 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40"
        >
          {t('reflection.done')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-4 overflow-y-auto overscroll-contain" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        {/* Date */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {t('reflection.today')}, {today.toUpperCase()}
        </p>

        {/* Title row with lamp button */}
        <div className="flex items-start gap-2">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('reflection.placeholderTitle')}
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
            <BulletLineInput
              key={idx}
              inputRef={(el) => { lineRefs.current[idx] = el; }}
              value={line}
              onChange={(e) => handleLineChange(idx, e.target.value)}
              onKeyDown={(e) => handleLineKeyDown(idx, e)}
              placeholder={idx === 0 ? t('reflection.writeThoughts') : ''}
            />
          ))}
        </div>

        {/* Mood selector */}
        <div className="mt-6">
          <p className="text-xs font-medium text-muted-foreground mb-2">{t('reflection.howFeeling')}</p>
          <MoodSelector value={mood} onChange={(m) => setMood(m)} showHeader={false} />
        </div>
      </div>

      <ReflectionCelebrationSheet
        open={showCelebration}
        onOpenChange={setShowCelebration}
        onDone={() => goBack()}
      />
    </div>
  );
}
