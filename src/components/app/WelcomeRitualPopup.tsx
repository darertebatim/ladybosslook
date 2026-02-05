import { useState } from 'react';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useWelcomePopupRitual, useRoutineBankDetail, useAddRoutineFromBank, RoutineBankTask } from '@/hooks/useRoutinesBank';
import { toast } from 'sonner';

interface WelcomeRitualPopupProps {
  onDismiss: () => void;
  onActionAdded?: () => void;
}

export function WelcomeRitualPopup({ onDismiss, onActionAdded }: WelcomeRitualPopupProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [addedActions, setAddedActions] = useState<Set<string>>(new Set());
  const [addingAction, setAddingAction] = useState<string | null>(null);
  
  // Fetch the welcome popup ritual from DB
  const { data: welcomeRitual, isLoading: ritualLoading } = useWelcomePopupRitual();
  
  // Fetch full ritual details with tasks
  const { data: ritualWithTasks, isLoading: detailLoading } = useRoutineBankDetail(welcomeRitual?.id);
  const addRoutine = useAddRoutineFromBank();

  const handleDismiss = () => {
    onDismiss();
    localStorage.removeItem('simora_force_new_user');
  };

  const handleFlip = () => {
    haptic.light();
    setIsFlipped(!isFlipped);
  };

  const handleAddAction = async (action: RoutineBankTask, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const actionId = action.id;
    if (addedActions.has(actionId) || addingAction === actionId) return;
    
    setAddingAction(actionId);
    haptic.light();
    
    try {
      await addRoutine.mutateAsync({
        routineId: welcomeRitual!.id,
        selectedTaskIds: [actionId],
      });
      
      setAddedActions(prev => new Set([...prev, actionId]));
      haptic.success();
      onActionAdded?.();
      toast.success('Added to your day! ✨');
    } catch (error) {
      console.error('Failed to add action:', error);
      toast.error('Failed to add action');
    } finally {
      setAddingAction(null);
    }
  };

  // Don't render if no welcome ritual is configured
  if (ritualLoading || !welcomeRitual) return null;

  const isLoading = ritualLoading || detailLoading;
  const actions = ritualWithTasks?.tasks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop with subtle blur */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Popup Card with 3D flip */}
      <div 
        className="relative w-full max-w-xs"
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
          {/* Front of card */}
          <div 
            className="relative w-full"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-xl">
              {/* Background Image */}
              {welcomeRitual.cover_image_url ? (
                <img 
                  src={welcomeRitual.cover_image_url} 
                  alt={welcomeRitual.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                  <FluentEmoji emoji={welcomeRitual.emoji || '✨'} size={96} className="opacity-40" />
                </div>
              )}
              
              {/* Bottom Gradient for Title Overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Dismiss button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors z-10"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              
              {/* Title Overlay - Bottom */}
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="font-bold text-xl text-white drop-shadow-lg">
                  {welcomeRitual.title}
                </h3>
                {welcomeRitual.subtitle && (
                  <p className="text-white/90 text-sm mt-1 drop-shadow">
                    {welcomeRitual.subtitle}
                  </p>
                )}
                <p className="text-white/70 text-xs mt-2">
                  Tap to pick your first actions
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
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-xl bg-card border border-border">
              {/* Header */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base text-foreground">
                    Pick an action
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss();
                    }}
                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  One is enough. Start small.
                </p>
              </div>
              
              {/* Actions list */}
              <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100%-90px)]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : actions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No actions available
                  </div>
                ) : (
                  actions.map((action) => {
                    const isAdded = addedActions.has(action.id);
                    const isAdding = addingAction === action.id;
                    
                    return (
                      <button
                        key={action.id}
                        onClick={(e) => handleAddAction(action, e)}
                        disabled={isAdded || isAdding}
                        className={cn(
                          "flex items-center gap-3 w-full p-3 rounded-xl border transition-all",
                          isAdded 
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" 
                            : "bg-card border-border/50 hover:bg-muted/50 active:scale-[0.98]"
                        )}
                      >
                        <FluentEmoji emoji={action.emoji || '✨'} size={28} className="flex-shrink-0" />
                        <span className={cn(
                          "flex-1 text-left text-sm font-medium truncate",
                          isAdded ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"
                        )}>
                          {action.title}
                        </span>
                        <div className={cn(
                          "shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                          isAdded 
                            ? "bg-emerald-500 text-white" 
                            : "bg-muted text-muted-foreground"
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
              
              {/* Tap hint */}
              <div className="absolute bottom-3 inset-x-0 text-center">
                <span className="text-[10px] text-muted-foreground/50">
                  Tap to flip back
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
