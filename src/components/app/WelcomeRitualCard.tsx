import { useState, useMemo } from 'react';
import { X, Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useRoutineBankDetail, useAddRoutineFromBank, RoutineBankTask, useWelcomePopupRitual } from '@/hooks/useRoutinesBank';
import { useTaskTemplates, TaskTemplate, TASK_COLORS, TaskColor, useAllActiveTasks } from '@/hooks/useTaskPlanner';

const COLOR_CYCLE: TaskColor[] = ['peach', 'sky', 'pink', 'mint', 'lavender', 'lime', 'yellow'];

interface WelcomeRitualCardProps {
  onActionAdded?: () => void;
  onDismiss?: () => void;
}

type Phase = 'picking' | 'confirming' | 'done';

export function WelcomeRitualCard({ onActionAdded, onDismiss }: WelcomeRitualCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [animatingIn, setAnimatingIn] = useState(false);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>('picking');

  const { data: welcomeRitualInfo, isLoading: welcomeLoading } = useWelcomePopupRitual();
  const { data: welcomeRitual, isLoading: ritualLoading } = useRoutineBankDetail(welcomeRitualInfo?.id);
  const addRoutine = useAddRoutineFromBank();
  const { data: userTasks = [] } = useAllActiveTasks();
  const { data: templates = [] } = useTaskTemplates();
  const popularTemplates = templates.filter(t => t.is_popular).slice(0, 6);

  const actions = welcomeRitual?.tasks?.length ? welcomeRitual.tasks : [];
  const displayActions = actions.length > 0 ? actions : popularTemplates;

  const existingTaskTitles = useMemo(() =>
    new Set(userTasks.map(t => t.title.toLowerCase().trim())),
    [userTasks]
  );

  const alreadyAddedActions = useMemo(() => {
    const set = new Set<string>();
    displayActions.forEach(action => {
      if (existingTaskTitles.has(action.title.toLowerCase().trim())) {
        set.add(action.id);
      }
    });
    return set;
  }, [displayActions, existingTaskTitles]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    localStorage.setItem('simora_welcome_card_dismissed', 'true');
    onDismiss?.();
  };

  const handleTapCard = () => {
    haptic.light();
    setAnimatingIn(true);
    setShowFullscreen(true);
  };

  const handleDismissFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimatingIn(false);
    setTimeout(() => {
      setShowFullscreen(false);
      setDismissed(true);
      localStorage.setItem('simora_welcome_card_dismissed', 'true');
      onDismiss?.();
    }, 300);
  };

  const toggleAction = (actionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (alreadyAddedActions.has(actionId) || phase !== 'picking') return;
    haptic.light();
    setSelectedActions(prev => {
      const next = new Set(prev);
      if (next.has(actionId)) next.delete(actionId);
      else next.add(actionId);
      return next;
    });
  };

  const handleContinue = async () => {
    if (selectedActions.size === 0 || !welcomeRitualInfo?.id) return;

    // Phase 1: Show "Adding..." with checkmark animations
    setPhase('confirming');
    haptic.light();

    try {
      await addRoutine.mutateAsync({
        routineId: welcomeRitualInfo.id,
        selectedTaskIds: Array.from(selectedActions),
      });

      haptic.success();
      localStorage.setItem('simora_welcome_card_action_added', 'true');
      localStorage.setItem('simora_welcome_card_dismissed', 'true');

      // Phase 2: Show "Done!" briefly
      setPhase('done');

      // Phase 3: After 1.5s, fade out the fullscreen overlay to reveal planner
      setTimeout(() => {
        setAnimatingIn(false);
      }, 1500);

      // Phase 4: After 2s, fully dismiss and notify parent
      setTimeout(() => {
        setShowFullscreen(false);
        setDismissed(true);
        onActionAdded?.();
        onDismiss?.();
      }, 2000);

    } catch (error) {
      console.error('Failed to add actions:', error);
      setPhase('picking');
    }
  };

  if (dismissed) return null;
  if (welcomeLoading || !welcomeRitualInfo) return null;

  const title = welcomeRitualInfo.title || 'Your day is open';
  const subtitle = welcomeRitualInfo.subtitle || 'Tap to pick your first actions';

  // Get only selected action names for the confirmation phase
  const selectedActionNames = displayActions
    .filter(a => selectedActions.has(a.id))
    .map(a => ({ title: a.title, emoji: a.emoji || '✨' }));

  return (
    <>
      {/* ── Fullscreen action picker ── */}
      {showFullscreen && (
        <div
          className={cn(
            "fixed inset-0 z-[9999] flex flex-col transition-all duration-300",
            animatingIn ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          )}
          style={{
            background: 'linear-gradient(160deg, #a855f7 0%, #7c3aed 40%, #6d28d9 100%)',
          }}
        >
          {/* Close button — only during picking */}
          {phase === 'picking' && (
            <div className="flex justify-end px-4 pt-[max(16px,env(safe-area-inset-top))]">
              <button
                onClick={handleDismissFullscreen}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {phase === 'picking' && (
            <>
              {/* Title */}
              <div className="px-6 pt-2 pb-4 text-center">
                <h2 className="text-[28px] font-bold text-white leading-tight">
                  Choose a simple and wholesome action to start right away!
                </h2>
                <p className="text-yellow-300 font-semibold text-base mt-3">
                  (Select all that apply)
                </p>
              </div>

              {/* Scrollable action cards */}
              <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
                {ritualLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-7 h-7 animate-spin text-white/70" />
                  </div>
                ) : (
                  displayActions.map((action, index) => {
                    const isAlreadyAdded = alreadyAddedActions.has(action.id);
                    const isSelected = selectedActions.has(action.id);
                    const emoji = action.emoji || '✨';

                    return (
                      <button
                        key={action.id}
                        onClick={(e) => toggleAction(action.id, e)}
                        disabled={isAlreadyAdded}
                        className={cn(
                          "flex items-center gap-4 w-full px-5 py-4 rounded-2xl bg-white/90 backdrop-blur-sm transition-all active:scale-[0.97]",
                          isSelected && "ring-2 ring-yellow-400 ring-offset-2 ring-offset-purple-600 bg-white",
                          isAlreadyAdded && "opacity-50"
                        )}
                      >
                        <span className="text-3xl shrink-0">
                          {emoji.length <= 2 ? emoji : <FluentEmoji emoji={emoji} size={36} />}
                        </span>
                        <span className={cn(
                          "flex-1 text-left font-semibold text-[17px] text-gray-900",
                          isAlreadyAdded && "line-through opacity-60"
                        )}>
                          {action.title}
                        </span>
                        <div className={cn(
                          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all border-2",
                          isSelected
                            ? "bg-purple-600 border-purple-600 text-white scale-110"
                            : isAlreadyAdded
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-transparent border-gray-300"
                        )}>
                          {(isAlreadyAdded || isSelected) && <Check className="w-5 h-5" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Continue button */}
              <div className="px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
                <button
                  onClick={handleContinue}
                  disabled={selectedActions.size === 0}
                  className={cn(
                    "w-full h-14 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2",
                    selectedActions.size > 0
                      ? "bg-white text-purple-700 active:scale-[0.97] shadow-lg shadow-purple-900/30"
                      : "bg-white/20 text-white/50"
                  )}
                >
                  Continue{selectedActions.size > 0 && ` (${selectedActions.size})`}
                </button>
              </div>
            </>
          )}

          {/* ── Confirming phase: animated checklist ── */}
          {phase === 'confirming' && (
            <div className="flex-1 flex flex-col items-center justify-center px-8 animate-fade-in">
              <Loader2 className="w-10 h-10 text-white animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-white mb-6">Adding to your planner...</h2>
              <div className="w-full max-w-sm space-y-3">
                {selectedActionNames.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-white/20 rounded-xl px-4 py-3 animate-fade-in"
                    style={{ animationDelay: `${i * 200}ms`, animationFillMode: 'both' }}
                  >
                    <span className="text-2xl">
                      {action.emoji.length <= 2 ? action.emoji : <FluentEmoji emoji={action.emoji} size={28} />}
                    </span>
                    <span className="flex-1 text-white font-medium text-[15px]">{action.title}</span>
                    <Check className="w-5 h-5 text-emerald-300" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Done phase: success message ── */}
          {phase === 'done' && (
            <div className="flex-1 flex flex-col items-center justify-center px-8 animate-scale-in">
              <div className="w-20 h-20 rounded-full bg-emerald-400 flex items-center justify-center mb-5">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
              <p className="text-white/80 text-center text-base">
                {selectedActions.size} action{selectedActions.size > 1 ? 's' : ''} added to your planner ✨
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Front card — inline in the feed ── */}
      {!showFullscreen && (
        <div className="w-full cursor-pointer" onClick={handleTapCard}>
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-md">
            {welcomeRitual?.cover_image_url ? (
              <img
                src={welcomeRitual.cover_image_url}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                <FluentEmoji emoji={welcomeRitualInfo.emoji || '✨'} size={96} className="opacity-40" />
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <button
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors z-10"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="font-bold text-lg text-white drop-shadow-lg leading-tight">
                {title}
              </h3>
              <p className="text-white/90 text-sm mt-1 drop-shadow">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
