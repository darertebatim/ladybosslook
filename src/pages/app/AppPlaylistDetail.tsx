import { useState, useEffect, useCallback, useRef } from "react";
import { HostBadges } from "@/components/app/HostBadges";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  CheckCircle2,
  Circle,
  Music,
  Clock,
  Lock,
  FileText,
  Video,
  ExternalLink,
  HelpCircle,
  Crown,
  Sparkles,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SupplementViewer } from "@/components/app/SupplementViewer";
import { BackButton } from "@/components/app/BackButton";
import { isNativeApp } from "@/lib/platform";
import { getTrackAvailabilityWithCountdown } from "@/lib/dripContent";
import { useEnrollments } from "@/hooks/useAppData";
import { useMediaCategories } from "@/hooks/useMediaCategories";
import {
  usePlaylistRoutine,
  useExistingPlaylistTask,
} from "@/hooks/usePlaylistRoutine";
import { useRoutinePlan, useAddRoutinePlan } from "@/hooks/useRoutinePlans";
import { useQuickAddPlaylistTask } from "@/hooks/useTaskPlanner";
import { RoutinePreviewSheet } from "@/components/app/RoutinePreviewSheet";
import { AddedToRoutineButton } from "@/components/app/AddedToRoutineButton";
import { PersianFlag } from "@/components/ui/PersianFlag";
import { useSubscription } from "@/hooks/useSubscription";
import { PaywallSheet } from "@/components/app/PaywallSheet";
import { PlusUpsellBanner } from "@/components/app/PlusUpsellBanner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Share2 } from "lucide-react";
import { useShareContent } from "@/hooks/useShareContent";
import { useTranslation } from "react-i18next";
function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_LENGTH = 120;
  const isLong = text.length > MAX_LENGTH;

  return (
    <p className="text-sm text-fg-warm-muted">
      {isLong && !expanded ? (
        <>
          {text.slice(0, MAX_LENGTH).trimEnd()}…{" "}
          <button
            onClick={() => setExpanded(true)}
            className="text-fg-warm font-medium"
          >
            more
          </button>
        </>
      ) : (
        <>
          {text}
          {isLong && (
            <>
              {" "}
              <button
                onClick={() => setExpanded(false)}
                className="text-fg-warm font-medium"
              >
                less
              </button>
            </>
          )}
        </>
      )}
    </p>
  );
}

