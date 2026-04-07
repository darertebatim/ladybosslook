import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { supabase } from '@/integrations/supabase/client';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Plus, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  answers?: OnboardingAnswers;
}

interface SuggestedTask {
  id: string;
  title: string;
  emoji: string;
  category: string;
  description?: string;
  color?: string;
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

export function SelfCareDiagnosisStep({ step, onNext, answers }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<'loading' | 'results'>('loading');
  const [insight, setInsight] = useState('');
  const [gapCategories, setGapCategories] = useState<string[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDiagnosis = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('selfcare-diagnosis', {
          body: { answers },
        });

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        setInsight(data.ai_insight || '');
        setGapCategories(data.gap_categories || []);
        setSuggestedTasks(data.suggested_tasks || []);

        // Small delay for smooth transition
        setTimeout(() => setPhase('results'), 500);
      } catch (err: any) {
        console.error('Diagnosis error:', err);
        setError('Something went wrong. Please try again.');
        setPhase('results');
      }
    };

    const timer = setTimeout(fetchDiagnosis, 1500); // Show loading animation first
    return () => clearTimeout(timer);
  }, [answers]);

  const handleAddTask = async (task: SuggestedTask) => {
    if (!user || addedTasks.has(task.id)) return;

    try {
      const { data: existing } = await supabase
        .from('user_tasks')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1);
      const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

      await supabase.from('user_tasks').insert({
        user_id: user.id,
        title: task.title,
        emoji: task.emoji || '📝',
        color: task.color || 'mint',
        repeat_pattern: 'daily',
        is_active: true,
        order_index: nextOrder,
        tag: 'Self-Care',
      });

      setAddedTasks(prev => new Set([...prev, task.id]));
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
      toast({ title: `${task.emoji} ${task.title} added!` });
    } catch {
      toast({ title: 'Failed to add task', variant: 'destructive' });
    }
  };

  return (
    <div className="h-full bg-white overflow-y-auto overscroll-contain">
      <div className="flex flex-col min-h-full px-5 pt-6 pb-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}>
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
                <p className="text-lg font-bold text-[#1a1f3d]">Analyzing your answers...</p>
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
                  <h2 className="text-[22px] font-extrabold text-[#1a1f3d] mb-4">{step.title}</h2>

                  {/* AI Insight */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 mb-5 border border-purple-100"
                  >
                    <p className="text-[15px] text-[#1a1f3d] leading-relaxed">{insight}</p>
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-sm font-medium text-[#1a1f3d]"
                      >
                        <FluentEmoji emoji={CATEGORY_EMOJI[cat] || '📌'} size={16} />
                        {cat}
                      </div>
                    ))}
                  </motion.div>

                  {/* Suggested Tasks */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Suggested habits for you
                    </p>
                    <div className="space-y-2.5">
                      {suggestedTasks.map((task) => {
                        const isAdded = addedTasks.has(task.id);
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card"
                          >
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <FluentEmoji emoji={task.emoji || '📝'} size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{task.title}</p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleAddTask(task)}
                              disabled={isAdded}
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                isAdded
                                  ? 'bg-green-500 text-white'
                                  : 'bg-primary/10 text-primary active:scale-90'
                              }`}
                            >
                              {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Done button */}
                  <div className="mt-auto pt-6">
                    <button
                      onClick={onNext}
                      className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base active:scale-[0.98] transition-all"
                    >
                      {step.buttonLabel || 'Done'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
