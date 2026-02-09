import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, CheckCircle2, Circle, Music, Clock, Lock, FileText, Video, ExternalLink, HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SupplementViewer } from "@/components/app/SupplementViewer";
import { BackButton } from "@/components/app/BackButton";
import { isNativeApp } from "@/lib/platform";
import { getTrackAvailabilityWithCountdown } from "@/lib/dripContent";
import { useEnrollments } from "@/hooks/useAppData";
import { usePlaylistRoutine, useExistingPlaylistTask } from "@/hooks/usePlaylistRoutine";
import { useRoutinePlan, useAddRoutinePlan } from "@/hooks/useRoutinePlans";
import { useQuickAddPlaylistTask } from "@/hooks/useTaskPlanner";
import { RoutinePreviewSheet } from "@/components/app/RoutinePreviewSheet";
import { AddedToRoutineButton } from "@/components/app/AddedToRoutineButton";
import { PlaylistTour } from "@/components/app/tour";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
export default function AppPlaylistDetail() {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedSupplement, setSelectedSupplement] = useState<{
    id: string;
    title: string;
    type: string;
    url: string;
    description?: string;
  } | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [startTour, setStartTour] = useState<(() => void) | null>(null);

  const handleTourReady = useCallback((tourStart: () => void) => {
    setStartTour(() => tourStart);
  }, []);

  // Routine-related hooks
  const { data: linkedRoutine } = usePlaylistRoutine(playlistId);
  const { data: fullRoutinePlan } = useRoutinePlan(linkedRoutine?.id);
  const { data: existingTask } = useExistingPlaylistTask(playlistId);
  const quickAddTask = useQuickAddPlaylistTask();
  const addRoutinePlan = useAddRoutinePlan();

  // Fetch playlist details
  const { data: playlist, isLoading: playlistLoading } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('*')
        .eq('id', playlistId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch tracks in playlist
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['playlist-tracks', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlist_items')
        .select(`
          id,
          sort_order,
          drip_delay_days,
          audio_id,
          audio_content (
            id,
            title,
            description,
            duration_seconds,
            cover_image_url
          )
        `)
        .eq('playlist_id', playlistId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      // Sort by sort_order, then by title as fallback
      const sorted = (data || []).sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        // If sort_order is the same, sort by title
        return a.audio_content.title.localeCompare(b.audio_content.title);
      });
      
      return sorted;
    },
    enabled: !!playlistId,
  });

  // Fetch user's progress
  const { data: progressData } = useQuery({
    queryKey: ['playlist-progress', playlistId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const audioIds = tracks?.map(t => t.audio_content.id) || [];
      if (audioIds.length === 0) return [];

      const { data, error } = await supabase
        .from('audio_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('audio_id', audioIds);
      
      if (error) throw error;
      return data;
    },
    enabled: !!tracks && tracks.length > 0,
  });

  // Fetch modules (supplements with drip)
  const { data: modules } = useQuery({
    queryKey: ['playlist-modules', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlist_supplements')
        .select(`
          *,
          audio_content (
            id,
            title,
            description,
            duration_seconds,
            cover_image_url
          )
        `)
        .eq('playlist_id', playlistId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!playlistId,
  });

  // Fetch module progress
  const { data: moduleProgressData } = useQuery({
    queryKey: ['module-progress', playlistId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !modules || modules.length === 0) return [];

      const moduleIds = modules.map(m => m.id);

      const { data, error } = await supabase
        .from('module_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('supplement_id', moduleIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!modules && modules.length > 0,
  });

  // Mark module as viewed mutation
  const markModuleViewedMutation = useMutation({
    mutationFn: async (supplementId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('module_progress')
        .upsert({
          user_id: user.id,
          supplement_id: supplementId,
          viewed: true,
          viewed_at: new Date().toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-progress', playlistId] });
    },
  });

  // Use centralized enrollments hook - single source of truth
  const { data: enrollments } = useEnrollments();

  // Fetch user's round for this playlist (to get first_session_date and drip_offset_days for drip content)
  const { data: userRound } = useQuery({
    queryKey: ['user-round-for-playlist', playlistId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Find the user's enrollment that has a round linked to this playlist
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          round_id,
          enrolled_at,
          program_rounds!inner (
            id,
            start_date,
            first_session_date,
            drip_offset_days,
            audio_playlist_id,
            is_self_paced
          )
        `)
        .eq('user_id', user.id)
        .eq('program_rounds.audio_playlist_id', playlistId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      if (!data?.program_rounds) return null;
      return { ...data.program_rounds, enrolled_at: data.enrolled_at };
    },
    enabled: !!playlistId && !playlist?.is_free,
  });

  // Check if user came from planner (Pro Task navigation)
  const cameFromPlanner = (location.state as any)?.from === 'planner';

  const displayMode = (playlist as any)?.display_mode || 'tracks';
  const hasAccess = playlist?.is_free || enrollments?.includes(playlist?.program_slug);

  const getTrackProgress = (audioId: string) => {
    const progress = progressData?.find(p => p.audio_id === audioId);
    if (!progress) return { percentage: 0, completed: false };
    
    const track = tracks?.find(t => t.audio_content.id === audioId);
    const duration = track?.audio_content.duration_seconds || 1;
    const percentage = (progress.current_position_seconds / duration) * 100;
    
    return {
      percentage: Math.min(percentage, 100),
      completed: progress.completed || percentage >= 95,
    };
  };

  const getModuleProgress = (moduleId: string, audioId?: string | null) => {
    // For audio modules, check audio_progress
    if (audioId) {
      const audioProgress = progressData?.find(p => p.audio_id === audioId);
      if (audioProgress) {
        return {
          viewed: audioProgress.completed || false,
          percentage: audioProgress.current_position_seconds / 
            (tracks?.find(t => t.audio_content?.id === audioId)?.audio_content?.duration_seconds || 1) * 100,
        };
      }
    }
    
    // For non-audio modules, check module_progress
    const progress = moduleProgressData?.find(p => p.supplement_id === moduleId);
    return {
      viewed: progress?.viewed || false,
      percentage: progress?.viewed ? 100 : 0,
    };
  };

  // Check if content is available based on drip delay
  // Uses first_session_date for timing (drip_delay_days=0 = immediate, 1 = at first session, etc.)
  const getContentAvailability = (dripDelayDays: number) => {
    // Free playlists = all content available
    if (playlist?.is_free) {
      return { isAvailable: true, availableDate: null, countdownText: null };
    }
    
    return getTrackAvailabilityWithCountdown(
      dripDelayDays, 
      userRound?.first_session_date || userRound?.start_date, // Prefer first_session_date, fallback to start_date
      userRound?.drip_offset_days || 0
    );
  };

  // Calculate progress based on display mode
  const getOverallProgress = () => {
    if (displayMode === 'modules' || displayMode === 'both') {
      const totalModules = modules?.length || 0;
      if (totalModules === 0) return { completed: 0, total: 0, percentage: 0 };
      
      const completedModules = modules?.filter(m => {
        const progress = getModuleProgress(m.id, m.audio_id);
        return progress.viewed;
      }).length || 0;
      
      return {
        completed: completedModules,
        total: totalModules,
        percentage: (completedModules / totalModules) * 100,
      };
    }
    
    // Traditional tracks mode
    const totalTracks = tracks?.length || 0;
    if (totalTracks === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completedCount = tracks?.filter(t => getTrackProgress(t.audio_content.id).completed).length || 0;
    return {
      completed: completedCount,
      total: totalTracks,
      percentage: (completedCount / totalTracks) * 100,
    };
  };

  const { completed: completedCount, total: totalItems, percentage: overallProgress } = getOverallProgress();

  // Find first incomplete item that is also available
  const getNextPlayableItem = () => {
    if (displayMode === 'modules' || displayMode === 'both') {
      return modules?.find(m => {
        const { isAvailable } = getContentAvailability(m.drip_delay_days || 0);
        const progress = getModuleProgress(m.id, m.audio_id);
        return isAvailable && !progress.viewed;
      });
    }
    
    return tracks?.find(t => {
      const { isAvailable } = getContentAvailability(t.drip_delay_days || 0);
      return isAvailable && !getTrackProgress(t.audio_content.id).completed;
    });
  };

  const handleContinue = () => {
    if (!hasAccess) return;
    
    if (displayMode === 'modules' || displayMode === 'both') {
      const nextModule = getNextPlayableItem();
      if (nextModule) {
        handleModuleClick(nextModule);
      } else if (modules && modules.length > 0) {
        // Play first available
        const firstAvailable = modules.find(m => getContentAvailability(m.drip_delay_days || 0).isAvailable);
        if (firstAvailable) handleModuleClick(firstAvailable);
      }
    } else {
      const trackToPlay = getNextPlayableItem() || tracks?.find(t => getContentAvailability(t.drip_delay_days || 0).isAvailable);
      if (trackToPlay && 'audio_content' in trackToPlay) {
        navigate(`/app/player/${trackToPlay.audio_content.id}`);
      }
    }
  };

  const handleAddToRoutine = () => {
    if (!playlist || !playlistId) return;
    // Always show the routine sheet for editing before saving
    setShowRoutineSheet(true);
  };

  // Create fallback task for playlists without a linked Pro Routine
  const fallbackRoutineTasks = playlist && !fullRoutinePlan?.tasks ? [{
    id: `playlist-${playlistId}`,
    plan_id: `synthetic-${playlistId}`,
    title: `Listen to ${playlist.name}`,
    icon: '🎧',
    duration_minutes: 15,
    task_order: 0,
    is_active: true,
    linked_playlist_id: playlistId,
    pro_link_type: 'playlist' as 'playlist',
    pro_link_value: playlistId,
    created_at: new Date().toISOString(),
  }] : null;

  // Use linked routine tasks or fallback
  const routineTasks = fullRoutinePlan?.tasks || fallbackRoutineTasks;
  const routineTitle = fullRoutinePlan?.title || playlist?.name || 'Playlist Routine';

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: Record<string, any>) => {
    if (!routineTasks || !playlist || !playlistId) return;
    
    // Transform edited tasks to the format expected by useAddRoutinePlan
    const transformedEditedTasks = Object.entries(editedTasks).map(([id, edits]) => ({
      id,
      title: edits.title,
      icon: edits.emoji,
      color: edits.color,
      repeatPattern: edits.repeatPattern,
      scheduledTime: edits.scheduledTime,
      tag: edits.tag,
    }));

    try {
      if (fullRoutinePlan?.id) {
        // Has a linked Pro Routine - use the normal flow
        await addRoutinePlan.mutateAsync({
          planId: fullRoutinePlan.id,
          selectedTaskIds,
          editedTasks: transformedEditedTasks,
        });
      } else {
        // No linked routine - use quick add with edits
        const editedTask = transformedEditedTasks[0];
        await quickAddTask.mutateAsync({ 
          playlistId, 
          playlistName: editedTask?.title || playlist.name,
          scheduledTime: editedTask?.scheduledTime,
          repeatPattern: editedTask?.repeatPattern,
          color: editedTask?.color,
          icon: editedTask?.icon,
        });
      }
      setShowRoutineSheet(false);
      toast.success('Added to your rituals!');
    } catch (error) {
      console.error('Failed to add ritual:', error);
      toast.error('Failed to add to rituals');
    }
  };

  const handleTrackClick = (audioId: string, dripDelayDays: number) => {
    if (!hasAccess) return;
    const { isAvailable } = getContentAvailability(dripDelayDays);
    if (!isAvailable) return;
    navigate(`/app/player/${audioId}`);
  };

  const handleModuleClick = (module: any, index?: number) => {
    if (!hasAccess) return;
    const { isAvailable } = getContentAvailability(module.drip_delay_days || 0);
    if (!isAvailable) return;

    // Track which module is currently open
    const moduleIdx = index ?? modules?.findIndex(m => m.id === module.id) ?? 0;
    setCurrentModuleIndex(moduleIdx);

    switch (module.type) {
      case 'audio':
        if (module.audio_id && playlistId) {
          // Pass module context AND index so player can return to correct position
          navigate(`/app/player/${module.audio_id}?moduleMode=true&playlistId=${playlistId}&moduleIndex=${moduleIdx}`);
        }
        break;
      case 'video':
      case 'pdf':
        // Don't auto-complete - user will click "Complete" button in viewer
        setSelectedSupplement({
          id: module.id,
          title: module.title,
          type: module.type,
          url: module.url,
          description: module.description || undefined,
        });
        break;
      case 'link':
        // For links, mark as viewed when opened (can't track external completion)
        markModuleViewedMutation.mutate(module.id);
        window.open(module.url, '_blank', 'noopener,noreferrer');
        break;
    }
  };

  // Handle return from audio player with completedIndex param
  useEffect(() => {
    const completedIndexParam = searchParams.get('completedIndex');
    if (completedIndexParam !== null && modules && modules.length > 0) {
      const completedIndex = parseInt(completedIndexParam, 10);
      const nextIndex = completedIndex + 1;
      
      // Clear the param immediately to prevent re-triggering
      navigate(location.pathname, { replace: true });
      
      if (nextIndex < modules.length) {
        const nextModule = modules[nextIndex];
        const availability = getContentAvailability(nextModule.drip_delay_days || 0);
        
        if (availability.isAvailable) {
          // Small delay to allow UI to settle before opening next module
          setTimeout(() => {
            handleModuleClick(nextModule, nextIndex);
          }, 300);
        }
      }
    }
  }, [searchParams, modules]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryLabel = () => {
    switch (playlist?.category) {
      case 'podcast': return 'Podcast';
      case 'course_supplement': return 'Course';
      case 'audiobook': return 'Audiobook';
      case 'meditate': return 'Meditate';
      case 'workout': return 'Workout';
      case 'soundscape': return 'Soundscape';
      case 'affirmation': return 'Affirmation';
      default: return 'Audio';
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Music className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'pdf': return <FileText className="h-5 w-5" />;
      case 'link': return <ExternalLink className="h-5 w-5" />;
      default: return null;
    }
  };

  if (playlistLoading || tracksLoading) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Fixed Header */}
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE]/80 dark:bg-violet-950/80 backdrop-blur-lg rounded-b-3xl shadow-sm"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="pt-3 pb-2 px-4">
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        
        {/* Header spacer */}
        <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />
        
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 space-y-4 pb-safe">
            <Skeleton className="h-32 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-12 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE]/80 dark:bg-violet-950/80 backdrop-blur-lg rounded-b-3xl shadow-sm"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="pt-1 pb-2 px-4 flex items-center gap-1">
            <BackButton to="/app/player" label="Library" />
          </div>
        </div>
        <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Playlist not found</p>
            <Button onClick={() => navigate('/app/player')}>Back to Library</Button>
          </div>
        </div>
      </div>
    );
  }

  const showTracks = displayMode === 'tracks' || displayMode === 'both';
  const showModules = displayMode === 'modules' || displayMode === 'both';

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Fixed Header with safe area + visual padding */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE]/80 dark:bg-violet-950/80 backdrop-blur-lg rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pt-1 pb-2 px-4 flex items-center justify-between">
          <BackButton to={cameFromPlanner ? '/app/home' : '/app/player'} label={cameFromPlanner ? 'Home' : 'Library'} />
          {startTour && (
            <button
              onClick={startTour}
              className="h-9 w-9 flex items-center justify-center rounded-full"
              aria-label="Start page tour"
            >
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Header spacer */}
      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Playlist Info */}
        <div className="p-4 space-y-4">
        <div className="flex gap-4">
          <div className="relative h-32 w-32 flex-shrink-0 rounded-lg overflow-hidden">
            {playlist.cover_image_url ? (
              <img 
                src={playlist.cover_image_url} 
                alt={playlist.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Music className="h-12 w-12 text-primary/40" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex gap-2 flex-wrap">
              {playlist.category && (
                <Badge variant="secondary">{getCategoryLabel()}</Badge>
              )}
              {playlist.is_free && <Badge className="bg-green-500">FREE</Badge>}
              {!hasAccess && <Badge variant="destructive">Locked</Badge>}
            </div>
            <h1 className="text-2xl font-bold">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-sm text-muted-foreground">{playlist.description}</p>
            )}
          </div>
        </div>

        {/* Progress */}
        {hasAccess && totalItems > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedCount}/{totalItems} {showModules ? 'modules' : 'tracks'} completed
              </span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        )}

        {/* Continue Button */}
        {hasAccess && totalItems > 0 && (
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleContinue} size="lg" className="w-full tour-continue-btn">
              <Play className="h-5 w-5 mr-1" />
              {getNextPlayableItem() ? 'Continue' : 'Play'}
            </Button>
            <div className="tour-add-to-routine">
              <AddedToRoutineButton
                isAdded={!!existingTask}
                onAddClick={handleAddToRoutine}
                isLoading={quickAddTask.isPending}
                size="lg"
                variant="outline"
              />
            </div>
          </div>
        )}

        {!hasAccess && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Enroll to access this content
              </p>
            </div>
            {playlist.program_slug && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => navigate(`/app/course/${playlist.program_slug}`)}
              >
                View Course Details
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Course Modules */}
      {hasAccess && showModules && modules && modules.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          <h2 className="text-lg font-semibold mb-3">Course Modules</h2>
          {modules.map((module, index) => {
            const { isAvailable, countdownText } = getContentAvailability(module.drip_delay_days || 0);
            const progress = getModuleProgress(module.id, module.audio_id);
            
            return (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module, index)}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  !isAvailable 
                    ? 'opacity-60 bg-muted/30 cursor-not-allowed' 
                    : 'cursor-pointer hover:bg-accent'
                }`}
              >
                {/* Status icon */}
                <div className="flex-shrink-0 w-8 text-center">
                  {!isAvailable ? (
                    <Lock className="h-5 w-5 text-muted-foreground mx-auto" />
                  ) : progress.viewed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                    <span className="text-sm text-muted-foreground">{index + 1}</span>
                  )}
                </div>

                {/* Type icon */}
                <div className="flex-shrink-0 text-muted-foreground">
                  {getModuleIcon(module.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">{module.title}</h3>
                    <Badge variant="outline" className="flex-shrink-0 text-[10px] px-1.5 py-0">
                      {module.type.toUpperCase()}
                    </Badge>
                  </div>
                  {!isAvailable && countdownText ? (
                    <p className="text-xs text-muted-foreground">
                      {countdownText}
                    </p>
                  ) : module.description ? (
                    <p className="text-xs text-muted-foreground truncate">{module.description}</p>
                  ) : null}
                </div>

                {/* Duration for audio modules */}
                {module.type === 'audio' && module.audio_content && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(module.audio_content.duration_seconds)}</span>
                  </div>
                )}

                {isAvailable && (
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <Play className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
          {showTracks && <Separator className="my-6" />}
        </div>
      )}

      {/* Track List */}
      {showTracks && tracks && tracks.length > 0 && (
        <div className="px-4 pb-4 space-y-2 tour-track-list">
          <h2 className="tour-track-list-header text-lg font-semibold mb-3">Tracks</h2>
          {tracks.map((item, index) => {
            const track = item.audio_content;
            const progress = getTrackProgress(track.id);
            const { isAvailable, countdownText } = getContentAvailability(item.drip_delay_days || 0);
            
            return (
              <div
                key={item.id}
                onClick={() => handleTrackClick(track.id, item.drip_delay_days || 0)}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  !isAvailable 
                    ? 'opacity-60 bg-muted/30 cursor-not-allowed' 
                    : hasAccess 
                      ? 'cursor-pointer hover:bg-accent' 
                      : 'opacity-60'
                }`}
              >
                {/* Track number / status icon */}
                <div className="flex-shrink-0 w-8 text-center">
                  {!isAvailable ? (
                    <Lock className="h-5 w-5 text-muted-foreground mx-auto" />
                  ) : progress.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                  ) : progress.percentage > 0 ? (
                    <div className="relative h-5 w-5 mx-auto">
                      <Circle className="h-5 w-5 text-muted-foreground" />
                      <div 
                        className="absolute inset-0 rounded-full border-2 border-primary"
                        style={{
                          clipPath: `polygon(50% 50%, 50% 0%, ${progress.percentage > 50 ? '100%' : '50%'} 0%, ${progress.percentage > 50 ? '100%' : '50%'} ${progress.percentage > 50 ? '100%' : `${(progress.percentage / 50) * 100}%`}, ${progress.percentage > 50 ? `${100 - ((progress.percentage - 50) / 50) * 100}%` : '50%'} ${progress.percentage > 50 ? '100%' : '100%'}, 50% 100%)`
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{track.title}</h3>
                  {!isAvailable && countdownText ? (
                    <p className="text-xs text-muted-foreground">
                      {countdownText}
                    </p>
                  ) : track.description ? (
                    <p className="text-xs text-muted-foreground truncate">{track.description}</p>
                  ) : null}
                  {isAvailable && progress.percentage > 0 && !progress.completed && (
                    <div className="mt-1">
                      <Progress value={progress.percentage} className="h-1" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(track.duration_seconds)}</span>
                </div>

                {isAvailable && hasAccess && (
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <Play className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

        <SupplementViewer
          isOpen={!!selectedSupplement}
          onClose={() => setSelectedSupplement(null)}
          supplement={selectedSupplement}
          moduleContext={modules && modules.length > 0 ? {
            modules: modules.map(m => ({
              id: m.id,
              title: m.title,
              type: m.type,
              url: m.url,
              description: m.description || undefined,
              audio_id: m.audio_id || undefined,
              sort_order: m.sort_order,
            })),
            currentIndex: currentModuleIndex,
            isCompleted: selectedSupplement ? getModuleProgress(selectedSupplement.id, null).viewed : false,
            onComplete: (moduleId) => {
              markModuleViewedMutation.mutate(moduleId);
            },
            onNavigate: (module, index) => {
              // For audio modules, navigate to player
              if (module.type === 'audio' && module.audio_id) {
                setSelectedSupplement(null);
                navigate(`/app/player/${module.audio_id}?moduleMode=true&playlistId=${playlistId}`);
                return;
              }
              // For other modules, update the supplement viewer
              setCurrentModuleIndex(index);
              setSelectedSupplement({
                id: module.id,
                title: module.title,
                type: module.type,
                url: module.url,
                description: module.description,
              });
            },
            getModuleCompleted: (moduleId) => getModuleProgress(moduleId, null).viewed,
          } : undefined}
        />

        {/* Routine Preview Sheet - works with linked Pro Routine or fallback task */}
        {routineTasks && routineTasks.length > 0 && (
          <RoutinePreviewSheet
            open={showRoutineSheet}
            onOpenChange={setShowRoutineSheet}
            tasks={routineTasks}
            routineTitle={routineTitle}
            onSave={handleSaveRoutine}
            isSaving={addRoutinePlan.isPending || quickAddTask.isPending}
          />
        )}

        {/* Playlist Tour */}
        <PlaylistTour isFirstVisit={true} onTourReady={handleTourReady} />
        
        {/* Bottom safe area padding */}
        <div className="pb-safe" />
      </div>
    </div>
  );
}