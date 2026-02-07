import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dices, BookOpen, X, CalendarPlus, HelpCircle } from 'lucide-react';
import { useTaskTemplates, TaskTemplate, TASK_COLORS, TaskColor } from '@/hooks/useTaskPlanner';
import { useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { ActionSheetTour } from '@/components/app/tour/ActionSheetTour';

// Map time_period values to display labels
const TIME_PERIOD_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Bedtime',
};

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
  const navigate = useNavigate();
  const [taskName, setTaskName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  const [isRolling, setIsRolling] = useState(false);
  const [startTour, setStartTour] = useState<(() => void) | null>(null);
  const { data: templates = [] } = useTaskTemplates();
  const { data: categories = [] } = useRoutineBankCategories();

  const handleTourReady = useCallback((tourStart: () => void) => {
    setStartTour(() => tourStart);
  }, []);

  const handleContinue = () => {
    if (taskName.trim()) {
      onContinue(taskName.trim());
      setTaskName('');
      onOpenChange(false);
    }
  };

  const handleTemplateSelect = (template: TaskTemplate) => {
    haptic.light();
    onContinue(template.title, template);
    setTaskName('');
    onOpenChange(false);
  };

  const handleRandomAction = () => {
    if (templates.length === 0 || isRolling) return;
    
    setIsRolling(true);
    haptic.light();
    
    // Dice roll delay with haptic pulses
    let pulseCount = 0;
    const pulseInterval = setInterval(() => {
      haptic.light();
      pulseCount++;
      if (pulseCount >= 3) clearInterval(pulseInterval);
    }, 200);
    
    // After ~1 second, select and add the action
    setTimeout(() => {
      clearInterval(pulseInterval);
      const randomIndex = Math.floor(Math.random() * templates.length);
      const randomTemplate = templates[randomIndex];
      setIsRolling(false);
      if (randomTemplate) {
        haptic.success();
        handleTemplateSelect(randomTemplate);
      }
    }, 1000);
  };

  const handleBrowseAll = () => {
    haptic.light();
    onOpenChange(false);
    navigate('/app/routines');
  };

  const handleClose = () => {
    setTaskName('');
    setSelectedCategory('popular');
    onOpenChange(false);
  };

  // Filter templates based on search and category
  const filteredSuggestions = useMemo(() => {
    let items = templates;
    
    // Apply category filter
    if (selectedCategory === 'popular') {
      items = items.filter(t => t.is_popular);
    } else if (selectedCategory !== 'all') {
      items = items.filter(t => t.category === selectedCategory);
    }
    
    // Apply search filter if exists
    if (taskName.trim()) {
      const search = taskName.toLowerCase();
      items = items.filter(t => 
        t.title.toLowerCase().includes(search) ||
        t.category?.toLowerCase().includes(search)
      );
    }
    
    return items.slice(0, 6);
  }, [templates, selectedCategory, taskName]);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[85vh] rounded-t-3xl p-0 pb-safe"
        hideCloseButton
      >
        <div className="flex flex-col">
          {/* Compact Header with help button */}
          <div className="pt-3 pb-2 px-4 flex items-center justify-between">
            {startTour ? (
              <button 
                onClick={startTour}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                aria-label="Start tour"
              >
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </button>
            ) : (
              <div className="w-8" />
            )}
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            <button 
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Title input */}
          <div className="px-4 pb-3">
            <div className="bg-muted/50 rounded-xl p-3">
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value.slice(0, 50))}
                placeholder="Type a new action..."
                className="text-base font-medium text-center border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50 h-auto py-1"
                maxLength={50}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (taskName.trim()) {
                      handleContinue();
                    } else {
                      (e.target as HTMLInputElement).blur();
                      if (Capacitor.isNativePlatform()) {
                        Keyboard.hide();
                      }
                    }
                  }
                }}
              />
              <div className="text-[10px] text-muted-foreground/60 text-center mt-1">
                {taskName.length}/50
              </div>
            </div>
          </div>

          {/* Continue button - appears when name is entered */}
          {taskName.trim() && (
            <div className="px-4 pb-3">
              <Button
                onClick={handleContinue}
                className="w-full h-11 rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90"
              >
                Continue
              </Button>
            </div>
          )}

          <div className="px-4 pb-3 flex gap-2 tour-action-buttons">
            <button
              onClick={handleRandomAction}
              disabled={isRolling}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-muted/50 hover:bg-muted border border-border/30 transition-all active:scale-[0.98]",
                isRolling && "opacity-70"
              )}
            >
              <Dices className={cn("w-4 h-4 text-muted-foreground", isRolling && "animate-spin")} />
              <span className="text-sm font-medium text-foreground">
                {isRolling ? 'Rolling...' : 'Random'}
              </span>
            </button>
            <button
              onClick={handleBrowseAll}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-muted/50 hover:bg-muted border border-border/30 transition-all active:scale-[0.98]"
            >
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Browse All</span>
            </button>
          </div>

          {/* Category Pills */}
          <div className="pb-3">
            <ScrollArea className="w-full">
              <div className="flex gap-2 px-4">
                {/* Popular pill */}
                <button
                  onClick={() => {
                    haptic.light();
                    setSelectedCategory('popular');
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                    selectedCategory === 'popular'
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  ⭐ Popular
                </button>
                {/* Category pills from database */}
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => {
                      haptic.light();
                      setSelectedCategory(cat.slug);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                      selectedCategory === cat.slug
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                  >
                    {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </div>

          {/* Suggestions - TaskTemplateCard style */}
          {filteredSuggestions.length > 0 && (
            <div className="px-4 pb-4 tour-action-suggestions">
              <p className="text-xs text-muted-foreground mb-2">
                {taskName.trim() ? 'Matching actions' : 'Suggestions'}
              </p>
              <div className="space-y-2 tour-action-list">
                {filteredSuggestions.map((template) => {
                  const bgColor = TASK_COLORS[template.color as TaskColor] || TASK_COLORS.blue;
                  const timePeriodLabel = template.time_period 
                    ? TIME_PERIOD_LABELS[template.time_period] || template.time_period
                    : 'Anytime';

                  return (
                    <div 
                      key={template.id}
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
                          onClick={() => handleTemplateSelect(template)}
                          className="shrink-0 p-2.5 rounded-full bg-foreground hover:bg-foreground/90 transition-colors"
                          aria-label="Add action"
                        >
                          <CalendarPlus className="h-5 w-5 text-background" />
                        </button>
                      </div>

                      {/* Description box */}
                      {template.description && (
                        <div className="mx-2 mb-2 p-2.5 bg-white/90 rounded-lg">
                          <p className="text-xs text-black/80 leading-relaxed line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom safe area padding */}
          <div className="h-2" />
        </div>

        {/* Action Sheet Tour */}
        <ActionSheetTour isOpen={open} onTourReady={handleTourReady} />
      </SheetContent>
    </Sheet>
  );
};
