import { Plus } from 'lucide-react';
import { TaskTemplate, TASK_COLOR_CLASSES, TaskColor } from '@/hooks/useTaskPlanner';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface TaskTemplateCardProps {
  template: TaskTemplate;
  onAdd: () => void;
}

export function TaskTemplateCard({ template, onAdd }: TaskTemplateCardProps) {
  const colorClass = TASK_COLOR_CLASSES[template.color as TaskColor] || TASK_COLOR_CLASSES.blue;

  const handleAdd = () => {
    haptic.light();
    onAdd();
  };

  return (
    <button 
      onClick={handleAdd}
      className={cn(
        'flex items-center gap-3 w-full p-4 rounded-2xl text-left transition-all active:scale-[0.98]',
        colorClass
      )}
    >
      <span className="text-2xl flex-shrink-0">{template.emoji || '📝'}</span>
      
      <span className="font-medium text-foreground/90 flex-1 line-clamp-2">
        {template.title}
      </span>

      {template.duration_minutes && (
        <span className="text-sm text-foreground/50 flex-shrink-0">
          {template.duration_minutes}m
        </span>
      )}
    </button>
  );
}
