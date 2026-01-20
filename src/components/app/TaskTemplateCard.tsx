import { Plus, Loader2 } from 'lucide-react';
import { TaskTemplate, TASK_COLORS, TaskColor } from '@/hooks/useTaskPlanner';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNativeApp } from '@/lib/platform';

interface TaskTemplateCardProps {
  template: TaskTemplate;
  onAdd: () => void;
  isAdding?: boolean;
}

export function TaskTemplateCard({ template, onAdd, isAdding }: TaskTemplateCardProps) {
  const bgColor = TASK_COLORS[template.color as TaskColor] || TASK_COLORS.blue;

  const handleAdd = async () => {
    if (isNativeApp()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {}
    }
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
        <p className="text-xs text-muted-foreground truncate">{template.category}</p>
      </div>

      <button
        onClick={handleAdd}
        disabled={isAdding}
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-foreground/70 hover:bg-white/50 disabled:opacity-50"
      >
        {isAdding ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
