import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { BackButtonCircle } from '@/components/app/BackButton';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { useRoutineBankDetail, useAddRoutineFromBank, RoutineBankTask, useUserAddedBankRoutines } from '@/hooks/useRoutinesBank';
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

// Convert a video URL to an embeddable format
const getEmbedUrl = (url: string): { type: 'embed' | 'mp4'; src: string } | null => {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return { type: 'embed', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: 'embed', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  // Direct MP4
  if (url.match(/\.(mp4|webm|mov)(\?|$)/i)) return { type: 'mp4', src: url };
  // Fallback: try as embed
  return { type: 'embed', src: url };
};

// Convert RoutineBankTask to RoutinePlanTask format for preview sheet
function convertToRoutinePlanTask(task: RoutineBankTask): RoutinePlanTask & { schedule_days?: number[] | null; drip_day?: number | null; repeat_pattern?: string | null; repeat_days?: number[] | null } {
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
    // Pass through schedule fields and per-task repeat settings
    schedule_days: task.schedule_days,
    drip_day: task.drip_day,
    repeat_pattern: task.repeat_pattern || 'daily',
    repeat_days: task.repeat_days || null,
  };
}

export default function AppInspireDetail() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [showPreviewSheet, setShowPreviewSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  const { data: routine, isLoading } = useRoutineBankDetail(planId);
  const { data: addedRoutineIds = [] } = useUserAddedBankRoutines();
  const addRoutineFromBank = useAddRoutineFromBank();
  
  // Check if routine was already added
  const isAlreadyAdded = planId ? addedRoutineIds.includes(planId) : false;
  const isAdded = isAlreadyAdded || justAdded;

  // Compute effective start date label + details
  const startInfo = useMemo(() => {
    if (!routine) return { label: 'Starts today', emoji: '🚀', isFuture: false };
    const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const startDate = (routine as any).challenge_start_date;
    const startDow = (routine as any).start_day_of_week as number | null;
    
    if (startDate) {
      const d = new Date(startDate + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d <= today) return { label: 'Ready to start today!', emoji: '🚀', isFuture: false };
      const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        label: `Starts ${format(d, 'MMM d')} · in ${diffDays} day${diffDays !== 1 ? 's' : ''}`, 
        emoji: '📅', 
        isFuture: true 
      };
    }
    if (startDow != null) {
      return { label: `Starts next ${WEEKDAY_NAMES[startDow]}`, emoji: '📅', isFuture: true };
    }
    return { label: 'Ready to start today!', emoji: '🚀', isFuture: false };
  }, [routine]);

  // Compute end date info
  const endInfo = useMemo(() => {
    if (!routine) return null;
    const endMode = (routine as any).end_mode as string | null;
    const endDate = (routine as any).end_date as string | null;
    const endAfterDays = (routine as any).end_after_days as number | null;

    if (endMode === 'date' && endDate) {
      const d = new Date(endDate + 'T00:00:00');
      return { label: `Ends ${format(d, 'MMM d')}`, emoji: '🏁' };
    }
    if (endMode === 'after_days' && endAfterDays) {
      return { label: `Ends after ${endAfterDays} day${endAfterDays !== 1 ? 's' : ''}`, emoji: '🏁' };
    }
    return null;
  }, [routine]);

  const handleAddClick = () => {
    if (!routine?.tasks?.length) {
      toast.error('No actions in this ritual');
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
      setJustAdded(true);
      toast.success(`${selectedTaskIds.length} actions added!`);
    } catch (error) {
      toast.error('Failed to add ritual');
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
        <p className="text-muted-foreground">Ritual not found</p>
        <Button variant="outline" onClick={() => navigate('/app/rituals')}>
          Back to Rituals
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
      {/* Fixed Header - Back button only */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 flex items-center px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <BackButtonCircle to="/app/rituals" />
      </header>

      {/* Scroll Container */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        {/* Hero Image - Square with title overlay */}
        <div 
          className="relative w-full"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className={cn(
            'relative w-full aspect-square bg-gradient-to-br overflow-hidden',
            gradient
          )}>
            {routine.cover_image_url ? (
              <img
                src={routine.cover_image_url}
                alt={routine.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl opacity-30">{routineIcon}</span>
              </div>
            )}
            {/* Title overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-16 pb-4 px-4">
              <h1 className="text-2xl font-bold text-white leading-tight drop-shadow-lg">
                {routine.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Video Player */}
        {(routine as any).video_url && (() => {
          const video = getEmbedUrl((routine as any).video_url);
          if (!video) return null;
          return (
            <div className="px-4 pt-4">
              {video.type === 'mp4' ? (
                <video
                  src={video.src}
                  controls
                  playsInline
                  className="w-full rounded-xl"
                  style={{ maxHeight: '240px' }}
                />
              ) : (
                <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={video.src}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Ritual video"
                  />
                </div>
              )}
            </div>
          );
        })()}

        <div className="px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 160px)' }}>
          {/* Subtitle & Badges */}
          <div className="pt-4">
            {routine.subtitle && (
              <p className="text-foreground">{routine.subtitle}</p>
            )}
            
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {routine.category && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                  {routine.category}
                </span>
              )}
              {routine.tasks && routine.tasks.length > 0 && (
                <span className="text-sm text-foreground">
                  {routine.tasks.length} action{routine.tasks.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Start date banner */}
            <div className={cn(
              'mt-4 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border',
              startInfo.isFuture 
                ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
            )}>
              <span className="text-lg">{startInfo.emoji}</span>
              <span className={cn(
                'text-sm font-medium',
                startInfo.isFuture 
                  ? 'text-amber-800 dark:text-amber-300'
                  : 'text-emerald-800 dark:text-emerald-300'
              )}>
                {startInfo.label}
              </span>
            </div>

            {/* End date banner */}
            {endInfo && (
              <div className="mt-2 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800">
                <span className="text-lg">{endInfo.emoji}</span>
                <span className="text-sm font-medium text-rose-800 dark:text-rose-300">
                  {endInfo.label}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {routine.description && (
            <div className="mt-5">
              <p className="text-foreground leading-relaxed">{routine.description}</p>
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
                      <p className="text-sm text-foreground mb-3">{section.content}</p>
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
              {/* Unsectioned tasks */}
              {(tasksBySection['unsorted']?.length ?? 0) > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Actions</h3>
                  <div className="space-y-3">
                    {tasksBySection['unsorted'].map((task) => {
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
              )}
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
        <AddedToRoutineButton
          isAdded={isAdded}
          onAddClick={handleAddClick}
          isLoading={addRoutineFromBank.isPending}
          size="lg"
          addText="Add to my rituals"
        />
      </div>

      {/* Preview Sheet */}
      {previewTasks.length > 0 && (
        <RoutinePreviewSheet
          open={showPreviewSheet}
          onOpenChange={setShowPreviewSheet}
          tasks={previewTasks}
          routineTitle={routine.title}
          defaultTag={routine.category}
          scheduleType={(routine as any).schedule_type || 'daily'}
          challengeStartDate={(routine as any).challenge_start_date || null}
          startDayOfWeek={(routine as any).start_day_of_week ?? null}
          endMode={(routine as any).end_mode || null}
          endDate={(routine as any).end_date || null}
          endAfterDays={(routine as any).end_after_days || null}
          onSave={handleSaveRoutine}
          isSaving={addRoutineFromBank.isPending}
        />
      )}
    </div>
  );
}
