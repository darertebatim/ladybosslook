import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Loader2, ChevronRight, Plus } from 'lucide-react';
import { useRoutinesBank, useUserAddedBankRoutines } from '@/hooks/useRoutinesBank';
import { useFocusPlayer } from '@/components/app/FocusPlayerProvider';
import { haptic } from '@/lib/haptics';
import { format, addMinutes } from 'date-fns';

export default function AppFocusRoutines() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: allRoutines, isLoading: routinesLoading } = useRoutinesBank();
  const { data: userAddedIds, isLoading: userLoading } = useUserAddedBankRoutines();
  const { startRoutine } = useFocusPlayer();

  const isLoading = routinesLoading || userLoading;

  // User's activated focus routines
  const activatedFocusRoutines = useMemo(() => {
    if (!allRoutines || !userAddedIds) return [];
    return allRoutines.filter(
      r => r.is_focus && userAddedIds.includes(r.id)
    );
  }, [allRoutines, userAddedIds]);

  // All available focus routines (not yet added)
  const availableFocusRoutines = useMemo(() => {
    if (!allRoutines || !userAddedIds) return [];
    return allRoutines.filter(
      r => r.is_focus && !userAddedIds.includes(r.id)
    );
  }, [allRoutines, userAddedIds]);

  const handlePlay = async (routine: typeof allRoutines extends (infer T)[] | undefined ? T : never) => {
    // Fetch routine detail with tasks
    const { supabase } = await import('@/integrations/supabase/client');
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

  // Calculate end time for a routine
  const getEndTime = (totalMinutes: number) => {
    return format(addMinutes(new Date(), totalMinutes), 'h:mma').toLowerCase();
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-3">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary fill-primary" />
            <h1 className="text-lg font-bold text-foreground">Focus Routines</h1>
          </div>
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
                  Activated
                </p>
                <div className="space-y-3">
                  {activatedFocusRoutines.map(routine => {
                    const totalMinutes = routine.sort_order || 30; // estimate
                    return (
                      <div
                        key={routine.id}
                        className="bg-card rounded-2xl border border-border p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-lg">
                              {routine.title}
                            </h3>
                            {routine.subtitle && (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                {routine.subtitle}
                              </p>
                            )}
                            {/* Task emoji preview */}
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-lg">{routine.emoji || '✨'}</span>
                            </div>
                          </div>

                          {/* Play button */}
                          <button
                            onClick={() => handlePlay(routine)}
                            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform shrink-0 ml-3"
                          >
                            <Play className="w-5 h-5 text-foreground fill-foreground ml-0.5" />
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

            {/* Browse all routines CTA */}
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
