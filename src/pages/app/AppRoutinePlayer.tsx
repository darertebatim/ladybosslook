import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
const DISMISSED_FEATURED_KEY = 'dismissed-featured-routines';
import { fetchSmartEstimates, type SmartEstimateInput } from '@/lib/smartEstimate';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Loader2, ChevronRight, RotateCw, ChevronLeft, Trash2, CalendarPlus, Bell, Calendar, Check, Plus, Pencil } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PRO_LINK_CONFIGS, type ProLinkType } from '@/lib/proTaskTypes';
import { TASK_COLOR_CLASSES, type TaskColor } from '@/hooks/useTaskPlanner';
import { useRoutineBankCategories, useFeaturedRoutinesBank } from '@/hooks/useRoutinesBank';
import { FeaturedRoutineCard } from '@/components/app/FeaturedRoutineCard';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/haptics';
import { startOfDay, endOfDay, format } from 'date-fns';
import { taskAppliesToDate } from '@/lib/localDate';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { toast } from 'sonner';
import { RoutinePreviewSheet, EditedTask, ROUTINE_COLOR_CYCLE } from '@/components/app/RoutinePreviewSheet';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutineBuilderSheet, BuilderTask } from '@/components/app/RoutineBuilderSheet';
import { SortableTaskList } from '@/components/app/SortableTaskList';
import { useTasksForDate, useCompletionsForDate, UserTask, useAddGoalProgress, useDeleteTask } from '@/hooks/useTaskPlanner';
import { isWaterTask } from '@/lib/waterTracking';
import { TaskDetailModal } from '@/components/app/TaskDetailModal';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

interface RoutineCardProps {
  routine: any;
  routineTasksMap: any;
  userTasksByRoutine: any;
  todayCompletions: Set<string> | undefined;
  getCompletionInfo: (routineId: string) => { pct: number; isComplete: boolean } | null;
  categoryNameMap: Map<string, string>;
  loadingRoutineId: string | null;
  addedRoutineIds: Set<string>;
  onPlay: (routine: any) => void;
  onOpenAddSheet: (routine: any) => void;
  onDeleteRoutine: (routine: any) => void;
  onEditRoutine?: (routine: any) => void;
}

// Secondary (darker) palette for emoji circles in routine cards
const TASK_COLORS_SECONDARY: Record<string, string> = {
  pink: '#FFC2EA',
  peach: '#FFD2A1',
  yellow: '#FFEA4E',
  lime: '#C3F1E1',
  sky: '#B9D6FF',
  mint: '#C9F588',
  lavender: '#DEC1FF',
  purple: '#DEC1FF',
  blue: '#B9D6FF',
  red: '#FFC2EA',
};

