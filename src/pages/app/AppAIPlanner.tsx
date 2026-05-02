import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, ArrowUp, RotateCcw, Pencil, Check, ChevronLeft, Crown } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGoBack } from '@/hooks/useGoBack';
import { getLocalDateStr } from '@/lib/localDate';
import { toast } from 'sonner';
import { getFluentEmojiUrl } from '@/lib/fluentEmoji';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallSheet } from '@/components/app/PaywallSheet';

const FREE_AI_PLANNER_USES = 7;
const usesKey = (uid?: string | null) => `ai_planner_uses_${uid || 'anon'}`;
const readUses = (uid?: string | null): number => {
  try { return parseInt(localStorage.getItem(usesKey(uid)) || '0', 10) || 0; } catch { return 0; }
};
const writeUses = (uid: string | null | undefined, n: number) => {
  try { localStorage.setItem(usesKey(uid), String(n)); } catch {}
};

// Brand round-robin pastel palette (matches user task bank)
const BRAND_TASK_COLORS = [
  '#FFE0F5', '#FFE6C9', '#FFF492', '#E2F9F0',
  '#D7E9FF', '#E0FBB8', '#F0E3FF',
];

const HINTS: { emoji: string; key: string }[] = [
  { emoji: '📚', key: 'aiPlannerPage.hintWork' },
  { emoji: '✅', key: 'aiPlannerPage.hintTodos' },
  { emoji: '💜', key: 'aiPlannerPage.hintSocial' },
  { emoji: '🏡', key: 'aiPlannerPage.hintHome' },
];

type Stage = 'input' | 'building' | 'matching' | 'picker' | 'success';

const LOADING_DIALOGUE_KEYS = [
  'aiPlannerPage.loading1',
  'aiPlannerPage.loading2',
  'aiPlannerPage.loading3',
  'aiPlannerPage.loading4',
  'aiPlannerPage.loading5',
];
const DIALOGUE_INTERVAL_MS = 750;
const MIN_LOADING_MS = LOADING_DIALOGUE_KEYS.length * DIALOGUE_INTERVAL_MS;

type TaskKind = 'event' | 'recurring' | 'todo';

interface ExtractedTask {
  id: string;
  label: string;
  emoji: string;
  kind: TaskKind;
  date?: string;
  time?: string;
  duration_minutes?: number;
  recurrence?: 'daily' | 'weekdays' | 'weekly';
}

/**
 * Permanent AI Planner tool — user types/speaks plans, AI extracts
 * structured tasks, user picks which to add. Mirrors the onboarding
 * RiloWeekPlansScreen flow but lives at /app/aiplanner and resets
 * after each successful add so the user can plan again.
 */
