import { useState, useMemo, useCallback } from 'react';
import { Search, Loader2, ListTodo } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { TaskTemplateCard } from '@/components/app/TaskTemplateCard';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { useTaskTemplates, TaskTemplate, TaskColor } from '@/hooks/useTaskPlanner';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader, AppHeaderSpacer } from '@/components/app/AppHeader';
import { useTranslation } from 'react-i18next';

export default function AppActions() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const { data: rawCategories } = useRoutineBankCategories();
  // Sort categories by task_display_order for the actions page
  const categories = useMemo(() => {
    if (!rawCategories) return rawCategories;
    return [...rawCategories].sort((a, b) => {
      if (a.slug === 'pro') return 1;
      if (b.slug === 'pro') return -1;
      const aOrder = a.task_display_order || 0;
      const bOrder = b.task_display_order || 0;
      // 0 means end of line
      if (aOrder === 0 && bOrder === 0) return 0;
      if (aOrder === 0) return 1;
      if (bOrder === 0) return -1;
      return aOrder - bOrder;
    });
  }, [rawCategories]);
  const { data: taskTemplates, isLoading: templatesLoading } = useTaskTemplates();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const filteredTaskTemplates = useMemo(() => {
    if (!taskTemplates) return [];
    let filtered = taskTemplates;
    
    if (selectedCategory === 'popular') {
      filtered = taskTemplates.filter(t => t.is_popular);
    } else if (selectedCategory && selectedCategory !== 'all') {
      filtered = taskTemplates.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [taskTemplates, selectedCategory, searchQuery]);

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
    if (!selectedTemplate || !user) {
      if (!user) toast.error('Please sign in to add routines');
      return;
    }

    try {
      setIsSavingTemplate(true);
      const editedTask = editedTasks.find(t => t.id === selectedTemplate.id);
      
      const proLinkType = editedTask?.pro_link_type ?? selectedTemplate.pro_link_type ?? 
        (selectedTemplate.linked_playlist_id ? 'playlist' : null);
      const proLinkValue = editedTask?.pro_link_value ?? selectedTemplate.pro_link_value ?? 
        selectedTemplate.linked_playlist_id ?? null;
      
      const { data: existingTasks } = await supabase
        .from('user_tasks')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1);
      
      const startOrderIndex = (existingTasks?.[0]?.order_index ?? -1) + 1;
      
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
          goal_enabled: selectedTemplate.goal_enabled ?? false,
          goal_target: selectedTemplate.goal_target ?? null,
          goal_type: selectedTemplate.goal_type ?? null,
          goal_unit: selectedTemplate.goal_unit ?? null,
        });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
      
      toast.success(t('tools.taskAdded'));
      setPreviewSheetOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
       console.error('Error adding task:', error);
       toast.error(t('tools.addTaskFailed'));
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <AppHeader
        title={t('tools.tasks')}
        showBack
        backTo="/app/routines"
        rightAction={
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
        }
      />
      <AppHeaderSpacer />

      {showSearch && (
        <div className="px-4 pb-2 animate-in slide-in-from-top duration-200">
          <Input
            type="search"
            placeholder={t('tools.searchTasks')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted/50"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="pb-safe w-full max-w-full">
          {/* Categories */}
          {categories && categories.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-muted-foreground px-4 mb-3">
                {t('tools.browseCategories')}
              </h2>
              <ScrollArea className="w-full">
                <div className="flex gap-2 px-4 pb-2">
                  <CategoryCircle
                    name={t('tools.popular')}
                    icon="Star"
                    color="yellow"
                    isSelected={selectedCategory === 'popular'}
                    onClick={() => setSelectedCategory('popular')}
                  />
                  <CategoryCircle
                    name={t('tools.all')}
                    icon="ListTodo"
                    color="blue"
                    isSelected={selectedCategory === 'all'}
                    onClick={() => setSelectedCategory('all')}
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
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </div>
          )}

          {/* Actions List */}
          <div className="mt-5 px-4 w-full max-w-full overflow-hidden pb-8">
            <div className="flex items-center gap-2 mb-3">
              <ListTodo className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-muted-foreground">
                 {selectedCategory === 'popular'
                   ? t('tools.popularTasks')
                   : selectedCategory === 'all'
                   ? t('tools.allTasks')
                   : t('tools.categoryTasks', { name: categories?.find(c => c.slug === selectedCategory)?.name?.toUpperCase() || '' })
                }
              </h2>
            </div>

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
                <p className="text-muted-foreground">{t('tools.noTasksInCategory')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
          isSaving={isSavingTemplate}
        />
      )}
    </div>
  );
}
