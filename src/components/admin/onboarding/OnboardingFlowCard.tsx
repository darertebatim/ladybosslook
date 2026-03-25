import { useState } from 'react';
import { OnboardingFlow } from '@/types/onboarding';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, ArrowRight, Star, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  flow: OnboardingFlow;
  onPreview: () => void;
  isDefault?: boolean;
  onSetDefault?: () => void;
}

const STEP_TYPE_EMOJI: Record<string, string> = {
  'welcome': '👋',
  'single-select': '☝️',
  'multi-select': '✅',
  'motivational': '💡',
  'starter-routine': '🔄',
  'daily-reset-prompt': '🔁',
  'welcome-aboard': '🎉',
  'greeting': '🙋',
  'yes-no': '❓',
  'do-you-want': '🤔',
  'info-stat': '📊',
  'notification-permission': '🔔',
  'results-chart': '📈',
  'habit-loop': '🔁',
  'loading-testimonials': '⏳',
  'personal-summary': '📋',
  'first-habit': '🌱',
  'breathing-prep': '🫁',
  'breathing': '🌬️',
  'breathing-done': '✨',
  'streak': '🔥',
  'paywall': '💎',
  'before-after': '🔀',
  'science-backed': '🧪',
  'rating': '⭐',
  'discount-offer': '🏷️',
  'contract': '📝',
  'distress-grid': '😰',
  'adhd-info': '🧠',
  'lucky-draw': '🎰',
  'super-prize': '🏆',
  'countdown-paywall': '⏰',
  'dark-paywall': '💜',
  'task-select-purple': '🟣',
  'confetti-message': '🎊',
  'personalized-plan': '📅',
  'single-select-descriptions': '📝',
  'routine-ready-teaser': '🗓️',
};

export function OnboardingFlowCard({ flow, onPreview, isDefault, onSetDefault }: Props) {
  const [expanded, setExpanded] = useState(false);

  const handlePreviewStep = (stepIndex: number) => {
    window.open(`/app/onboarding/${flow.id}?step=${stepIndex}`, '_blank');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-indigo-50 p-3">
            <Smartphone className="h-6 w-6 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{flow.name}</h3>
              {isDefault && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{flow.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {flow.steps.length} screens · {flow.appName} · <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">ID: {flow.id}</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            {!isDefault && onSetDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onSetDefault(); }}
                className="text-xs text-muted-foreground"
              >
                Set Default
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onPreview}>
              Preview <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded(prev => !prev)}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 border-t pt-3 grid grid-cols-1 gap-1">
                {flow.steps.map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => handlePreviewStep(i)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors text-left group w-full"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                    <span className="text-sm">{STEP_TYPE_EMOJI[step.type] || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">
                        {step.title?.replace(/\n/g, ' ') || step.type}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">{step.type}</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
