import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { supabase } from '@/integrations/supabase/client';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { computeGapCategories, computeTopCluster, ClusterType } from '@/utils/selfcare-scoring';
import meplusMascotBg from '@/assets/meplus-mascot-bg.png';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
  answers?: OnboardingAnswers;
}

const CATEGORY_EMOJI: Record<string, string> = {
  calm: '🧘', sleep: '😴', nutrition: '🥗', movement: '🏃',
  Exercise: '💪', hygiene: '🧴', Presence: '🧠', connection: '💬',
  'self-kindness': '💚', gratitude: '🙏', productivity: '📋',
  TidyUp: '🧹', Evening: '🌙', LovedOnes: '🥰', 'easy-win': '✨',
};

const CATEGORY_LABELS: Record<string, string> = {
  calm: 'Calm', sleep: 'Sleep', nutrition: 'Nutrition', movement: 'Movement',
  Exercise: 'Exercise', hygiene: 'Hygiene', Presence: 'Presence', connection: 'Connection',
  'self-kindness': 'Self-Kindness', gratitude: 'Gratitude', productivity: 'Productivity',
  TidyUp: 'Tidy Up', Evening: 'Evening', LovedOnes: 'Loved Ones', 'easy-win': 'Easy Win',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  calm: "Your mind is running non-stop — you need moments of stillness.",
  sleep: "Your body isn't getting the rest it needs to recharge.",
  nutrition: "You've been skipping meals or not fueling yourself well.",
  movement: "Your body is craving more gentle, everyday movement.",
  Exercise: "You haven't been making time for real physical activity.",
  hygiene: "Basic self-care routines have been slipping lately.",
  Presence: "You're on autopilot — you need to slow down and be present.",
  connection: "You've been isolating — reaching out would help.",
  'self-kindness': "You're being too hard on yourself right now.",
  gratitude: "You've lost sight of the good things around you.",
  productivity: "Your days feel unstructured and scattered.",
  TidyUp: "Your space is cluttered, and it's draining your energy.",
  Evening: "Your nights are chaotic — a wind-down routine would help.",
  LovedOnes: "The people you love need more of your time and care.",
  'easy-win': "You just need a quick win to build momentum.",
};

const CLUSTER_HEADLINES: Record<ClusterType, string> = {
  body: "Your body is asking for attention",
  mind: "Your mind needs a reset",
  environment: "Your daily life needs more structure",
  people: "Your relationships need nurturing",
};

const CLUSTER_SUBTEXT: Record<ClusterType, string> = {
  body: "Rest, movement, and nourishment are the foundation. Let's start there.",
  mind: "When your mind is overwhelmed, everything else suffers. Let's create some calm.",
  environment: "Small changes to your space and routines can shift everything.",
  people: "Connection is self-care too. Let's make space for the people who matter.",
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
  const topCluster = computeTopCluster(answers || {});
  return { gap_categories: gapCategories, suggested_tasks: [], top_cluster: topCluster };
};

export function SelfCareDiagnosisStep({ step, onNext, onAnswer, answers }: Props) {
  const [phase, setPhase] = useState<'loading' | 'results'>('loading');
  const [gapCategories, setGapCategories] = useState<string[]>([]);
  const [topCluster, setTopCluster] = useState<ClusterType>('mind');
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
      setProgress((p) => Math.min(p + 1.5, 95));
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
      diagnosis: { gap_categories?: string[]; suggested_tasks?: unknown[]; top_cluster?: string },
      nextError = ''
    ) => {
      if (cancelled || hasResolved.current) return;
      hasResolved.current = true;

      const nextGaps = diagnosis.gap_categories || DEFAULT_GAPS;
      const cluster = (diagnosis.top_cluster || computeTopCluster(answers || {})) as ClusterType;

      setGapCategories(nextGaps);
      setTopCluster(cluster);
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
          top_cluster: cluster,
        })
      );

      window.setTimeout(() => setPhase('results'), 500);
    };

    const fallbackTimer = window.setTimeout(() => {
      applyDiagnosis(buildFallbackDiagnosis(answers));
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
        applyDiagnosis(buildFallbackDiagnosis(answers));
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
                {/* Cluster headline */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-1"
                >
                  <h2 className="text-[22px] font-extrabold text-foreground">
                    {CLUSTER_HEADLINES[topCluster]}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {CLUSTER_SUBTEXT[topCluster]}
                  </p>
                </motion.div>

                {error && (
                  <div className="mt-3 rounded-2xl border border-accent/20 bg-accent/10 p-3">
                    <p className="text-sm text-foreground">{error}</p>
                  </div>
                )}

                {/* Category gap cards */}
                <div className="mt-5 space-y-3">
                  {gapCategories.map((cat, i) => (
                    <motion.div
                      key={cat}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.12 }}
                      className="flex items-start gap-3 rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/5 to-accent/10 p-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                        <FluentEmoji emoji={CATEGORY_EMOJI[cat] || '📌'} size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[15px] text-foreground">
                          {CATEGORY_LABELS[cat] || cat}
                        </p>
                        <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">
                          {CATEGORY_DESCRIPTIONS[cat] || "This area needs your attention."}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Motivational closer */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-5 text-center text-sm text-muted-foreground"
                >
                  Small changes here will make the biggest difference ✨
                </motion.p>

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
