import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search, X, StickyNote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CleanTaskRow } from '@/components/app/tasksbank/CleanTaskRow';
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

export default function AppTasksBankCategory() {
  const { t } = useTranslation();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showBuilderPreview, setShowBuilderPreview] = useState(false);
  const [builderResult, setBuilderResult] = useState<{ title: string; emoji: string; color: string; tasks: BuilderTask[] } | null>(null);

  const { selectedTasks, setSelectedTasks, handleToggleTask, handleClearSelection } = useTaskBankSelection();

  const { data: categories } = useRoutineBankCategories();
  const { data: allTasks, isLoading: tasksLoading } = useTaskTemplates();

  const category = categories?.find(c => c.slug === categorySlug);
  const title = category?.name || t('tier1.tasksBank.tasksFallback');
  const categoryColor = category?.color || 'purple';
  const categoryEmoji = category?.emoji || '✨';

  // Soft pastel header bg per category color (matches CategorySection).
  const headerBgMap: Record<string, string> = {
    yellow: 'bg-amber-50',
    pink: 'bg-pink-50',
    purple: 'bg-purple-50',
    blue: 'bg-blue-50',
    green: 'bg-emerald-50',
    orange: 'bg-orange-50',
    red: 'bg-red-50',
    teal: 'bg-teal-50',
    indigo: 'bg-indigo-50',
    rose: 'bg-rose-50',
    amber: 'bg-amber-50',
    mint: 'bg-teal-50',
    lavender: 'bg-purple-50',
    sky: 'bg-sky-50',
    lime: 'bg-lime-50',
    peach: 'bg-orange-50',
    emerald: 'bg-emerald-50',
  };
  const heroBg = headerBgMap[categoryColor] || headerBgMap.purple;

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

  // Auto-select a task when deep-linked via ?add=<taskId> (e.g. from a channel attach).
  const autoAddHandledRef = useRef(false);
  useEffect(() => {
    if (autoAddHandledRef.current) return;
    const addId = searchParams.get('add');
    if (!addId || !allTasks) return;
    const target = allTasks.find(t => t.id === addId);
    if (!target) return;
    autoAddHandledRef.current = true;
    setSelectedTasks(new Set([addId]));
    haptic.medium();
    // Open the builder so user can confirm and add to their routine.
    setTimeout(() => setShowBuilder(true), 250);
    // Clean the URL so refresh/back doesn't re-trigger.
    const next = new URLSearchParams(searchParams);
    next.delete('add');
    setSearchParams(next, { replace: true });
  }, [searchParams, allTasks, setSelectedTasks, setSearchParams]);

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

  const selectionCount = selectedTasks.size;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[#FFF8E1] dark:bg-amber-950/90 rounded-b-3xl shadow-ios"
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
            <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-full active:bg-muted/50 transition-colors">
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
          {tasksLoading && (
            <div className="px-4 pt-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}

          {!tasksLoading && (
            <div className="px-4 pt-4 space-y-3">
              {/* Hero card — pastel background, big emoji, name + description */}
              {category && (
                <div className={cn('rounded-2xl p-4 flex items-center gap-4', heroBg)}>
                  <span className="shrink-0 w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center">
                    <FluentEmoji emoji={categoryEmoji} size={42} />
                  </span>
                  {category.description ? (
                    <p className="flex-1 text-[16px] font-bold text-black leading-snug">
                      {category.description}
                    </p>
                  ) : (
                    <h2 className="flex-1 text-[16px] font-bold text-black leading-snug">{category.name}</h2>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {filteredTasks.map(task => (
                  <CleanTaskRow
                    key={task.id}
                    template={task}
                    onToggle={() => handleToggleTask(task.id)}
                    isSelected={selectedTasks.has(task.id)}
                    accentColor={categoryColor}
                  />
                ))}
              </div>
            </div>
          )}

          {!tasksLoading && filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">{t('tier1.tasksBank.noTasks')}</p>
            </div>
          )}

          <div className={cn(selectionCount > 0 ? "h-40" : "h-24")} />
        </div>
      </div>

      {selectionCount > 0 && (
        <div
          className="fixed left-0 right-0 bottom-28 z-40 px-4 pb-2 animate-in slide-in-from-bottom duration-300"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearSelection}
              aria-label="Cancel selection"
              className="shrink-0 h-14 w-14 rounded-2xl bg-card-warm text-fg-warm shadow-ios flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
            <Button onClick={handleOpenBuilder} className="flex-1 h-14 rounded-2xl text-base font-bold gap-2 shadow-lg" size="lg">
              <FluentEmoji emoji="✨" size={20} />
              {t('tier1.tasksBank.buildMyRoutine', { n: selectionCount })}
            </Button>
          </div>
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
