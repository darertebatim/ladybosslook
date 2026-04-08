import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { supabase } from '@/integrations/supabase/client';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { computeGapCategories } from '@/utils/selfcare-scoring';
import meplusMascotBg from '@/assets/meplus-mascot-bg.png';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
  answers?: OnboardingAnswers;
}

const CATEGORY_EMOJI: Record<string, string> = {
  calm: '🧘',
  sleep: '😴',
  nutrition: '🥗',
  movement: '🏃',
  Exercise: '💪',
  hygiene: '🧴',
  Presence: '🧠',
  connection: '💬',
  'self-kindness': '💚',
  gratitude: '🙏',
  productivity: '📋',
  TidyUp: '🧹',
  Evening: '🌙',
  LovedOnes: '🥰',
  'easy-win': '✨',
};

const CATEGORY_LABELS: Record<string, string> = {
  calm: 'Calm',
  sleep: 'Sleep',
  nutrition: 'Nutrition',
  movement: 'Movement',
  Exercise: 'Exercise',
  hygiene: 'Hygiene',
  Presence: 'Presence',
  connection: 'Connection',
  'self-kindness': 'Self-Kindness',
  gratitude: 'Gratitude',
  productivity: 'Productivity',
  TidyUp: 'Tidy Up',
  Evening: 'Evening',
  LovedOnes: 'Loved Ones',
  'easy-win': 'Easy Win',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_EMOJI);
const DEFAULT_GAPS = ['calm', 'sleep', 'movement'];

const STATUS_MESSAGES = [
  { title: 'Scanning your habits...', sub: 'Looking at your daily patterns' },
  { title: 'Checking your balance...', sub: `Comparing across ${ALL_CATEGORIES.length} areas` },
  { title: 'Finding hidden gaps...', sub: 'What you might be missing' },
  { title: 'Analyzing priorities...', sub: 'Ranking what matters most' },
  { title: 'Building your profile...', sub: 'Personalizing recommendations' },
  { title: 'Almost there...', sub: 'Preparing your diagnosis' },
];

const buildFallbackDiagnosis = (answers?: OnboardingAnswers) => {
  const gapCategories = computeGapCategories(answers || {});
  return {
    gap_categories: gapCategories,
    suggested_tasks: [],
    ai_insight:
      'You may be carrying more than you realize, and a few self-care areas are asking for your attention right now. Start small and steady — the right habits can help you feel more grounded, energized, and back in sync with yourself.',
  };
};

