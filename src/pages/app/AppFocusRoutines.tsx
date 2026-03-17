import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Loader2, ChevronRight, Plus, RotateCw, ChevronLeft } from 'lucide-react';
import { useRoutinesBank, useUserAddedBankRoutines } from '@/hooks/useRoutinesBank';
import { useFocusPlayer } from '@/components/app/FocusPlayerProvider';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/haptics';
import { format, addMinutes, startOfDay, endOfDay } from 'date-fns';

export default function AppFocusRoutines() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: allRoutines, isLoading: routinesLoading } = useRoutinesBank();
  const { data: userAddedIds, isLoading: userLoading } = useUserAddedBankRoutines();
  const { startRoutine } = useFocusPlayer();

  const isLoading = routinesLoading || userLoading;

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

  const handlePlay = async (routine: typeof allRoutines extends (infer T)[] | undefined ? T : never) => {
    const { data } = await supabase
      .from('routines_bank_tasks')
      .select(`
        id, title, emoji, task_order, duration_minutes,
        task:admin_task_bank(goal_target, goal_type, color)
      `)
      .eq('routine_id', routine.id)
      .order('task_order', { ascending: true });

    if (!data || data.length === 0) {
      const { toast } = await import('sonner');
      toast.error('No tasks found in this routine');
      return;
    }

    haptic.medium();
    startRoutine({
      routineId: routine.id,
      routineTitle: routine.title,
      routineEmoji: routine.emoji || '✨',
      tasks: data.map(t => ({
        id: t.id,
        title: t.title,
        emoji: t.emoji || '📝',
        targetSeconds: (t.task as any)?.goal_target || (t.duration_minutes ? t.duration_minutes * 60 : 300),
        color: (t.task as any)?.color || undefined,
      })),
    });
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
                            {routine.subtitle && (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                {routine.subtitle}
                              </p>
                            )}
                            {/* Task emoji chain */}
                            {emojis.length > 0 && (
                              <div className="flex items-center gap-0.5 mt-2 flex-wrap">
                                {emojis.map((emoji, i) => (
                                  <span key={i} className="flex items-center">
                                    <span className="text-base">{emoji}</span>
                                    {i < emojis.length - 1 && (
                                      <ChevronRight className="w-3 h-3 text-muted-foreground/40 mx-0.5" />
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Play / Replay button */}
                          <button
                            onClick={() => handlePlay(routine)}
                            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform shrink-0 ml-3"
                          >
                            {completion?.isComplete ? (
                              <RotatCw className="w-5 h-5 text-foreground" />
                            ) : (
                              <Play className="w-5 h-5 text-foreground fill-foreground ml-0.5" />
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
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-semibold text-foreground mb-1">No focus routines yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse and add focus routines to start your timed sessions
                </p>
              </div>
            )}

            {/* Discover more */}
            {availableFocusRoutines.length > 0 && (
              <section>
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Discover
                </p>
                <div className="space-y-2">
                  {availableFocusRoutines.map(routine => (
                    <button
                      key={routine.id}
                      onClick={() => navigate(`/app/routines/${routine.id}`, { state: { from: location.pathname } })}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border active:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-2xl">{routine.emoji || '✨'}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm">{routine.title}</h4>
                        {routine.subtitle && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{routine.subtitle}</p>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
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
    </div>
  );
}
