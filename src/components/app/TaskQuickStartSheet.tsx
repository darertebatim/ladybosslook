/**
 * Task Quick Start Sheet - UPDATED (Capacitor Keyboard removed)
 * 
 * Keyboard handling removed.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTaskTemplates, TaskTemplate, TASK_COLORS, TaskColor } from '@/hooks/useTaskPlanner';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

interface TaskQuickStartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (taskName: string, template?: TaskTemplate) => void;
}

export const TaskQuickStartSheet = ({
  open,
  onOpenChange,
  onContinue,
}: TaskQuickStartSheetProps) => {
  const [taskName, setTaskName] = useState('');
  const { data: templates = [] } = useTaskTemplates();

  const handleContinue = () => {
    if (taskName.trim()) {
      onContinue(taskName.trim());
      setTaskName('');
      onOpenChange(false);
    }
  };

  const handleTemplateSelect = (template: TaskTemplate) => {
    onContinue(template.title, template);
    setTaskName('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setTaskName('');
    onOpenChange(false);
  };

  const suggestions = taskName.trim()
    ? templates.filter(t => 
        t.title.toLowerCase().includes(taskName.toLowerCase())
      ).slice(0, 8)
    : templates.filter(t => t.is_popular).slice(0, 8);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[85vh] rounded-t-3xl pb-safe"
      >
        <div className="flex flex-col">
          <div className="pt-2 pb-4 text-center">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground">New Action</h2>
          </div>

          <div className="px-4 pb-4">
            <div className="relative bg-muted/50 rounded-2xl p-4">
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value.slice(0, 50))}
                placeholder="Tap to rename"
                className="text-xl font-medium text-center border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40"
                maxLength={50}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (taskName.trim()) {
                      handleContinue();
                    } else {
                      (e.target as HTMLInputElement).blur();
                    }
                  }
                }}
              />
              <div className="text-xs text-muted-foreground text-center mt-1">
                {taskName.length}/50
              </div>
            </div>
          </div>

          {taskName.trim() && (
            <div className="px-4 pb-4">
              <Button
                onClick={handleContinue}
                className="w-full h-12 rounded-full bg-foreground text-background font-semibold text-base hover:bg-foreground/90"
              >
                Continue
              </Button>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="px-4 pb-6">
              <p className="text-sm text-muted-foreground mb-3">
                {taskName.trim() ? 'Similar actions 💡' : 'Need some idea? 💡'}
              </p>
              <div className="space-y-2">
                {suggestions.map((template) => {
                  const bgColor = TASK_COLORS[template.color as TaskColor] || TASK_COLORS.sky;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="flex items-center gap-3 w-full p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                      style={{ backgroundColor: bgColor }}
                    >
                      <FluentEmoji emoji={template.emoji || '📝'} size={28} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] text-foreground/90 truncate">
                          {template.title}
                        </p>
                        <p className="text-xs text-foreground/60 truncate">
                          {template.category || template.tag}
                        </p>
                      </div>
                      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-foreground/50">
                        <Plus className="w-5 h-5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>
      </SheetContent>
    </Sheet>
  );
};
