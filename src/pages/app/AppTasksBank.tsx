import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { TaskTemplateCard } from '@/components/app/TaskTemplateCard';
import { useTaskTemplates, useCreateTaskFromTemplate, TaskTemplate } from '@/hooks/useTaskPlanner';
import { useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { haptic } from '@/lib/haptics';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function AppTasksBank() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories, isLoading: categoriesLoading } = useRoutineBankCategories();
  const { data: allTasks, isLoading: tasksLoading } = useTaskTemplates();
  const createFromTemplate = useCreateTaskFromTemplate();

  const isLoading = categoriesLoading || tasksLoading;

  // Sort categories by task_display_order (0 goes to end, then ascending)
  const sortedCategories = useMemo(() => {
    if (!categories || !allTasks) return [];
    return categories
      .filter(c => (c.task_display_order ?? 0) !== 0 && allTasks.some(t => t.category === c.slug))
      .sort((a, b) => (a.task_display_order ?? 0) - (b.task_display_order ?? 0));
  }, [categories, allTasks]);

  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    if (!allTasks) return {};
    const grouped: Record<string, TaskTemplate[]> = {};
    for (const task of allTasks) {
      if (!grouped[task.category]) grouped[task.category] = [];
      grouped[task.category].push(task);
    }
    return grouped;
  }, [allTasks]);

  // Filter by search
  const matchesSearch = (task: TaskTemplate) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return task.title.toLowerCase().includes(q) || 
           task.description?.toLowerCase().includes(q) ||
           task.category.toLowerCase().includes(q);
  };

  const handleAddTask = (template: TaskTemplate) => {
    haptic.medium();
    const today = new Date();
    createFromTemplate.mutate({ template, date: today });
  };

  const handleCategoryTap = (slug: string) => {
    haptic.light();
    setSelectedCategory(prev => prev === slug ? null : slug);
  };

  // Categories to display in content
  const displayCategories = selectedCategory 
    ? sortedCategories.filter(c => c.slug === selectedCategory)
    : sortedCategories;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Fixed Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[#FFF8E1] dark:bg-amber-950/90 rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Tasks Library</h1>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-full active:bg-muted/50 transition-colors"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {showSearch && (
          <div className="px-4 pb-2 animate-in slide-in-from-top duration-200">
            <Input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50"
              autoFocus
            />
          </div>
        )}
      </header>

      {/* Header Spacer */}
      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="pb-safe w-full max-w-full">

          {/* Category pills - horizontal scroll */}
          {sortedCategories.length > 0 && (
            <div className="mt-4">
              <ScrollArea className="w-full">
                <div className="flex gap-3 px-4 pb-2">
                  {sortedCategories.map(cat => (
                    <CategoryCircle
                      key={cat.slug}
                      name={cat.name}
                      icon={cat.icon}
                      emoji={cat.emoji}
                      color={cat.color}
                      isSelected={selectedCategory === cat.slug}
                      onClick={() => handleCategoryTap(cat.slug)}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="px-4 pt-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}

          {/* Task lists grouped by category */}
          {!isLoading && displayCategories.map(cat => {
            const tasks = (tasksByCategory[cat.slug] || []).filter(matchesSearch);
            if (tasks.length === 0) return null;

            return (
              <div key={cat.slug} className="mt-6 first:mt-4">
                <div className="px-4 mb-3 flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{cat.name}</h2>
                  <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </div>
                <div className="px-4 space-y-2.5">
                  {tasks.map(task => (
                    <TaskTemplateCard
                      key={task.id}
                      template={task}
                      onAdd={() => handleAddTask(task)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Empty search state */}
          {!isLoading && searchQuery && displayCategories.every(cat => 
            (tasksByCategory[cat.slug] || []).filter(matchesSearch).length === 0
          ) && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No tasks found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Try a different search term</p>
            </div>
          )}

          {/* Bottom padding */}
          <div className="h-24" />
        </div>
      </div>
    </div>
  );
}
