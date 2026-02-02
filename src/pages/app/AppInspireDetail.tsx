import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useRoutineBankDetail, useAddRoutineFromBank, RoutineBankTask } from '@/hooks/useRoutinesBank';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TASK_COLORS, TaskColor } from '@/hooks/useTaskPlanner';
const colorGradients: Record<string, string> = {
  yellow: 'from-amber-400 to-amber-600',
  pink: 'from-pink-400 to-pink-600',
  purple: 'from-purple-400 to-purple-600',
  blue: 'from-blue-400 to-blue-600',
  green: 'from-emerald-400 to-emerald-600',
  orange: 'from-orange-400 to-orange-600',
  red: 'from-red-400 to-red-600',
  teal: 'from-teal-400 to-teal-600',
  indigo: 'from-indigo-400 to-indigo-600',
  rose: 'from-rose-400 to-rose-600',
  amber: 'from-amber-400 to-amber-600',
  mint: 'from-teal-300 to-teal-500',
};

// Helper to check if string is emoji
const isEmoji = (str: string) => 
  /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u.test(str);

// Convert RoutineBankTask to RoutinePlanTask format for preview sheet
function convertToRoutinePlanTask(task: RoutineBankTask): RoutinePlanTask {
  return {
    id: task.id,
    plan_id: task.routine_id,
    title: task.title,
    icon: task.emoji || '✨',
    color: task.color || undefined,
    task_order: task.task_order || 0,
    is_active: true,
    created_at: task.created_at || new Date().toISOString(),
    linked_playlist_id: task.linked_playlist_id || null,
    pro_link_type: task.pro_link_type as RoutinePlanTask['pro_link_type'] || null,
    pro_link_value: task.pro_link_value || null,
    // Include goal fields
    goal_enabled: task.goal_enabled ?? false,
    goal_target: task.goal_target ?? null,
    goal_type: task.goal_type ?? null,
    goal_unit: task.goal_unit ?? null,
    linked_playlist: null,
  };
}

