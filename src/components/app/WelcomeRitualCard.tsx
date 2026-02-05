import { useState } from 'react';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useRoutineBankDetail, useAddRoutineFromBank, RoutineBankTask, useWelcomePopupRitual } from '@/hooks/useRoutinesBank';
import { useTaskTemplates, TaskTemplate, TASK_COLORS, TaskColor } from '@/hooks/useTaskPlanner';
import { toast } from 'sonner';

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
        toast.error('No welcome ritual configured');
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
      toast.success('Added to your day! ✨');
      // Don't dismiss - let user add more actions
    } catch (error) {
      console.error('Failed to add action:', error);
      toast.error('Failed to add action');
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
        
        {/* Back of card */}
        <div 
          className="absolute inset-0 w-full"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-md bg-card border border-border">
            {/* Header */}
            <div className="p-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-foreground">
                  Pick an action
                </h3>
                <button
                  onClick={handleDismiss}
                  className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                One is enough. Start small.
              </p>
            </div>
            
            {/* Actions list */}
            <div className="p-2 space-y-1.5 overflow-y-auto max-h-[calc(100%-70px)]">
              {ritualLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : displayActions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No actions available yet
                </div>
              ) : (
                displayActions.map((action) => {
                  const isAdded = addedActions.has(action.id);
                  const isAdding = addingAction === action.id;
                  const emoji = action.emoji || '✨';
                  const actionTitle = action.title;
                  
                  return (
                    <button
                      key={action.id}
                      onClick={(e) => handleAddAction(action, e)}
                      disabled={isAdded || isAdding}
                      className={cn(
                        "flex items-center gap-2.5 w-full p-2.5 rounded-xl border transition-all",
                        isAdded 
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" 
                          : "bg-card border-border/50 hover:bg-muted/50 active:scale-[0.98]"
                      )}
                    >
                      <FluentEmoji emoji={emoji} size={24} className="flex-shrink-0" />
                      <span className={cn(
                        "flex-1 text-left text-[13px] truncate",
                        isAdded ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"
                      )}>
                        {actionTitle}
                      </span>
                      <div className={cn(
                        "shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                        isAdded 
                          ? "bg-emerald-500 text-white" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {isAdding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isAdded ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            
            {/* Tap to flip back hint */}
            <div className="absolute bottom-2 inset-x-0 text-center">
              <span className="text-[10px] text-muted-foreground/50">
                Tap to flip back
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
