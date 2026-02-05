import { useState } from 'react';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useRoutineBankDetail, useAddRoutineFromBank, RoutineBankTask, useWelcomePopupRitual } from '@/hooks/useRoutinesBank';
import { useTaskTemplates, TaskTemplate, TASK_COLORS, TaskColor } from '@/hooks/useTaskPlanner';


// Color cycle for visual variety
const COLOR_CYCLE: TaskColor[] = ['peach', 'sky', 'pink', 'mint', 'lavender', 'lime', 'yellow'];

interface WelcomeRitualCardProps {
  onActionAdded?: () => void;
  onDismiss?: () => void;
}

export function WelcomeRitualCard({ onActionAdded, onDismiss }: WelcomeRitualCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [addedActions, setAddedActions] = useState<Set<string>>(new Set());
  const [addingAction, setAddingAction] = useState<string | null>(null);
  
  // Fetch the welcome popup ritual dynamically
  const { data: welcomeRitualInfo, isLoading: welcomeLoading } = useWelcomePopupRitual();
  
  // Fetch full ritual details including tasks
  const { data: welcomeRitual, isLoading: ritualLoading } = useRoutineBankDetail(welcomeRitualInfo?.id);
  const addRoutine = useAddRoutineFromBank();
  
  // Fallback: fetch popular templates if ritual has no tasks
  const { data: templates = [] } = useTaskTemplates();
  const popularTemplates = templates.filter(t => t.is_popular).slice(0, 6);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    localStorage.removeItem('simora_force_new_user');
    onDismiss?.();
  };

  const handleFlip = () => {
    haptic.light();
    setIsFlipped(!isFlipped);
  };

  const handleAddAction = async (action: RoutineBankTask | TaskTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const actionId = action.id;
    if (addedActions.has(actionId) || addingAction === actionId) return;
    
    setAddingAction(actionId);
    haptic.light();
    
    try {
      if (!welcomeRitualInfo?.id) {
        return;
      }
      
      // Add the single task from the routine
      await addRoutine.mutateAsync({
        routineId: welcomeRitualInfo.id,
        selectedTaskIds: [actionId],
      });
      
      setAddedActions(prev => new Set([...prev, actionId]));
      haptic.success();
      onActionAdded?.();
      // Don't dismiss - let user add more actions
    } catch (error) {
      console.error('Failed to add action:', error);
    } finally {
      setAddingAction(null);
    }
  };

  if (dismissed) return null;
  
  // Don't show if no welcome ritual is configured or still loading
  if (welcomeLoading || !welcomeRitualInfo) return null;

  // Get actions to display (from ritual tasks or fallback to popular templates)
  const actions = welcomeRitual?.tasks?.length ? welcomeRitual.tasks : [];
  const displayActions = actions.length > 0 ? actions : popularTemplates;
  
  // Use ritual's title and subtitle dynamically
  const title = welcomeRitualInfo.title || 'Your day is open';
  const subtitle = welcomeRitualInfo.subtitle || 'Tap to pick your first actions';

  return (
    <div 
      className="w-full cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <div 
        className="relative w-full transition-transform duration-500"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
        onClick={handleFlip}
      >
        {/* Front of card - same style as RoutineBankCard */}
        <div 
          className="relative w-full"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-md">
            {/* Background Image - no overlay, just like other ritual cards */}
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
            
            {/* Bottom Gradient for Title Overlay - same as RoutineBankCard */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors z-10"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            
            {/* Title Overlay - Bottom, matching RoutineBankCard sizing */}
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
        
        {/* Back of card - App-style with colorful action cards */}
        <div 
          className="absolute inset-0 w-full"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/20">
            {/* Header - softer, more app-like */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Pick an action
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    One is enough. Start small.
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-foreground/70" />
                </button>
              </div>
            </div>
            
            {/* Actions list - colorful app-style cards */}
            <div className="px-3 pb-8 space-y-2 overflow-y-auto max-h-[calc(100%-80px)]">
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
                  const isAdded = addedActions.has(action.id);
                  const isAdding = addingAction === action.id;
                  const emoji = action.emoji || '✨';
                  const actionTitle = action.title;
                  // Use action's color or cycle through colors
                  const actionColor = (action as RoutineBankTask).color as TaskColor || COLOR_CYCLE[index % COLOR_CYCLE.length];
                  const bgColor = TASK_COLORS[actionColor] || TASK_COLORS.mint;
                  
                  return (
                    <button
                      key={action.id}
                      onClick={(e) => handleAddAction(action, e)}
                      disabled={isAdded || isAdding}
                      className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-xl transition-all active:scale-[0.98]",
                        isAdded && "ring-2 ring-emerald-400 ring-offset-1"
                      )}
                      style={{ backgroundColor: bgColor }}
                    >
                      <span className="text-2xl shrink-0">
                        {emoji.length <= 2 ? emoji : <FluentEmoji emoji={emoji} size={28} />}
                      </span>
                      <span className={cn(
                        "flex-1 text-left font-medium text-[15px] text-black truncate",
                        isAdded && "line-through opacity-70"
                      )}>
                        {actionTitle}
                      </span>
                      <div className={cn(
                        "shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all",
                        isAdded 
                          ? "bg-emerald-500 text-white" 
                          : "bg-white/60 text-black/50"
                      )}>
                        {isAdding ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isAdded ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            
            {/* Tap to flip back hint */}
            <div className="absolute bottom-2 inset-x-0 text-center">
              <span className="text-[10px] text-foreground/40">
                Tap to flip back
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
