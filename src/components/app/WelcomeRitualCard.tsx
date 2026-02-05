import { useState, useEffect } from 'react';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useRoutineBankDetail, useAddRoutineFromBank, RoutineBankTask } from '@/hooks/useRoutinesBank';
import { useTaskTemplates, TaskTemplate } from '@/hooks/useTaskPlanner';
import { toast } from 'sonner';

// The welcome ritual ID in the database
const WELCOME_RITUAL_ID = 'b8f4019f-dd9a-4c7d-a901-69b37cc78b7d';

interface WelcomeRitualCardProps {
  onActionAdded?: () => void;
}

export function WelcomeRitualCard({ onActionAdded }: WelcomeRitualCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [addedActions, setAddedActions] = useState<Set<string>>(new Set());
  const [addingAction, setAddingAction] = useState<string | null>(null);
  
  // Fetch welcome ritual details
  const { data: welcomeRitual, isLoading: ritualLoading } = useRoutineBankDetail(WELCOME_RITUAL_ID);
  const addRoutine = useAddRoutineFromBank();
  
  // Fallback: fetch popular templates if ritual has no tasks
  const { data: templates = [] } = useTaskTemplates();
  const popularTemplates = templates.filter(t => t.is_popular).slice(0, 6);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    localStorage.removeItem('simora_force_new_user');
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
      // Add the single task from the routine
      await addRoutine.mutateAsync({
        routineId: WELCOME_RITUAL_ID,
        selectedTaskIds: [actionId],
      });
      
      setAddedActions(prev => new Set([...prev, actionId]));
      haptic.success();
      onActionAdded?.();
      
      // If first action, maybe dismiss the card
      if (addedActions.size === 0) {
        toast.success('Added to your day! ✨');
      }
    } catch (error) {
      console.error('Failed to add action:', error);
      toast.error('Failed to add action');
    } finally {
      setAddingAction(null);
    }
  };

  if (dismissed) return null;

  // Get actions to display (from ritual tasks or fallback to popular templates)
  const actions = welcomeRitual?.tasks?.length ? welcomeRitual.tasks : [];
  const displayActions = actions.length > 0 ? actions : popularTemplates;

  return (
    <div 
      className="perspective-1000 w-full cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <div 
        className={cn(
          "relative w-full transition-transform duration-500 transform-style-preserve-3d",
          isFlipped && "rotate-y-180"
        )}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
        onClick={handleFlip}
      >
        {/* Front of card */}
        <div 
          className="relative w-full backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden shadow-xl">
            {/* Background Image */}
            {welcomeRitual?.cover_image_url ? (
              <img 
                src={welcomeRitual.cover_image_url} 
                alt="Welcome to Simora" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                <FluentEmoji emoji="✨" size={96} className="opacity-40" />
              </div>
            )}
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors z-10"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            
            {/* Content overlay */}
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h2 className="text-2xl font-bold text-white mb-1">
                Your day is open
              </h2>
              <p className="text-white/80 text-sm mb-4">
                Tap to pick your first actions ✨
              </p>
              
              <div className="bg-white/20 backdrop-blur-md rounded-full py-3 px-6 text-center">
                <span className="text-white font-semibold">
                  Pick my first actions
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Back of card */}
        <div 
          className="absolute inset-0 w-full backface-hidden rotate-y-180"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden shadow-xl bg-white dark:bg-zinc-900 border border-border">
            {/* Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Pick an action
                </h3>
                <button
                  onClick={handleDismiss}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                One is enough. Start small.
              </p>
            </div>
            
            {/* Actions list */}
            <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100%-80px)]">
              {ritualLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No actions available yet
                </div>
              ) : (
                displayActions.map((action) => {
                  const isAdded = addedActions.has(action.id);
                  const isAdding = addingAction === action.id;
                  const emoji = action.emoji || '✨';
                  const title = action.title;
                  
                  return (
                    <button
                      key={action.id}
                      onClick={(e) => handleAddAction(action, e)}
                      disabled={isAdded || isAdding}
                      className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-xl border transition-all",
                        isAdded 
                          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" 
                          : "bg-card border-border/50 hover:bg-muted/50 active:scale-[0.98]"
                      )}
                    >
                      <FluentEmoji emoji={emoji} size={28} className="flex-shrink-0" />
                      <span className={cn(
                        "flex-1 text-left text-[15px] truncate",
                        isAdded ? "text-green-700 dark:text-green-300" : "text-foreground"
                      )}>
                        {title}
                      </span>
                      <div className={cn(
                        "shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                        isAdded 
                          ? "bg-green-500 text-white" 
                          : "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400"
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
            <div className="absolute bottom-3 inset-x-0 text-center">
              <span className="text-xs text-muted-foreground/60">
                Tap to flip back
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
