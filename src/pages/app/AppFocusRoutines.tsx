import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Loader2, ChevronRight, RotateCw, ChevronLeft } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { useRoutinesBank, useUserAddedBankRoutines, useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { useFocusPlayer } from '@/components/app/FocusPlayerProvider';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/haptics';
import { startOfDay, endOfDay } from 'date-fns';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { FeaturedRoutineCard } from '@/components/app/FeaturedRoutineCard';

export default function AppFocusRoutines() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: allRoutines, isLoading: routinesLoading } = useRoutinesBank();
  const { data: userAddedIds, isLoading: userLoading } = useUserAddedBankRoutines();
  const { data: routineCategories = [] } = useRoutineBankCategories();
  const { startRoutine, isActive } = useFocusPlayer();

  const isLoading = routinesLoading || userLoading;

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    routineCategories.forEach(c => map.set(c.slug, c.name));
    return map;
  }, [routineCategories]);

  // Fetch today's session completion data
  const { data: todaySessions } = useQuery({
    queryKey: ['focus-today-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const today = new Date();
      const { data } = await supabase
        .from('routine_sessions')
        .select('routine_id, tasks_completed, tasks_total, ended_at')
        .eq('user_id', user.id)
        .gte('started_at', startOfDay(today).toISOString())
        .lte('started_at', endOfDay(today).toISOString());
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch routine tasks for emoji chains
  const focusRoutineIds = useMemo(() => {
    if (!allRoutines) return [];
    return allRoutines.filter(r => r.is_focus).map(r => r.id);
  }, [allRoutines]);

  const { data: routineTasks } = useQuery({
    queryKey: ['focus-routine-tasks', focusRoutineIds],
    queryFn: async () => {
      if (focusRoutineIds.length === 0) return {};
      const { data } = await supabase
        .from('routines_bank_tasks')
        .select('routine_id, emoji, task_order')
        .in('routine_id', focusRoutineIds)
        .order('task_order', { ascending: true });
      
      const map: Record<string, string[]> = {};
      (data || []).forEach(t => {
        if (!map[t.routine_id]) map[t.routine_id] = [];
        map[t.routine_id].push(t.emoji || '📝');
      });
      return map;
    },
    enabled: focusRoutineIds.length > 0,
  });

  // User's activated focus routines
  const activatedFocusRoutines = useMemo(() => {
    if (!allRoutines || !userAddedIds) return [];
    return allRoutines.filter(r => r.is_focus && userAddedIds.includes(r.id));
  }, [allRoutines, userAddedIds]);

  // All available focus routines (not yet added)
  const availableFocusRoutines = useMemo(() => {
    if (!allRoutines || !userAddedIds) return [];
    return allRoutines.filter(r => r.is_focus && !userAddedIds.includes(r.id));
  }, [allRoutines, userAddedIds]);

  // Get completion % for a routine
  const getCompletionInfo = (routineId: string) => {
    if (!todaySessions) return null;
    const session = todaySessions.find(s => s.routine_id === routineId && s.ended_at);
    if (!session) return null;
    const pct = session.tasks_total > 0
      ? Math.round((session.tasks_completed / session.tasks_total) * 100)
      : 0;
    return { pct, isComplete: pct === 100 };
  };

  // Pre-start state
  const [preStartRoutine, setPreStartRoutine] = useState<(typeof allRoutines extends (infer T)[] | undefined ? T : never) | null>(null);
  const [preStartTasks, setPreStartTasks] = useState<{ id: string; title: string; emoji: string; targetSeconds: number; color?: string }[]>([]);
  const [loadingRoutineId, setLoadingRoutineId] = useState<string | null>(null);

  const totalPreStartSeconds = preStartTasks.reduce((s, t) => s + t.targetSeconds, 0);

  const { isActive } = useFocusPlayer();

  const handlePlay = async (routine: typeof allRoutines extends (infer T)[] | undefined ? T : never) => {
    if (isActive) {
      const { toast } = await import('sonner');
      toast('A routine is already running. Finish or cancel it first.');
      return;
    }
    setLoadingRoutineId(routine.id);
    const { data } = await supabase
      .from('routines_bank_tasks')
      .select(`
        id, title, emoji, task_order, duration_minutes,
        task:admin_task_bank(goal_target, goal_type, color)
      `)
      .eq('routine_id', routine.id)
      .order('task_order', { ascending: true });

    setLoadingRoutineId(null);

    if (!data || data.length === 0) {
      const { toast } = await import('sonner');
      toast.error('No tasks found in this routine');
      return;
    }

    haptic.light();
    const tasks = data.map(t => ({
      id: t.id,
      title: t.title,
      emoji: t.emoji || '📝',
      targetSeconds: (t.task as any)?.goal_target || (t.duration_minutes ? t.duration_minutes * 60 : 300),
      color: (t.task as any)?.color || undefined,
    }));
    setPreStartTasks(tasks);
    setPreStartRoutine(routine);
  };

  const handleStartFromPreview = () => {
    if (!preStartRoutine) return;
    haptic.medium();
    startRoutine({
      routineId: preStartRoutine.id,
      routineTitle: preStartRoutine.title,
      routineEmoji: preStartRoutine.emoji || '✨',
      tasks: preStartTasks,
    });
    setPreStartRoutine(null);
    setPreStartTasks([]);
  };

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
            <h1 className="text-base font-bold text-foreground">Focus Routines</h1>
          </div>
          <div className="w-7" />
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
            {activatedFocusRoutines.length > 0 && (
              <section>
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Your routines
                </p>
                <div className="space-y-3">
                  {activatedFocusRoutines.map(routine => {
                    const completion = getCompletionInfo(routine.id);
                    const emojis = routineTasks?.[routine.id] || [];

                    return (
                      <div
                        key={routine.id}
                        className="bg-card rounded-2xl border border-border p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-foreground text-lg">
                                {routine.title}
                              </h3>
                              {completion && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  completion.isComplete
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {completion.pct}%
                                </span>
                              )}
                            </div>
                            {/* Task 3D emoji chain */}
                            {emojis.length > 0 && (
                              <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                                {emojis.map((emoji, i) => (
                                  <span key={i} className="flex items-center">
                                    <FluentEmoji emoji={emoji} size={24} />
                                    {i < emojis.length - 1 && (
                                      <ChevronRight className="w-3 h-3 text-muted-foreground/30 mx-0.5" />
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Play / Progress badge */}
                          <button
                            onClick={() => handlePlay(routine)}
                            disabled={loadingRoutineId === routine.id}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-muted active:scale-95 transition-transform shrink-0 ml-3"
                          >
                            {loadingRoutineId === routine.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                            ) : completion ? (
                              <>
                                {completion.isComplete ? (
                                  <RotateCw className="w-4 h-4 text-foreground" />
                                ) : (
                                  <Play className="w-4 h-4 text-foreground fill-foreground" />
                                )}
                                <span className="text-sm font-semibold text-foreground">{completion.pct}%</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 text-foreground fill-foreground" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Empty state */}
            {activatedFocusRoutines.length === 0 && (
              <div className="text-center py-12">
                <FluentEmoji emoji="🎯" size={48} className="mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No focus routines yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse and add focus routines to start your timed sessions
                </p>
              </div>
            )}

            {/* Discover more - using FeaturedRoutineCard */}
            {availableFocusRoutines.length > 0 && (
              <section>
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Discover
                </p>
                <div className="space-y-2.5">
                  {availableFocusRoutines.map(routine => (
                    <FeaturedRoutineCard
                      key={routine.id}
                      routine={routine}
                      categoryName={categoryNameMap.get(routine.category)}
                    />
                  ))}
                </div>
              </section>
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

      {/* Pre-start overlay */}
      {preStartRoutine && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
          <header
            className="flex items-center justify-between px-4 pt-3 pb-3"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
          >
            <button onClick={() => setPreStartRoutine(null)} className="p-1 active:opacity-70">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="w-7" />
          </header>

          <div className="flex-1 overflow-y-auto px-5 pb-32">
            <h1 className="text-2xl font-bold text-foreground mt-2">{preStartRoutine.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(), 'h:mma')} – {format(addMinutes(new Date(), Math.ceil(totalPreStartSeconds / 60)), 'h:mma')} ({Math.ceil(totalPreStartSeconds / 60)}m)
            </p>

            <div className="space-y-2.5 mt-6">
              {preStartTasks.map((task, i) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3.5"
                >
                  <span className="text-xs text-muted-foreground font-medium w-4 shrink-0">{i + 1}</span>
                  <FluentEmoji emoji={task.emoji} size={28} />
                  <p className="flex-1 text-sm font-medium text-foreground leading-snug">{task.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{Math.ceil(task.targetSeconds / 60)}m</span>
                </div>
              ))}
            </div>
          </div>

          {/* Start button */}
          <div
            className="fixed bottom-0 left-0 right-0 px-5 pb-4 pt-2 bg-background"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
          >
            <button
              onClick={handleStartFromPreview}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-amber-400 text-black font-bold text-base active:scale-[0.98] transition-transform"
            >
              <Play className="w-5 h-5 fill-current" />
              Start
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
