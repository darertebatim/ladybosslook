import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { supabase } from '@/integrations/supabase/client';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { Loader2 } from 'lucide-react';
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
  nutrition: '💧',
  movement: '🚶',
  Exercise: '💪',
  hygiene: '🧴',
  Presence: '📵',
  connection: '💬',
  'self-kindness': '💕',
  gratitude: '🙏',
  productivity: '📋',
  TidyUp: '🧹',
  Night: '🌙',
};

export function SelfCareDiagnosisStep({ step, onNext, onAnswer, answers }: Props) {
  const [phase, setPhase] = useState<'loading' | 'results'>('loading');
  const [insight, setInsight] = useState('');
  const [gapCategories, setGapCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);

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

        setTimeout(() => setPhase('results'), 500);
      } catch (err: any) {
        console.error('Diagnosis error:', err);
        setError('Something went wrong. Please try again.');
        setPhase('results');
      }
    };

    const timer = setTimeout(fetchDiagnosis, 1500);
    return () => clearTimeout(timer);
  }, []);

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
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-6"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </div>
                  <motion.div
                    className="absolute -top-2 -right-2 text-2xl"
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✨
                  </motion.div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">Analyzing your answers...</p>
                  <p className="text-sm text-muted-foreground mt-1">Finding your hidden gaps</p>
                </div>
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
                          {cat}
                        </div>
                      ))}
                    </motion.div>

                    {/* Next button pinned at bottom */}
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
