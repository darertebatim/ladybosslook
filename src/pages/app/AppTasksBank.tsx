import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search, ChevronRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { TaskTemplateCard } from '@/components/app/TaskTemplateCard';
import { CleanTaskRow } from '@/components/app/tasksbank/CleanTaskRow';
import { CategorySection } from '@/components/app/tasksbank/CategorySection';
import { useTaskTemplates, TaskTemplate } from '@/hooks/useTaskPlanner';
import { useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { haptic } from '@/lib/haptics';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RoutineBuilderSheet, BuilderTask } from '@/components/app/RoutineBuilderSheet';
import { RoutinePreviewSheet, EditedTask, ROUTINE_COLOR_CYCLE } from '@/components/app/RoutinePreviewSheet';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useTaskBankSelection } from '@/hooks/useTaskBankSelection';
import { PromoBanner } from '@/components/app/PromoBanner';
import { HomeBanner } from '@/components/app/HomeBanner';
import { SelfCareQuizBanner } from '@/components/app/SelfCareQuizBanner';

const PREVIEW_COUNT = 8;

export default function AppTasksBank() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showBuilderPreview, setShowBuilderPreview] = useState(false);
  const [builderResult, setBuilderResult] = useState<{ title: string; emoji: string; color: string; tasks: BuilderTask[] } | null>(null);

  const { selectedTasks, setSelectedTasks, handleToggleTask, handleClearSelection } = useTaskBankSelection();

  const { data: categories, isLoading: categoriesLoading } = useRoutineBankCategories();
  const { data: allTasks, isLoading: tasksLoading } = useTaskTemplates();

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

  const isSearching = searchQuery.length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching || !allTasks) return [];
    return allTasks.filter(matchesSearch);
  }, [allTasks, searchQuery, isSearching]);

  const handleCategoryTap = (slug: string) => {
    haptic.light();
    navigate(`/app/tasksbank/${slug}`);
  };

  const selectionCount = selectedTasks.size;

  const getBuilderTasks = useCallback((): BuilderTask[] => {
    if (!allTasks) return [];
    return Array.from(selectedTasks)
      .map(id => allTasks.find(t => t.id === id))
      .filter(Boolean)
      .map((t, i) => ({
        id: t!.id,
        title: t!.title,
        emoji: t!.emoji || '📝',
        color: t!.color || ROUTINE_COLOR_CYCLE[i % ROUTINE_COLOR_CYCLE.length],
        repeat_pattern: t!.repeat_pattern || 'daily',
        repeat_days: t!.repeat_days || null,
        description: t!.description,
        pro_link_type: t!.pro_link_type,
        pro_link_value: t!.pro_link_value,
        goal_enabled: t!.goal_enabled,
        goal_target: t!.goal_target,
        goal_type: t!.goal_type,
        goal_unit: t!.goal_unit,
        time_period: t!.time_period,
        linked_playlist_id: t!.linked_playlist_id,
        category: t!.category,
      }));
  }, [allTasks, selectedTasks]);

  const handleOpenBuilder = () => {
    haptic.medium();
    setShowBuilder(true);
  };

  const handleBuilderComplete = (title: string, emoji: string, color: string, tasks: BuilderTask[]) => {
    setShowBuilder(false);
    setBuilderResult({ title, emoji, color, tasks });
    setShowBuilderPreview(true);
  };

  const handleBuilderPreviewSave = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    if (!user || !builderResult) return;
    try {
      const { data: newRoutine, error: routineError } = await supabase
        .from('user_routines_bank')
        .insert({
          user_id: user.id,
          title: builderResult.title,
          emoji: builderResult.emoji,
          color: builderResult.color,
          is_active: true,
          is_user_created: true,
          category: null,
        } as any)
        .select('id, routine_id')
        .single();

      if (routineError) throw routineError;
      const routineId = (newRoutine as any).routine_id;

      const selectedBuilderTasks = builderResult.tasks.filter(t => selectedTaskIds.includes(t.id));
      const editedMap = new Map(editedTasks.map(e => [e.id, e]));

      const { data: existingTasks } = await supabase
        .from('user_tasks')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1);
      const startOrder = (existingTasks?.[0]?.order_index ?? -1) + 1;

      const hasProTask = selectedTaskIds.some(id => id.startsWith('__pro_task_routine_'));
      const regularTasks = selectedBuilderTasks.filter(t => !t.id.startsWith('__pro_task_routine_'));

      if (regularTasks.length > 0) {
        const userTasks = regularTasks.map((task: any, index: number) => {
          const edited = editedMap.get(task.id);
          return {
            user_id: user.id,
            title: edited?.title || task.title,
            emoji: edited?.icon || task.emoji || '📝',
            color: edited?.color || task.color || ROUTINE_COLOR_CYCLE[index % ROUTINE_COLOR_CYCLE.length],
            repeat_pattern: edited?.repeatPattern || task.repeat_pattern || 'daily',
            repeat_days: task.repeat_days || null,
            scheduled_time: edited?.scheduledTime || null,
            // Use the admin task bank's category as the tag (like FAB-added tasks)
            tag: edited?.tag ?? task.category ?? builderResult.title,
            time_period: task.time_period || null,
            linked_playlist_id: (edited?.pro_link_type || task.pro_link_type) === 'playlist' ? (edited?.pro_link_value || task.pro_link_value) : null,
            pro_link_type: edited?.pro_link_type || task.pro_link_type || null,
            pro_link_value: edited?.pro_link_value || task.pro_link_value || null,
            is_active: true,
            order_index: startOrder + index,
            goal_enabled: task.goal_enabled || false,
            goal_target: task.goal_target || null,
            goal_type: task.goal_type || null,
            goal_unit: task.goal_unit || null,
            duration_minutes: task.duration_minutes || null,
            source_routine_id: routineId,
          };
        });
        await supabase.from('user_tasks').insert(userTasks);
      }

      if (hasProTask) {
        const proEdited = editedTasks.find(e => e.id.startsWith('__pro_task_routine_'));
        await supabase.from('user_tasks').insert({
          user_id: user.id,
          title: proEdited?.title || builderResult.title,
          emoji: proEdited?.icon || '🎬',
          color: proEdited?.color || 'mint',
          repeat_pattern: 'daily',
          tag: builderResult.title,
          pro_link_type: 'routine',
          pro_link_value: routineId,
          is_active: true,
          order_index: startOrder + regularTasks.length,
          source_routine_id: null,
        });
      }

      toast({ title: t('tier1.tasksBank.routineCreated') });
      setShowBuilderPreview(false);
      setBuilderResult(null);
      setSelectedTasks(new Set());
      queryClient.invalidateQueries({ queryKey: ['user-routines-all'] });
      queryClient.invalidateQueries({ queryKey: ['routine-user-tasks-emojis'] });
      queryClient.invalidateQueries({ queryKey: ['routine-user-task-ids'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
    } catch (err) {
      console.error('Failed to create routine:', err);
      toast({ title: t('tier1.tasksBank.createFailed'), variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[#FFF8E1] dark:bg-amber-950/90 rounded-b-3xl shadow-ios"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">{t('tier1.tasksBank.title')}</h1>
          </div>
          <div className="flex items-center gap-1">
            {selectionCount > 0 && (
              <button onClick={handleClearSelection} className="p-2 rounded-full active:bg-muted/50 transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
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
              placeholder={t('tier1.tasksBank.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50"
              autoFocus
            />
          </div>
        )}
      </header>

      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="pb-safe w-full max-w-full">

          {/* Promo Banner - Top */}
          {!isSearching && (
            <>
              <PromoBanner location="tasks_bank_top" className="px-4 pt-4" carousel />
              <HomeBanner location="tasks_bank_top" className="px-4 pt-4" />
            </>
          )}

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

          {!isSearching && (
            <>
              <div className="px-4 pb-2">
                <SelfCareQuizBanner />
              </div>
              <PromoBanner location="tasks_bank_after_categories" className="px-4 pb-2" carousel />
              <HomeBanner location="tasks_bank_after_categories" className="px-4 pb-2" />
            </>
          )}

          {isLoading && (
            <div className="px-4 pt-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && isSearching && (
            <div className="px-4 pt-4 space-y-2.5">
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">{t('tier1.tasksBank.noTasks')}</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">{t('tier1.tasksBank.tryDifferent')}</p>
                </div>
              ) : (
                searchResults.map(task => {
                  const cat = sortedCategories.find(c => c.slug === task.category);
                  return (
                    <CleanTaskRow
                      key={task.id}
                      template={task}
                      onToggle={() => handleToggleTask(task.id)}
                      isSelected={selectedTasks.has(task.id)}
                      accentColor={cat?.color || task.color}
                    />
                  );
                })
              )}
            </div>
          )}

          {!isLoading && !isSearching && sortedCategories.map((cat, idx) => {
            const tasks = tasksByCategory[cat.slug] || [];
            if (tasks.length === 0) return null;
            const preview = tasks.slice(0, PREVIEW_COUNT);

             return (
              <CategorySection
                key={cat.slug}
                name={cat.name}
                emoji={cat.emoji}
                description={cat.description}
                color={cat.color}
                count={tasks.length}
                defaultOpen={idx < 2}
                onSeeAll={tasks.length > PREVIEW_COUNT ? () => handleCategoryTap(cat.slug) : undefined}
                seeAllLabel={t('tier1.tasksBank.moreCount', { n: tasks.length - PREVIEW_COUNT })}
              >
                {preview.map(task => (
                  <CleanTaskRow
                    key={task.id}
                    template={task}
                    onToggle={() => handleToggleTask(task.id)}
                    isSelected={selectedTasks.has(task.id)}
                    accentColor={cat.color}
                  />
                ))}
              </CategorySection>
            );
          })}

          <div className={cn(selectionCount > 0 ? "h-40" : "h-24")} />
        </div>
      </div>

      {selectionCount > 0 && (
        <div
          className="fixed left-0 right-0 bottom-20 z-40 px-4 pb-2 animate-in slide-in-from-bottom duration-300"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
        >
          <Button onClick={handleOpenBuilder} className="w-full h-14 rounded-2xl text-base font-bold gap-2 shadow-lg" size="lg">
            <FluentEmoji emoji="✨" size={20} />
            {t('tier1.tasksBank.buildMyRoutine', { n: selectionCount })}
          </Button>
        </div>
      )}

      <RoutineBuilderSheet
        open={showBuilder}
        onOpenChange={setShowBuilder}
        onComplete={handleBuilderComplete}
        initialTitle={t('tier1.tasksBank.myRoutine')}
        initialEmoji="✨"
        initialColor="mint"
        initialTasks={getBuilderTasks()}
      />

      {builderResult && (
        <RoutinePreviewSheet
          open={showBuilderPreview}
          onOpenChange={(open) => {
            setShowBuilderPreview(open);
            if (!open) setBuilderResult(null);
          }}
          tasks={builderResult.tasks.map((t, i) => ({
            id: t.id,
            plan_id: 'user-created',
            title: t.title,
            icon: t.emoji || '📝',
            color: t.color,
            task_order: i,
            is_active: true,
            created_at: new Date().toISOString(),
            linked_playlist_id: t.linked_playlist_id || null,
            pro_link_type: t.pro_link_type as any,
            pro_link_value: t.pro_link_value || null,
            tag: builderResult.title,
            linked_playlist: null,
            repeat_pattern: t.repeat_pattern,
            repeat_days: t.repeat_days,
            goal_enabled: t.goal_enabled,
            goal_target: t.goal_target,
            goal_type: t.goal_type,
            goal_unit: t.goal_unit,
            description: t.description,
            time_period: t.time_period,
          } as any))}
          routineTitle={builderResult.title}
          routineBankId="user-created"
          onSave={handleBuilderPreviewSave}
        />
      )}
    </div>
  );
}
