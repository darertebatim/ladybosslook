import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, StickyNote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TaskTemplateCard } from '@/components/app/TaskTemplateCard';
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

export default function AppTasksBankCategory() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showBuilder, setShowBuilder] = useState(false);
  const [showBuilderPreview, setShowBuilderPreview] = useState(false);
  const [builderResult, setBuilderResult] = useState<{ title: string; emoji: string; color: string; tasks: BuilderTask[] } | null>(null);

  const { data: categories } = useRoutineBankCategories();
  const { data: allTasks, isLoading: tasksLoading } = useTaskTemplates();

  const category = categories?.find(c => c.slug === categorySlug);
  const title = category?.name || 'Tasks';

  const tasks = useMemo(() => {
    if (!allTasks) return [];
    return allTasks.filter(t => t.category === categorySlug);
  }, [allTasks, categorySlug]);

  const matchesSearch = (task: TaskTemplate) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return task.title.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q);
  };

  const filteredTasks = useMemo(() => tasks.filter(matchesSearch), [tasks, searchQuery]);

  const handleToggleTask = useCallback((taskId: string) => {
    haptic.light();
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const handleClearSelection = () => {
    haptic.light();
    setSelectedTasks(new Set());
  };

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
            tag: edited?.tag ?? builderResult.title,
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

      toast({ title: 'Routine created! 🎉' });
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
      toast({ title: 'Failed to create routine', variant: 'destructive' });
    }
  };

  const selectionCount = selectedTasks.size;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[#FFF8E1] dark:bg-amber-950/90 rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/app/tasksbank')} className="p-1 -ml-1 active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-full">
              {filteredTasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {selectionCount > 0 && (
              <button onClick={handleClearSelection} className="p-2 rounded-full active:bg-muted/50 transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-full active:bg-muted/50 transition-colors">
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

      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="pb-safe w-full max-w-full">
          {tasksLoading && (
            <div className="px-4 pt-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}

          {!tasksLoading && (
            <div className="px-4 pt-4 space-y-2.5">
              {filteredTasks.map(task => (
                <TaskTemplateCard
                  key={task.id}
                  template={task}
                  onAdd={() => handleToggleTask(task.id)}
                  isSelected={selectedTasks.has(task.id)}
                  selectable
                />
              ))}
            </div>
          )}

          {!tasksLoading && filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No tasks found</p>
            </div>
          )}

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
            Build My Routine ({selectionCount})
          </Button>
        </div>
      )}

      <RoutineBuilderSheet
        open={showBuilder}
        onOpenChange={setShowBuilder}
        onComplete={handleBuilderComplete}
        initialTitle="My Self-Care Routine"
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
