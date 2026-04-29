import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, ArrowUp, RotateCcw, Pencil, Check } from 'lucide-react';
import { OnboardingStep } from '@/types/onboarding';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateStr } from '@/lib/localDate';
import { toast } from 'sonner';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';

// Brand round-robin pastel palette (matches user task bank)
const BRAND_TASK_COLORS = [
  '#FFE0F5', // pink
  '#FFE6C9', // peach
  '#FFF492', // yellow
  '#E2F9F0', // lime
  '#D7E9FF', // sky
  '#E0FBB8', // mint
  '#F0E3FF', // lavender
];

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
}

const HINTS: { emoji: string; label: string }[] = [
  { emoji: '📚', label: 'Work or school' },
  { emoji: '✅', label: 'To-dos and errands' },
  { emoji: '💜', label: 'Social plans' },
  { emoji: '🏡', label: 'Home & family' },
];

type Stage = 'input' | 'building' | 'matching' | 'picker' | 'success';

type TaskKind = 'event' | 'recurring' | 'todo';

interface ExtractedTask {
  id: string;
  label: string;
  emoji: string;
  kind: TaskKind;
  date?: string;            // YYYY-MM-DD
  time?: string;            // HH:MM
  duration_minutes?: number;
  recurrence?: 'daily' | 'weekdays' | 'weekly';
}

/**
 * Final onboarding screen — "Any other plans this week?" with a fake-AI
 * extraction sequence. Stages:
 *   input   → typing UI (white card + hints)
 *   building → user bubble at top + orb + "Building your tasks…"
 *   matching → same + "Matching the right titles…"
 *   picker   → "Pick tasks for your plan" list with select/reset/edit
 *   success  → green banner → auto-advance
 */
