import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import type { ActionResult } from '@/hooks/useAICoachStream';
import { cn } from '@/lib/utils';

const ACTION_CONFIG: Record<string, { icon: string; cta: string; route: string; gradient: string; proposeCta: string }> = {
  add_task_to_planner: {
    icon: '📋',
    cta: 'Open Task',
    route: '/app/home',
    gradient: 'from-blue-500/10 to-cyan-500/10 border-blue-200',
    proposeCta: 'Add to Planner',
  },
  adopt_routine: {
    icon: '🔄',
    cta: 'Open Routine',
    route: '/app/routines',
    gradient: 'from-purple-500/10 to-violet-500/10 border-purple-200',
    proposeCta: 'Adopt Routine',
  },
  suggest_breathing: {
    icon: '🫁',
    cta: 'Start Breathing',
    route: '/app/breathe',
    gradient: 'from-teal-500/10 to-emerald-500/10 border-teal-200',
    proposeCta: 'Start Breathing',
  },
  log_mood: {
    icon: '🎭',
    cta: 'Open Mood History',
    route: '/app/emotion/history',
    gradient: 'from-pink-500/10 to-rose-500/10 border-pink-200',
    proposeCta: 'Log Mood',
  },
  create_journal_prompt: {
    icon: '📝',
    cta: 'Open Reflection',
    route: '/app/reflections/free-form',
    gradient: 'from-amber-500/10 to-yellow-500/10 border-amber-200',
    proposeCta: 'Start Writing',
  },
  get_routine_suggestions: {
    icon: '✨',
    cta: 'Browse Routines',
    route: '/app/routines',
    gradient: 'from-indigo-500/10 to-purple-500/10 border-indigo-200',
    proposeCta: 'Browse Routines',
  },
  get_task_suggestions: {
    icon: '🎯',
    cta: 'Browse Tasks',
    route: '/app/tasksbank',
    gradient: 'from-orange-500/10 to-amber-500/10 border-orange-200',
    proposeCta: 'Browse Tasks',
  },
};

interface Props {
  result: ActionResult;
  messageId: string;
  resultIndex: number;
  onExecute?: (messageId: string, resultIndex: number, action: string, toolArgs: Record<string, any>) => Promise<void>;
}

export function AICoachActionCard({ result, messageId, resultIndex, onExecute }: Props) {
  const navigate = useNavigate();
  const [executing, setExecuting] = useState(false);
  const config = ACTION_CONFIG[result.action] || {
    icon: result.success ? '✅' : '❌',
    cta: '',
    route: '',
    gradient: 'from-muted to-muted border-border',
    proposeCta: 'Confirm',
  };

  const isProposal = result.proposed === true;
  const deepLink = result.created?.deepLink;
  const route = deepLink || config.route;
  const cta = result.created?.cta || config.cta;

  const handleExecute = async () => {
    if (!onExecute || !result.toolArgs) return;
    setExecuting(true);
    try {
      await onExecute(messageId, resultIndex, result.action, result.toolArgs);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className={cn(
      "rounded-2xl border px-3.5 py-3 bg-gradient-to-br animate-fade-in",
      result.success ? config.gradient : "from-destructive/5 to-destructive/10 border-destructive/20"
    )}>
      <div className="flex items-start gap-2.5">
        <FluentEmoji emoji={config.icon} size={24} className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {result.message || result.error}
          </p>
          {result.created && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {result.created.emoji && <FluentEmoji emoji={result.created.emoji} size={14} />} {result.created.title || result.created.name || result.created.emotion || ''}
              {result.created.scheduled_date && ` · ${result.created.scheduled_date}`}
            </p>
          )}
          {/* Routine/Task suggestion list */}
          {result.created?.routines && (
            <div className="mt-2 space-y-1">
              {(result.created.routines as any[]).slice(0, 5).map((r: any) => (
                <div key={r.id} className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <FluentEmoji emoji={r.emoji} size={14} /> {r.title}
                </div>
              ))}
            </div>
          )}
          {result.created?.tasks && (
            <div className="mt-2 space-y-1">
              {(result.created.tasks as any[]).slice(0, 5).map((t: any) => (
                <div key={t.id} className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <FluentEmoji emoji={t.emoji} size={14} /> {t.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Proposal: show confirm button */}
      {isProposal && result.success && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full h-9 text-xs font-semibold rounded-xl bg-primary/10 hover:bg-primary/20 text-primary gap-1.5 border border-primary/20"
          onClick={handleExecute}
          disabled={executing}
        >
          {executing ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding...</>
          ) : (
            <><Plus className="h-3.5 w-3.5" /> {config.proposeCta}</>
          )}
        </Button>
      )}

      {/* Executed: show navigation button */}
      {!isProposal && result.success && route && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full h-8 text-xs font-semibold rounded-xl bg-white/60 hover:bg-white/80 gap-1"
          onClick={() => navigate(route)}
        >
          <Check className="h-3 w-3 text-emerald-500" /> {cta} <ArrowRight className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