export default function AppInspireDetail() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [showPreviewSheet, setShowPreviewSheet] = useState(false);
  
  const { data: routine, isLoading } = useRoutineBankDetail(planId);
  const addRoutineFromBank = useAddRoutineFromBank();

  const handleAddClick = () => {
    if (!routine?.tasks?.length) {
      toast.error('No tasks in this routine');
      return;
    }
    setShowPreviewSheet(true);
  };

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    if (!planId) return;
    
    try {
      await addRoutineFromBank.mutateAsync({ 
        routineId: planId, 
        selectedTaskIds, 
        editedTasks: editedTasks.map(t => ({
          ...t,
          pro_link_type: t.pro_link_type as string | null,
          pro_link_value: t.pro_link_value as string | null,
        })),
      });
      setShowPreviewSheet(false);
      toast.success(`${selectedTaskIds.length} tasks added!`);
      navigate('/app/home');
    } catch (error) {
      toast.error('Failed to add routine');
    }
  };

  const handleShare = async () => {
    if (!routine) return;
    
    try {
      await navigator.share({
        title: routine.title,
        text: routine.subtitle || routine.description || '',
        url: window.location.href,
      });
    } catch {
      // User cancelled or share not supported
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Routine not found</p>
        <Button variant="outline" onClick={() => navigate('/app/routines')}>
          Back to Routines
        </Button>
      </div>
    );
  }

  const color = routine.color || 'purple';
  const gradient = colorGradients[color] || colorGradients.purple;
  const routineIcon = routine.emoji && isEmoji(routine.emoji) ? routine.emoji : '✨';

  // Convert tasks for preview sheet
  const previewTasks = routine.tasks?.map(convertToRoutinePlanTask) || [];

  // Group tasks by section
  const tasksBySection: Record<string, RoutineBankTask[]> = {};
  routine.tasks?.forEach(task => {
    const sectionId = task.section_id || 'unsorted';
    if (!tasksBySection[sectionId]) {
      tasksBySection[sectionId] = [];
    }
    tasksBySection[sectionId].push(task);
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Fixed Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/app/routines');
            }
          }}
          className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white">
            <Heart className="w-5 h-5" />
          </button>
          <button 
            onClick={handleShare}
            className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Scroll Container */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        {/* Hero Image/Gradient */}
        <div className={cn(
          'relative w-full bg-gradient-to-br',
          gradient
        )} style={{ height: 'calc(224px + env(safe-area-inset-top, 0px))' }}>
          {routine.cover_image_url ? (
            <img
              src={routine.cover_image_url}
              alt={routine.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center pt-12">
              <span className="text-8xl opacity-30">{routineIcon}</span>
            </div>
          )}
        </div>

        <div className="px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 160px)' }}>
          {/* Title & Badges */}
          <div className="pt-4">
            <h1 className="text-2xl font-bold text-foreground">{routine.title}</h1>
            {routine.subtitle && (
              <p className="text-muted-foreground mt-1">{routine.subtitle}</p>
            )}
            
            <div className="flex items-center gap-3 mt-3">
              {routine.tasks && routine.tasks.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {routine.tasks.length} tasks
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {routine.description && (
            <div className="mt-6">
              <p className="text-muted-foreground leading-relaxed">{routine.description}</p>
            </div>
          )}

          {/* Tasks by Section */}
          {routine.sections && routine.sections.length > 0 ? (
            <div className="mt-6 space-y-6">
              {routine.sections.map((section) => {
                const sectionTasks = tasksBySection[section.id] || [];
                return (
                  <div key={section.id}>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {section.title}
                    </h3>
                    {section.content && (
                      <p className="text-sm text-muted-foreground mb-3">{section.content}</p>
                    )}
                    {section.image_url && (
                      <img
                        src={section.image_url}
                        alt={section.title}
                        className="w-full h-40 object-cover rounded-xl mb-3"
                      />
                    )}
                    {sectionTasks.length > 0 && (
                      <div className="space-y-3">
                        {sectionTasks.map((task) => {
                          const bgColor = TASK_COLORS[(task.color as TaskColor) || 'mint'] || TASK_COLORS.mint;
                          const repeatLabel = task.repeat_pattern && task.repeat_pattern !== 'none' 
                            ? task.repeat_pattern === 'daily' ? 'Daily' 
                              : task.repeat_pattern === 'weekly' ? 'Weekly' 
                              : task.repeat_pattern === 'monthly' ? 'Monthly'
                              : task.repeat_pattern === 'weekend' ? 'Weekends' : ''
                            : 'Once';
                          return (
                            <div
                              key={task.id}
                              className="rounded-xl border border-border/50 overflow-hidden"
                              style={{ backgroundColor: bgColor }}
                            >
                              <div className="flex items-center gap-3 p-3">
                                <span className="text-2xl shrink-0">
                                  {task.emoji && isEmoji(task.emoji) ? task.emoji : '📝'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-black truncate">{task.title}</p>
                                  <p className="text-xs text-black/70 truncate">
                                    {task.category || 'General'}
                                    <span className="ml-1">• {repeatLabel}</span>
                                  </p>
                                </div>
                              </div>
                              {task.description && (
                                <div className="mx-2 mb-2 p-2.5 bg-white/90 rounded-lg">
                                  <p className="text-xs text-black/80 leading-relaxed">
                                    {task.description}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : routine.tasks && routine.tasks.length > 0 ? (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">What's Included</h2>
              <div className="space-y-3">
                {routine.tasks.map((task) => {
                  const bgColor = TASK_COLORS[(task.color as TaskColor) || 'mint'] || TASK_COLORS.mint;
                  const repeatLabel = task.repeat_pattern && task.repeat_pattern !== 'none' 
                    ? task.repeat_pattern === 'daily' ? 'Daily' 
                      : task.repeat_pattern === 'weekly' ? 'Weekly' 
                      : task.repeat_pattern === 'monthly' ? 'Monthly'
                      : task.repeat_pattern === 'weekend' ? 'Weekends' : ''
                    : 'Once';
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-border/50 overflow-hidden"
                      style={{ backgroundColor: bgColor }}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <span className="text-2xl shrink-0">
                          {task.emoji && isEmoji(task.emoji) ? task.emoji : '📝'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-black truncate">{task.title}</p>
                          <p className="text-xs text-black/70 truncate">
                            {task.category || 'General'}
                            <span className="ml-1">• {repeatLabel}</span>
                          </p>
                        </div>
                      </div>
                      {task.description && (
                        <div className="mx-2 mb-2 p-2.5 bg-white/90 rounded-lg">
                          <p className="text-xs text-black/80 leading-relaxed">
                            {task.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Sticky Add Button */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
      >
        <Button
          onClick={handleAddClick}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          + Add to my routine
        </Button>
      </div>

      {/* Preview Sheet */}
      {previewTasks.length > 0 && (
        <RoutinePreviewSheet
          open={showPreviewSheet}
          onOpenChange={setShowPreviewSheet}
          tasks={previewTasks}
          routineTitle={routine.title}
          defaultTag={routine.category}
          onSave={handleSaveRoutine}
          isSaving={addRoutineFromBank.isPending}
        />
      )}
    </div>
  );
}
