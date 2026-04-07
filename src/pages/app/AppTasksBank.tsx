import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, StickyNote, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { TaskTemplateCard } from '@/components/app/TaskTemplateCard';
import { useTaskTemplates, TaskTemplate } from '@/hooks/useTaskPlanner';
import { useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { haptic } from '@/lib/haptics';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateTaskFromTemplate } from '@/hooks/useTaskPlanner';

const PREVIEW_COUNT = 8;

export default function AppTasksBank() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useRoutineBankCategories();
  const { data: allTasks, isLoading: tasksLoading } = useTaskTemplates();
  const createTask = useCreateTaskFromTemplate();

  const isLoading = categoriesLoading || tasksLoading;

  const sortedCategories = useMemo(() => {
    if (!categories || !allTasks) return [];
    return categories
      .filter(c => (c.task_display_order ?? 0) !== 0 && allTasks.some(t => t.category === c.slug))
      .sort((a, b) => (a.task_display_order ?? 0) - (b.task_display_order ?? 0));
  }, [categories, allTasks]);

  const tasksByCategory = useMemo(() => {
    if (!allTasks) return {};
    const grouped: Record<string, TaskTemplate[]> = {};
    for (const task of allTasks) {
      if (!grouped[task.category]) grouped[task.category] = [];
      grouped[task.category].push(task);
    }
    return grouped;
  }, [allTasks]);

  const matchesSearch = (task: TaskTemplate) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return task.title.toLowerCase().includes(q) ||
           task.description?.toLowerCase().includes(q) ||
           task.category.toLowerCase().includes(q);
  };

  // If searching, show flat filtered results
  const isSearching = searchQuery.length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching || !allTasks) return [];
    return allTasks.filter(matchesSearch);
  }, [allTasks, searchQuery, isSearching]);

  const handleCategoryTap = (slug: string) => {
    haptic.light();
    navigate(`/app/tasksbank/${slug}`);
  };

  const handleAddTask = (task: TaskTemplate) => {
    haptic.light();
    createTask.mutate({ template: task, date: new Date() });
  };

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
            <h1 className="text-xl font-bold text-foreground">Self-Care Habits</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/app/projects')}
              className="p-2 rounded-full active:bg-muted/50 transition-colors"
              aria-label="Task Drafts"
            >
              <StickyNote className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full active:bg-muted/50 transition-colors"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
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
          {!isSearching && sortedCategories.length > 0 && (
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

          {/* Search results - flat list */}
          {!isLoading && isSearching && (
            <div className="px-4 pt-4 space-y-2.5">
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">No tasks found</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Try a different search term</p>
                </div>
              ) : (
                searchResults.map(task => (
                  <TaskTemplateCard
                    key={task.id}
                    template={task}
                    onAdd={() => handleAddTask(task)}
                  />
                ))
              )}
            </div>
          )}

          {/* Category sections with horizontal scroll previews */}
          {!isLoading && !isSearching && sortedCategories.map(cat => {
            const tasks = tasksByCategory[cat.slug] || [];
            if (tasks.length === 0) return null;

            return (
              <div key={cat.slug} className="mt-6 first:mt-4">
                {/* Section header */}
                <button
                  onClick={() => handleCategoryTap(cat.slug)}
                  className="w-full flex items-center justify-between px-4 mb-3 active:opacity-70 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">{cat.name}</h2>
                    <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-full">
                      {tasks.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary">
                    All
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                {/* Horizontal scroll of task cards - 2 rows */}
                <ScrollArea className="w-full">
                  <div className="flex gap-2.5 px-4 pb-2">
                    {(() => {
                      const preview = tasks.slice(0, PREVIEW_COUNT);
                      const columns: TaskTemplate[][] = [];
                      for (let i = 0; i < preview.length; i += 2) {
                        columns.push(preview.slice(i, i + 2));
                      }
                      return columns.map((col, ci) => (
                        <div key={ci} className="flex flex-col gap-2 min-w-[260px] max-w-[260px]">
                          {col.map(task => (
                            <TaskTemplateCard
                              key={task.id}
                              template={task}
                              onAdd={() => handleAddTask(task)}
                            />
                          ))}
                        </div>
                      ));
                    })()}
                    {/* "See more" card */}
                    {tasks.length > PREVIEW_COUNT && (
                      <button
                        onClick={() => handleCategoryTap(cat.slug)}
                        className="min-w-[100px] max-w-[100px] rounded-xl border border-border/50 bg-muted/30 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform self-stretch"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ChevronRight className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          +{tasks.length - PREVIEW_COUNT} more
                        </span>
                      </button>
                    )}
                  </div>
                  <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
              </div>
            );
          })}

          <div className="h-24" />
        </div>
      </div>
    </div>
  );
}
