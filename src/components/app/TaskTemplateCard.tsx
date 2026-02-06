import { CalendarPlus } from 'lucide-react';
import { TaskTemplate, TASK_COLORS, TaskColor } from '@/hooks/useTaskPlanner';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

interface TaskTemplateCardProps {
  template: TaskTemplate;
  onAdd: () => void;
}

// Map time_period values to display labels
const TIME_PERIOD_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Bedtime',
};

export function TaskTemplateCard({ template, onAdd }: TaskTemplateCardProps) {
  const bgColor = TASK_COLORS[template.color as TaskColor] || TASK_COLORS.blue;

  const handleAdd = () => {
    haptic.light();
    onAdd();
  };

  // Get time period label
  const timePeriodLabel = template.time_period 
    ? TIME_PERIOD_LABELS[template.time_period] || template.time_period
    : 'Anytime';

  return (
    <div 
      className="rounded-xl border border-border/50 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Main content row */}
      <div className="flex items-center gap-3 p-3">
        <FluentEmoji emoji={template.emoji || '📝'} size={32} className="shrink-0" />
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-black truncate">{template.title}</p>
          <p className="text-xs text-black/70 truncate">
            {template.category}
            {template.repeat_pattern && template.repeat_pattern !== 'none' && (
              <span>
                {' • '}
                {template.repeat_pattern === 'daily' ? 'Daily' : 
                 template.repeat_pattern === 'weekly' ? 'Weekly' : 
                 template.repeat_pattern === 'monthly' ? 'Monthly' :
                 template.repeat_pattern === 'weekend' ? 'Weekends' : ''}
              </span>
            )}
            {(!template.repeat_pattern || template.repeat_pattern === 'none') && (
              <span>{' • '}Once</span>
            )}
            <span>{' • '}{timePeriodLabel}</span>
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="tour-action-add-btn shrink-0 p-2.5 rounded-full bg-foreground hover:bg-foreground/90 transition-colors"
          aria-label="Add to my rituals"
        >
          <CalendarPlus className="h-5 w-5 text-background" />
        </button>
      </div>

      {/* Description box */}
      {template.description && (
        <div className="mx-2 mb-2 p-2.5 bg-white/90 rounded-lg">
          <p className="text-xs text-black/80 leading-relaxed">
            {template.description}
          </p>
        </div>
      )}
    </div>
  );
}