function RoutineCardContent({
  routine,
  routineTasksMap,
  userTasksByRoutine,
  todayCompletions,
  getCompletionInfo,
  categoryNameMap,
  loadingRoutineId,
  addedRoutineIds,
  onPlay,
  onOpenAddSheet,
  onDeleteRoutine,
  onEditRoutine,
}: RoutineCardProps) {
  const completion = getCompletionInfo(routine.routine_id);
  const allTasks = routineTasksMap?.[routine.routine_id] || [];
  const MAX_EMOJIS = 3;
  const visibleTasks = allTasks.slice(0, MAX_EMOJIS);
  const overflowCount = allTasks.length - MAX_EMOJIS;
  const cardColor = TASK_COLOR_CLASSES[(routine.color as TaskColor) || 'peach'] || TASK_COLOR_CLASSES.peach;
  const secondaryHex = TASK_COLORS_SECONDARY[(routine.color as string) || 'peach'] || TASK_COLORS_SECONDARY.peach;

  return (
    <div
      onClick={() => onPlay(routine)}
      className={cn(
        'rounded-2xl p-4 pb-3.5 active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden',
        cardColor
      )}
    >
      {/* Title row with action buttons */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-black text-[17px] leading-snug flex-1 min-w-0 truncate mr-2">
          {routine.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {onEditRoutine && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditRoutine(routine); }}
              className="w-9 h-9 rounded-full bg-background/60 flex items-center justify-center active:scale-95 transition-all"
              title="Edit routine"
            >
              <Pencil className="w-3.5 h-3.5 text-foreground/70" />
            </button>
          )}
          {addedRoutineIds.has(routine.routine_id) ? (
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center"
              title="Added to planner"
            >
              <Check className="w-4 h-4 text-success" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenAddSheet(routine); }}
              className="w-9 h-9 rounded-full bg-urgency flex items-center justify-center active:scale-95 transition-transform shadow-sm"
              title="Add to planner"
            >
              <CalendarPlus className="w-4 h-4 text-urgency-foreground" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteRoutine(routine); }}
            className="w-9 h-9 rounded-full bg-background/60 flex items-center justify-center active:scale-95 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {visibleTasks.map((task: any, i: number) => (
            <span key={i} className="flex items-center">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: secondaryHex }}
              >
                <FluentEmoji emoji={task.emoji} size={20} />
              </span>
              {i < visibleTasks.length - 1 && (
                <ChevronRight className="w-3 h-3 text-black mx-0.5" />
              )}
            </span>
          ))}
          {overflowCount > 0 && (
            <>
              <ChevronRight className="w-3 h-3 text-black mx-0.5" />
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-black"
                style={{ backgroundColor: secondaryHex }}
              >
                +{overflowCount}
              </span>
            </>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(routine); }}
          disabled={loadingRoutineId === routine.routine_id}
          className="flex items-center justify-center gap-2 h-12 min-w-[48px] px-5 rounded-full active:scale-95 transition-transform shrink-0"
          style={{ backgroundColor: secondaryHex }}
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
}

function SortableRoutineCard(props: RoutineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.routine.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn('touch-manipulation', isDragging && 'opacity-50 scale-[1.02]')}
    >
      <RoutineCardContent {...props} />
    </div>
  );
}

