import { useState, useEffect, useMemo } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
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

export function WelcomeRitualCard({ onActionAdded, onDismiss }: WelcomeRitualCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const handleFlip = () => {
    haptic.light();
    setIsFlipped(true);
  };

  const handleCloseFlip = () => {
    setIsFlipped(false);
  };

  const toggleAction = (actionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (alreadyAddedActions.has(actionId)) return;
    
    haptic.light();
    setSelectedActions(prev => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    if (selectedActions.size === 0 || !welcomeRitualInfo?.id) return;
    
    setIsSubmitting(true);
    haptic.light();
    
    try {
      await addRoutine.mutateAsync({
        routineId: welcomeRitualInfo.id,
        selectedTaskIds: Array.from(selectedActions),
      });
      
      haptic.success();
      localStorage.setItem('simora_welcome_card_action_added', 'true');
      localStorage.setItem('simora_welcome_card_dismissed', 'true');
      onActionAdded?.();
      setDismissed(true);
      onDismiss?.();
    } catch (error) {
      console.error('Failed to add actions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (dismissed) return null;
  if (welcomeLoading || !welcomeRitualInfo) return null;
  
  const title = welcomeRitualInfo.title || 'Your day is open';
  const subtitle = welcomeRitualInfo.subtitle || 'Tap to pick your first actions';

  return (
    <>
      {/* Spotlight overlay - 80% black when flipped */}
      {isFlipped && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 animate-fade-in"
          onClick={handleCloseFlip}
        />
      )}
      
      <div 
        className={cn("w-full", isFlipped && "relative z-50")}
        style={{ perspective: '1000px' }}
      >
        <div 
          className="relative w-full transition-transform duration-500"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front of card */}
          <div 
            className="relative w-full cursor-pointer"
            style={{ backfaceVisibility: 'hidden' }}
            onClick={handleFlip}
          >
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
          
          {/* Back of card - taller than square */}
          <div 
            className="absolute top-0 left-0 w-full"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="relative w-full rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/20">
              {/* Header */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      Choose a simple and wholesome action to start right away!
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      (select all that apply)
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCloseFlip(); }}
                    className="shrink-0 ml-2 w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4 text-foreground/70" />
                  </button>
                </div>
              </div>
              
              {/* Actions list */}
              <div className="px-3 pb-3 space-y-2 max-h-[60vh] overflow-y-auto">
                {ritualLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                ) : displayActions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No actions available yet
                  </div>
                ) : (
                  displayActions.map((action, index) => {
                    const isAlreadyAdded = alreadyAddedActions.has(action.id);
                    const isSelected = selectedActions.has(action.id);
                    const emoji = action.emoji || '✨';
                    const actionTitle = action.title;
                    const actionColor = (action as RoutineBankTask).color as TaskColor || COLOR_CYCLE[index % COLOR_CYCLE.length];
                    const bgColor = TASK_COLORS[actionColor] || TASK_COLORS.mint;
                    
                    return (
                      <button
                        key={action.id}
                        onClick={(e) => toggleAction(action.id, e)}
                        disabled={isAlreadyAdded}
                        className={cn(
                          "flex items-center gap-3 w-full p-3 rounded-xl transition-all active:scale-[0.98]",
                          isSelected && "ring-2 ring-foreground ring-offset-1",
                          isAlreadyAdded && "opacity-50"
                        )}
                        style={{ backgroundColor: bgColor }}
                      >
                        <span className="text-2xl shrink-0">
                          {emoji.length <= 2 ? emoji : <FluentEmoji emoji={emoji} size={28} />}
                        </span>
                        <span className={cn(
                          "flex-1 text-left font-medium text-[15px] text-black truncate",
                          isAlreadyAdded && "line-through opacity-70"
                        )}>
                          {actionTitle}
                        </span>
                        <div className={cn(
                          "shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all border-2",
                          isSelected 
                            ? "bg-foreground border-foreground text-background" 
                            : isAlreadyAdded
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-white/60 border-black/20"
                        )}>
                          {isAlreadyAdded ? (
                            <Check className="w-4 h-4" />
                          ) : isSelected ? (
                            <Check className="w-4 h-4" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              
              {/* Continue button */}
              <div className="px-3 pb-4 pt-2">
                <button
                  onClick={handleContinue}
                  disabled={selectedActions.size === 0 || isSubmitting}
                  className={cn(
                    "w-full h-12 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2",
                    selectedActions.size > 0
                      ? "bg-foreground text-background active:scale-[0.98]"
                      : "bg-black/10 dark:bg-white/10 text-foreground/40"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Continue{selectedActions.size > 0 && ` (${selectedActions.size})`}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