export default function AppAIPlanner() {
  const { t } = useTranslation();
  const goBack = useGoBack('/app/home');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSubscribed, isLoading: subLoading } = useSubscription();

  const [usesCount, setUsesCount] = useState<number>(() => readUses(user?.id));
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    setUsesCount(readUses(user?.id));
  }, [user?.id]);

  const remainingFree = Math.max(0, FREE_AI_PLANNER_USES - usesCount);
  const showCounter = !subLoading && !isSubscribed;

  const [stage, setStage] = useState<Stage>('input');
  const [isClosing, setIsClosing] = useState(false);
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice input
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechSupported =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
  };

  const startListening = () => {
    if (!speechSupported) {
      toast.error(t('aiPlannerPage.voiceUnsupported'));
      return;
    }
    if (isListening) { stopListening(); return; }
    haptic.light();
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = (navigator.language || 'en-US');
    const baseText = text;
    rec.onresult = (e: any) => {
      let interim = ''; let final = '';
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
        toast.error(t('aiPlannerPage.micDenied'));
      } else if (e?.error !== 'aborted' && e?.error !== 'no-speech') {
        toast.error(t('aiPlannerPage.voiceFailed'));
      }
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    try { rec.start(); setIsListening(true); } catch { setIsListening(false); }
  };

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch {} }, []);

  const startSequence = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Gating: non-subscribers get FREE_AI_PLANNER_USES lifetime submissions
    if (!subLoading && !isSubscribed) {
      const current = readUses(user?.id);
      if (current >= FREE_AI_PLANNER_USES) {
        haptic.medium();
        setShowPaywall(true);
        return;
      }
      const next = current + 1;
      writeUses(user?.id, next);
      setUsesCount(next);
    }

    haptic.medium();
    setStage('building');
    setDialogueIdx(0);
    setRevealedCount(0);
    const startedAt = Date.now();

    const dialogueTimer = setInterval(() => {
      setDialogueIdx((i) => Math.min(i + 1, LOADING_DIALOGUE_KEYS.length - 1));
      haptic.light();
    }, DIALOGUE_INTERVAL_MS);

    const matchingTimer = setTimeout(() => setStage('matching'), 1400);

    try {
      const today = getLocalDateStr();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';

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
        extracted.push({
          id: `ai-fb-${Date.now()}`,
          label: trimmed.slice(0, 40),
          emoji: '📝',
          kind: 'todo',
        });
      }

      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      await new Promise((r) => setTimeout(r, remaining));
      clearInterval(dialogueTimer);

      setTasks(extracted);
      setSelectedIds(new Set(extracted.map((t) => t.id)));
      setRevealedCount(0);
      setStage('picker');
      haptic.medium();

      extracted.forEach((_, i) => {
        setTimeout(() => {
          haptic.light();
          setRevealedCount((c) => Math.max(c, i + 1));
        }, 220 + i * 180);
      });
    } catch (e: any) {
      clearTimeout(matchingTimer);
      clearInterval(dialogueTimer);
      console.error('[AppAIPlanner] extract failed', e);
      toast.error(e?.message || t('aiPlannerPage.extractFailed'));
      setStage('input');
    }
  };

  const resetAll = () => {
    setStage('input');
    setTasks([]);
    setSelectedIds(new Set());
    setText('');
    setTimeout(() => textareaRef.current?.focus(), 50);
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

  // Slide the sheet down before navigating back, mirroring the success exit
  const handleBack = () => {
    haptic.light();
    setIsClosing(true);
    setTimeout(() => goBack(), 320);
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
    const chosen = tasks.filter((t) => selectedIds.has(t.id));

    if (user?.id && chosen.length > 0) {
      try {
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
            tag: 'AI Planner',
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
            base.repeat_pattern = 'none';
            base.scheduled_date = getLocalDateStr();
          }
          return base;
        });

        const { error: insErr } = await supabase.from('user_tasks').insert(rows);
        if (insErr) {
          console.warn('[AppAIPlanner] insert error', insErr.message);
          toast.error(t('aiPlannerPage.saveFailed'));
          return;
        }
      } catch (e) {
        console.warn('[AppAIPlanner] persist failed', e);
        toast.error(t('aiPlannerPage.saveFailed'));
        return;
      }
    }

    setStage('success');
    // After the green banner shows, slide the sheet down then navigate Home.
    setTimeout(() => setIsClosing(true), 1200);
    setTimeout(() => navigate('/app/home'), 1700);
  };

  const selectedCount = selectedIds.size;

  return (
    <>
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: isClosing ? '100%' : 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
      className="fixed inset-0 w-full flex flex-col overflow-hidden z-[10001]"
      style={{
        background:
          stage === 'input'
            ? 'linear-gradient(160deg, #FFD6C2 0%, #FFC9D9 30%, #F5D4F0 60%, #E8D9FF 100%)'
            : '#FFFFFF',
        transition: 'background 400ms ease',
      }}
    >
      {/* Back button (always visible) */}
      <div
        className="absolute left-0 top-0 z-40 px-4 py-2 flex items-center"
        style={{ paddingTop: 'env(safe-area-inset-top, 44px)' }}
      >
        <button
          onClick={handleBack}
          className="h-9 w-9 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center active:opacity-60"
          aria-label={t('aiPlannerPage.back')}
        >
          <ChevronLeft className="h-5 w-5 text-[#1a1f3d]" />
        </button>
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {stage === 'success' && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="absolute inset-x-0 top-0 z-30 px-4 pb-3"
            style={{ background: '#A98AF0', paddingTop: 'calc(env(safe-area-inset-top, 44px) + 12px)' }}
          >
            <p className="text-center text-white font-semibold text-[15px]">
              {t(selectedCount === 1 ? 'aiPlannerPage.successOne' : 'aiPlannerPage.successMany', { count: selectedCount })}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INPUT stage */}
      {stage === 'input' && (
        <>
          <div className="shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 44px)' }} />
          {/* Plus upsell banner — only for non-subscribers, slides up out of screen on submit */}
          <AnimatePresence>
            {showCounter && (
              <motion.button
                key="plus-banner"
                type="button"
                onClick={() => { haptic.medium(); setShowPaywall(true); }}
                initial={{ y: -120, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -160, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className="relative mx-4 mt-14 rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform shadow-ios"
                style={{
                  background:
                    'linear-gradient(120deg, #1a1f3d 0%, #3d2a5c 45%, #6b3d7a 100%)',
                }}
              >
                {/* Shimmer overlay */}
                <motion.div
                  aria-hidden
                  initial={{ x: '-120%' }}
                  animate={{ x: '220%' }}
                  transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-y-0 w-1/3"
                  style={{
                    background:
                      'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                  }}
                />
                {/* Glow blob */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-60 blur-2xl"
                  style={{ background: 'radial-gradient(circle, #FFB37A 0%, transparent 70%)' }}
                />
                <div className="relative flex items-center gap-3 p-3.5">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #FFD27A 0%, #FF8A5C 100%)',
                      boxShadow: '0 6px 16px -6px rgba(255,138,92,0.7)',
                    }}
                  >
                    <Crown className="h-5 w-5 text-[#1a1f3d]" strokeWidth={2.4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-[14px] leading-tight">
                      Unlock unlimited AI planning
                    </p>
                    <p className="text-white/70 text-[12px] leading-tight mt-0.5">
                      {remainingFree > 0
                        ? `${remainingFree} free ${remainingFree === 1 ? 'plan' : 'plans'} left · Get Plus`
                        : 'You\u2019re out of free plans · Get Plus'}
                    </p>
                    <p
                      className="text-[11px] font-semibold leading-tight mt-1"
                      style={{ color: '#FFD27A' }}
                    >
                      Start your 7-day free trial →
                    </p>
                  </div>
                  <div className="shrink-0 h-7 px-2.5 rounded-full bg-white/15 backdrop-blur flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#FFD27A]" />
                    <span className="text-white text-[11px] font-bold tracking-wide">PLUS</span>
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
          <div className="flex-1" />
          <div className="shrink-0 px-6 pb-4">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[28px] leading-[1.15] font-bold text-[#1a1f3d]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {t('aiPlannerPage.title')}
            </motion.h1>

            <motion.ul
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-4 space-y-1.5"
            >
              {HINTS.map((h) => (
                <li key={h.key} className="flex items-center gap-2 text-[15px] text-[#1a1f3d]">
                  <img
                    src={getFluentEmojiUrl(h.emoji)}
                    alt=""
                    className="h-[18px] w-[18px] shrink-0"
                    loading="lazy"
                  />
                  <span className="font-medium">{t(h.key)}</span>
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
                placeholder={t('aiPlannerPage.placeholder')}
                rows={4}
                className="w-full rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 px-4 py-3.5 pr-14 text-[15px] text-[#1a1f3d] placeholder:text-[#1a1f3d]/40 outline-none focus:bg-white/90 transition-colors resize-none"
              />
              {text.trim() ? (
                <button
                  type="button"
                  onClick={() => startSequence(text)}
                  className="absolute right-3 bottom-3 h-10 w-10 rounded-full bg-black flex items-center justify-center active:scale-95 transition-transform"
                  aria-label={t('aiPlannerPage.submit')}
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
                  aria-label={isListening ? t('aiPlannerPage.stopVoice') : t('aiPlannerPage.startVoice')}
                >
                  <Mic className="h-4 w-4 text-white" />
                </button>
              )}
            </motion.div>
          </div>
          <div
            className="shrink-0"
            style={{ height: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
          />
        </>
      )}

      {/* BUILDING / MATCHING / PICKER / SUCCESS */}
      {stage !== 'input' && (
        <div
          className="flex-1 flex flex-col px-5 overflow-hidden"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 44px) + 56px)' }}
        >
          {/* User prompt bubble */}
          <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="shrink-0"
          >
            <div className="w-full rounded-2xl bg-white border border-black/10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] px-4 py-3 flex items-start gap-2.5">
              <Sparkles className="h-[18px] w-[18px] text-[#A98AF0] shrink-0 mt-0.5" />
              <p
                className="text-[15px] font-semibold text-[#1a1f3d] leading-snug overflow-hidden"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {text}
              </p>
            </div>
            {(stage === 'building' || stage === 'matching' || stage === 'picker') && (
              <div className="mt-2.5 flex items-center justify-end gap-3 pr-1">
                <button
                  onClick={handleReset}
                  className="h-8 w-8 flex items-center justify-center text-[#1a1f3d]/70 active:opacity-60"
                  aria-label={t('aiPlannerPage.reset')}
                >
                  <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
                <button
                  onClick={handleEditPrompt}
                  className="h-8 w-8 flex items-center justify-center text-[#1a1f3d]/70 active:opacity-60"
                  aria-label={t('aiPlannerPage.edit')}
                >
                  <Pencil className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
              </div>
            )}
          </motion.div>

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
                  key={`dlg-${dialogueIdx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4 }}
                  className="mt-10 text-[24px] font-bold text-[#1a1f3d] text-center px-6"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {t(LOADING_DIALOGUE_KEYS[dialogueIdx])}
                </motion.h2>
              </motion.div>
            )}

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
                  {t('aiPlannerPage.pickTitle')}
                </h2>
                <div className="flex-1 overflow-y-auto space-y-2.5 pb-32 -mx-1 px-1">
                  {tasks.map((task, idx) => {
                    const isSelected = selectedIds.has(task.id);
                    const chipBg = BRAND_TASK_COLORS[idx % BRAND_TASK_COLORS.length];
                    const visible = idx < revealedCount;
                    return (
                      <motion.button
                        key={task.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => toggleSelect(task.id)}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 text-left active:scale-[0.99] transition-all',
                          isSelected ? 'border-black/10' : 'border-black/5 opacity-60',
                          !visible && 'pointer-events-none',
                        )}
                      >
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
                            <span>{describeSchedule(task, t)}</span>
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
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {stage === 'success' && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1" />
            )}
          </AnimatePresence>

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
                    {t(selectedCount === 1 ? 'aiPlannerPage.addTask' : 'aiPlannerPage.addTasks', { count: selectedCount })}
                  </span>
                  <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
    <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
    </>
  );
}

function PulsingOrb() {
  return (
    <div className="relative h-[150px] w-[150px] flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.25, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,170,150,0.5) 0%, rgba(255,170,150,0) 70%)',
        }}
      />
      <div
        className="absolute h-[130px] w-[130px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,214,224,0.9) 0%, rgba(255,214,224,0.3) 60%, transparent 80%)',
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative h-[110px] w-[110px] rounded-full shadow-[0_10px_30px_-8px_rgba(220,120,140,0.45)]"
        style={{
          background:
            'radial-gradient(circle at 35% 30%, #FFE0CC 0%, #FFB6C7 45%, #E8A4D8 100%)',
        }}
      />
    </div>
  );
}

function describeSchedule(task: ExtractedTask, t: (k: string) => string): string {
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
  if (task.kind === 'event') {
    let when = '';
    if (task.date) {
      try {
        const d = new Date(task.date + 'T00:00:00');
        when = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      } catch { when = task.date; }
    }
    const time = task.time ? ` ${t('aiPlannerPage.scheduleAt')} ${fmtTime(task.time)}` : '';
    return `${when}${time}${fmtDur(task.duration_minutes)}`.trim() || t('aiPlannerPage.scheduleEvent');
  }
  if (task.kind === 'recurring') {
    const label =
      task.recurrence === 'weekdays' ? t('aiPlannerPage.scheduleWeekdays')
        : task.recurrence === 'weekly' ? t('aiPlannerPage.scheduleWeekly')
          : t('aiPlannerPage.scheduleDaily');
    const time = task.time ? ` ${t('aiPlannerPage.scheduleAt')} ${fmtTime(task.time)}` : '';
    return `${label}${time}${fmtDur(task.duration_minutes)}`;
  }
  return t('aiPlannerPage.scheduleTodo');
}