export function SelfCareDiagnosisStep({ step, onNext, onAnswer, answers }: Props) {
  const [phase, setPhase] = useState<'loading' | 'results'>('loading');
  const [insight, setInsight] = useState('');
  const [gapCategories, setGapCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const hasResolved = useRef(false);

  const diagnosisSeed = JSON.stringify({
    weighing: answers?.['sc-weighing'] ?? null,
    neglecting: answers?.['sc-neglecting'] ?? [],
    win: answers?.['sc-win'] ?? null,
    deeper: answers?.['sc-deeper'] ?? null,
  });

  const [statusIdx, setStatusIdx] = useState(0);
  const [scanIdx, setScanIdx] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [scannedResults, setScannedResults] = useState<Record<string, 'good' | 'gap' | null>>({});

  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = window.setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = window.setInterval(() => {
      setProgress((p) => Math.min(p + 0.8, 95));
    }, 100);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'loading') return;
    let idx = 0;
    const timer = window.setInterval(() => {
      if (idx < ALL_CATEGORIES.length) {
        setScanIdx(idx);
        setScannedResults((prev) => ({
          ...prev,
          [ALL_CATEGORIES[idx]]: Math.random() > 0.5 ? 'good' : null,
        }));
        idx += 1;
      } else {
        idx = 0;
        setScanIdx(0);
      }
    }, 350);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    hasResolved.current = false;

    const applyDiagnosis = (
      diagnosis: { gap_categories?: string[]; suggested_tasks?: unknown[]; ai_insight?: string },
      nextError = ''
    ) => {
      if (cancelled || hasResolved.current) return;
      hasResolved.current = true;

      const nextGaps = diagnosis.gap_categories || DEFAULT_GAPS;
      const nextInsight = diagnosis.ai_insight || buildFallbackDiagnosis(answers).ai_insight;

      setGapCategories(nextGaps);
      setInsight(nextInsight);
      setError(nextError);
      setProgress(100);

      const results: Record<string, 'good' | 'gap' | null> = {};
      ALL_CATEGORIES.forEach((cat) => {
        results[cat] = nextGaps.includes(cat) ? 'gap' : 'good';
      });
      setScannedResults(results);

      onAnswer?.(
        'sc-diagnosis-data',
        JSON.stringify({
          gap_categories: nextGaps,
          suggested_tasks: diagnosis.suggested_tasks || [],
          ai_insight: nextInsight,
        })
      );

      window.setTimeout(() => setPhase('results'), 500);
    };

    const fallbackTimer = window.setTimeout(() => {
      applyDiagnosis(buildFallbackDiagnosis(answers), 'Live analysis took too long, so we prepared your diagnosis locally.');
    }, 9000);

    const fetchDiagnosis = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('selfcare-diagnosis', {
          body: { answers },
        });

        if (cancelled || hasResolved.current) return;
        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        window.clearTimeout(fallbackTimer);
        applyDiagnosis(data || buildFallbackDiagnosis(answers));
      } catch (err) {
        console.error('Diagnosis error:', err);
        window.clearTimeout(fallbackTimer);
        applyDiagnosis(buildFallbackDiagnosis(answers), 'We could not finish the live analysis, so we used a quick backup diagnosis.');
      }
    };

    const startTimer = window.setTimeout(fetchDiagnosis, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [answers, diagnosisSeed, onAnswer]);

  const currentStatus = STATUS_MESSAGES[statusIdx];

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="shrink-0 relative" style={{ height: 200 }}>
        <img src={meplusMascotBg} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
      </div>

      <div className="flex-1 bg-white rounded-t-[28px] -mt-6 relative z-10 flex flex-col overflow-y-auto overscroll-contain">
        <div className="px-5 pt-5 flex flex-col flex-1 min-h-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)' }}>
          <AnimatePresence mode="wait">
            {phase === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col gap-4"
              >
                <div className="text-center pt-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={statusIdx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="text-lg font-bold text-foreground">{currentStatus.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{currentStatus.sub}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  {ALL_CATEGORIES.map((cat, i) => {
                    const isActive = i === scanIdx;
                    const result = scannedResults[cat];

                    return (
                      <motion.div
                        key={cat}
                        className={`
                          flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all duration-200
                          ${isActive
                            ? 'border-primary bg-primary/10 shadow-sm scale-[1.03]'
                            : result === 'gap'
                              ? 'border-accent/40 bg-accent/10'
                              : result === 'good'
                                ? 'border-primary/20 bg-primary/5'
                                : 'border-border bg-muted/30'
                          }
                        `}
                        animate={isActive ? { scale: [1, 1.03, 1] } : undefined}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="text-sm">{CATEGORY_EMOJI[cat]}</span>
                        <span className={`truncate ${result ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {CATEGORY_LABELS[cat]}
                        </span>
                        {result === 'good' && !isActive && <span className="ml-auto text-primary text-[10px]">✓</span>}
                        {result === 'gap' && !isActive && <span className="ml-auto text-accent text-[10px]">!</span>}
                        {isActive && (
                          <motion.div
                            className="ml-auto h-3 w-3 rounded-full border-2 border-primary border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <p className="mt-1 text-center text-[11px] text-muted-foreground">
                  Checking {Math.min(scanIdx + 1, ALL_CATEGORIES.length)} of {ALL_CATEGORIES.length} categories
                </p>
              </motion.div>
            )}

            {phase === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col"
              >
                <h2 className="mb-4 text-[22px] font-extrabold text-foreground">{step.title}</h2>

                {error && (
                  <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/10 p-3">
                    <p className="text-sm text-foreground">{error}</p>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-5 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/10 p-4"
                >
                  <p className="text-[15px] leading-relaxed text-foreground">{insight}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mb-6 flex flex-wrap gap-2"
                >
                  {gapCategories.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-sm font-medium text-foreground"
                    >
                      <FluentEmoji emoji={CATEGORY_EMOJI[cat] || '📌'} size={16} />
                      {CATEGORY_LABELS[cat] || cat}
                    </div>
                  ))}
                </motion.div>

                <div className="mt-auto pt-6">
                  <button
                    onClick={onNext}
                    className="w-full rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground transition-all active:scale-[0.98]"
                  >
                    {step.buttonLabel || 'Next'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