export function RiloWeekPlansScreen({ step, onNext, onAnswer }: Props) {
  const [stage, setStage] = useState<Stage>('input');
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  // ── Voice input (Web Speech API) ────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechSupported =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
  };

  const startListening = () => {
    if (!speechSupported) {
      toast.error("Voice input isn't supported on this device");
      return;
    }
    if (isListening) {
      stopListening();
      return;
    }
    haptic.light();
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = (navigator.language || 'en-US');

    const baseText = text;
    rec.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      const combined = [baseText, final, interim].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      setText(combined);
    };
    rec.onerror = (e: any) => {
      setIsListening(false);
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        toast.error('Microphone permission denied');
      } else if (e?.error !== 'aborted' && e?.error !== 'no-speech') {
        toast.error('Voice input failed');
      }
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, []);

  // ── Submit / sequence ───────────────────────────────────────
  const startSequence = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    haptic.medium();
    setStage('building');

    // Visual stage transition shortly before the network call resolves.
    const matchingTimer = setTimeout(() => setStage('matching'), 1400);

    try {
      const today = getLocalDateStr();
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';

      const { data, error } = await supabase.functions.invoke('extract-week-tasks', {
        body: { text: trimmed, today, timezone },
      });

      clearTimeout(matchingTimer);

      if (error) throw error;
      const aiTasks: any[] = Array.isArray(data?.tasks) ? data.tasks : [];

      const extracted: ExtractedTask[] = aiTasks
        .filter((t) => t && typeof t.title === 'string')
        .slice(0, 8)
        .map((t, i) => ({
          id: `ai-${i}-${Date.now()}`,
          label: t.title,
          emoji: typeof t.emoji === 'string' && t.emoji ? t.emoji : '✨',
          kind: (['event', 'recurring', 'todo'].includes(t.kind) ? t.kind : 'todo') as TaskKind,
          date: t.date,
          time: t.time,
          duration_minutes: typeof t.duration_minutes === 'number' ? t.duration_minutes : undefined,
          recurrence: ['daily', 'weekdays', 'weekly'].includes(t.recurrence) ? t.recurrence : undefined,
        }));

      if (extracted.length === 0) {
        // Graceful fallback: still let the user proceed with one to-do
        extracted.push({
          id: `ai-fb-${Date.now()}`,
          label: trimmed.slice(0, 40),
          emoji: '📝',
          kind: 'todo',
        });
      }

      setTasks(extracted);
      setSelectedIds(new Set(extracted.map((t) => t.id)));
      setStage('picker');
      haptic.light();
    } catch (e: any) {
      clearTimeout(matchingTimer);
      console.error('[RiloWeekPlans] extract failed', e);
      toast.error(e?.message || 'Could not build your tasks. Try again.');
      setStage('input');
    }
  };

  const handleReset = () => {
    haptic.light();
    setStage('input');
    setTasks([]);
    setSelectedIds(new Set());
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleEditPrompt = () => {
    haptic.light();
    setStage('input');
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const toggleSelect = (id: string) => {
    haptic.light();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddTasks = async () => {
    if (selectedIds.size === 0) return;
    haptic.medium();
    const chosen = tasks
      .filter((t) => selectedIds.has(t.id))
      ;
    if (onAnswer) onAnswer(step.id, chosen.map((t) => t.label));

    // Persist to user_tasks so they appear on the planner immediately.
    if (user?.id && chosen.length > 0) {
      try {
        // Place above existing tasks, like provisionRiloPicks does.
        const { data: minRow } = await supabase
          .from('user_tasks')
          .select('order_index')
          .eq('user_id', user.id)
          .order('order_index', { ascending: true })
          .limit(1)
          .maybeSingle();
        const minOrder = (minRow?.order_index as number | null | undefined) ?? 0;
        const startOrder = minOrder - chosen.length;

        const COLORS = ['sky', 'mint', 'lavender', 'pink', 'lime', 'yellow', 'peach'];

        const rows = chosen.map((t, i) => {
          const base: any = {
            user_id: user.id,
            title: t.label,
            emoji: t.emoji,
            color: COLORS[i % COLORS.length],
            tag: 'My Week',
            is_active: true,
            order_index: startOrder + i,
          };
          if (t.duration_minutes) base.duration_minutes = t.duration_minutes;

          if (t.kind === 'event') {
            base.scheduled_date = t.date || getLocalDateStr();
            if (t.time) base.scheduled_time = t.time.length === 5 ? `${t.time}:00` : t.time;
            base.repeat_pattern = 'none';
          } else if (t.kind === 'recurring') {
            base.repeat_pattern = t.recurrence || 'daily';
            if (t.time) base.scheduled_time = t.time.length === 5 ? `${t.time}:00` : t.time;
          } else {
            // todo
            base.repeat_pattern = 'none';
            base.scheduled_date = getLocalDateStr();
          }
          return base;
        });

        const { error: insErr } = await supabase.from('user_tasks').insert(rows);
        if (insErr) console.warn('[RiloWeekPlans] insert error', insErr.message);
      } catch (e) {
        console.warn('[RiloWeekPlans] persist failed', e);
      }
    }

    setStage('success');
    setTimeout(() => onNext(), 1700);
  };

  const handleSkip = () => {
    haptic.light();
    if (onAnswer) onAnswer(step.id, '');
    onNext();
  };

  const selectedCount = selectedIds.size;

  return (
    <div
      className="h-full w-full flex flex-col relative overflow-hidden"
      style={{
        background:
          stage === 'input'
            ? 'linear-gradient(170deg, #FFE4D6 0%, #FFE9DC 35%, #FFF1E6 65%, #FFF8F1 100%)'
            : stage === 'success'
              ? 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)'
              : '#FFFFFF',
        transition: 'background 400ms ease',
      }}
    >
      {/* ── Top success banner (stage: success) ────────────── */}
      <AnimatePresence>
        {stage === 'success' && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="absolute inset-x-0 top-0 z-30 px-4 pt-4 pb-3"
            style={{ background: '#A98AF0' }}
          >
            <p className="text-center text-white font-semibold text-[15px]">
              ✨ {selectedCount} task{selectedCount === 1 ? '' : 's'} successfully added to your plan ✨
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INPUT stage (original UI) ───────────────────────── */}
      {stage === 'input' && (
        <>
          <div className="shrink-0 px-6 pt-2 flex justify-end">
            <button
              onClick={handleSkip}
              className="text-[14px] font-medium text-[#1a1f3d]/70 active:opacity-60 px-2 py-1.5"
            >
              Skip
            </button>
          </div>
          <div className="flex-1" />
          <div className="shrink-0 px-6 pb-4">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[28px] leading-[1.15] font-bold text-[#1a1f3d]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {step.title || 'Any other plans this week?'}
            </motion.h1>

            <motion.ul
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-4 space-y-1.5"
            >
              {HINTS.map((h) => (
                <li
                  key={h.label}
                  className="flex items-center gap-2 text-[15px] text-[#1a1f3d]"
                >
                  <span className="text-base leading-none">{h.emoji}</span>
                  <span className="font-medium">{h.label}</span>
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="mt-5 relative"
            >
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write or speak your plans"
                rows={4}
                className="w-full rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-3.5 pr-14 text-[15px] text-[#1a1f3d] placeholder:text-[#1a1f3d]/40 outline-none focus:bg-white/90 transition-colors resize-none"
              />
              {text.trim() ? (
                <button
                  type="button"
                  onClick={() => startSequence(text)}
                  className="absolute right-3 bottom-3 h-10 w-10 rounded-full bg-black flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="Submit"
                >
                  <ArrowUp className="h-4 w-4 text-white" strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startListening}
                  className={cn(
                    'absolute right-3 bottom-3 h-10 w-10 rounded-full flex items-center justify-center active:scale-95 transition-all',
                    isListening ? 'bg-red-500 animate-pulse' : 'bg-black',
                    !speechSupported && 'opacity-50',
                  )}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  <Mic className="h-4 w-4 text-white" />
                </button>
              )}
            </motion.div>
          </div>
          <div className="shrink-0 h-6" />
        </>
      )}

      {/* ── BUILDING / MATCHING / PICKER / SUCCESS stages ──── */}
      {stage !== 'input' && (
        <div className="flex-1 flex flex-col px-5 pt-14 overflow-hidden">
          {/* User prompt bubble */}
          <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="shrink-0"
          >
            <div className="w-full rounded-2xl bg-white border border-black/10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center gap-2.5">
              <Sparkles className="h-[18px] w-[18px] text-[#A98AF0] shrink-0" />
              <p className="text-[16px] font-semibold text-[#1a1f3d] truncate">
                {text}
              </p>
            </div>
            {/* Reset / edit row */}
            {(stage === 'building' || stage === 'matching' || stage === 'picker') && (
              <div className="mt-2.5 flex items-center justify-end gap-3 pr-1">
                <button
                  onClick={handleReset}
                  className="h-8 w-8 flex items-center justify-center text-[#1a1f3d]/70 active:opacity-60"
                  aria-label="Reset"
                >
                  <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
                <button
                  onClick={handleEditPrompt}
                  className="h-8 w-8 flex items-center justify-center text-[#1a1f3d]/70 active:opacity-60"
                  aria-label="Edit"
                >
                  <Pencil className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
              </div>
            )}
          </motion.div>

          {/* Loading orb (building / matching) */}
          <AnimatePresence mode="wait">
            {(stage === 'building' || stage === 'matching') && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center pb-24"
              >
                <PulsingOrb />
                <motion.h2
                  key={stage}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-10 text-[24px] font-bold text-[#1a1f3d]"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {stage === 'building' ? 'Building your tasks…' : 'Matching the right titles…'}
                </motion.h2>
              </motion.div>
            )}

            {/* Picker stage */}
            {stage === 'picker' && (
              <motion.div
                key="picker"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex-1 flex flex-col mt-5 overflow-hidden"
              >
                <h2
                  className="text-[26px] font-bold text-[#1a1f3d] mb-3 px-1"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  Pick tasks for your plan
                </h2>
                <div className="flex-1 overflow-y-auto space-y-2.5 pb-32 -mx-1 px-1">
                  {tasks.map((task, idx) => {
                    const isSelected = selectedIds.has(task.id);
                    const chipBg = BRAND_TASK_COLORS[idx % BRAND_TASK_COLORS.length];
                    return (
                      <button
                        key={task.id}
                        onClick={() => toggleSelect(task.id)}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 text-left active:scale-[0.99] transition-all',
                          isSelected ? 'border-black/10' : 'border-black/5 opacity-60',
                        )}
                      >
                        {/* Emoji chip */}
                        <div
                          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: chipBg }}
                        >
                          <img
                            src={getFluentEmojiUrl(task.emoji)}
                            alt={task.emoji}
                            width={26}
                            height={26}
                            className="select-none pointer-events-none"
                            onError={(e) => {
                              const img = e.currentTarget;
                              img.style.display = 'none';
                              const parent = img.parentElement;
                              if (parent && !parent.querySelector('.fallback-emoji')) {
                                const span = document.createElement('span');
                                span.className = 'fallback-emoji text-[22px] leading-none';
                                span.textContent = task.emoji;
                                parent.appendChild(span);
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-[#1a1f3d] truncate">
                            {task.label}
                          </p>
                          <p className="text-[12px] text-[#1a1f3d]/50 mt-0.5 flex items-center gap-1">
                            <span>{task.kind === 'recurring' ? '🔁' : '📅'}</span>
                            <span>{describeSchedule(task)}</span>
                          </p>
                        </div>
                        <div
                          className={cn(
                            'h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all',
                            isSelected ? 'bg-[#22C55E]' : 'bg-black/10',
                          )}
                        >
                          {isSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Success — keep picker visually faded */}
            {stage === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1"
              />
            )}
          </AnimatePresence>

          {/* Add tasks CTA */}
          <AnimatePresence>
            {stage === 'picker' && (
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-3 bg-gradient-to-t from-white via-white to-white/0"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
              >
                <button
                  onClick={handleAddTasks}
                  disabled={selectedCount === 0}
                  className={cn(
                    'w-full h-14 rounded-full bg-black text-white flex items-center justify-between px-6 active:scale-[0.98] transition-all',
                    selectedCount === 0 && 'opacity-40',
                  )}
                >
                  <span className="text-[16px] font-bold">
                    Add task{selectedCount === 1 ? '' : 's'} ({selectedCount})
                  </span>
                  <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── The pulsing purple orb (CSS only, matches screenshots) ──
function PulsingOrb() {
  return (
    <div className="relative h-[150px] w-[150px] flex items-center justify-center">
      {/* Outer halo */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.25, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(169,138,240,0.45) 0%, rgba(169,138,240,0) 70%)',
        }}
      />
      {/* Soft ring */}
      <div
        className="absolute h-[130px] w-[130px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(214,201,255,0.9) 0%, rgba(214,201,255,0.3) 60%, transparent 80%)',
        }}
      />
      {/* Core orb */}
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative h-[110px] w-[110px] rounded-full shadow-[0_10px_30px_-8px_rgba(120,90,200,0.5)]"
        style={{
          background:
            'radial-gradient(circle at 35% 30%, #D6C9FF 0%, #B8A4F2 45%, #9C82E8 100%)',
        }}
      />
    </div>
  );
}

// ── Pretty schedule label for the picker row (Tiimo-style) ──
function describeSchedule(t: ExtractedTask): string {
  const fmtTime = (hhmm?: string) => {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isNaN(h)) return '';
    const hr12 = ((h + 11) % 12) + 1;
    const ampm = h < 12 ? 'AM' : 'PM';
    return m ? `${hr12}:${String(m).padStart(2, '0')} ${ampm}` : `${hr12}:00 ${ampm}`;
  };
  const fmtDur = (mins?: number) => {
    if (!mins) return '';
    if (mins % 60 === 0) return ` · ${mins / 60}h`;
    return ` · ${mins}m`;
  };
  if (t.kind === 'event') {
    let when = '';
    if (t.date) {
      try {
        const d = new Date(t.date + 'T00:00:00');
        when = d.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        when = t.date;
      }
    }
    const time = t.time ? ` at ${fmtTime(t.time)}` : '';
    return `${when}${time}${fmtDur(t.duration_minutes)}`.trim() || 'Event';
  }
  if (t.kind === 'recurring') {
    const label =
      t.recurrence === 'weekdays' ? 'Weekdays' : t.recurrence === 'weekly' ? 'Weekly' : 'Daily';
    const time = t.time ? ` at ${fmtTime(t.time)}` : '';
    return `${label}${time}${fmtDur(t.duration_minutes)}`;
  }
  return 'To-do';
}
