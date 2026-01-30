import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Loader2, Sparkles, ListTodo } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { RoutinePlanCard } from '@/components/app/RoutinePlanCard';
import { InspireBanner } from '@/components/app/InspireBanner';
import { TaskTemplateCard } from '@/components/app/TaskTemplateCard';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import {
  useRoutineCategories,
  useRoutinePlans,
  useFeaturedPlans,
  usePopularPlans,
  useProRoutinePlans,
  useAddRoutinePlan,
  RoutinePlanTask,
} from '@/hooks/useRoutinePlans';
import { useTaskTemplates, TaskTemplate, TaskColor } from '@/hooks/useTaskPlanner';
import { toast } from 'sonner';

export default function AppInspire() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useRoutineCategories();
  const { data: featuredPlans } = useFeaturedPlans();
  const { data: popularPlans, isLoading: popularLoading } = usePopularPlans();
  const { data: proPlans } = useProRoutinePlans();
  const { data: filteredPlans, isLoading: plansLoading } = useRoutinePlans(
    selectedCategory || undefined
  );
  const { data: taskTemplates, isLoading: templatesLoading } = useTaskTemplates();
  const addRoutinePlan = useAddRoutinePlan();

  // Determine which plans to display based on selected category
  const displayPlans = useMemo(() => {
    if (selectedCategory === 'popular') {
      return popularPlans;
    }
    if (selectedCategory === 'all-routines') {
      // Show all routine plans
      return filteredPlans;
    }
    if (selectedCategory === 'all-tasks') {
      // Don't show routines for all-tasks view
      return [];
    }
    // Category-specific plans
    return filteredPlans;
  }, [selectedCategory, filteredPlans, popularPlans]);

  const isLoading = categoriesLoading || popularLoading || (selectedCategory && selectedCategory !== 'popular' && plansLoading);

  // Filter task templates by selected category slug or popular
  const filteredTaskTemplates = useMemo(() => {
    if (!taskTemplates) return [];
    if (selectedCategory === 'popular') {
      return taskTemplates.filter(t => t.is_popular);
    }
    if (selectedCategory === 'all-tasks') {
      // Show all task templates
      return taskTemplates;
    }
    if (selectedCategory === 'all-routines') {
      // Don't show tasks for all-routines view
      return [];
    }
    if (!selectedCategory) return taskTemplates;
    // Compare against the category slug stored in admin_task_bank
    return taskTemplates.filter(t => t.category === selectedCategory);
  }, [taskTemplates, selectedCategory]);

  // Filter by search query
  const searchedPlans = displayPlans?.filter(plan => 
    !searchQuery || 
    plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Convert TaskTemplate to RoutinePlanTask for the preview sheet
  const syntheticTask: RoutinePlanTask | null = selectedTemplate ? {
    id: selectedTemplate.id,
    plan_id: `synthetic-task-${selectedTemplate.id}`,
    title: selectedTemplate.title,
    duration_minutes: selectedTemplate.duration_minutes || 1,
    icon: selectedTemplate.emoji || '✨',
    color: selectedTemplate.color as TaskColor,
    task_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    linked_playlist_id: selectedTemplate.linked_playlist_id || null,
    pro_link_type: selectedTemplate.pro_link_type as RoutinePlanTask['pro_link_type'] || null,
    pro_link_value: selectedTemplate.pro_link_value || null,
    linked_playlist: null,
  } : null;

  const handleAddTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setPreviewSheetOpen(true);
  };

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    if (!selectedTemplate) return;

    try {
      await addRoutinePlan.mutateAsync({
        planId: `synthetic-task-${selectedTemplate.id}`,
        selectedTaskIds,
        editedTasks,
        syntheticTasks: syntheticTask ? [syntheticTask] : [],
      });
      toast.success('Task added to your routine! ✨');
      setPreviewSheetOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Fixed Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Routines</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-full hover:bg-muted/50 transition-colors">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 pb-2 animate-in slide-in-from-top duration-200">
            <Input
              type="search"
              placeholder="Search routines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50"
            />
          </div>
        )}
      </header>

      {/* Header Spacer */}
      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="pb-safe w-full max-w-full">
          {/* Featured Banner Carousel */}
          {featuredPlans && featuredPlans.length > 0 && selectedCategory === 'popular' && !searchQuery && (
            <div className="px-4 pt-4">
              <InspireBanner plans={featuredPlans} />
            </div>
          )}

          {/* Pro Routines Section - only shown when Pro category is selected */}

          {/* Categories */}
          {categories && categories.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-muted-foreground px-4 mb-3">
                BROWSE CATEGORIES
              </h2>
              <ScrollArea className="w-full">
                <div className="flex gap-2 px-4 pb-2">
                  <CategoryCircle
                    name="Popular"
                    icon="Star"
                    color="yellow"
                    isSelected={selectedCategory === 'popular'}
                    onClick={() => setSelectedCategory('popular')}
                  />
                  <CategoryCircle
                    name="All Routines"
                    icon="Sparkles"
                    color="purple"
                    isSelected={selectedCategory === 'all-routines'}
                    onClick={() => setSelectedCategory('all-routines')}
                  />
                  <CategoryCircle
                    name="All Tasks"
                    icon="ListTodo"
                    color="blue"
                    isSelected={selectedCategory === 'all-tasks'}
                    onClick={() => setSelectedCategory('all-tasks')}
                  />
                  {categories.filter(c => c.slug !== 'pro').map((category) => (
                    <CategoryCircle
                      key={category.id}
                      name={category.name}
                      icon={category.icon}
                      color={category.color}
                      isSelected={selectedCategory === category.slug}
                      onClick={() => setSelectedCategory(category.slug)}
                    />
                  ))}
                  {categories.find(c => c.slug === 'pro') && (
                    <CategoryCircle
                      name={categories.find(c => c.slug === 'pro')!.name}
                      icon={categories.find(c => c.slug === 'pro')!.icon}
                      color={categories.find(c => c.slug === 'pro')!.color}
                      isSelected={selectedCategory === 'pro'}
                      onClick={() => setSelectedCategory('pro')}
                    />
                  )}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </div>
          )}

          {/* Plans Grid */}
          <div className="mt-5 px-4 w-full max-w-full overflow-hidden">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              {selectedCategory === 'popular'
                ? 'POPULAR ROUTINES'
                : selectedCategory === 'all-routines'
                ? 'ALL ROUTINES'
                : selectedCategory === 'all-tasks'
                ? 'ALL TASKS'
                : categories?.find(c => c.slug === selectedCategory)?.name?.toUpperCase() || 'ROUTINES'
              }
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchedPlans && searchedPlans.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 w-full max-w-full">
                {searchedPlans.map((plan) => (
                  <RoutinePlanCard
                    key={plan.id}
                    plan={plan}
                    onClick={() => navigate(`/app/routines/${plan.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No routines found' : 'No routines available yet'}
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {searchQuery ? 'Try a different search term' : 'Check back soon for new content!'}
                </p>
              </div>
            )}
          </div>

          {/* Task Ideas Section - hide for Pro category and all-routines since they focus on routines only */}
          {taskTemplates && taskTemplates.length > 0 && selectedCategory !== 'pro' && selectedCategory !== 'all-routines' && (
            <div className="mt-8 px-4 w-full max-w-full overflow-hidden pb-8">
              <div className="flex items-center gap-2 mb-3">
                <ListTodo className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-muted-foreground">
                  {selectedCategory === 'popular' 
                    ? 'POPULAR TASKS'
                    : selectedCategory === 'all-tasks'
                    ? 'ALL TASKS'
                    : `${categories?.find(c => c.slug === selectedCategory)?.name?.toUpperCase() || 'CATEGORY'} TASKS`
                  }
                </h2>
              </div>

              {/* Task Templates List */}
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTaskTemplates.length > 0 ? (
                <div className="space-y-2">
                  {filteredTaskTemplates.map((template) => (
                    <TaskTemplateCard
                      key={template.id}
                      template={template}
                      onAdd={() => handleAddTemplate(template)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks in this category</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Routine Preview Sheet for editing task before adding */}
      {syntheticTask && selectedTemplate && (
        <RoutinePreviewSheet
          open={previewSheetOpen}
          onOpenChange={(open) => {
            setPreviewSheetOpen(open);
            if (!open) setSelectedTemplate(null);
          }}
          tasks={[syntheticTask]}
          routineTitle={selectedTemplate.title}
          defaultTag={categories?.find(c => c.slug === selectedTemplate.category)?.name || null}
          onSave={handleSaveRoutine}
          isSaving={addRoutinePlan.isPending}
        />
      )}
    </div>
  );
}
