import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Loader2, ChevronRight, RotateCw, ChevronLeft, Trash2, CalendarPlus, Bell, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PRO_LINK_CONFIGS, type ProLinkType } from '@/lib/proTaskTypes';
import { TASK_COLOR_CLASSES, type TaskColor } from '@/hooks/useTaskPlanner';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/haptics';
import { startOfDay, endOfDay, format } from 'date-fns';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { toast } from 'sonner';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { SortableTaskList } from '@/components/app/SortableTaskList';
import { useTasksForDate, useCompletionsForDate, UserTask, useAddGoalProgress, useDeleteTask } from '@/hooks/useTaskPlanner';
import { isWaterTask } from '@/lib/waterTracking';
import { TaskDetailModal } from '@/components/app/TaskDetailModal';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AppRoutinePlayer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { startRoutine, isActive } = useRoutinePlayerContext();
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [deleteRoutine, setDeleteRoutine] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const [showPageRoutineSheet, setShowPageRoutineSheet] = useState(false);

  // Check if routine player page is already added as a task
  const { data: isPageAdded } = useExistingProTask('route', '/app/routineplayer');

  // Fetch ALL user routines from user_routines_bank (user-owned copies)
  const { data: myRoutines, isLoading } = useQuery({
    queryKey: ['user-routines-all', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_routines_bank')
        .select('id, routine_id, title, emoji, cover_image_url, category, color, is_focus, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  // Fetch user_tasks grouped by source_routine_id for emoji chains
  const routineIds = useMemo(() => {
    return (myRoutines || []).map((r: any) => r.routine_id);
  }, [myRoutines]);

  const { data: routineTasksMap } = useQuery({
    queryKey: ['routine-user-tasks-emojis', user?.id, routineIds],
    queryFn: async () => {
      if (!user || routineIds.length === 0) return {};
      const { data } = await supabase
        .from('user_tasks')
        .select('source_routine_id, title, emoji, order_index')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('source_routine_id', routineIds)
        .order('order_index', { ascending: true });

      const map: Record<string, { title: string; emoji: string }[]> = {};
      (data || []).forEach((t: any) => {
        const rid = t.source_routine_id;
        if (!rid) return;
        if (!map[rid]) map[rid] = [];
        map[rid].push({ title: t.title, emoji: t.emoji || '📝' });
      });
      return map;
    },
    enabled: !!user && routineIds.length > 0,
  });

  // Fetch today's session data (for resume logic only)
  const { data: todaySessions } = useQuery({
    queryKey: ['focus-today-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const today = new Date();
      const { data } = await supabase
        .from('routine_sessions')
        .select('id, routine_id, tasks_completed, tasks_total, ended_at')
        .eq('user_id', user.id)
        .gte('started_at', startOfDay(today).toISOString())
        .lte('started_at', endOfDay(today).toISOString());
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user_task IDs for all routines
  const { data: userTasksByRoutine } = useQuery({
    queryKey: ['routine-user-task-ids', user?.id, routineIds],
    queryFn: async () => {
      if (!user || routineIds.length === 0) return {};
      const { data } = await supabase
        .from('user_tasks')
        .select('id, source_routine_id, title')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('source_routine_id', routineIds);

      const map: Record<string, string[]> = {};
      (data || []).forEach((t: any) => {
        const rid = t.source_routine_id;
        if (!rid) return;
        if (!map[rid]) map[rid] = [];
        map[rid].push(t.id);
      });
      return map;
    },
    enabled: !!user && routineIds.length > 0,
  });

  // Fetch today's task_completions for all focus routine tasks
  const allUserTaskIds = useMemo(() => {
    if (!userTasksByRoutine) return [];
    return Object.values(userTasksByRoutine).flat();
  }, [userTasksByRoutine]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { data: todayCompletions } = useQuery({
    queryKey: ['focus-today-completions', user?.id, todayStr, allUserTaskIds],
    queryFn: async () => {
      if (!user || allUserTaskIds.length === 0) return new Set<string>();
      const { data } = await supabase
        .from('task_completions')
        .select('task_id')
        .eq('user_id', user.id)
        .eq('completed_date', todayStr)
        .in('task_id', allUserTaskIds);
      return new Set((data || []).map(d => d.task_id));
    },
    enabled: !!user && allUserTaskIds.length > 0,
  });

  // Progress based on real planner completions
  const getCompletionInfo = (routineId: string) => {
    const taskIds = userTasksByRoutine?.[routineId];
    if (!taskIds || taskIds.length === 0) return null;
    const completed = taskIds.filter(id => todayCompletions?.has(id)).length;
    if (completed === 0) return null;
    const pct = Math.round((completed / taskIds.length) * 100);
    return { pct, isComplete: pct === 100 };
  };

  // Pre-start state — now just stores the routine to show planner-style overlay
  const [preStartRoutine, setPreStartRoutine] = useState<any | null>(null);
  const [loadingRoutineId, setLoadingRoutineId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);

  // Auto-open routine from ?routine= query param (e.g. from pro link)
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    const routineParam = searchParams.get('routine');
    if (!routineParam || !myRoutines || autoOpenedRef.current) return;
    const match = myRoutines.find((r: any) => r.routine_id === routineParam);
    if (match) {
      autoOpenedRef.current = true;
      setPreStartRoutine(match);
      // Clean up URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, myRoutines, setSearchParams]);

  // Auto-cleanup orphaned routines (no active tasks)
  useEffect(() => {
    if (!user || !myRoutines || !routineTasksMap) return;
    const orphanedRoutines = myRoutines.filter((r: any) => {
      const tasks = routineTasksMap[r.routine_id] || [];
      return tasks.length === 0;
    });
    if (orphanedRoutines.length === 0) return;
    
    const deleteOrphans = async () => {
      const orphanIds = orphanedRoutines.map((r: any) => r.id);
      await supabase
        .from('user_routines_bank')
        .delete()
        .in('id', orphanIds);
      queryClient.invalidateQueries({ queryKey: ['user-routines-all'] });
      queryClient.invalidateQueries({ queryKey: ['linkable-user-routines'] });
    };
    deleteOrphans();
  }, [user, myRoutines, routineTasksMap, queryClient]);

  // Delete routine and all its tasks
  const handleDeleteRoutine = async (routine: any) => {
    if (!user) return;
    try {
      // Delete all user_tasks linked to this routine
      await supabase
        .from('user_tasks')
        .delete()
        .eq('user_id', user.id)
        .eq('source_routine_id', routine.routine_id);

      // Delete the routine record
      await supabase
        .from('user_routines_bank')
        .delete()
        .eq('id', routine.id);

      toast.success(`"${routine.title}" deleted`);
      queryClient.invalidateQueries({ queryKey: ['user-routines-all'] });
      queryClient.invalidateQueries({ queryKey: ['linkable-user-routines'] });
      queryClient.invalidateQueries({ queryKey: ['routine-user-tasks-emojis'] });
      queryClient.invalidateQueries({ queryKey: ['routine-user-task-ids'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
    } catch (err) {
      toast.error('Failed to delete routine');
    }
    setDeleteRoutine(null);
  };

  // RoutinePreviewSheet state for adding routine as planner task
  const [addRoutineTarget, setAddRoutineTarget] = useState<any | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const addRoutinePlan = useAddRoutinePlan();

  const handleOpenAddSheet = (routine: any) => {
    haptic.light();
    setAddRoutineTarget(routine);
    setShowAddSheet(true);
  };

  const addSheetSyntheticTask: RoutinePlanTask | null = addRoutineTarget ? {
    id: `synthetic-routine-${addRoutineTarget.routine_id}`,
    plan_id: `synthetic-routine-player`,
    title: addRoutineTarget.title,
    icon: addRoutineTarget.emoji || '✨',
    color: addRoutineTarget.color || 'amber',
    task_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    linked_playlist_id: null,
    pro_link_type: 'routine' as any,
    pro_link_value: addRoutineTarget.routine_id,
    tag: 'pro',
    linked_playlist: null,
  } : null;

  const handleSaveAddSheet = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    if (!addRoutineTarget || !addSheetSyntheticTask) return;
    try {
      await addRoutinePlan.mutateAsync({
        planId: 'synthetic-routine-player',
        selectedTaskIds,
        editedTasks,
        syntheticTasks: [addSheetSyntheticTask],
      });
      toast.success('Added to your planner! 📋');
      setShowAddSheet(false);
      setAddRoutineTarget(null);
    } catch (error) {
      console.error('Failed to add routine task:', error);
      toast.error('Failed to add to planner');
    }
  };

  // Planner hooks for the pre-start overlay (uses today's date)
  const today = useMemo(() => new Date(), []);
  const { data: plannerTasks = [] } = useTasksForDate(today);
  const { data: plannerCompletions } = useCompletionsForDate(today);
  const addGoalProgress = useAddGoalProgress();

  const plannerCompletedTaskIds = useMemo(() => {
    return new Set(plannerCompletions?.tasks.map(c => c.task_id) || []);
  }, [plannerCompletions]);

  const plannerCompletedSubtaskIds = useMemo(() => {
    return plannerCompletions?.subtasks.map(c => c.subtask_id) || [];
  }, [plannerCompletions]);

  const plannerGoalProgressMap = useMemo(() => {
    const map = new Map<string, number>();
    plannerCompletions?.tasks.forEach(c => {
      if ((c as any).goal_progress) {
        map.set(c.task_id, (c as any).goal_progress);
      }
    });
    return map;
  }, [plannerCompletions]);

  // Filter planner tasks to only the selected routine's tasks
  const routineFilteredTasks = useMemo(() => {
    if (!preStartRoutine) return [];
    return plannerTasks.filter(t => t.source_routine_id === preStartRoutine.routine_id);
  }, [plannerTasks, preStartRoutine]);

  // Calculate routine duration for header
  const routineDurationLabel = useMemo(() => {
    if (!routineFilteredTasks.length) return '';
    const timedSeconds = routineFilteredTasks
      .filter(t => t.goal_type === 'timer')
      .reduce((s, t) => s + (t.goal_target || 0), 0);
    const totalMins = Math.ceil(timedSeconds / 60);
    const hasUntimed = routineFilteredTasks.some(t => t.goal_type !== 'timer');
    if (totalMins > 0 && hasUntimed) return `${totalMins}m timed + untimed tasks`;
    if (totalMins > 0) return `${totalMins}m`;
    return 'Untimed tasks';
  }, [routineFilteredTasks]);

  // Remaining (uncompleted) tasks for start button
  const remainingTasks = useMemo(() => {
    return routineFilteredTasks.filter(t => !plannerCompletedTaskIds.has(t.id));
  }, [routineFilteredTasks, plannerCompletedTaskIds]);

  const handlePlay = async (routine: any) => {
    if (isActive) {
      toast('A routine is already running. Finish or cancel it first.');
      return;
    }
    haptic.light();
    setPreStartRoutine(routine);
  };

  const handleStartFromPreview = async () => {
    if (!preStartRoutine) return;
    haptic.medium();

    if (remainingTasks.length === 0) {
      setShowRestartDialog(true);
      return;
    }

    launchRoutine();
  };

  const handleRestartRoutine = async () => {
    if (!preStartRoutine) return;
    setShowRestartDialog(false);
    haptic.medium();

    // Delete today's completions for this routine's tasks so they can be re-done
    const taskIds = userTasksByRoutine?.[preStartRoutine.routine_id] || [];
    if (taskIds.length > 0) {
      await supabase
        .from('task_completions')
        .delete()
        .eq('user_id', user!.id)
        .eq('completed_date', format(today, 'yyyy-MM-dd'))
        .in('task_id', taskIds);
    }

    // Build all tasks (not just remaining since we reset)
    const allTasks = routineFilteredTasks.map(t => ({
      id: t.id,
      title: t.title,
      emoji: t.emoji || '📝',
      targetSeconds: t.goal_type === 'timer' ? (t.goal_target || 300) : 0,
      color: t.color || undefined,
      userTaskId: t.id,
      goalType: t.goal_type || null,
      goalTarget: t.goal_target || null,
      hasTimerGoal: t.goal_type === 'timer',
      proLinkType: t.pro_link_type || null,
      proLinkValue: t.pro_link_value || null,
    }));

    startRoutine({
      routineId: preStartRoutine.routine_id,
      routineTitle: preStartRoutine.title,
      routineEmoji: preStartRoutine.emoji || '✨',
      tasks: allTasks,
    });

    setPreStartRoutine(null);
  };

  const launchRoutine = async () => {
    if (!preStartRoutine) return;

    // Build focus player tasks from remaining planner tasks
    const focusTasks = remainingTasks.map(t => ({
      id: t.id,
      title: t.title,
      emoji: t.emoji || '📝',
      targetSeconds: t.goal_type === 'timer' ? (t.goal_target || 300) : 0,
      color: t.color || undefined,
      userTaskId: t.id,
      goalType: t.goal_type || null,
      goalTarget: t.goal_target || null,
      hasTimerGoal: t.goal_type === 'timer',
      proLinkType: t.pro_link_type || null,
      proLinkValue: t.pro_link_value || null,
    }));

    // Check for incomplete session to resume
    const incompleteSession = todaySessions?.find(s => s.routine_id === preStartRoutine.routine_id && !s.ended_at);
    
    if (incompleteSession) {
      const { data: completedTasks } = await supabase
        .from('routine_session_tasks')
        .select('task_title, task_emoji, target_seconds, actual_seconds, status')
        .eq('session_id', incompleteSession.id)
        .order('task_order', { ascending: true });

      const prevResults: import('@/components/app/RoutinePlayerSummary').SessionTaskResult[] = 
        (completedTasks || []).map(ct => ({
          title: ct.task_title,
          emoji: ct.task_emoji,
          targetSeconds: ct.target_seconds,
          actualSeconds: ct.actual_seconds,
          status: ct.status as 'completed' | 'skipped',
        }));

      startRoutine(
        {
          routineId: preStartRoutine.routine_id,
          routineTitle: preStartRoutine.title,
          routineEmoji: preStartRoutine.emoji || '✨',
          tasks: focusTasks,
        },
        {
          startFromIndex: 0,
          previousResults: prevResults,
          existingSessionId: incompleteSession.id,
        }
      );
    } else {
      startRoutine({
        routineId: preStartRoutine.routine_id,
        routineTitle: preStartRoutine.title,
        routineEmoji: preStartRoutine.emoji || '✨',
        tasks: focusTasks,
      });
    }

    setPreStartRoutine(null);
  };

  const handleOpenGoalInput = useCallback((task: UserTask) => {
    const isSmallCountGoal = task.goal_enabled && task.goal_type === 'count' && (task.goal_target || 0) < 10 && !isWaterTask(task);
    if (isSmallCountGoal) {
      addGoalProgress.mutate(
        { taskId: task.id, date: today, amount: 1 },
        {
          onSuccess: (result) => {
            haptic.success();
            const unit = task.goal_unit || 'times';
            toast(`+1 ${unit}`, {
              description: `Progress: ${result.newProgress}/${task.goal_target}`,
              duration: 2000,
            });
          },
        }
      );
      return;
    }
  }, [today, addGoalProgress]);

  const handleOpenTimer = useCallback((_task: UserTask) => {
    // Timer handled by routine player, no-op here
  }, []);

  const handleTaskTap = useCallback((task: UserTask) => {
    setSelectedTask(task);
  }, []);

  const deleteTask = useDeleteTask();
  const handleEditTask = useCallback((task: UserTask) => {
    setSelectedTask(null);
    navigate(`/app/home/edit/${task.id}`);
  }, [navigate]);

  const handleDeleteTask = useCallback((task: UserTask) => {
    setSelectedTask(null);
    deleteTask.mutate(task.id, {
      onSuccess: () => toast.success('Task deleted'),
    });
  }, [deleteTask]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-3">
          <button onClick={() => navigate(-1)} className="p-1 active:opacity-70">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h1 className="text-base font-bold text-foreground">My Routines</h1>
          </div>
          <AddedToRoutineButton
            isAdded={!!isPageAdded}
            onAddClick={() => { haptic.medium(); setShowPageRoutineSheet(true); }}
            iconOnly
          />
        </div>
      </header>

      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} />

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Activated routines */}
            {(() => {
              const activeRoutines = (myRoutines || []).filter((r: any) => {
                const tasks = routineTasksMap?.[r.routine_id] || [];
                return tasks.length > 0;
              });
              return activeRoutines.length > 0 ? (
              <section>
                <p className="text-base font-bold text-foreground mb-3">My Routines</p>
                <div className="space-y-3">
                  {activeRoutines.map((routine: any) => {
                    const completion = getCompletionInfo(routine.routine_id);
                    const allTasks = routineTasksMap?.[routine.routine_id] || [];
                    const completedIds = todayCompletions || new Set<string>();
                    const taskIdsForRoutine = userTasksByRoutine?.[routine.routine_id] || [];
                    const remainingTasksForCard = allTasks.filter((t, idx) => {
                      const taskId = taskIdsForRoutine[idx];
                      return !taskId || !completedIds.has(taskId);
                    });

                    const MAX_EMOJIS = 3;
                    const visibleTasks = allTasks.slice(0, MAX_EMOJIS);
                    const overflowCount = allTasks.length - MAX_EMOJIS;
                    const cardColor = TASK_COLOR_CLASSES[(routine.color as TaskColor) || 'peach'] || TASK_COLOR_CLASSES.peach;

                    return (
                      <div
                        key={routine.id}
                        onClick={() => handlePlay(routine)}
                        className={cn(
                          'rounded-2xl p-4 pb-3.5 active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden',
                          cardColor
                        )}
                      >
                        {/* Top row: schedule hints + action buttons top-right */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[11px] font-medium text-black/50">
                              <Bell className="w-3 h-3" />
                              {allTasks.length} tasks
                            </span>
                            {routine.category && (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-black/50">
                                <Calendar className="w-3 h-3" />
                                {routine.category}
                              </span>
                            )}
                          </div>
                          {/* Top-right action buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenAddSheet(routine); }}
                              className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                              title="Add to planner"
                            >
                              <CalendarPlus className="w-4 h-4 text-white" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteRoutine(routine); }}
                              className="w-9 h-9 rounded-full bg-background/60 flex items-center justify-center active:scale-95 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-black/40" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-black text-[17px] leading-snug mb-3">
                          {routine.title}
                        </h3>

                        {/* Bottom row: emoji bubbles + play button */}
                        <div className="flex items-center justify-between">
                          {/* Emoji chain */}
                          <div className="flex items-center gap-1">
                            {visibleTasks.map((task, i) => (
                              <span key={i} className="flex items-center">
                                <span className="w-9 h-9 rounded-full bg-background/60 flex items-center justify-center">
                                  <FluentEmoji emoji={task.emoji} size={20} />
                                </span>
                                {i < visibleTasks.length - 1 && (
                                  <ChevronRight className="w-3 h-3 text-black/20 mx-0.5" />
                                )}
                              </span>
                            ))}
                            {overflowCount > 0 && (
                              <>
                                <ChevronRight className="w-3 h-3 text-black/20 mx-0.5" />
                                <span className="w-9 h-9 rounded-full bg-background/60 flex items-center justify-center text-xs font-semibold text-black/50">
                                  +{overflowCount}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Play button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePlay(routine); }}
                            disabled={loadingRoutineId === routine.routine_id}
                            className="flex items-center justify-center gap-2 h-12 min-w-[48px] px-5 rounded-full bg-secondary active:scale-95 transition-transform shrink-0"
                          >
                            {loadingRoutineId === routine.routine_id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-black" />
                            ) : completion ? (
                              <>
                                {completion.isComplete ? (
                                  <RotateCw className="w-5 h-5 text-black" />
                                ) : (
                                  <Play className="w-5 h-5 text-black fill-black" />
                                )}
                                <span className="text-sm font-bold text-black">{completion.pct}%</span>
                              </>
                            ) : (
                              <Play className="w-5 h-5 text-black fill-black" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
              ) : null;
            })()}

            {/* Empty state */}
            {(myRoutines || []).filter((r: any) => (routineTasksMap?.[r.routine_id] || []).length > 0).length === 0 && (
              <div className="text-center py-12">
                <FluentEmoji emoji="🎯" size={48} className="mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No routines yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse and add routines to start your sessions
                </p>
              </div>
            )}

            <button
              onClick={() => navigate('/app/routines')}
              className="w-full flex items-center justify-center gap-1 text-sm text-primary font-medium py-3"
            >
              Browse all routines <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Pre-start overlay — planner-style filtered view */}
      {preStartRoutine && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
          <header
            className="flex items-center justify-between px-4 pt-3 pb-3 border-b border-border/50"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
          >
            <button onClick={() => setPreStartRoutine(null)} className="p-1 active:opacity-70">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="text-center">
              <h1 className="text-base font-bold text-foreground">{preStartRoutine.title}</h1>
              {routineDurationLabel && (
                <p className="text-xs text-muted-foreground">{routineDurationLabel}</p>
              )}
            </div>
            <div className="w-7" />
          </header>

          <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
            {routineFilteredTasks.length > 0 ? (
              <SortableTaskList
                tasks={routineFilteredTasks}
                date={today}
                completedTaskIds={plannerCompletedTaskIds}
                completedSubtaskIds={plannerCompletedSubtaskIds}
                goalProgressMap={plannerGoalProgressMap}
                onTaskTap={handleTaskTap}
                onStreakIncrease={() => {}}
                onOpenGoalInput={handleOpenGoalInput}
                onOpenTimer={handleOpenTimer}
                hideQuickAdd
              />
            ) : (
              <div className="text-center py-12">
                <FluentEmoji emoji="📝" size={48} className="mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No tasks found for this routine</p>
              </div>
            )}
          </div>

          {/* Start / Resume button */}
          <div
            className="fixed bottom-0 left-0 right-0 px-5 pb-4 pt-2 bg-background"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
          >
            <button
              onClick={handleStartFromPreview}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-amber-400 text-black font-bold text-base active:scale-[0.98] transition-transform"
            >
              <Play className="w-5 h-5 fill-current" />
              {plannerCompletedTaskIds.size > 0 && remainingTasks.length < routineFilteredTasks.length
                ? `Resume (${remainingTasks.length} remaining)`
                : 'Start'}
            </button>
          </div>

          {/* Task Detail Modal */}
          <TaskDetailModal
            task={selectedTask}
            open={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            date={today}
            isCompleted={selectedTask ? plannerCompletedTaskIds.has(selectedTask.id) : false}
            completedSubtaskIds={plannerCompletedSubtaskIds}
            goalProgress={selectedTask ? (plannerGoalProgressMap.get(selectedTask.id) || 0) : 0}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onStreakIncrease={() => {}}
            onOpenGoalInput={handleOpenGoalInput}
            onOpenTimer={handleOpenTimer}
          />
        </div>
      )}

      {/* Restart confirmation dialog */}
      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent className="rounded-3xl max-w-[320px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center leading-snug">
              You've already completed this routine.
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground">
              Do you want to reset the existing data and run the routine again?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-center">
            <AlertDialogCancel className="flex-1 rounded-full font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestartRoutine}
              className="flex-1 rounded-full font-bold"
            >
              Restart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete routine confirmation dialog */}
      <AlertDialog open={!!deleteRoutine} onOpenChange={(open) => !open && setDeleteRoutine(null)}>
        <AlertDialogContent className="rounded-3xl max-w-[320px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center leading-snug">
              Delete "{deleteRoutine?.title}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground">
              This will remove the routine and all its tasks from your planner. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-center">
            <AlertDialogCancel className="flex-1 rounded-full font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoutine && handleDeleteRoutine(deleteRoutine)}
              className="flex-1 rounded-full font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add routine to planner sheet */}
      {addSheetSyntheticTask && (
        <RoutinePreviewSheet
          open={showAddSheet}
          onOpenChange={(open) => {
            setShowAddSheet(open);
            if (!open) setAddRoutineTarget(null);
          }}
          tasks={[addSheetSyntheticTask]}
          routineTitle={addRoutineTarget?.title || 'Routine'}
          onSave={handleSaveAddSheet}
          isSaving={addRoutinePlan.isPending}
        />
      )}

      {/* Page-level add to planner sheet */}
      <RoutinePreviewSheet
        open={showPageRoutineSheet}
        onOpenChange={setShowPageRoutineSheet}
        tasks={[{
          id: 'synthetic-routineplayer-page',
          plan_id: 'synthetic-routineplayer-page',
          title: 'My Routines',
          icon: '🎯',
          color: 'amber',
          task_order: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          linked_playlist_id: null,
          pro_link_type: 'route' as any,
          pro_link_value: '/app/routineplayer',
          linked_playlist: null,
        }]}
        routineTitle="My Routines"
        onSave={async (selectedTaskIds, editedTasks) => {
          try {
            await addRoutinePlan.mutateAsync({
              planId: 'synthetic-routineplayer-page',
              syntheticTasks: [{
                id: 'synthetic-routineplayer-page',
                plan_id: 'synthetic-routineplayer-page',
                title: 'My Routines',
                icon: '🎯',
                color: 'amber',
                task_order: 0,
                is_active: true,
                created_at: new Date().toISOString(),
                linked_playlist_id: null,
                pro_link_type: 'route' as any,
                pro_link_value: '/app/routineplayer',
                linked_playlist: null,
              }],
              editedTasks,
            });
            setShowPageRoutineSheet(false);
            toast.success('Added to your planner! 🎯');
          } catch (error) {
            toast.error('Failed to add to planner');
          }
        }}
        isSaving={addRoutinePlan.isPending}
      />
    </div>
  );
}