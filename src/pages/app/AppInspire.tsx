import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Loader2, Sparkles, ListTodo } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { RoutineBankCard } from '@/components/app/RoutineBankCard';
import { TaskTemplateCard } from '@/components/app/TaskTemplateCard';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import {
  useRoutineBankCategories,
  useRoutinesBank,
  usePopularRoutinesBank,
  useFeaturedRoutinesBank,
  useAddRoutineFromBank,
  RoutineBankTask,
} from '@/hooks/useRoutinesBank';
import { useTaskTemplates, useCreateTask, TaskTemplate, TaskColor } from '@/hooks/useTaskPlanner';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function AppInspire() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useRoutineBankCategories();
  const { data: featuredRoutines } = useFeaturedRoutinesBank();
  const { data: popularRoutines, isLoading: popularLoading } = usePopularRoutinesBank();
  const { data: filteredRoutines, isLoading: routinesLoading } = useRoutinesBank(
    selectedCategory && selectedCategory !== 'popular' && selectedCategory !== 'all-routines' && selectedCategory !== 'all-tasks'
      ? selectedCategory
      : undefined
  );
  const { data: taskTemplates, isLoading: templatesLoading } = useTaskTemplates();
  const addRoutineFromBank = useAddRoutineFromBank();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Determine which routines to display based on selected category
  const displayRoutines = useMemo(() => {
    if (selectedCategory === 'popular') {
      return popularRoutines;
    }
    if (selectedCategory === 'all-routines') {
      // Show all routines
      return filteredRoutines;
    }
    if (selectedCategory === 'all-tasks') {
      // Don't show routines for all-tasks view
      return [];
    }
    // Category-specific routines
    return filteredRoutines;
  }, [selectedCategory, filteredRoutines, popularRoutines]);

  const isLoading = categoriesLoading || popularLoading || (selectedCategory && selectedCategory !== 'popular' && routinesLoading);

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
  const searchedRoutines = displayRoutines?.filter(routine => 
    !searchQuery || 
    routine.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    routine.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Convert TaskTemplate to RoutinePlanTask for the preview sheet
  const syntheticTask: RoutinePlanTask | null = selectedTemplate ? {
    id: selectedTemplate.id,
    plan_id: `synthetic-task-${selectedTemplate.id}`,
    title: selectedTemplate.title,
    description: selectedTemplate.description || null,
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
    if (!user) {
      toast.error('Please sign in to add rituals');
      return;
    }

    try {
      setIsSavingTemplate(true);
      
      // Get the edited task data (there's only one for a single template)
      const editedTask = editedTasks.find(t => t.id === selectedTemplate.id);
      
      // Determine pro_link fields
      const proLinkType = editedTask?.pro_link_type ?? selectedTemplate.pro_link_type ?? 
        (selectedTemplate.linked_playlist_id ? 'playlist' : null);
      const proLinkValue = editedTask?.pro_link_value ?? selectedTemplate.pro_link_value ?? 
        selectedTemplate.linked_playlist_id ?? null;
      
      // Get current max order_index
      const { data: existingTasks } = await supabase
        .from('user_tasks')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1);
      
      const startOrderIndex = (existingTasks?.[0]?.order_index ?? -1) + 1;
      
      // Create the user task directly
      const { error } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          title: editedTask?.title || selectedTemplate.title,
          emoji: editedTask?.icon || selectedTemplate.emoji || '✨',
          color: editedTask?.color || selectedTemplate.color || 'mint',
          repeat_pattern: editedTask?.repeatPattern || 'daily',
          scheduled_time: editedTask?.scheduledTime || null,
          tag: editedTask?.tag ?? selectedTemplate.category ?? null,
          linked_playlist_id: proLinkType === 'playlist' ? proLinkValue : null,
          pro_link_type: proLinkType,
          pro_link_value: proLinkValue,
          is_active: true,
          order_index: startOrderIndex,
          // Copy goal settings from template
          goal_enabled: selectedTemplate.goal_enabled ?? false,
          goal_target: selectedTemplate.goal_target ?? null,
          goal_type: selectedTemplate.goal_type ?? null,
          goal_unit: selectedTemplate.goal_unit ?? null,
        });
      
      if (error) throw error;
      
      // Invalidate queries to refresh planner
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
      
      toast.success('Action added to your rituals! ✨');
      setPreviewSheetOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error adding action:', error);
      toast.error('Failed to add action');
    } finally {
      setIsSavingTemplate(false);
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
            <h1 className="text-xl font-bold text-foreground">Rituals</h1>
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
              placeholder="Search rituals..."
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
                    name="All Rituals"
                    icon="Sparkles"
                    color="purple"
                    isSelected={selectedCategory === 'all-routines'}
                    onClick={() => setSelectedCategory('all-routines')}
                  />
                  <CategoryCircle
                    name="All Actions"
                    icon="ListTodo"
                    color="blue"
                    isSelected={selectedCategory === 'all-tasks'}
                    onClick={() => setSelectedCategory('all-tasks')}
                  />
                  {categories.filter(c => c.slug !== 'pro').map((category) => (
                    <CategoryCircle
                      key={category.slug}
                      name={category.name}
                      icon={category.icon}
                      emoji={category.emoji}
                      color={category.color}
                      isSelected={selectedCategory === category.slug}
                      onClick={() => setSelectedCategory(category.slug)}
                    />
                  ))}
                  {categories.find(c => c.slug === 'pro') && (
                    <CategoryCircle
                      name={categories.find(c => c.slug === 'pro')!.name}
                      icon={categories.find(c => c.slug === 'pro')!.icon}
                      emoji={categories.find(c => c.slug === 'pro')!.emoji}
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

          {/* Routines Grid - only show if there are routines */}
          {searchedRoutines && searchedRoutines.length > 0 && (
            <div className="mt-5 px-4 w-full max-w-full overflow-hidden">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                {selectedCategory === 'popular'
                  ? 'POPULAR RITUALS'
                  : selectedCategory === 'all-routines'
                  ? 'ALL RITUALS'
                  : selectedCategory === 'all-tasks'
                  ? 'ALL ACTIONS'
                  : categories?.find(c => c.slug === selectedCategory)?.name?.toUpperCase() || 'RITUALS'
                }
              </h2>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 w-full max-w-full">
                  {searchedRoutines.map((routine) => (
                    <RoutineBankCard
                      key={routine.id}
                      routine={routine}
                      onClick={() => navigate(`/app/routines/${routine.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Task Ideas Section - hide for all-routines since they focus on routines only */}
          {taskTemplates && taskTemplates.length > 0 && selectedCategory !== 'all-routines' && (
            <div className="mt-8 px-4 w-full max-w-full overflow-hidden pb-8">
              <div className="flex items-center gap-2 mb-3">
                <ListTodo className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-muted-foreground">
                  {selectedCategory === 'popular' 
                    ? 'POPULAR ACTIONS'
                    : selectedCategory === 'all-tasks'
                    ? 'ALL ACTIONS'
                    : `${categories?.find(c => c.slug === selectedCategory)?.name?.toUpperCase() || 'CATEGORY'} ACTIONS`
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
                  <p className="text-muted-foreground">No actions in this category</p>
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
          isSaving={addRoutineFromBank.isPending}
        />
      )}
    </div>
  );
}
