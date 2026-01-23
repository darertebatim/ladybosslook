import { useState, useRef } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTaskTemplates, TaskTemplate, TASK_COLOR_CLASSES, TaskColor } from '@/hooks/useTaskPlanner';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
interface TaskQuickStartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (taskName: string, template?: TaskTemplate) => void;
}

// Pastel colors for suggestion cards
const SUGGESTION_COLORS: TaskColor[] = ['sky', 'yellow', 'mint', 'lavender', 'peach', 'pink'];

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

  // Filter templates based on search or show popular
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
          {/* Header */}
          <div className="pt-2 pb-4 text-center">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground">New Task</h2>
          </div>

          {/* Name input */}
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
                    // If there's text, continue; otherwise just dismiss keyboard to show suggestions
                    if (taskName.trim()) {
                      handleContinue();
                    } else {
                      // Blur to dismiss keyboard and show suggestions
                      (e.target as HTMLInputElement).blur();
                      if (Capacitor.isNativePlatform()) {
                        Keyboard.hide();
                      }
                    }
                  }
                }}
              />
              <div className="text-xs text-muted-foreground text-center mt-1">
                {taskName.length}/50
              </div>
            </div>
          </div>

          {/* Continue button - appears when name is entered */}
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

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="px-4 pb-6">
              <p className="text-sm text-muted-foreground mb-3">
                {taskName.trim() ? 'Similar tasks 💡' : 'Need some idea? 💡'}
              </p>
              <div className="space-y-2">
                {suggestions.map((template, index) => {
                  // Format time nicely (e.g., "07:00:00" -> "7:00 AM")
                  const formatTime = (time: string | null) => {
                    if (!time) return null;
                    const [hours, minutes] = time.split(':').map(Number);
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const displayHour = hours % 12 || 12;
                    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
                  };

                  return (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={cn(
                        'flex items-center gap-3 w-full p-4 rounded-2xl text-left transition-all active:scale-[0.98]',
                        TASK_COLOR_CLASSES[SUGGESTION_COLORS[index % SUGGESTION_COLORS.length]]
                      )}
                    >
                      <span className="text-2xl flex-shrink-0">{template.emoji}</span>
                      <span className="font-medium text-foreground/90 flex-1">
                        {template.title}
                      </span>
                      {template.suggested_time && (
                        <span className="text-sm text-foreground/50 flex-shrink-0">
                          {formatTime(template.suggested_time)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom padding */}
          <div className="h-4" />
        </div>
      </SheetContent>
    </Sheet>
  );
};
