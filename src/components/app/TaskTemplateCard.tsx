import { CalendarPlus } from 'lucide-react';
import { TaskTemplate, TASK_COLORS, TaskColor } from '@/hooks/useTaskPlanner';
import { haptic } from '@/lib/haptics';

interface TaskTemplateCardProps {
  template: TaskTemplate;
  onAdd: () => void;
}

export function TaskTemplateCard({ template, onAdd }: TaskTemplateCardProps) {
  const bgColor = TASK_COLORS[template.color as TaskColor] || TASK_COLORS.blue;

  const handleAdd = () => {
    haptic.light();
    onAdd();
  };

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-xl border border-border/50"
      style={{ backgroundColor: bgColor }}
    >
      <span className="text-2xl shrink-0">{template.emoji || '📝'}</span>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{template.title}</p>
        <p className="text-xs text-foreground truncate">
          {template.category}
        </p>
      </div>

      <button
        onClick={handleAdd}
        className="shrink-0 p-2.5 rounded-full bg-foreground hover:bg-foreground/90 transition-colors"
        aria-label="Add to routine"
      >
        <CalendarPlus className="h-5 w-5 text-background" />
      </button>
    </div>
  );
}
