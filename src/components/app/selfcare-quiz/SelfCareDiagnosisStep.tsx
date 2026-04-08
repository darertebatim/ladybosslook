import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { supabase } from '@/integrations/supabase/client';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
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
  TidyUp: '🧹', Night: '🌙',
};

const CATEGORY_LABELS: Record<string, string> = {
  calm: 'Calm', sleep: 'Sleep', nutrition: 'Nutrition', movement: 'Movement',
  Exercise: 'Exercise', hygiene: 'Hygiene', Presence: 'Presence', connection: 'Connection',
  'self-kindness': 'Self-Kindness', gratitude: 'Gratitude', productivity: 'Productivity',
  TidyUp: 'Tidy Up', Night: 'Night Routine',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_EMOJI);

const STATUS_MESSAGES = [
  { title: 'Scanning your habits...', sub: 'Looking at your daily patterns' },
  { title: 'Checking your balance...', sub: 'Comparing across 13 areas' },
  { title: 'Finding hidden gaps...', sub: 'What you might be missing' },
  { title: 'Analyzing priorities...', sub: 'Ranking what matters most' },
  { title: 'Building your profile...', sub: 'Personalizing recommendations' },
  { title: 'Almost there...', sub: 'Preparing your diagnosis' },
];

export function SelfCareDiagnosisStep({ step, onNext, onAnswer, answers }: Props) {
  const [phase, setPhase] = useState<'loading' | 'results'>('loading');
  const [insight, setInsight] = useState('');
  const [gapCategories, setGapCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);

  // Loading animation state
  const [statusIdx, setStatusIdx] = useState(0);
  const [scanIdx, setScanIdx] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [scannedResults, setScannedResults] = useState<Record<string, 'good' | 'gap' | null>>({});

  // Cycle status messages
  useEffect(() => {
    if (phase !== 'loading') return;
    const t = setInterval(() => setStatusIdx(i => (i + 1) % STATUS_MESSAGES.length), 2200);
    return () => clearInterval(t);
  }, [phase]);

  // Animate progress bar
  useEffect(() => {
    if (phase !== 'loading') return;
    const t = setInterval(() => setProgress(p => Math.min(p + 0.8, 95)), 100);
    return () => clearInterval(t);
  }, [phase]);

  // Scan through categories one by one
  useEffect(() => {
    if (phase !== 'loading') return;
    let idx = 0;
    const t = setInterval(() => {
      if (idx < ALL_CATEGORIES.length) {
        setScanIdx(idx);
        // Randomly mark as good or neutral during scan
        setScannedResults(prev => ({
          ...prev,
          [ALL_CATEGORIES[idx]]: Math.random() > 0.5 ? 'good' : null,
        }));
        idx++;
      } else {
        // Reset and scan again
        idx = 0;
        setScanIdx(0);
      }
    }, 350);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchDiagnosis = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('selfcare-diagnosis', {
          body: { answers },
        });

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        setInsight(data.ai_insight || '');
        setGapCategories(data.gap_categories || []);

        if (onAnswer) {
          onAnswer('sc-diagnosis-data', JSON.stringify({
            gap_categories: data.gap_categories || [],
            suggested_tasks: data.suggested_tasks || [],
            ai_insight: data.ai_insight || '',
          }));
        }

        // Mark gap categories in scan results
        const results: Record<string, 'good' | 'gap' | null> = {};
        ALL_CATEGORIES.forEach(cat => {
          results[cat] = (data.gap_categories || []).includes(cat) ? 'gap' : 'good';
        });
        setScannedResults(results);
        setProgress(100);
        
        setTimeout(() => setPhase('results'), 800);
      } catch (err: any) {
        console.error('Diagnosis error:', err);
        setError('Something went wrong. Please try again.');
        setPhase('results');
      }
    };

    const timer = setTimeout(fetchDiagnosis, 1200);
    return () => clearTimeout(timer);
  }, []);

  const currentStatus = STATUS_MESSAGES[statusIdx];

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Hero mascot header */}
      <div className="shrink-0 relative" style={{ height: 200 }}>
        <img src={meplusMascotBg} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
      </div>

      {/* White bottom sheet */}
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
                {/* Status text with animation */}
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

                {/* Progress bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>

                {/* Category scan grid */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {ALL_CATEGORIES.map((cat, i) => {
                    const isActive = i === scanIdx;
                    const result = scannedResults[cat];
                    return (
                      <motion.div
                        key={cat}
                        className={`
                          flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium
                          transition-all duration-200 border
                          ${isActive 
                            ? 'border-indigo-400 bg-indigo-50 shadow-sm shadow-indigo-100 scale-[1.03]' 
                            : result === 'gap'
                              ? 'border-amber-300 bg-amber-50'
                              : result === 'good'
                                ? 'border-green-200 bg-green-50'
                                : 'border-muted bg-muted/30'
                          }
                        `}
                        animate={isActive ? { scale: [1, 1.03, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="text-sm">{CATEGORY_EMOJI[cat]}</span>
                        <span className={`truncate ${
                          isActive ? 'text-indigo-700' 
                          : result === 'gap' ? 'text-amber-700'
                          : result === 'good' ? 'text-green-700'
                          : 'text-muted-foreground'
                        }`}>
                          {CATEGORY_LABELS[cat]}
                        </span>
                        {result === 'good' && !isActive && (
                          <motion.span 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }}
                            className="ml-auto text-green-500 text-[10px]"
                          >✓</motion.span>
                        )}
                        {result === 'gap' && !isActive && (
                          <motion.span 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }}
                            className="ml-auto text-amber-500 text-[10px]"
                          >!</motion.span>
                        )}
                        {isActive && (
                          <motion.div
                            className="ml-auto w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Scanning indicator */}
                <p className="text-[11px] text-center text-muted-foreground mt-1">
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
                {error ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">{error}</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-[22px] font-extrabold text-foreground mb-4">{step.title}</h2>

                    {/* AI Insight */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 mb-5 border border-purple-100"
                    >
                      <p className="text-[15px] text-foreground leading-relaxed">{insight}</p>
                    </motion.div>

                    {/* Gap Categories */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="flex flex-wrap gap-2 mb-6"
                    >
                      {gapCategories.map((cat) => (
                        <div
                          key={cat}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-sm font-medium text-foreground"
                        >
                          <FluentEmoji emoji={CATEGORY_EMOJI[cat] || '📌'} size={16} />
                          {CATEGORY_LABELS[cat] || cat}
                        </div>
                      ))}
                    </motion.div>

                    {/* Next button */}
                    <div className="mt-auto pt-6">
                      <button
                        onClick={onNext}
                        className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base active:scale-[0.98] transition-all"
                      >
                        {step.buttonLabel || 'Next'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}