import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Dices, BookOpen, X } from 'lucide-react';
import { useTaskTemplates, TaskTemplate } from '@/hooks/useTaskPlanner';
import { useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';

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
  const { data: templates = [] } = useTaskTemplates();
  const { data: categories = [] } = useRoutineBankCategories();

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
    if (templates.length === 0) return;
    const randomIndex = Math.floor(Math.random() * templates.length);
    const randomTemplate = templates[randomIndex];
    if (randomTemplate) {
      haptic.success();
      handleTemplateSelect(randomTemplate);
    }
  };

  const handleBrowseAll = () => {
    haptic.light();
    onOpenChange(false);
    navigate('/app/inspire');
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
        className="h-auto max-h-[85vh] rounded-t-[28px] p-0 pb-safe bg-background/95 backdrop-blur-xl"
        hideCloseButton
      >
        <div className="flex flex-col">
          {/* iOS-style Header with drag handle */}
          <div className="pt-2 pb-3 px-5 flex items-center justify-between">
            <div className="w-8" />
            <div className="w-9 h-[5px] bg-muted-foreground/25 rounded-full" />
            <button 
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/60 active:scale-95 transition-transform"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Title input - iOS style */}
          <div className="px-5 pb-4">
            <div className="bg-secondary/60 rounded-2xl px-4 py-3">
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value.slice(0, 50))}
                placeholder="Type a new action..."
                className="text-[17px] font-medium text-center border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40 h-auto py-0"
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
              {taskName.length > 0 && (
                <div className="text-[11px] text-muted-foreground/50 text-center mt-2">
                  {taskName.length}/50
                </div>
              )}
            </div>
          </div>

          {/* Continue button - appears when name is entered */}
          {taskName.trim() && (
            <div className="px-5 pb-4">
              <Button
                onClick={handleContinue}
                className="w-full h-[50px] rounded-2xl bg-foreground text-background font-semibold text-[17px] active:scale-[0.98] transition-transform"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Quick Action Buttons - iOS pill style */}
          <div className="px-5 pb-4 flex gap-3">
            <button
              onClick={handleRandomAction}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-secondary/60 active:bg-secondary transition-colors active:scale-[0.98]"
            >
              <Dices className="w-[18px] h-[18px] text-foreground/70" />
              <span className="text-[15px] font-medium text-foreground">Random</span>
            </button>
            <button
              onClick={handleBrowseAll}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-secondary/60 active:bg-secondary transition-colors active:scale-[0.98]"
            >
              <BookOpen className="w-[18px] h-[18px] text-foreground/70" />
              <span className="text-[15px] font-medium text-foreground">Browse All</span>
            </button>
          </div>

          {/* Suggestions - iOS list style */}
          {filteredSuggestions.length > 0 && (
            <div className="px-5 pb-4">
              <p className="text-[13px] font-medium text-muted-foreground/70 uppercase tracking-wide mb-2 px-1">
                {taskName.trim() ? 'Matching' : 'Suggestions'}
              </p>
              <div className="bg-secondary/40 rounded-2xl overflow-hidden divide-y divide-border/30">
                {filteredSuggestions.map((template, index) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3.5 bg-transparent active:bg-secondary/60 transition-colors",
                      index === 0 && "rounded-t-2xl",
                      index === filteredSuggestions.length - 1 && "rounded-b-2xl"
                    )}
                  >
                    <FluentEmoji emoji={template.emoji || '📝'} size={28} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[16px] font-normal text-foreground truncate">
                        {template.title}
                      </p>
                    </div>
                    <span className="text-[13px] text-muted-foreground/60 shrink-0 mr-1">
                      {template.category}
                    </span>
                    <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Pills - iOS segmented style */}
          <div className="pb-5">
            <ScrollArea className="w-full">
              <div className="flex gap-2 px-5">
                <button
                  onClick={() => {
                    haptic.light();
                    setSelectedCategory('popular');
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full text-[14px] font-medium whitespace-nowrap transition-all shrink-0 active:scale-95",
                    selectedCategory === 'popular'
                      ? "bg-foreground text-background"
                      : "bg-secondary/60 text-foreground/80"
                  )}
                >
                  ⭐ Popular
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => {
                      haptic.light();
                      setSelectedCategory(cat.slug);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full text-[14px] font-medium whitespace-nowrap transition-all shrink-0 active:scale-95",
                      selectedCategory === cat.slug
                        ? "bg-foreground text-background"
                        : "bg-secondary/60 text-foreground/80"
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

          {/* Bottom safe area padding */}
          <div className="h-1" />
        </div>
      </SheetContent>
    </Sheet>
  );
};
