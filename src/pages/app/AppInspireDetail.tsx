import { useState, useMemo, useCallback } from 'react';
import { AddToRoutineHandHint, useAddToRoutineHint } from '@/components/app/AddToRoutineHandHint';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ChallengeRoutineCard } from '@/components/app/ChallengeRoutineCard';
import { HostBadges } from '@/components/app/HostBadges';
import { useUserChallenges } from '@/hooks/useUserChallenges';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Share2, Instagram, Play, Heart, CalendarPlus, Sparkles } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { BackButtonCircle } from '@/components/app/BackButton';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { useRoutineBankDetail, useAddRoutineFromBank, RoutineBankTask, useUserAddedBankRoutines, useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { toast } from 'sonner';
import { useShareContent } from '@/hooks/useShareContent';
import { cn } from '@/lib/utils';
import { TASK_COLORS, TaskColor } from '@/hooks/useTaskPlanner';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { haptic } from '@/lib/haptics';
import { useRoutineFavorites, useToggleRoutineFavorite } from '@/hooks/useRoutineFavorites';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/useSubscription';

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
function convertToRoutinePlanTask(task: RoutineBankTask): RoutinePlanTask & { schedule_days?: number[] | null; drip_day?: number | null; monthly_day?: number | null; repeat_pattern?: string | null; repeat_days?: number[] | null } {
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
    monthly_day: task.monthly_day,
    repeat_pattern: (task as any).is_once ? 'none' : (task.monthly_day != null ? 'monthly' : (task.repeat_pattern || 'daily')),
    repeat_days: task.repeat_days || null,
  };
}

