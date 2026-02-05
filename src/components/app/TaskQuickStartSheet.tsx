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
        className="h-auto max-h-[85vh] rounded-t-3xl p-0 pb-safe"
        hideCloseButton
      >
        <div className="flex flex-col">
          {/* Compact Header */}
          <div className="pt-3 pb-2 px-4 flex items-center justify-between">
            <div className="w-8" /> {/* Spacer */}
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

          {/* Quick Action Buttons */}
          <div className="px-4 pb-3 flex gap-2">
            <button
              onClick={handleRandomAction}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-muted/50 hover:bg-muted border border-border/30 transition-all active:scale-[0.98]"
            >
              <Dices className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Random</span>
            </button>
            <button
              onClick={handleBrowseAll}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-muted/50 hover:bg-muted border border-border/30 transition-all active:scale-[0.98]"
            >
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Browse All</span>
            </button>
          </div>

          {/* Suggestions */}
          {filteredSuggestions.length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-xs text-muted-foreground mb-2">
                {taskName.trim() ? 'Matching actions' : 'Suggestions'}
              </p>
              <div className="space-y-1.5">
                {filteredSuggestions.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-card border border-border/50 hover:bg-muted/50 transition-all active:scale-[0.99]"
                  >
                    <FluentEmoji emoji={template.emoji || '📝'} size={24} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[15px] text-foreground truncate">
                        {template.title}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {template.category}
                    </span>
                    <div className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Pills */}
          <div className="pb-4">
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

          {/* Bottom safe area padding */}
          <div className="h-2" />
        </div>
      </SheetContent>
    </Sheet>
  );
};