export default function AppRoutinePlayer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { startRoutine, isActive } = useRoutinePlayerContext();
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [deleteRoutine, setDeleteRoutine] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const [showPageRoutineSheet, setShowPageRoutineSheet] = useState(false);

  // Builder state
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderEditRoutine, setBuilderEditRoutine] = useState<any | null>(null);
  const [builderResult, setBuilderResult] = useState<{ title: string; emoji: string; color: string; tasks: any[] } | null>(null);
  const [showBuilderPreview, setShowBuilderPreview] = useState(false);
  const [builderEditTasks, setBuilderEditTasks] = useState<any[]>([]);
  // Reopen builder when returning from routine preview
  useEffect(() => {
    if (sessionStorage.getItem('builder-previewing') === 'true') {
      sessionStorage.removeItem('builder-previewing');
      setShowBuilder(true);
    }
  }, []);

  const handleBuilderNavigateToRoutine = useCallback((routineId: string) => {
    sessionStorage.setItem('builder-previewing', 'true');
    setShowBuilder(false);
    navigate(`/app/inspire/${routineId}`);
  }, [navigate]);

  // Dismissed featured routines
  const [dismissedFeatured, setDismissedFeatured] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(DISMISSED_FEATURED_KEY) || '[]'); } catch { return []; }
  });

  // Check if routine player page is already added as a task
  const { data: isPageAdded } = useExistingProTask('route', '/app/routineplayer');

  // Check which individual routines are already added to planner
  const { data: addedRoutineIdsData } = useQuery({
    queryKey: ['added-routine-tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_tasks')
        .select('pro_link_value')
        .eq('user_id', user.id)
        .eq('pro_link_type', 'routine')
        .eq('is_active', true);
      if (error) return [];
      return (data || []).map(t => t.pro_link_value).filter(Boolean) as string[];
    },
    enabled: !!user,
  });
  const addedRoutineIds = useMemo(() => new Set(addedRoutineIdsData || []), [addedRoutineIdsData]);

  // Category slug → name map
  const { data: routineCategories = [] } = useRoutineBankCategories();
  const { data: featuredRoutines = [] } = useFeaturedRoutinesBank();
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    routineCategories.forEach(cat => map.set(cat.slug, cat.name));
    return map;
  }, [routineCategories]);
   // Fetch ALL user routines from user_routines_bank (user-owned copies)
  const { data: myRoutines, isLoading } = useQuery({
    queryKey: ['user-routines-all', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const fetchUserRoutines = async () => {
        const { data, error } = await supabase
          .from('user_routines_bank')
          .select('id, routine_id, title, emoji, cover_image_url, category, color, is_focus, is_active, order_index')
          .eq('user_id', user.id)
          .or('is_active.eq.true,is_active.is.null')
          .order('order_index', { ascending: true });
        if (error) throw error;
        return (data || []) as any[];
      };

      const existing = await fetchUserRoutines();
      const existingRoutineIds = new Set(existing.map((r: any) => r.routine_id));

      const { data: userTaskRows, error: userTaskError } = await supabase
        .from('user_tasks')
        .select('source_routine_id')
        .eq('user_id', user.id)
        .not('source_routine_id', 'is', null);

      if (userTaskError) throw userTaskError;

      const taskRoutineIds = Array.from(
        new Set((userTaskRows || []).map((t: any) => t.source_routine_id).filter(Boolean))
      );

      const missingRoutineIds = taskRoutineIds.filter((rid) => !existingRoutineIds.has(rid));

      if (missingRoutineIds.length > 0) {
        const { data: bankRoutines } = await supabase
          .from('routines_bank')
          .select('id, title, emoji, cover_image_url, category, color, is_focus')
          .in('id', missingRoutineIds);

        const maxOrder = existing.reduce((max: number, r: any) => Math.max(max, r.order_index ?? 0), -1);
        const recoveredRows = missingRoutineIds.map((routineId, index) => {
          const bank = bankRoutines?.find((b: any) => b.id === routineId);
          return {
            user_id: user.id,
            routine_id: routineId,
            title: bank?.title ?? 'Routine',
            emoji: bank?.emoji ?? '✨',
            cover_image_url: bank?.cover_image_url ?? null,
            category: bank?.category ?? null,
            color: bank?.color ?? null,
            is_focus: bank?.is_focus ?? false,
            is_active: true,
            order_index: maxOrder + index + 1,
          };
        });

        const { error: upsertError } = await supabase
          .from('user_routines_bank')
          .upsert(recoveredRows as any, { onConflict: 'user_id,routine_id' });

        if (upsertError) throw upsertError;

        return await fetchUserRoutines();
      }

      return existing;
    },
    enabled: !!user,
  });

  // Reorder routines mutation
  const reorderRoutinesMutation = useMutation({
    mutationFn: async (updates: { id: string; order_index: number }[]) => {
      for (const u of updates) {
        await supabase
          .from('user_routines_bank')
          .update({ order_index: u.order_index } as any)
          .eq('id', u.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-routines-all'] });
    },
  });

  // Local routine order state for optimistic drag updates
  const [localRoutines, setLocalRoutines] = useState<any[]>([]);
  const skipRoutineSyncRef = useRef(false);
  const routineReorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local routines from query data
  const routinesKey = JSON.stringify((myRoutines || []).map((r: any) => `${r.id}:${r.title}:${r.emoji}:${r.color}:${r.order_index ?? ''}`));
  const localRoutinesKey = JSON.stringify(localRoutines.map((r: any) => `${r.id}:${r.title}:${r.emoji}:${r.color}:${r.order_index ?? ''}`));
  if (routinesKey !== localRoutinesKey && !skipRoutineSyncRef.current) {
    setLocalRoutines(myRoutines || []);
  }

  // DnD sensors for routine reordering
  const routineSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);

  const handleRoutineDragStart = useCallback((event: DragStartEvent) => {
    setActiveRoutineId(event.active.id as string);
    haptic.medium();
  }, []);

  const handleRoutineDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveRoutineId(null);
    if (over && active.id !== over.id) {
      const oldIndex = localRoutines.findIndex((r: any) => r.id === active.id);
      const newIndex = localRoutines.findIndex((r: any) => r.id === over.id);
      const reordered = arrayMove(localRoutines, oldIndex, newIndex);
      setLocalRoutines(reordered);
      skipRoutineSyncRef.current = true;
      if (routineReorderTimerRef.current) clearTimeout(routineReorderTimerRef.current);
      routineReorderTimerRef.current = setTimeout(() => { skipRoutineSyncRef.current = false; }, 2000);
      haptic.light();
      const updates = reordered.map((r: any, i: number) => ({ id: r.id, order_index: i }));
      reorderRoutinesMutation.mutate(updates);
    }
  }, [localRoutines, reorderRoutinesMutation]);
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
        .or('pro_link_type.is.null,pro_link_type.neq.routine')
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

  // Fetch user_task IDs (with schedule info) for all routines
  const { data: userTasksByRoutine } = useQuery({
    queryKey: ['routine-user-task-ids', user?.id, routineIds],
    queryFn: async () => {
      if (!user || routineIds.length === 0) return {};
      const { data } = await supabase
        .from('user_tasks')
        .select('id, source_routine_id, title, scheduled_date, repeat_pattern, repeat_days, created_at, repeat_end_date')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .or('pro_link_type.is.null,pro_link_type.neq.routine')
        .in('source_routine_id', routineIds);

      const map: Record<string, { id: string; scheduled_date: string | null; repeat_pattern: string; repeat_days: number[] | null; created_at: string; repeat_end_date: string | null }[]> = {};
      (data || []).forEach((t: any) => {
        const rid = t.source_routine_id;
        if (!rid) return;
        if (!map[rid]) map[rid] = [];
        map[rid].push({
          id: t.id,
          scheduled_date: t.scheduled_date,
          repeat_pattern: t.repeat_pattern,
          repeat_days: t.repeat_days,
          created_at: t.created_at,
          repeat_end_date: t.repeat_end_date,
        });
      });
      return map;
    },
    enabled: !!user && routineIds.length > 0,
  });

  // Fetch today's task_completions for all focus routine tasks
  const allUserTaskIds = useMemo(() => {
    if (!userTasksByRoutine) return [];
    return Object.values(userTasksByRoutine).flat().map(t => t.id);
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

  // Progress based on planner completions + routine_sessions (dual-source, like RoutinePlayBadge)
  const getCompletionInfo = (routineId: string) => {
    const tasks = userTasksByRoutine?.[routineId];
    if (!tasks || tasks.length === 0) return null;
    const todayTasks = tasks.filter(t => taskAppliesToDate(t, todayStr));
    const totalTasks = todayTasks.length || tasks.length;

    // Source 1: manual task_completions
    const manualCompleted = todayTasks.length > 0
      ? todayTasks.filter(t => todayCompletions?.has(t.id)).length
      : 0;

    // Source 2: routine_sessions from the player
    const session = todaySessions?.find(s => s.routine_id === routineId);
    const sessionCompleted = session ? Math.min(Math.max(session.tasks_completed, 0), totalTasks) : 0;

    const resolvedCompleted = Math.max(manualCompleted, sessionCompleted);
    if (resolvedCompleted === 0) return null;

    const pct = Math.round((resolvedCompleted / totalTasks) * 100);
    return { pct, isComplete: pct >= 100 };
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

  // Auto-cleanup orphaned routines (no active tasks) — DB-verified
  useEffect(() => {
    if (!user || !myRoutines || myRoutines.length === 0) return;
    const verifyAndCleanup = async () => {
      // Verify each routine actually has zero tasks in DB before deleting
      const orphanIds: string[] = [];
      for (const r of myRoutines) {
        const { count } = await supabase
          .from('user_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('source_routine_id', r.routine_id)
          .eq('is_active', true);
        if (count === 0) orphanIds.push(r.id);
      }
      if (orphanIds.length === 0) return;
      await supabase
        .from('user_routines_bank')
        .delete()
        .in('id', orphanIds);
      queryClient.invalidateQueries({ queryKey: ['user-routines-all'] });
      queryClient.invalidateQueries({ queryKey: ['linkable-user-routines'] });
    };
    verifyAndCleanup();
  }, [user, myRoutines, queryClient]);

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

      // Also delete standalone launcher pro-task (source_routine_id is null)
      await supabase
        .from('user_tasks')
        .delete()
        .eq('user_id', user.id)
        .eq('pro_link_type', 'routine')
        .eq('pro_link_value', routine.routine_id);

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
      queryClient.invalidateQueries({ queryKey: ['added-routine-tasks'] });
      setShowAddSheet(false);
      setAddRoutineTarget(null);
    } catch (error) {
      console.error('Failed to add routine task:', error);
      toast.error('Failed to add to planner');
    }
  };

  // Builder: handle create flow → opens preview sheet
  const handleBuilderComplete = (title: string, emoji: string, color: string, tasks: any[]) => {
    setShowBuilder(false);
    setBuilderResult({ title, emoji, color, tasks });
    setShowBuilderPreview(true);
  };

  // Builder: handle edit flow → direct save
  const handleBuilderEditSave = async (title: string, emoji: string, color: string, tasks: any[]) => {
    if (!user || !builderEditRoutine) return;
    try {
      const routineId = builderEditRoutine.routine_id;

      // Update routine metadata
      await supabase
        .from('user_routines_bank')
        .update({ title, emoji, color } as any)
        .eq('id', builderEditRoutine.id);

      // Delete existing tasks for this routine
      await supabase
        .from('user_tasks')
        .delete()
        .eq('user_id', user.id)
        .eq('source_routine_id', routineId)
        .or('pro_link_type.is.null,pro_link_type.neq.routine');

      // Get max order_index
      const { data: existingTasks } = await supabase
        .from('user_tasks')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1);
      const startOrder = (existingTasks?.[0]?.order_index ?? -1) + 1;

      // Insert new tasks
      if (tasks.length > 0) {
        const userTasks = tasks.map((task: any, index: number) => ({
          user_id: user.id,
          title: task.title,
          emoji: task.emoji || '📝',
          color: task.color || ROUTINE_COLOR_CYCLE[index % ROUTINE_COLOR_CYCLE.length],
          repeat_pattern: task.repeat_pattern || 'daily',
          repeat_days: task.repeat_days || null,
          tag: title,
          time_period: task.time_period || null,
          linked_playlist_id: task.pro_link_type === 'playlist' ? task.pro_link_value : null,
          pro_link_type: task.pro_link_type || null,
          pro_link_value: task.pro_link_value || null,
          is_active: true,
          order_index: startOrder + index,
          goal_enabled: task.goal_enabled || false,
          goal_target: task.goal_target || null,
          goal_type: task.goal_type || null,
          goal_unit: task.goal_unit || null,
          duration_minutes: task.duration_minutes || null,
          source_routine_id: routineId,
        }));

        await supabase.from('user_tasks').insert(userTasks);
      }

      toast.success('Routine updated! ✨');
      setShowBuilder(false);
      setBuilderEditRoutine(null);

      // Update preStartRoutine if it's the same routine being edited
      if (preStartRoutine && preStartRoutine.routine_id === routineId) {
        setPreStartRoutine((prev: any) => prev ? { ...prev, title, emoji, color } : prev);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-routines-all'] }),
        queryClient.invalidateQueries({ queryKey: ['routine-user-tasks-emojis'] }),
        queryClient.invalidateQueries({ queryKey: ['routine-user-task-ids'] }),
        queryClient.invalidateQueries({ queryKey: ['user-tasks'] }),
      ]);
    } catch (err) {
      console.error('Failed to update routine:', err);
      toast.error('Failed to update routine');
    }
  };

  // Builder: handle preview sheet save (create new user routine)
  const handleBuilderPreviewSave = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    if (!user || !builderResult) return;
    try {
      // Insert user_routines_bank entry (routine_id auto-generated via default)
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

      // Convert builder tasks to RoutinePlanTask format for filtering
      const selectedTasks = builderResult.tasks.filter(t => selectedTaskIds.includes(t.id));
      const editedMap = new Map(editedTasks.map(e => [e.id, e]));

      // Get max order_index
      const { data: existingTasks } = await supabase
        .from('user_tasks')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1);
      const startOrder = (existingTasks?.[0]?.order_index ?? -1) + 1;

      // Check if pro-task was selected
      const hasProTask = selectedTaskIds.some(id => id.startsWith('__pro_task_routine_'));

      // Insert regular tasks
      const regularTasks = selectedTasks.filter(t => !t.id.startsWith('__pro_task_routine_'));
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

      // Insert pro-task (routine launcher) if selected
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
          order_index: -1,
          source_routine_id: null,
        });
      }

      toast.success('Routine created! 🎉');
      setShowBuilderPreview(false);
      setBuilderResult(null);
      queryClient.invalidateQueries({ queryKey: ['user-routines-all'] });
      queryClient.invalidateQueries({ queryKey: ['routine-user-tasks-emojis'] });
      queryClient.invalidateQueries({ queryKey: ['routine-user-task-ids'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
    } catch (err) {
      console.error('Failed to create routine:', err);
      toast.error('Failed to create routine');
    }
  };

  // Builder: prepare edit mode data
  const handleEditRoutine = useCallback(async (routine: any) => {
    if (!user) return;
    haptic.light();
    // Load tasks for this routine
    const { data: tasks } = await supabase
      .from('user_tasks')
      .select('id, title, emoji, color, repeat_pattern, repeat_days, description, pro_link_type, pro_link_value, goal_enabled, goal_target, goal_type, goal_unit, duration_minutes, time_period, linked_playlist_id, tag')
      .eq('user_id', user.id)
      .eq('source_routine_id', routine.routine_id)
      .eq('is_active', true)
      .or('pro_link_type.is.null,pro_link_type.neq.routine')
      .order('order_index', { ascending: true });

    const builderTasks: any[] = (tasks || []).map(t => ({
      id: t.id,
      title: t.title,
      emoji: t.emoji || '📝',
      color: t.color || 'peach',
      repeat_pattern: t.repeat_pattern || 'daily',
      repeat_days: t.repeat_days || null,
      description: t.description || null,
      pro_link_type: t.pro_link_type || null,
      pro_link_value: t.pro_link_value || null,
      goal_enabled: t.goal_enabled || false,
      goal_target: t.goal_target || null,
      goal_type: t.goal_type || null,
      goal_unit: t.goal_unit || null,
      duration_minutes: t.duration_minutes || null,
      time_period: t.time_period || null,
      linked_playlist_id: t.linked_playlist_id || null,
      category: t.tag || null,
    }));

    setBuilderEditRoutine(routine);
    setBuilderEditTasks(builderTasks);
    setShowBuilder(true);
  }, [user]);


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
    return plannerTasks.filter(t => t.source_routine_id === preStartRoutine.routine_id && t.pro_link_type !== 'routine');
  }, [plannerTasks, preStartRoutine]);

  // Calculate routine duration using smart estimates
  const { data: routineDurationLabel = '' } = useQuery({
    queryKey: ['routine-duration-label', preStartRoutine?.routine_id, routineFilteredTasks.map(t => t.id).join(',')],
    queryFn: async () => {
      if (!routineFilteredTasks.length || !user) return '';
      const inputs: SmartEstimateInput[] = routineFilteredTasks.map(t => ({
        taskTitle: t.title,
        durationMinutes: t.duration_minutes ?? null,
        goalType: t.goal_type ?? null,
        goalTarget: t.goal_target ?? null,
      }));
      const estimates = await fetchSmartEstimates(user.id, inputs);
      const totalSeconds = routineFilteredTasks.reduce((sum, t) => {
        if (t.goal_type === 'timer' && t.goal_target) return sum + t.goal_target;
        return sum + (estimates.get(t.title) || 60);
      }, 0);
      const totalMins = Math.round(totalSeconds / 60);
      if (totalMins >= 60) {
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
      }
      return `${totalMins}m`;
    },
    enabled: !!preStartRoutine && routineFilteredTasks.length > 0 && !!user,
    staleTime: 60_000,
  });

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
    const routineTasks = userTasksByRoutine?.[preStartRoutine.routine_id] || [];
    const taskIds = routineTasks.map(t => t.id);
    if (taskIds.length > 0) {
      await supabase
        .from('task_completions')
        .delete()
        .eq('user_id', user!.id)
        .eq('completed_date', format(today, 'yyyy-MM-dd'))
        .in('task_id', taskIds);
    }

    // Build all tasks (not just remaining since we reset)
    // Fetch smart estimates for non-timer tasks
    // Build smart estimate inputs using duration_minutes
    const estimateInputs: SmartEstimateInput[] = routineFilteredTasks.map(t => ({
      taskTitle: t.title,
      durationMinutes: t.duration_minutes ?? null,
      goalType: null, // no longer using timer goals
      goalTarget: null,
    }));
    const estimates = user ? await fetchSmartEstimates(user.id, estimateInputs) : new Map();

    const allTasks = routineFilteredTasks.map(t => {
      const durationSeconds = t.duration_minutes ? t.duration_minutes * 60 : null;
      const estimate = estimates.get(t.title);
      return {
        id: t.id,
        title: t.title,
        emoji: t.emoji || '📝',
        targetSeconds: durationSeconds || estimate || 60,
        color: t.color || undefined,
        userTaskId: t.id,
        goalType: t.goal_type || null,
        goalTarget: t.goal_target || null,
        hasTimerGoal: true, // always countdown
        isEstimate: !durationSeconds,
        proLinkType: t.pro_link_type || null,
        proLinkValue: t.pro_link_value || null,
      };
    });

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

    // Fetch smart estimates for tasks
    const estimateInputs: SmartEstimateInput[] = remainingTasks.map(t => ({
      taskTitle: t.title,
      durationMinutes: t.duration_minutes ?? null,
      goalType: null,
      goalTarget: null,
    }));
    const estimates = user ? await fetchSmartEstimates(user.id, estimateInputs) : new Map();

    // Build focus player tasks from remaining planner tasks
    const focusTasks = remainingTasks.map(t => {
      const durationSeconds = t.duration_minutes ? t.duration_minutes * 60 : null;
      const estimate = estimates.get(t.title);
      return {
        id: t.id,
        title: t.title,
        emoji: t.emoji || '📝',
        targetSeconds: durationSeconds || estimate || 60,
        color: t.color || undefined,
        userTaskId: t.id,
        goalType: t.goal_type || null,
        goalTarget: t.goal_target || null,
        hasTimerGoal: true, // always countdown
        isEstimate: !durationSeconds,
        proLinkType: t.pro_link_type || null,
        proLinkValue: t.pro_link_value || null,
      };
    });

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
            <h1 className="text-base font-bold text-foreground">Routine Player</h1>
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
              const activeRoutines = localRoutines;
              const sortableIds = activeRoutines.map((r: any) => r.id);
              const activeRoutineData = activeRoutineId ? activeRoutines.find((r: any) => r.id === activeRoutineId) : null;

              return activeRoutines.length > 0 ? (
              <section>
                <p className="text-base font-bold text-foreground mb-3">My Routines</p>
                <DndContext
                  sensors={routineSensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleRoutineDragStart}
                  onDragEnd={handleRoutineDragEnd}
                >
                  <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {activeRoutines.map((routine: any) => (
                        <SortableRoutineCard
                          key={routine.id}
                          routine={routine}
                          routineTasksMap={routineTasksMap}
                          userTasksByRoutine={userTasksByRoutine}
                          todayCompletions={todayCompletions}
                          getCompletionInfo={getCompletionInfo}
                          categoryNameMap={categoryNameMap}
                          loadingRoutineId={loadingRoutineId}
                          addedRoutineIds={addedRoutineIds}
                          onPlay={handlePlay}
                          onOpenAddSheet={handleOpenAddSheet}
                          onDeleteRoutine={setDeleteRoutine}
                          onEditRoutine={handleEditRoutine}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeRoutineData ? (
                      <div className="opacity-90 scale-105 shadow-2xl rounded-2xl">
                        <RoutineCardContent
                          routine={activeRoutineData}
                          routineTasksMap={routineTasksMap}
                          userTasksByRoutine={userTasksByRoutine}
                          todayCompletions={todayCompletions}
                          getCompletionInfo={getCompletionInfo}
                          categoryNameMap={categoryNameMap}
                          loadingRoutineId={loadingRoutineId}
                          addedRoutineIds={addedRoutineIds}
                          onPlay={handlePlay}
                          onOpenAddSheet={handleOpenAddSheet}
                          onDeleteRoutine={setDeleteRoutine}
                          onEditRoutine={handleEditRoutine}
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </section>
              ) : null;
            })()}

            {/* Create Routine card */}
            <button
              onClick={() => { haptic.light(); setBuilderEditRoutine(null); setShowBuilder(true); }}
              className="w-full rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
            >
              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/30 p-5 relative">
                {/* Decorative circles */}
                <div className="absolute top-3 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-amber-200/40 to-orange-200/30 dark:from-amber-800/20 dark:to-orange-800/15 blur-sm" />
                <div className="absolute bottom-2 right-12 w-8 h-8 rounded-full bg-rose-200/30 dark:bg-rose-800/15 blur-sm" />
                
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 dark:from-amber-500 dark:to-orange-500 flex items-center justify-center shadow-md shadow-amber-200/50 dark:shadow-amber-900/30">
                    <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <p className="text-[15px] font-bold text-foreground">Build Your Routine</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Design your perfect daily flow</p>
                  </div>
                </div>
              </div>
            </button>

            {/* Empty state */}
            {(myRoutines || []).length === 0 && (
              <div className="text-center py-8">
                <FluentEmoji emoji="🎯" size={48} className="mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No routines yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your own or browse the library
                </p>
              </div>
            )}

            {/* Try a routine — same style as home planner */}
            {featuredRoutines.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarPlus className="h-4 w-4 text-violet-500" />
                    <h2 className="text-sm font-semibold text-foreground/70 tracking-wide">
                      Try a routine
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate('/app/routines')}
                    className="text-xs text-primary font-medium flex items-center gap-0.5"
                  >
                    All <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide snap-x snap-mandatory scroll-pl-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {featuredRoutines.filter(r => !dismissedFeatured.includes(r.id)).map((routine) => (
                    <div key={routine.id} className={cn('shrink-0 w-[85%] snap-start')}>
                      <FeaturedRoutineCard
                        routine={routine}
                        categoryName={categoryNameMap.get(routine.category)}
                        onDismiss={() => {
                          const updated = [...dismissedFeatured, routine.id];
                          setDismissedFeatured(updated);
                          localStorage.setItem(DISMISSED_FEATURED_KEY, JSON.stringify(updated));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {featuredRoutines.length === 0 && (
              <button
                onClick={() => navigate('/app/routines')}
                className="w-full flex items-center justify-center gap-1 text-sm text-primary font-medium py-3"
              >
                Browse Routines Library <ChevronRight className="w-4 h-4" />
              </button>
            )}
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
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { haptic.light(); handleEditRoutine(preStartRoutine); }}
                className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center active:scale-95 transition-all"
                title="Edit routine"
              >
                <Pencil className="w-3.5 h-3.5 text-foreground/70" />
              </button>
              {!addedRoutineIds.has(preStartRoutine.routine_id) && (
                <button
                  onClick={() => { haptic.light(); handleOpenAddSheet(preStartRoutine); }}
                  className="w-8 h-8 rounded-full bg-urgency flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                  title="Add to planner"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-urgency-foreground" />
                </button>
              )}
              <button
                onClick={() => { haptic.light(); setDeleteRoutine(preStartRoutine); }}
                className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center active:scale-95 transition-all"
                title="Delete routine"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 pb-48 pt-4">
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
            className="fixed bottom-0 left-0 right-0 px-5 pt-2 bg-background"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
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

      {/* Routine Builder Sheet */}
      <RoutineBuilderSheet
        open={showBuilder}
        onOpenChange={(open) => {
          setShowBuilder(open);
          if (!open) setBuilderEditRoutine(null);
        }}
        onComplete={handleBuilderComplete}
        editMode={!!builderEditRoutine}
        initialTitle={builderEditRoutine?.title || ''}
        initialEmoji={builderEditRoutine?.emoji || '✨'}
        initialColor={builderEditRoutine?.color || 'mint'}
        initialTasks={builderEditRoutine ? builderEditTasks : []}
        onEditSave={handleBuilderEditSave}
      />

      {/* Builder Preview Sheet (shown after builder create) */}
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