export default function AppInspireDetail() {
  const { t } = useTranslation();
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPreviewSheet, setShowPreviewSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { showHint, dismissHint } = useAddToRoutineHint();
  
  const { data: routine, isLoading } = useRoutineBankDetail(planId);
  const { data: addedRoutineIds = [] } = useUserAddedBankRoutines();
  const addRoutineFromBank = useAddRoutineFromBank();
  const { data: userChallenges = [] } = useUserChallenges();
  const { data: categories = [] } = useRoutineBankCategories();
  const { startRoutine } = useRoutinePlayerContext();
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const { favoriteIds } = useRoutineFavorites();
  const toggleFavorite = useToggleRoutineFavorite();
  const isFavorited = planId ? favoriteIds.includes(planId) : false;
  
  // Check if routine was already added
  const isAlreadyAdded = planId ? addedRoutineIds.includes(planId) : false;
  const isAdded = isAlreadyAdded || justAdded;
  
  const isDrip = (routine as any)?.schedule_type === 'drip';
  const isProject = (routine as any)?.schedule_type === 'project';
  const isProgram = (routine as any)?.schedule_type === 'program';
  const isFocus = (routine as any)?.is_focus === true;
  const isMoment = (routine as any)?.is_moment === true;
  const userChallenge = useMemo(() => {
    if (!planId || !isChallenge) return null;
    return userChallenges.find(c => c.routineId === planId) || null;
  }, [planId, isChallenge, userChallenges]);

  // Compute effective start date label + details
  const startInfo = useMemo(() => {
    if (!routine) return { label: t('inspirePage.startsToday'), emoji: '🚀', isFuture: false };
    const WEEKDAY_NAMES = [
      t('common.sunday', { defaultValue: 'Sunday' }),
      t('common.monday', { defaultValue: 'Monday' }),
      t('common.tuesday', { defaultValue: 'Tuesday' }),
      t('common.wednesday', { defaultValue: 'Wednesday' }),
      t('common.thursday', { defaultValue: 'Thursday' }),
      t('common.friday', { defaultValue: 'Friday' }),
      t('common.saturday', { defaultValue: 'Saturday' }),
    ];
    const startDate = (routine as any).challenge_start_date;
    const startDow = (routine as any).start_day_of_week as number | null;
    
    if (startDate) {
      const d = new Date(startDate + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d <= today) return { label: t('inspirePage.readyToStart'), emoji: '🚀', isFuture: false };
      const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        label: t(diffDays === 1 ? 'inspirePage.startsOn' : 'inspirePage.startsOnPlural', { date: format(d, 'MMM d'), days: diffDays }),
        emoji: '📅', 
        isFuture: true 
      };
    }
    if (startDow != null) {
      return { label: t('inspirePage.startsNext', { day: WEEKDAY_NAMES[startDow] }), emoji: '📅', isFuture: true };
    }
    return { label: t('inspirePage.readyToStart'), emoji: '🚀', isFuture: false };
  }, [routine, t]);

  // Compute end date info
  const endInfo = useMemo(() => {
    if (!routine) return null;
    const endMode = (routine as any).end_mode as string | null;
    const endDate = (routine as any).end_date as string | null;
    const endAfterDays = (routine as any).end_after_days as number | null;

    if (endMode === 'date' && endDate) {
      const d = new Date(endDate + 'T00:00:00');
      return { label: t('inspirePage.endsOn', { date: format(d, 'MMM d') }), emoji: '🏁' };
    }
    if (endMode === 'after_days' && endAfterDays) {
      return { label: t(endAfterDays === 1 ? 'inspirePage.endsAfter' : 'inspirePage.endsAfterPlural', { count: endAfterDays }), emoji: '🏁' };
    }
    return null;
  }, [routine, t]);

  const { handleShare, handleShareInstagram } = useShareContent({
    title: routine?.title || t('inspirePage.shareTitleFallback'),
    text: t('inspirePage.shareText', { title: routine?.title || t('inspirePage.shareTitleFallback') }),
    imageUrl: routine?.cover_image_url,
    source: 'inspire_routine',
    contentId: routine?.id,
  });

  const handleAddClick = () => {
    if (!routine?.tasks?.length) {
      toast.error(t('inspirePage.noTasks'));
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
      if (isProject) {
        toast.success(t('inspirePage.stepUnlock'), { duration: 5000 });
      } else {
        toast.success(t('inspirePage.tasksAdded', { count: selectedTaskIds.length }));
      }
    } catch (error) {
      toast.error(t('inspirePage.addFailed'));
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
        <p className="text-muted-foreground">{t('inspirePage.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/app/routines')}>
          {t('inspirePage.backToRoutines')}
        </Button>
      </div>
    );
  }

  const color = routine.color || 'purple';
  const gradient = colorGradients[color] || colorGradients.purple;
  const routineIcon = routine.emoji && isEmoji(routine.emoji) ? routine.emoji : '✨';
  const isPlusRoutine = (routine as any).is_free === false;

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
      {/* Fixed Header - Back button + Share */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <BackButtonCircle to={(location.state as any)?.from || '/app/routines'} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!planId) return;
              haptic.light();
              toggleFavorite.mutate({ routineId: planId, isFavorited });
            }}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label={isFavorited ? t('inspirePage.removeFromFavorites') : t('inspirePage.addToFavorites')}
          >
            <Heart className={cn("h-5 w-5 transition-colors", isFavorited && "fill-red-500 text-red-500")} />
          </button>
          <button
            onClick={handleShareInstagram}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label={t('inspirePage.shareToInstagram')}
          >
            <Instagram className="h-5 w-5" />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label={t('inspirePage.share')}
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
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
                className={cn(
                  "w-full h-full object-cover",
                  routine.cover_aspect === '6x4' && "object-bottom"
                )}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <FluentEmoji emoji={routineIcon} size={110} className="opacity-60" />
              </div>
            )}
            {/* Title overlay layer */}
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-16 pb-4 px-4" />
            {/* Title text */}
            <div className="absolute inset-x-0 bottom-0 z-30 pt-16 pb-4 px-4">
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
                    title={t('inspirePage.videoTitle')}
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* Intro Audio */}
        {(routine as any).audio_url && (
          <div className="px-4 pt-4">
            <audio
              src={(routine as any).audio_url}
              controls
              preload="metadata"
              className="w-full"
            />
          </div>
        )}

        <div className="px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 160px)' }}>



          {/* Subtitle & Badges */}
          <div className="pt-4">
            {routine.subtitle && (
              <p className="text-foreground">{routine.subtitle}</p>
            )}
            <HostBadges contentType="routine" contentId={routine.id} size="md" className="mt-3" />
            
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {isFocus && (
                 <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                   {t('inspirePage.focusBadge')}
                </span>
              )}
              {isProject && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {t('inspirePage.projectBadge')}
                </span>
              )}
              {isChallenge && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                  {t('inspirePage.challengeBadge')}
                </span>
              )}
              {isProgram && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                  {t('inspirePage.programBadge')}
                </span>
              )}
              {isMoment && (
                 <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                   {t('inspirePage.resetBadge')}
                </span>
              )}
              {routine.category && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                  {categories.find(c => c.slug === routine.category)?.name || routine.category}
                </span>
              )}
              {routine.tasks && routine.tasks.length > 0 && (
               <span className="text-sm text-foreground">
                   {routine.tasks.length} {isProject ? t(routine.tasks.length === 1 ? 'inspirePage.step' : 'inspirePage.steps') : t(routine.tasks.length === 1 ? 'inspirePage.task' : 'inspirePage.tasks')}
                </span>
              )}
            </div>

            {/* Program enrollment banner */}
            {isProgram && (routine as any).linkedProgram && (
              <div className="mt-4 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border bg-[#FFF492]/40 border-[#E8D86A] dark:bg-yellow-950/30 dark:border-yellow-800">
                <span className="text-lg">🎓</span>
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  {t('inspirePage.enrollsIn', { title: (routine as any).linkedProgram.title })}
                </span>
              </div>
            )}

            {/* Start/End + Badge row */}
            <div className={cn("mt-4 flex gap-3", (routine as any).badge_image_url ? "" : "")}>
              {/* Left: Start & End banners */}
              <div className={cn("flex flex-row gap-2", (routine as any).badge_image_url ? "flex-1" : "w-full")}>
                <div className={cn(
                  'flex-1 min-w-0 flex items-center gap-2 rounded-xl px-3 py-2.5 border',
                  startInfo.isFuture 
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                    : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                )}>
                  <span className="text-sm shrink-0">{startInfo.emoji}</span>
                  <span className={cn(
                    'text-xs font-medium truncate',
                    startInfo.isFuture 
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-emerald-800 dark:text-emerald-300'
                  )}>
                    {startInfo.label}
                  </span>
                </div>

                {endInfo && (
                  <div className="flex-1 min-w-0 flex items-center gap-2 rounded-xl px-3 py-2.5 border bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800">
                    <span className="text-sm shrink-0">{endInfo.emoji}</span>
                    <span className="text-xs font-medium text-rose-800 dark:text-rose-300 truncate">
                      {endInfo.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Badge preview */}
              {(routine as any).badge_image_url && (
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="w-[72px] h-[72px] rounded-xl overflow-hidden border-2 border-amber-300 bg-amber-50 shadow-md">
                    <img 
                      src={(routine as any).badge_image_url} 
                      alt={t('inspirePage.challengeBadgeAlt')} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] text-amber-600 font-semibold mt-1">{t('inspirePage.badge', { defaultValue: 'Badge' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description — rendered as rich HTML */}
          {routine.description && (
            <div
              className="mt-5 text-foreground leading-relaxed prose prose-base max-w-none
                prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                prose-strong:text-foreground prose-a:text-primary
                prose-ul:pl-5 prose-ul:list-disc prose-ol:pl-5 prose-ol:list-decimal
                prose-li:my-1 prose-p:my-2"
              dangerouslySetInnerHTML={{ __html: routine.description }}
            />
          )}

          {/* Challenge progress card - shown when user has added this challenge */}
          {isAdded && userChallenge && (
            <div className="mt-5">
              <ChallengeRoutineCard challenge={userChallenge} />
            </div>
          )}

          {/* Tasks display */}
          {isProject ? (
            /* Project: show tasks as sequential steps */
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">{t('inspirePage.steps')}</h3>
              {(() => {
                const allTasks = routine.tasks || [];
                // Group by drip_day (step number)
                const stepGroups = new Map<number, RoutineBankTask[]>();
                allTasks.forEach((task, idx) => {
                  const step = (task as any).drip_day ?? (idx + 1);
                  if (!stepGroups.has(step)) stepGroups.set(step, []);
                  stepGroups.get(step)!.push(task);
                });
                const sortedSteps = Array.from(stepGroups.keys()).sort((a, b) => a - b);
                return sortedSteps.map(step => (
                  <div key={step}>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">
                      {t('inspirePage.stepLabel', { n: step })}
                    </p>
                    <div className="space-y-3">
                      {stepGroups.get(step)!.map((task) => {
                        const bgColor = TASK_COLORS[(task.color as TaskColor) || 'mint'] || TASK_COLORS.mint;
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
                                  {task.category || t('inspirePage.general')} • {t('inspirePage.oneTimeStep')}
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
                ));
              })()}
            </div>
          ) : routine.sections && routine.sections.length > 0 ? (
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
                          const repeatLabel = (() => {
                            if (!task.repeat_pattern || task.repeat_pattern === 'none') return t('inspirePage.repeat_once');
                            if (task.repeat_pattern === 'weekly') return t('inspirePage.repeat_weekly');
                            if (task.repeat_pattern === 'monthly') return t('inspirePage.repeat_monthly');
                            if (task.repeat_pattern === 'weekend') return t('inspirePage.repeat_weekend');
                            // schedule_days present → weekly
                            if (task.schedule_days && task.schedule_days.length > 0) return t('inspirePage.repeat_weekly');
                            if (task.repeat_pattern === 'daily') return t('inspirePage.repeat_daily');
                            return t('inspirePage.repeat_once');
                          })();
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
                                    {task.category || t('inspirePage.general')}
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('inspirePage.tasksHeader')}</h3>
                  <div className="space-y-3">
                    {tasksBySection['unsorted'].map((task) => {
                      const bgColor = TASK_COLORS[(task.color as TaskColor) || 'mint'] || TASK_COLORS.mint;
                      const repeatLabel = (() => {
                        if (!task.repeat_pattern || task.repeat_pattern === 'none') return t('inspirePage.repeat_once');
                        if (task.repeat_pattern === 'weekly') return t('inspirePage.repeat_weekly');
                        if (task.repeat_pattern === 'monthly') return t('inspirePage.repeat_monthly');
                        if (task.repeat_pattern === 'weekend') return t('inspirePage.repeat_weekend');
                        if (task.schedule_days && task.schedule_days.length > 0) return t('inspirePage.repeat_weekly');
                        if (task.repeat_pattern === 'daily') return t('inspirePage.repeat_daily');
                        return t('inspirePage.repeat_once');
                      })();
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
                                {task.category || t('inspirePage.general')}
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
          ) : null}
        </div>
      </div>

      {/* Animated hand hint for new users — outside footer so fixed positioning works */}
      <AddToRoutineHandHint show={showHint && !isAdded} />

      {/* Sticky Footer: Play button (for focus routines already added), Moment play-once, OR Add button */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 104px)' }}
      >
        {isMoment && routine?.tasks?.length ? (
          <div className="flex gap-3">
            <Button
              onClick={() => {
                haptic.medium();
                const bankTasks = routine.tasks || [];
                startRoutine({
                  routineId: planId || `moment-${routine.title}`,
                  routineTitle: routine.title,
                  routineEmoji: routine.emoji || '✨',
                  tasks: bankTasks.map((t: RoutineBankTask) => ({
                    id: t.id,
                    title: t.title,
                    emoji: t.emoji || '📝',
                    targetSeconds: t.duration_minutes ? t.duration_minutes * 60 : 60,
                    color: t.color || undefined,
                    proLinkType: t.pro_link_type || undefined,
                    proLinkValue: t.pro_link_value || undefined,
                    hasTimerGoal: true,
                    isEstimate: !t.duration_minutes,
                  })),
                });
              }}
              className="flex-1 h-12 rounded-xl text-base font-semibold gap-2"
            >
              <Play className="w-5 h-5" />
              {t('inspirePage.reset')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                dismissHint();
                handleAddClick();
              }}
              className="h-12 w-12 rounded-xl p-0 shrink-0 bg-orange-500 hover:bg-orange-600 text-white border-0"
            >
              <CalendarPlus className="w-5 h-5" />
            </Button>
          </div>
        ) : isFocus && isAdded && routine?.tasks?.length ? (
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                haptic.medium();
                if (!user) return;
                // Fetch user's OWN tasks by source_routine_id
                const { data: userTasks } = await supabase
                  .from('user_tasks')
                  .select('id, title, emoji, color, goal_target, goal_type, duration_minutes, order_index')
                  .eq('user_id', user.id)
                  .eq('source_routine_id', planId!)
                  .eq('is_active', true)
                  .order('order_index', { ascending: true });

                if (!userTasks || userTasks.length === 0) {
                  toast.error(t('inspirePage.noTasksFound'));
                  return;
                }

                // Fetch smart estimates
                const { fetchSmartEstimates } = await import('@/lib/smartEstimate');
                const estimateInputs = userTasks.map((t: any) => ({
                  taskTitle: t.title,
                  durationMinutes: t.duration_minutes ?? null,
                  goalType: t.goal_type || null,
                  goalTarget: t.goal_target || null,
                }));
                const estimates = await fetchSmartEstimates(user.id, estimateInputs);

                startRoutine({
                  routineId: planId!,
                  routineTitle: routine.title,
                  routineEmoji: routine.emoji || '✨',
                  tasks: userTasks.map((t: any) => {
                    const durationSeconds = t.duration_minutes ? t.duration_minutes * 60 : null;
                    const estimate = estimates.get(t.title);
                    return {
                      id: t.id,
                      title: t.title,
                      emoji: t.emoji || '📝',
                      targetSeconds: durationSeconds || estimate || 60,
                      color: t.color || undefined,
                      userTaskId: t.id,
                      hasTimerGoal: true,
                      isEstimate: !durationSeconds,
                    };
                  }),
                });
              }}
              className="flex-1 h-12 rounded-xl text-base font-semibold gap-2"
            >
              <Play className="w-5 h-5" />
              {t('inspirePage.startRoutine')}
            </Button>
          </div>
        ) : (
          <div className="relative">
            <AddedToRoutineButton
              isAdded={isAdded}
              onAddClick={() => {
                dismissHint();
                handleAddClick();
              }}
              isLoading={addRoutineFromBank.isPending}
              size="lg"
              addText={t('inspirePage.addToMyRoutines')}
              className="!bg-brand-primary hover:!bg-brand-primary/90 !text-white !border-0"
            />
            {isPlusRoutine && !isSubscribed && !isAdded && (
              <div className="pointer-events-none absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 shadow-ios">
                <Sparkles className="w-3 h-3 text-white" strokeWidth={2.5} />
                <span className="text-[11px] font-bold text-white tracking-wide">PLUS</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Sheet */}
      {previewTasks.length > 0 && (
        <RoutinePreviewSheet
          open={showPreviewSheet}
          onOpenChange={setShowPreviewSheet}
          tasks={previewTasks}
          routineTitle={routine.title}
          routineColor={(routine as any).color || null}
          defaultTag={routine.category}
          scheduleType={(routine as any).schedule_type || 'daily'}
          challengeStartDate={(routine as any).challenge_start_date || null}
          startDayOfWeek={(routine as any).start_day_of_week ?? null}
          endMode={(routine as any).end_mode || null}
          endDate={(routine as any).end_date || null}
          endAfterDays={(routine as any).end_after_days || null}
          badgeImageUrl={(routine as any).badge_image_url || null}
          onSave={handleSaveRoutine}
          isSaving={addRoutineFromBank.isPending}
          isFree={(routine as any).is_free ?? false}
          isPro={isPlusRoutine}
          routineBankId={planId || null}
          linkedProgramTitle={(routine as any).linkedProgram?.title || null}
          linkedProgramSlug={(routine as any).linked_program_slug || null}
        />
      )}
    </div>
  );
}