export default function AppPlaylistDetail() {
  const { t } = useTranslation();
  const { playlistId } = useParams();
  const { user } = useAuth();
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
  const [showPaywall, setShowPaywall] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  }, []);

  // Routine-related hooks
  const { data: linkedRoutine } = usePlaylistRoutine(playlistId);
  const { data: fullRoutinePlan } = useRoutinePlan(linkedRoutine?.id);
  const { data: existingTask } = useExistingPlaylistTask(playlistId);
  const quickAddTask = useQuickAddPlaylistTask();
  const addRoutinePlan = useAddRoutinePlan();

  // Fetch playlist details
  const { data: playlist, isLoading: playlistLoading } = useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audio_playlists")
        .select("*")
        .eq("id", playlistId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { handleShare } = useShareContent({
    title: playlist?.name || "Playlist",
    text: `🎵 Check out the '${playlist?.name || "this"}' playlist on Routine Ladyboss 💫`,
    imageUrl: playlist?.cover_image_url,
    source: "audio_playlist",
    contentId: playlistId,
  });

  // Fetch tracks in playlist
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ["playlist-tracks", playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audio_playlist_items")
        .select(
          `
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
        `,
        )
        .eq("playlist_id", playlistId)
        .order("sort_order", { ascending: true });

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
    queryKey: ["playlist-progress", playlistId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const audioIds = tracks?.map((t) => t.audio_content.id) || [];
      if (audioIds.length === 0) return [];

      const { data, error } = await supabase
        .from("audio_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("audio_id", audioIds);

      if (error) throw error;
      return data;
    },
    enabled: !!tracks && tracks.length > 0,
  });

  // Fetch modules (supplements with drip)
  const { data: modules } = useQuery({
    queryKey: ["playlist-modules", playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playlist_supplements")
        .select(
          `
          *,
          audio_content (
            id,
            title,
            description,
            duration_seconds,
            cover_image_url
          )
        `,
        )
        .eq("playlist_id", playlistId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!playlistId,
  });

  // Fetch module progress
  const { data: moduleProgressData } = useQuery({
    queryKey: ["module-progress", playlistId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !modules || modules.length === 0) return [];

      const moduleIds = modules.map((m) => m.id);

      const { data, error } = await supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("supplement_id", moduleIds);

      if (error) throw error;
      return data || [];
    },
    enabled: !!modules && modules.length > 0,
  });

  // Mark module as viewed mutation
  const markModuleViewedMutation = useMutation({
    mutationFn: async (supplementId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("module_progress").upsert({
        user_id: user.id,
        supplement_id: supplementId,
        viewed: true,
        viewed_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["module-progress", playlistId],
      });
    },
  });

  // Use centralized enrollments hook - single source of truth
  const { data: enrollments } = useEnrollments();
  const { categories: audioCategories } = useMediaCategories("audio");

  // Check if user has activated this free playlist
  const { data: playlistSave, isLoading: saveLoading } = useQuery({
    queryKey: ["playlist-save", playlistId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("playlist_saves")
        .select("id")
        .eq("user_id", user.id)
        .eq("playlist_id", playlistId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!playlistId && !!user?.id,
  });

  // Mutation to activate free playlist
  const activatePlaylistMutation = useMutation({
    mutationFn: async () => {
      if (!user || !playlistId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("playlist_saves")
        .insert({ user_id: user.id, playlist_id: playlistId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["playlist-save", playlistId, user?.id],
      });
      toast.success(t('playlistDetailPage.accessGranted'));
    },
    onError: () => {
      toast.error(t('playlistDetailPage.somethingWrong'));
    },
  });

  // Fetch user's round for this playlist (to get first_session_date and drip_offset_days for drip content)
  const { data: userRound } = useQuery({
    queryKey: ["user-round-for-playlist", playlistId],
    queryFn: async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data, error } = await supabase
        .from("course_enrollments")
        .select(
          `
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
        `,
        )
        .eq("user_id", authUser.id)
        .eq("program_rounds.audio_playlist_id", playlistId)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      if (!data?.program_rounds) return null;
      return { ...data.program_rounds, enrolled_at: data.enrolled_at };
    },
    enabled: !!playlistId && !playlist?.is_free,
  });

  // Check if user came from planner (Pro Task navigation)
  const cameFromPlanner = (location.state as any)?.from === "planner";

  const { hasAccessToProgram } = useSubscription();

  const displayMode = (playlist as any)?.display_mode || "tracks";
  // Free playlists require activation (playlist_saves)
  // requires_subscription playlists require BOTH Simora Plus AND explicit
  // activation (playlist_saves) — so users opt-in per playlist and we only
  // PN those who actually follow it.
  // Regular paid playlists require enrollment
  const hasAccess = playlist?.is_free
    ? !!playlistSave
    : playlist?.requires_subscription
      ? hasAccessToProgram("simora-plus") && !!playlistSave
      : enrollments?.includes(playlist?.program_slug);

  const getTrackProgress = (audioId: string) => {
    const progress = progressData?.find((p) => p.audio_id === audioId);
    if (!progress) return { percentage: 0, completed: false };

    const track = tracks?.find((t) => t.audio_content.id === audioId);
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
      const audioProgress = progressData?.find((p) => p.audio_id === audioId);
      if (audioProgress) {
        return {
          viewed: audioProgress.completed || false,
          percentage:
            (audioProgress.current_position_seconds /
              (tracks?.find((t) => t.audio_content?.id === audioId)
                ?.audio_content?.duration_seconds || 1)) *
            100,
        };
      }
    }

    // For non-audio modules, check module_progress
    const progress = moduleProgressData?.find(
      (p) => p.supplement_id === moduleId,
    );
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

    const anchorDate = userRound?.is_self_paced
      ? userRound?.enrolled_at
      : userRound?.first_session_date || userRound?.start_date;
    return getTrackAvailabilityWithCountdown(
      dripDelayDays,
      anchorDate,
      userRound?.drip_offset_days || 0,
    );
  };

  // Calculate progress based on display mode
  const getOverallProgress = () => {
    if (displayMode === "modules" || displayMode === "both") {
      const totalModules = modules?.length || 0;
      if (totalModules === 0) return { completed: 0, total: 0, percentage: 0 };

      const completedModules =
        modules?.filter((m) => {
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

    const completedCount =
      tracks?.filter((t) => getTrackProgress(t.audio_content.id).completed)
        .length || 0;
    return {
      completed: completedCount,
      total: totalTracks,
      percentage: (completedCount / totalTracks) * 100,
    };
  };

  const {
    completed: completedCount,
    total: totalItems,
    percentage: overallProgress,
  } = getOverallProgress();

  // Find first incomplete item that is also available
  const getNextPlayableItem = () => {
    if (displayMode === "modules" || displayMode === "both") {
      return modules?.find((m) => {
        const { isAvailable } = getContentAvailability(m.drip_delay_days || 0);
        const progress = getModuleProgress(m.id, m.audio_id);
        return isAvailable && !progress.viewed;
      });
    }

    return tracks?.find((t) => {
      const { isAvailable } = getContentAvailability(t.drip_delay_days || 0);
      return isAvailable && !getTrackProgress(t.audio_content.id).completed;
    });
  };

  const handleContinue = () => {
    if (!hasAccess) return;

    if (displayMode === "modules" || displayMode === "both") {
      const nextModule = getNextPlayableItem();
      if (nextModule) {
        handleModuleClick(nextModule);
      } else if (modules && modules.length > 0) {
        // Play first available
        const firstAvailable = modules.find(
          (m) => getContentAvailability(m.drip_delay_days || 0).isAvailable,
        );
        if (firstAvailable) handleModuleClick(firstAvailable);
      }
    } else {
      const trackToPlay =
        getNextPlayableItem() ||
        tracks?.find(
          (t) => getContentAvailability(t.drip_delay_days || 0).isAvailable,
        );
      if (trackToPlay && "audio_content" in trackToPlay) {
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
  const fallbackRoutineTasks =
    playlist && !fullRoutinePlan?.tasks
      ? [
          {
            id: `playlist-${playlistId}`,
            plan_id: `synthetic-${playlistId}`,
            title: `Listen to ${playlist.name}`,
            icon: "🎧",
            duration_minutes: 15,
            task_order: 0,
            is_active: true,
            linked_playlist_id: playlistId,
            pro_link_type: "playlist" as "playlist",
            pro_link_value: playlistId,
            created_at: new Date().toISOString(),
          },
        ]
      : null;

  // Use linked routine tasks or fallback
  const routineTasks = fullRoutinePlan?.tasks || fallbackRoutineTasks;
  const routineTitle =
    fullRoutinePlan?.title || playlist?.name || "Playlist Routine";

  const handleSaveRoutine = async (
    selectedTaskIds: string[],
    editedTasks: Record<string, any>,
  ) => {
    if (!routineTasks || !playlist || !playlistId) return;

    // Transform edited tasks to the format expected by useAddRoutinePlan
    const transformedEditedTasks = Object.entries(editedTasks).map(
      ([id, edits]) => ({
        id,
        title: edits.title,
        icon: edits.emoji,
        color: edits.color,
        repeatPattern: edits.repeatPattern,
        scheduledTime: edits.scheduledTime,
        tag: edits.tag,
      }),
    );

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
      toast.success(t('playlistDetailPage.addedToRoutines'));
    } catch (error) {
      console.error("Failed to add routine:", error);
      toast.error(t('playlistDetailPage.failedAddRoutines'));
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
    const moduleIdx =
      index ?? modules?.findIndex((m) => m.id === module.id) ?? 0;
    setCurrentModuleIndex(moduleIdx);

    switch (module.type) {
      case "audio":
        if (module.audio_id && playlistId) {
          // Pass module context AND index so player can return to correct position
          navigate(
            `/app/player/${module.audio_id}?moduleMode=true&playlistId=${playlistId}&moduleIndex=${moduleIdx}`,
          );
        }
        break;
      case "video":
      case "pdf":
        // Don't auto-complete - user will click "Complete" button in viewer
        setSelectedSupplement({
          id: module.id,
          title: module.title,
          type: module.type,
          url: module.url,
          description: module.description || undefined,
        });
        break;
      case "link":
        // For links, mark as viewed when opened (can't track external completion)
        markModuleViewedMutation.mutate(module.id);
        window.open(module.url, "_blank", "noopener,noreferrer");
        break;
    }
  };

  // Handle return from audio player with completedIndex param
  useEffect(() => {
    const completedIndexParam = searchParams.get("completedIndex");
    if (completedIndexParam !== null && modules && modules.length > 0) {
      const completedIndex = parseInt(completedIndexParam, 10);
      const nextIndex = completedIndex + 1;

      // Clear the param immediately to prevent re-triggering
      navigate(location.pathname, { replace: true });

      if (nextIndex < modules.length) {
        const nextModule = modules[nextIndex];
        const availability = getContentAvailability(
          nextModule.drip_delay_days || 0,
        );

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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCategoryLabel = () => {
    const slug = playlist?.category;
    if (!slug) return "Audio";
    const found = (audioCategories as any[])?.find((c) => c.slug === slug);
    return found?.label || slug;
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "audio":
        return <Music className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "pdf":
        return <FileText className="h-5 w-5" />;
      case "link":
        return <ExternalLink className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (playlistLoading || tracksLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div
          className="fixed top-0 left-0 right-0 z-50"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="pt-3 pb-2 px-4">
            <Skeleton className="h-8 w-20 bg-foreground/10" />
          </div>
        </div>
        <div
          style={{ height: "calc(48px + env(safe-area-inset-top, 0px))" }}
          className="shrink-0"
        />
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 space-y-4 pb-safe">
            <Skeleton className="h-32 w-32 bg-foreground/10" />
            <Skeleton className="h-8 w-3/4 bg-foreground/10" />
            <Skeleton className="h-12 w-full bg-foreground/10" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full bg-foreground/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div
          className="fixed top-0 left-0 right-0 z-50"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="pt-1 pb-2 px-4 flex items-center gap-1">
            <BackButton
              to="/app/player"
              label="Library"
              className="text-fg-warm"
            />
          </div>
        </div>
        <div
          style={{ height: "calc(48px + env(safe-area-inset-top, 0px))" }}
          className="shrink-0"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-fg-warm-muted mb-4">{t('playlistDetailPage.notFound')}</p>
            <Button onClick={() => navigate("/app/player")}>
              Back to Library
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const showTracks = displayMode === "tracks" || displayMode === "both";
  const showModules = displayMode === "modules" || displayMode === "both";

  return (
    <>
      <div
        ref={heroRef}
        className="flex flex-col h-full overflow-hidden bg-background"
      >
        {/* Fixed Header */}
        <div
          className="fixed top-0 left-0 right-0 z-50 bg-background"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="pt-1 pb-2 px-4 flex items-center justify-between">
            <BackButton
              to={cameFromPlanner ? "/app/home" : "/app/player"}
              label={cameFromPlanner ? "Home" : "Library"}
              className="text-fg-warm"
            />
            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="h-9 w-9 flex items-center justify-center rounded-full active:scale-95 transition-transform"
                aria-label={t('playlistDetailPage.shareAria')}
              >
                <Share2 className="h-5 w-5 text-fg-warm-muted" />
              </button>
            </div>
          </div>
        </div>

        {/* Header spacer */}
        <div
          style={{ height: "calc(48px + env(safe-area-inset-top, 0px))" }}
          className="shrink-0"
        />

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain relative z-10"
          onScroll={handleScroll}
        >
          {/* Playlist Info */}
          <div className="p-4 space-y-4">
            {/* Pills row above cover + title */}
            <div className="flex gap-2 flex-wrap items-center">
                  {playlist.category && (
                    <Badge
                      variant="secondary"
                      className="bg-foreground/10 text-fg-warm border-0"
                    >
                      {getCategoryLabel()}
                    </Badge>
                  )}
                  {playlist.language === "persian" ? (
                    <Badge
                      variant="outline"
                      className="text-sm flex items-center gap-1 px-1.5 border-border text-fg-warm-muted"
                    >
                      <PersianFlag size={14} />
                      <span>Persian</span>
                    </Badge>
                  ) : (
                    playlist.language &&
                    (
                      {
                        american: "🇺🇸",
                        turkish: "🇹🇷",
                        spanish: "🇪🇸",
                        all: "🌐",
                      } as Record<string, string>
                    )[playlist.language] && (
                      <Badge
                        variant="outline"
                        className="text-sm border-border text-fg-warm-muted flex items-center gap-1"
                      >
                        <span>
                          {
                            (
                              {
                                american: "🇺🇸",
                                turkish: "🇹🇷",
                                spanish: "🇪🇸",
                                all: "🌐",
                              } as Record<string, string>
                            )[playlist.language]
                          }
                        </span>
                        <span>
                          {
                            (
                              {
                                american: "American",
                                turkish: "Türkçe",
                                spanish: "Español",
                                all: "All",
                              } as Record<string, string>
                            )[playlist.language]
                          }
                        </span>
                      </Badge>
                    )
                  )}
                  {playlist.is_free && !hasAccessToProgram("simora-plus") && (
                    <Badge className="bg-foreground/20 text-fg-warm">
                      FREE
                    </Badge>
                  )}
                  {playlist.requires_subscription && !hasAccess && (
                    <Badge className="bg-amber-200 text-amber-700 gap-1">
                      <Crown className="h-3 w-3" />
                      PLUS
                    </Badge>
                  )}
                  {!hasAccess &&
                    !playlist.is_free &&
                    !playlist.requires_subscription && (
                      <Badge variant="destructive">{t('playlistDetailPage.locked')}</Badge>
                    )}
            </div>

            <div className="flex gap-4">
              <div className="relative h-32 w-32 flex-shrink-0 rounded-lg overflow-hidden">
                {playlist.cover_image_url ? (
                  <img
                    src={playlist.cover_image_url}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
                    <Music className="h-12 w-12 text-fg-warm-muted" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <h1 className="text-2xl font-bold text-fg-warm">
                  {playlist.name}
                </h1>
                <HostBadges contentType="playlist" contentId={playlist.id} size="md" className="mt-2" />
                <PlaylistTagChips playlistId={playlist.id} />
                {playlist.description && (
                  <ExpandableDescription text={playlist.description} />
                )}
              </div>
            </div>

            {/* Progress */}
            {hasAccess && totalItems > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-fg-warm-muted">
                    {completedCount}/{totalItems}{" "}
                    {showModules ? "modules" : "tracks"} completed
                  </span>
                  <span className="font-medium text-fg-warm">
                    {Math.round(overallProgress)}%
                  </span>
                </div>
                <Progress
                  value={overallProgress}
                  className="h-2 bg-foreground/10"
                />
              </div>
            )}

            {/* Continue Button */}
            {hasAccess && totalItems > 0 && (
              <div className="flex items-center gap-2 w-full">
                <Button
                  onClick={handleContinue}
                  size="lg"
                  className="flex-1 tour-continue-btn bg-brand text-white active:bg-brand/90"
                >
                  <Play className="h-5 w-5 mr-1" />
                  {getNextPlayableItem() ? "Continue" : "Play"}
                </Button>
                <div className="tour-add-to-routine">
                  <AddedToRoutineButton
                    isAdded={!!existingTask}
                    onAddClick={handleAddToRoutine}
                    isLoading={quickAddTask.isPending}
                    iconOnly
                    className="h-12 w-12"
                  />
                </div>
              </div>
            )}

            {!hasAccess && playlist.is_free && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 bg-foreground/10 rounded-lg">
                  <Music className="h-5 w-5 text-sky-400" />
                  <p className="text-sm text-fg-warm">
                    This playlist is free! Tap below to start listening.
                  </p>
                </div>
                <Button
                  className="w-full bg-brand text-white active:bg-brand/90"
                  size="lg"
                  onClick={() => activatePlaylistMutation.mutate()}
                  disabled={activatePlaylistMutation.isPending}
                >
                  {activatePlaylistMutation.isPending
                    ? "Following..."
                    : "Follow Playlist"}
                </Button>
              </div>
            )}

            {!hasAccess &&
              !playlist.is_free &&
              playlist.requires_subscription && (
                hasAccessToProgram("simora-plus") ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-4 bg-foreground/10 rounded-lg">
                      <Crown className="h-5 w-5 text-amber-500" />
                      <p className="text-sm text-fg-warm">
                        Tap below to follow this playlist and get notified about new tracks.
                      </p>
                    </div>
                    <Button
                      className="w-full bg-brand text-white active:bg-brand/90"
                      size="lg"
                      onClick={() => activatePlaylistMutation.mutate()}
                      disabled={activatePlaylistMutation.isPending}
                    >
                      {activatePlaylistMutation.isPending
                        ? "Following..."
                        : "Follow Playlist"}
                    </Button>
                  </div>
                ) : (
                  <PlusUpsellBanner
                    title="Unlock this with Rilo Plus"
                    subtitle="Plus full audio library, AI Planner & all tools"
                  />
                )
              )}

            {!hasAccess &&
              !playlist.is_free &&
              !playlist.requires_subscription && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-4 bg-foreground/10 rounded-lg">
                    <Lock className="h-5 w-5 text-fg-warm-muted" />
                    <p className="text-sm text-fg-warm-muted">
                      Enroll to access this content
                    </p>
                  </div>
                  {playlist.program_slug && (
                    <Button
                      className="w-full bg-brand text-white active:bg-brand/90"
                      size="lg"
                      onClick={() =>
                        navigate(`/app/programs/${playlist.program_slug}`)
                      }
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
              <h2 className="text-lg font-semibold mb-3 text-fg-warm">
                Course Modules
              </h2>
              {modules.map((module, index) => {
                const { isAvailable, countdownText } = getContentAvailability(
                  module.drip_delay_days || 0,
                );
                const progress = getModuleProgress(module.id, module.audio_id);

                return (
                  <div
                    key={module.id}
                    onClick={() => handleModuleClick(module, index)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border border-border",
                      !isAvailable
                        ? "opacity-60 bg-foreground/5 cursor-not-allowed"
                        : "cursor-pointer active:bg-foreground/10",
                    )}
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0 w-8 text-center">
                      {!isAvailable ? (
                        <Lock className="h-5 w-5 text-fg-warm-muted mx-auto" />
                      ) : progress.viewed ? (
                        <CheckCircle2 className="h-5 w-5 text-sky-400 mx-auto" />
                      ) : (
                        <span className="text-sm text-fg-warm-muted">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Type icon */}
                    <div className="flex-shrink-0 text-fg-warm-muted">
                      {getModuleIcon(module.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate text-fg-warm">
                          {module.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className="flex-shrink-0 text-[10px] px-1.5 py-0 border-border text-fg-warm-muted"
                        >
                          {module.type.toUpperCase()}
                        </Badge>
                      </div>
                      {!isAvailable && countdownText ? (
                        <p className="text-xs text-fg-warm-muted">
                          {countdownText}
                        </p>
                      ) : module.description ? (
                        <p className="text-xs text-fg-warm-muted truncate">
                          {module.description}
                        </p>
                      ) : null}
                    </div>

                    {/* Duration for audio modules */}
                    {module.type === "audio" && module.audio_content && (
                      <div className="flex items-center gap-1 text-xs text-fg-warm-muted flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDuration(
                            module.audio_content.duration_seconds,
                          )}
                        </span>
                      </div>
                    )}

                    {isAvailable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 text-fg-warm-muted"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {showTracks && <Separator className="my-6 bg-foreground/10" />}
            </div>
          )}

          {/* Track List */}
          {showTracks && tracks && tracks.length > 0 && (
            <div className="px-4 pb-4 space-y-2 tour-track-list">
              <h2 className="tour-track-list-header text-lg font-semibold mb-3 text-fg-warm">
                Tracks
              </h2>
              {tracks.map((item, index) => {
                const track = item.audio_content;
                const progress = getTrackProgress(track.id);
                const { isAvailable, countdownText } = getContentAvailability(
                  item.drip_delay_days || 0,
                );

                return (
                  <div
                    key={item.id}
                    onClick={() =>
                      handleTrackClick(track.id, item.drip_delay_days || 0)
                    }
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border border-border",
                      !isAvailable
                        ? "opacity-60 bg-foreground/5 cursor-not-allowed"
                        : hasAccess
                          ? "cursor-pointer active:bg-foreground/10"
                          : "opacity-60",
                    )}
                  >
                    {/* Track number / status icon */}
                    <div className="flex-shrink-0 w-8 text-center">
                      {!isAvailable ? (
                        <Lock className="h-5 w-5 text-fg-warm-muted mx-auto" />
                      ) : progress.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-sky-400 mx-auto" />
                      ) : progress.percentage > 0 ? (
                        <div className="relative h-5 w-5 mx-auto">
                          <Circle className="h-5 w-5 text-fg-warm-muted" />
                          <div
                            className="absolute inset-0 rounded-full border-2 border-primary"
                            style={{
                              clipPath: `polygon(50% 50%, 50% 0%, ${progress.percentage > 50 ? "100%" : "50%"} 0%, ${progress.percentage > 50 ? "100%" : "50%"} ${progress.percentage > 50 ? "100%" : `${(progress.percentage / 50) * 100}%`}, ${progress.percentage > 50 ? `${100 - ((progress.percentage - 50) / 50) * 100}%` : "50%"} ${progress.percentage > 50 ? "100%" : "100%"}, 50% 100%)`,
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-fg-warm-muted">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate text-fg-warm">
                        {track.title}
                      </h3>
                      {!isAvailable && countdownText ? (
                        <p className="text-xs text-fg-warm-muted">
                          {countdownText}
                        </p>
                      ) : track.description ? (
                        <p className="text-xs text-fg-warm-muted truncate">
                          {track.description}
                        </p>
                      ) : null}
                      {isAvailable &&
                        progress.percentage > 0 &&
                        !progress.completed && (
                          <div className="mt-1">
                            <Progress
                              value={progress.percentage}
                              className="h-1 bg-foreground/10"
                            />
                          </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-fg-warm-muted flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(track.duration_seconds)}</span>
                    </div>

                    {isAvailable && hasAccess && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 text-fg-warm-muted"
                      >
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
            moduleContext={
              modules && modules.length > 0
                ? {
                    modules: modules.map((m) => ({
                      id: m.id,
                      title: m.title,
                      type: m.type,
                      url: m.url,
                      description: m.description || undefined,
                      audio_id: m.audio_id || undefined,
                      sort_order: m.sort_order,
                    })),
                    currentIndex: currentModuleIndex,
                    isCompleted: selectedSupplement
                      ? getModuleProgress(selectedSupplement.id, null).viewed
                      : false,
                    onComplete: (moduleId) => {
                      markModuleViewedMutation.mutate(moduleId);
                      // High-satisfaction moment → ask for a 5-star review (cooldown-protected)
                      import("@/lib/appReview").then(({ triggerSoftReview }) =>
                        setTimeout(
                          () => triggerSoftReview("module_complete"),
                          1200,
                        ),
                      );
                    },
                    onNavigate: (module, index) => {
                      // For audio modules, navigate to player
                      if (module.type === "audio" && module.audio_id) {
                        setSelectedSupplement(null);
                        navigate(
                          `/app/player/${module.audio_id}?moduleMode=true&playlistId=${playlistId}`,
                        );
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
                    getModuleCompleted: (moduleId) =>
                      getModuleProgress(moduleId, null).viewed,
                  }
                : undefined
            }
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

          {/* Bottom safe area padding */}
          <div className="pb-safe" />
        </div>
      </div>

      <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
    </>
  );
}
