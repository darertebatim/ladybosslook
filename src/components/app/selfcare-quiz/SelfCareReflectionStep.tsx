import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { OnboardingStep, OnboardingAnswers } from '@/types/onboarding';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useReflections } from '@/hooks/useReflections';
import { computeTopCluster } from '@/utils/selfcare-scoring';
import selfcareQuizHero from '@/assets/selfcare-quiz-hero.png';

const CLUSTER_TO_CATEGORIES: Record<string, string[]> = {
  body: ['energize', 'morning'],
  mind: ['calm', 'deep-dives'],
  environment: ['reset', 'night'],
  people: ['morning', 'big-picture'],
};

interface Props {
  step: OnboardingStep;
  onNext: () => void;
  onAnswer?: (stepId: string, answer: string | string[]) => void;
  answers?: OnboardingAnswers;
}

export function SelfCareReflectionStep({ step, onNext, onAnswer, answers }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: reflections, isLoading } = useReflections();

  const cluster = useMemo(() => computeTopCluster(answers || {}), [answers]);
  const targetCats = CLUSTER_TO_CATEGORIES[cluster] || ['calm', 'morning'];

  const matched = useMemo(() => {
    if (!reflections) return [];
    const results = reflections.filter(r => r.category && targetCats.includes(r.category));
    // If not enough matches, fill with featured
    if (results.length < 2) {
      const featured = reflections.filter(r => r.is_featured && !results.find(m => m.id === r.id));
      return [...results, ...featured].slice(0, 3);
    }
    return results.slice(0, 3);
  }, [reflections, targetCats]);

  const handleSelect = (id: string) => {
    setSelectedId(id === selectedId ? null : id);
  };

  const handleAdd = () => {
    if (selectedId) {
      onAnswer?.(step.id, selectedId);
      localStorage.setItem('simora_onboarding_reflection', selectedId);
    }
    onNext();
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Hero */}
      <div className="relative w-full h-[35%] min-h-[180px] flex-shrink-0">
        <img src={selfcareQuizHero} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 pb-6 -mt-6 relative z-10" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[28px] font-extrabold text-black text-center mb-1 leading-tight"
        >
          {step.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-black/60 text-center mb-5"
        >
          {step.subtitle}
        </motion.p>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#1a1f3d] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3 flex-1">
            {matched.map((ref, i) => {
              const isSelected = selectedId === ref.id;
              return (
                <motion.button
                  key={ref.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  onClick={() => handleSelect(ref.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'border-[#1a1f3d] bg-[#1a1f3d]/5'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FluentEmoji emoji={ref.emoji || '📝'} size={26} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-black leading-tight truncate">{ref.title}</p>
                    {ref.subtitle && (
                      <p className="text-xs text-black/50 mt-0.5 line-clamp-1">{ref.subtitle}</p>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'border-[#1a1f3d] bg-[#1a1f3d]' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-auto pt-4"
        >
          <button
            onClick={handleAdd}
            className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-bold text-base active:scale-[0.98] transition-all"
          >
            {selectedId ? step.buttonLabel : 'Continue'}
          </button>
          {step.secondaryButtonLabel && (
            <button
              onClick={handleSkip}
              className="w-full py-3 text-sm text-black/40 font-medium active:opacity-60 mt-1"
            >
              {step.secondaryButtonLabel}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
