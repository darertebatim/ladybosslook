import { Plus } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { TaskTemplate } from '@/hooks/useTaskPlanner';

interface ActionBankCardProps {
  action: TaskTemplate;
  onClick: () => void;
}

/**
 * Action card for home page suggestions
 * Matches the style from TaskQuickStartSheet suggestions
 */
export const ActionBankCard = ({ action, onClick }: ActionBankCardProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-xl bg-card border border-border/50 hover:bg-muted/50 transition-all active:scale-[0.99]"
    >
      <FluentEmoji emoji={action.emoji || '📝'} size={24} className="flex-shrink-0" />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[15px] text-foreground truncate">
          {action.title}
        </p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {action.category}
      </span>
      <div className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
    </button>
  );
};
