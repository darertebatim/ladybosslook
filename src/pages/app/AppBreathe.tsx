import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Wind, BarChart3, Share2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { AppHeader, AppHeaderSpacer } from "@/components/app/AppHeader";
import {
  useBreathingExercises,
  BreathingExercise,
  BREATHING_CATEGORIES,
} from "@/hooks/useBreathingExercises";
import { BreathingExerciseCard } from "@/components/breathe/BreathingExerciseCard";
import { BreathingExerciseScreen } from "@/components/breathe/BreathingExerciseScreen";
import { Skeleton } from "@/components/ui/skeleton";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { AddedToRoutineButton } from "@/components/app/AddedToRoutineButton";
import { useExistingProTask } from "@/hooks/usePlaylistRoutine";
import { useRoutinePlan, useAddRoutinePlan } from "@/hooks/useRoutinePlans";
import {
  RoutinePreviewSheet,
  EditedTask,
} from "@/components/app/RoutinePreviewSheet";
import { RoutinePlanTask } from "@/hooks/useRoutinePlans";
import { toast } from "sonner";
import { useShareContent } from "@/hooks/useShareContent";
import { SlideUpPage } from "@/components/app/SlideUpPage";
import { useTranslation } from "react-i18next";

export default function AppBreathe() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { data: exercises, isLoading } = useBreathingExercises();

  const [selectedExercise, setSelectedExercise] =
    useState<BreathingExercise | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const { data: existingTask } = useExistingProTask("breathe", null, true);
  const addRoutinePlan = useAddRoutinePlan();
  const isAdded = !!(existingTask || justAdded);

  const { handleShare } = useShareContent({
    title: "Breathe on Rilo",
    text: `🌬️ My favorite calm-down tool — guided breathing exercises on Rilo.`,
    source: "breathe_tool",
  });

  const FALLBACK_BREATHING_TASKS: RoutinePlanTask[] = useMemo(
    () => [
      {
        id: "breathe-task-1",
        plan_id: "synthetic-breathe",
        title: "Morning Breathing Exercise",
        icon: "🌬️",
        task_order: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        linked_playlist_id: null,
        pro_link_type: "breathe",
        pro_link_value: null,
        tag: "pro",
      },
    ],
    [],
  );

  const handleSaveRoutine = async (
    selectedTaskIds: string[],
    editedTasks: EditedTask[],
  ) => {
    try {
      const editedTask = editedTasks[0];
      if (editedTask || selectedTaskIds.length > 0) {
        await addRoutinePlan.mutateAsync({
          planId: "synthetic-breathe",
          selectedTaskIds,
          editedTasks,
          syntheticTasks: FALLBACK_BREATHING_TASKS,
        });
      }
      toast.success("Breathing routine added to your planner!");
      setShowRoutineSheet(false);
      setJustAdded(true);
    } catch (error) {
      console.error("Failed to add routine:", error);
      toast.error("Failed to add routine");
    }
  };

  // Handle deep link to specific exercise from pro task
  const exerciseId = searchParams.get("exercise");

  useEffect(() => {
    if (exerciseId && exercises && exercises.length > 0) {
      const exercise = exercises.find((e) => e.id === exerciseId);
      if (exercise) {
        setSelectedExercise(exercise);
      }
    }
  }, [exerciseId, exercises]);

  // Filter to active exercises, then by category
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    const active = exercises.filter((e) => e.is_active);
    if (selectedCategory === "all") return active;
    return active.filter((e) => e.category === selectedCategory);
  }, [exercises, selectedCategory]);

  const handleCategoryClick = (value: string) => {
    setSelectedCategory(value);
    haptic.light();
  };

  const handleExerciseClick = (exercise: BreathingExercise) => {
    setSelectedExercise(exercise);
    haptic.light();
  };

  const handleCloseExercise = () => {
    setSelectedExercise(null);
  };

  // If an exercise is selected, show the unified exercise screen
  if (selectedExercise) {
    return (
      <BreathingExerciseScreen
        exercise={selectedExercise}
        onClose={handleCloseExercise}
      />
    );
  }

  // If deep-linking to a specific exercise but data hasn't loaded yet, show blank screen
  // to avoid flashing the exercise list
  if (exerciseId && (!exercises || exercises.length === 0)) {
    return <div className="min-h-0 bg-background" />;
  }

  return (
    <SlideUpPage defaultBack="/app/home">
      <SEOHead
        title="Breathe - LadyBoss"
        description="Breathing exercises for relaxation and focus"
      />

      <div className="min-h-0 bg-background">
        {/* Header */}
        <AppHeader
          title={t("tools.breathe.title")}
          showBack
          backTo="/app/home"
          rightAction={
            <div className="flex items-center gap-1">
              <AddedToRoutineButton
                isAdded={isAdded}
                onAddClick={() => setShowRoutineSheet(true)}
                isLoading={addRoutinePlan.isPending}
                iconOnly
              />
              <button
                onClick={() => navigate("/app/breathe/stats")}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              >
                <BarChart3 className="h-4 w-4 text-foreground" />
              </button>
              <button
                onClick={() => {
                  haptic.light();
                  handleShare();
                }}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                aria-label={t("breathePage.shareAria")}
              >
                <Share2 className="h-4 w-4 text-foreground" />
              </button>
            </div>
          }
        />
        <AppHeaderSpacer />

        {/* Category pills */}
        <div className="px-4 pt-2 pb-3">
          <div
            className="flex gap-2 overflow-x-auto no-scrollbar"
            style={{
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-x",
            }}
          >
            {BREATHING_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                  selectedCategory === cat.value
                    ? "bg-primary text-primary-foreground shadow-ios"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise list */}
        <div className="px-4 pb-safe">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Wind className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No exercises available yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredExercises.map((exercise, index) => (
                <BreathingExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onClick={() => handleExerciseClick(exercise)}
                  className={index === 0 ? "tour-exercise-card" : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Routine Preview Sheet */}
      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={FALLBACK_BREATHING_TASKS}
        routineTitle={t("breathePage.routineTitle")}
        onSave={handleSaveRoutine}
        isSaving={addRoutinePlan.isPending}
      />
    </SlideUpPage>
  );
}
