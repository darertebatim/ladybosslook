import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { mapTaskToCluster } from '@/utils/selfcare-scoring';

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
  answers?: OnboardingAnswers;
}

interface SkippedTask {
  id: string;
  title: string;
  emoji: string;
  tag: string | null;
  skipCount: number;
}

type Action = 'keep' | 'remove' | 'replace';

export function WeekCleanupStep({ step, onNext, onAnswer, answers }: Props) {
  const { user } = useAuth();

  const skippedTasks = useMemo<SkippedTask[]>(() => {
    const raw = answers?.['wr-skipped-tasks'];
    if (!raw || typeof raw !== 'string') return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }, [answers]);

  const [actions, setActions] = useState<Record<string, Action>>(() => {
    const map: Record<string, Action> = {};
    skippedTasks.forEach(t => { map[t.id] = 'keep'; });
    return map;
  });
  const [saving, setSaving] = useState(false);

  const setAction = (id: string, action: Action) => {
    setActions(prev => ({ ...prev, [id]: action }));
  };

  const handleContinue = async () => {
    setSaving(true);

    // Process removals
    const removals = skippedTasks.filter(t => actions[t.id] === 'remove');
    if (user && removals.length > 0) {
      await supabase
        .from('user_tasks')
        .update({ is_active: false })
        .in('id', removals.map(t => t.id))
        .eq('user_id', user.id);
    }

    // Pass replacement tasks to suggestions step
    const replacements = skippedTasks
      .filter(t => actions[t.id] === 'replace')
      .map(t => ({
        id: t.id,
        title: t.title,
        cluster: mapTaskToCluster(t.tag) || 'mind',
        tag: t.tag,
      }));

    if (onAnswer && replacements.length > 0) {
      onAnswer('wr-replace-tasks', JSON.stringify(replacements));
    }

    setSaving(false);
    onNext();
  };

  // Auto-advance if nothing to clean up
  if (skippedTasks.length === 0) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <FluentEmoji emoji="🎉" size={48} />
          <h2 className="text-xl font-extrabold text-foreground mt-4">Amazing consistency!</h2>
          <p className="text-sm text-muted-foreground mt-2">You didn't skip any goals frequently this week.</p>
          <button
            onClick={onNext}
            className="mt-8 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-[0.98] transition-all"
          >
            {step.buttonLabel || 'Continue'}
          </button>
        </motion.div>
      </div>
    );
  }

  const actionButtons: { value: Action; label: string; emoji: string }[] = [
    { value: 'keep', label: 'Keep', emoji: '✅' },
    { value: 'replace', label: 'Replace', emoji: '🔄' },
    { value: 'remove', label: 'Remove', emoji: '🗑️' },
  ];

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex flex-col flex-1 px-5 pt-8 pb-5">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-5"
        >
          <h1 className="text-xl font-extrabold text-foreground">{step.title}</h1>
          {step.subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{step.subtitle}</p>
          )}
        </motion.div>

        <div className="space-y-3 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <AnimatePresence>
            {skippedTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-3 rounded-2xl border-2 border-orange-200 bg-orange-50/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FluentEmoji emoji={task.emoji || '📋'} size={24} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground block truncate">{task.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {task.skipCount > 0 
                        ? `Skipped ${task.skipCount}× this week`
                        : 'Not done this week'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 ml-9">
                  {actionButtons.map(btn => (
                    <button
                      key={btn.value}
                      onClick={() => setAction(task.id, btn.value)}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded-xl transition-all ${
                        actions[task.id] === btn.value
                          ? btn.value === 'remove'
                            ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : btn.value === 'replace'
                              ? 'bg-primary/10 text-primary border-2 border-primary/30'
                              : 'bg-green-100 text-green-700 border-2 border-green-300'
                          : 'bg-muted/50 text-muted-foreground border-2 border-transparent'
                      }`}
                    >
                      {btn.emoji} {btn.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-auto pt-3">
          <button
            onClick={handleContinue}
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : step.buttonLabel || 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
