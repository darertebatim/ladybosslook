import { memo, useEffect, useState } from "react";
import { format } from "date-fns";
import { OverlayPortal } from "@/components/app/OverlayPortal";
import { StreakCelebration } from "@/components/app/StreakCelebration";
import { StreakGoalSelection } from "@/components/app/StreakGoalSelection";
import { StreakGoalSelectionAdvanced } from "@/components/app/StreakGoalSelectionAdvanced";
import { StreakGoalCompletionCelebration } from "@/components/app/StreakGoalCompletionCelebration";
import { StreakGoalConfirmation } from "@/components/app/StreakGoalConfirmation";
import { StreakRecoveryPrompt } from "@/components/app/StreakRecoveryPrompt";
import { BadgeCelebration } from "@/components/app/BadgeCelebration";
import { GoldStreakCelebration } from "@/components/app/GoldStreakCelebration";
import { ChallengeDayCelebration } from "@/components/app/ChallengeDayCelebration";
import { RoutineEndedCelebration } from "@/components/app/RoutineEndedCelebration";
import type { RoutineEndedData } from "@/hooks/useRoutineEndedCelebration";
import { TaskSkipSheet } from "@/components/app/TaskSkipSheet";
import { StepCompletionCelebration } from "@/components/app/StepCompletionCelebration";
import { ProjectCompletionCelebration } from "@/components/app/ProjectCompletionCelebration";
import { GoalInputSheet } from "@/components/app/GoalInputSheet";
import { TaskTimerScreen } from "@/components/app/TaskTimerScreen";
import { PaywallSheet } from "@/components/app/PaywallSheet";
import { ActionLimitSheet } from "@/components/app/ActionLimitSheet";
import { TaskQuickStartSheet } from "@/components/app/TaskQuickStartSheet";
import { TaskDetailModal } from "@/components/app/TaskDetailModal";
import { PushNotificationOnboarding } from "@/components/app/PushNotificationOnboarding";
import { RecoverySuccessBanner } from "@/components/app/RecoverySuccessBanner";
import { ShieldEarnedDetector } from "@/components/app/ShieldEarnedDetector";
import { ReturningUserPushSheet } from "@/components/app/ReturningUserPushSheet";
import { TaskCompletionPushNudge } from "@/components/app/TaskCompletionPushNudge";
import { usePushPermission } from "@/hooks/usePushPermission";
import { useSubscription } from "@/hooks/useSubscription";
import { useAppReview } from "@/hooks/useAppReview";
import { SoftReviewPrompt } from "@/components/app/SoftReviewPrompt";
import { SOFT_REVIEW_EVENT } from "@/lib/appReview";
import { Capacitor } from "@capacitor/core";
import type { UserTask, TaskTemplate } from "@/hooks/useTaskPlanner";
import type { BadgeLevel } from "@/hooks/useWeeklyTaskCompletion";

interface HomeCelebrationsProps {
  // Paywall
  showPaywall: boolean;
  setShowPaywall: (v: boolean) => void;
  showActionLimit: boolean;
  setShowActionLimit: (v: boolean) => void;

  // Quick start
  showQuickStart: boolean;
  setShowQuickStart: (v: boolean) => void;
  onQuickStartContinue: (name: string, template?: TaskTemplate) => void;

  // Task detail
  selectedTask: UserTask | null;
  setSelectedTask: (t: UserTask | null) => void;
  selectedDate: Date;
  completedTaskIds: Set<string>;
  completedSubtaskIds: string[];
  goalProgressMap: Map<string, number>;
  onEditTask: (t: UserTask) => void;
  onDeleteTask: (t: UserTask) => void;
  onSkipTask: (t: UserTask) => void;
  onOpenGoalInput: (t: UserTask) => void;
  onOpenTimer: (t: UserTask) => void;
  onStepUnlocked: (
    result: import("@/hooks/useProjectStepUnlock").StepUnlockResult,
  ) => void;

  // Streak
  showStreakModal: boolean;
  setShowStreakModal: (v: boolean) => void;
  isFirstActionCelebration: boolean;
  setIsFirstActionCelebration: (v: boolean) => void;
  streak: any;
  shouldShowGoalSelection: boolean;

  // Streak goal
  showGoalSelection: boolean;
  setShowGoalSelection: (v: boolean) => void;
  isStreakUpgrade: boolean;
  setIsStreakUpgrade: (v: boolean) => void;
  showGoalConfirmation: boolean;
  setShowGoalConfirmation: (v: boolean) => void;
  confirmedGoal: number;
  setConfirmedGoal: (v: number) => void;
  setStreakGoal: any;

  // Badge
  badgeCelebrationType: any;
  closeBadgeCelebration: () => void;
  badgeCompletedCount: number;
  badgeTotalCount: number;
  maybeRequestReview: (trigger?: string) => void;

  // Gold streak
  showGoldStreakCelebration: boolean;
  setShowGoldStreakCelebration: (v: boolean) => void;
  goldStreakData: any;
  goldDatesThisWeek: Date[];
  updateGoldStreak: any;

  // Streak goal completion
  showStreakGoalCompletion: boolean;
  setShowStreakGoalCompletion: (v: boolean) => void;

  // Skip task
  skipTask: UserTask | null;
  setSkipTask: (t: UserTask | null) => void;

  // Goal input
  goalInputTask: UserTask | null;
  setGoalInputTask: (t: UserTask | null) => void;
  onGoalInputConfirm: (amount: number) => void;

  // Timer
  timerTask: UserTask | null;
  setTimerTask: (t: UserTask | null) => void;
  onTimerSaveProgress: (seconds: number) => void;
  onTimerMarkComplete: () => void;

  // Recovery
  showRecoveryPrompt: boolean;
  setShowRecoveryPrompt: (v: boolean) => void;
  recoverStreak: any;

  // Recovery success
  showRecoverySuccess: "streak" | null;
  setShowRecoverySuccess: (v: "streak" | null) => void;

  // Notification
  userId?: string;
  showNotificationFlow: boolean;
  setShowNotificationFlow: (v: boolean) => void;

  // Challenge day celebration
  challengeDayCelebration: {
    challengeTitle: string;
    challengeEmoji: string;
    currentDay: number;
    totalDays: number;
    routineId: string;
    badgeImageUrl: string | null;
  } | null;
  closeChallengeDayCelebration: () => void;
  showChallengeDayCelebration: boolean;

  // Routine ended (re-add prompt)
  routineEndedData?: RoutineEndedData | null;
  showRoutineEnded?: boolean;
  closeRoutineEnded?: () => void;
  onAddRoutineAgain?: () => void | Promise<void>;
  isAddingRoutineAgain?: boolean;

  // Step completion
  stepCelebration: { completedStep: number; newTaskCount: number } | null;
  onCloseStepCelebration: () => void;

  // Project completion
  projectCompletion: {
    routineId: string;
    routineTitle: string;
    routineEmoji: string;
    totalSteps: number;
    totalTasks: number;
    badgeImageUrl: string | null;
  } | null;
  onCloseProjectCompletion: () => void;
}

export const HomeCelebrations = memo(function HomeCelebrations(
  props: HomeCelebrationsProps,
) {
  const {
    showPaywall,
    setShowPaywall,
    showActionLimit,
    setShowActionLimit,
    showQuickStart,
    setShowQuickStart,
    onQuickStartContinue,
    selectedTask,
    setSelectedTask,
    selectedDate,
    completedTaskIds,
    completedSubtaskIds,
    goalProgressMap,
    onEditTask,
    onDeleteTask,
    onSkipTask,
    onOpenGoalInput,
    onOpenTimer,
    onStepUnlocked,
    showStreakModal,
    setShowStreakModal,
    isFirstActionCelebration,
    setIsFirstActionCelebration,
    streak,
    shouldShowGoalSelection,
    showGoalSelection,
    setShowGoalSelection,
    isStreakUpgrade,
    setIsStreakUpgrade,
    showGoalConfirmation,
    setShowGoalConfirmation,
    confirmedGoal,
    setConfirmedGoal,
    setStreakGoal,
    badgeCelebrationType,
    closeBadgeCelebration,
    badgeCompletedCount,
    badgeTotalCount,
    maybeRequestReview,
    showGoldStreakCelebration,
    setShowGoldStreakCelebration,
    goldStreakData,
    goldDatesThisWeek,
    updateGoldStreak,
    showStreakGoalCompletion,
    setShowStreakGoalCompletion,
    skipTask,
    setSkipTask,
    goalInputTask,
    setGoalInputTask,
    onGoalInputConfirm,
    timerTask,
    setTimerTask,
    onTimerSaveProgress,
    onTimerMarkComplete,
    showRecoveryPrompt,
    setShowRecoveryPrompt,
    recoverStreak,
    showRecoverySuccess,
    setShowRecoverySuccess,
    userId,
    showNotificationFlow,
    setShowNotificationFlow,
    challengeDayCelebration,
    closeChallengeDayCelebration,
    showChallengeDayCelebration,
    routineEndedData,
    showRoutineEnded,
    closeRoutineEnded,
    onAddRoutineAgain,
    isAddingRoutineAgain,
    stepCelebration,
    onCloseStepCelebration,
    projectCompletion,
    onCloseProjectCompletion,
  } = props;
  const {
    maybeRequestReviewAndroidOnly,
    openIOSReviewSoftLink,
    openAndroidReviewSoftLink,
  } = useAppReview();
  const [showIOSSoftReview, setShowIOSSoftReview] = useState(false);
  const [softReviewTrigger, setSoftReviewTrigger] =
    useState<string>("soft_review");

  // Global listener: any feature can dispatch SOFT_REVIEW_EVENT to ask for a
  // 5-star review at a high-satisfaction moment. iOS shows the in-app sheet
  // (which deep-links to App Store), Android jumps straight to Play Store.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const trigger = detail.trigger || "soft_review";
      const platform = Capacitor.getPlatform();
      // Universal Satisfaction Gate: every native platform sees the gate
      // FIRST. The native StoreKit / Play In-App Review dialog is only
      // fired from the gate's onAccept path (positive sentiment users).
      if (platform === "ios" || platform === "android") {
        setSoftReviewTrigger(trigger);
        setTimeout(() => setShowIOSSoftReview(true), 800);
      }
    };
    window.addEventListener(SOFT_REVIEW_EVENT, handler);
    return () => window.removeEventListener(SOFT_REVIEW_EVENT, handler);
  }, []);

  const { hasAccessToProgram } = useSubscription();
  const isSubscribed = hasAccessToProgram("any");

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const goldCelebrationShownKey = `simora_gold_celebration_shown_${todayStr}`;

  // ---- Push-notification re-engagement triggers ----
  const { needsAttention } = usePushPermission();
  const [showReturningSheet, setShowReturningSheet] = useState(false);
  const [taskNudge, setTaskNudge] = useState<{
    open: boolean;
    streakDay?: number;
    streakGoal?: number;
  }>({ open: false });

  // Returning-user sheet: streak >= 3 and not asked in last 5 days
  useEffect(() => {
    if (!userId || !needsAttention) return;
    const currentStreak = streak?.current_streak ?? streak?.currentStreak ?? 0;
    if (currentStreak < 3) return;
    const last = localStorage.getItem("returningUserPushDismissed");
    if (last) {
      const days = (Date.now() - parseInt(last)) / (1000 * 60 * 60 * 24);
      if (days < 5) return;
    }
    const t = setTimeout(() => setShowReturningSheet(true), 4000);
    return () => clearTimeout(t);
  }, [userId, needsAttention, streak]);

  // Listen for global "request push nudge" event fired after task completion / streak goal set
  useEffect(() => {
    const handler = (e: Event) => {
      if (!userId || !needsAttention) return;
      const last = localStorage.getItem("taskCompletionNudgeDismissed");
      if (last) {
        const hours = (Date.now() - parseInt(last)) / (1000 * 60 * 60);
        if (hours < 48) return;
      }
      const detail = (e as CustomEvent).detail || {};
      setTaskNudge({
        open: true,
        streakDay: detail.streakDay,
        streakGoal: detail.streakGoal,
      });
    };
    window.addEventListener("requestPushNudge", handler);
    return () => window.removeEventListener("requestPushNudge", handler);
  }, [userId, needsAttention]);

  return (
    <OverlayPortal>
      <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
      <ActionLimitSheet
        open={showActionLimit}
        onOpenChange={setShowActionLimit}
        onTakeChallenge={() => setShowPaywall(true)}
      />

      <TaskQuickStartSheet
        open={showQuickStart}
        onOpenChange={setShowQuickStart}
        onContinue={onQuickStartContinue}
      />

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        date={selectedDate}
        isCompleted={
          selectedTask ? completedTaskIds.has(selectedTask.id) : false
        }
        completedSubtaskIds={completedSubtaskIds}
        goalProgress={
          selectedTask ? goalProgressMap.get(selectedTask.id) || 0 : 0
        }
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        onStreakIncrease={() => setShowStreakModal(true)}
        onOpenGoalInput={onOpenGoalInput}
        onOpenTimer={onOpenTimer}
        onSkip={onSkipTask}
        onStepUnlocked={onStepUnlocked}
      />

      <StreakCelebration
        open={showStreakModal}
        onClose={() => {
          setShowStreakModal(false);
          setIsFirstActionCelebration(false);
        }}
        isFirstAction={isFirstActionCelebration}
        currentStreak={streak?.current_streak || 1}
        shouldShowGoalSelection={shouldShowGoalSelection}
        onShowGoalSelection={() => {
          setIsStreakUpgrade(false);
          setShowGoalSelection(true);
        }}
      />

      {isStreakUpgrade && (streak?.streak_goal || 0) >= 50 ? (
        <StreakGoalSelectionAdvanced
          open={showGoalSelection}
          onClose={() => setShowGoalSelection(false)}
          onSelectGoal={(goal) => {
            setStreakGoal.mutate(goal, {
              onSuccess: () => {
                setShowGoalSelection(false);
                setIsStreakUpgrade(false);
                setConfirmedGoal(goal);
                setShowGoalConfirmation(true);
              },
            });
          }}
          isLoading={setStreakGoal.isPending}
          minGoal={streak?.streak_goal || 50}
        />
      ) : (
        <StreakGoalSelection
          open={showGoalSelection}
          onClose={() => setShowGoalSelection(false)}
          onSelectGoal={(goal) => {
            setStreakGoal.mutate(goal, {
              onSuccess: () => {
                setShowGoalSelection(false);
                setIsStreakUpgrade(false);
                setConfirmedGoal(goal);
                setShowGoalConfirmation(true);
              },
            });
          }}
          isLoading={setStreakGoal.isPending}
          minGoal={isStreakUpgrade ? streak?.streak_goal || 0 : 0}
          isUpgrade={isStreakUpgrade}
        />
      )}

      <StreakGoalConfirmation
        open={showGoalConfirmation}
        goal={confirmedGoal}
        onClose={() => setShowGoalConfirmation(false)}
      />

      <BadgeCelebration
        type={badgeCelebrationType}
        onClose={() => {
          closeBadgeCelebration();
        }}
        onCollectGold={closeBadgeCelebration}
        onGoldCollected={() => {
          if (localStorage.getItem(goldCelebrationShownKey) === "true") return;
          localStorage.setItem(goldCelebrationShownKey, "true");
          updateGoldStreak.mutate(undefined, {
            onSuccess: () => setShowGoldStreakCelebration(true),
          });
          // Daily badges (silver/gold) are NOT review triggers — they're earned
          // every day for completing 2-3 tasks, far too frequent and low-signal
          // to anchor an App Store rating. Reviews now only fire on streak
          // milestones, all gated by the SatisfactionGate.
        }}
        completedCount={badgeCompletedCount}
        totalCount={badgeTotalCount}
      />

      <GoldStreakCelebration
        open={showGoldStreakCelebration}
        onClose={() => setShowGoldStreakCelebration(false)}
        currentGoldStreak={goldStreakData?.currentGoldStreak || 1}
        goldDatesThisWeek={goldDatesThisWeek}
      />

      <TaskSkipSheet
        task={skipTask}
        open={!!skipTask}
        onClose={() => setSkipTask(null)}
        date={selectedDate}
      />

      <GoalInputSheet
        open={!!goalInputTask}
        onOpenChange={(open) => !open && setGoalInputTask(null)}
        unit={goalInputTask?.goal_unit || "times"}
        onConfirm={onGoalInputConfirm}
      />

      {timerTask && (
        <TaskTimerScreen
          task={timerTask}
          currentProgress={goalProgressMap.get(timerTask.id) || 0}
          onSaveProgress={onTimerSaveProgress}
          onMarkComplete={onTimerMarkComplete}
          onClose={() => setTimerTask(null)}
        />
      )}

      <StreakGoalCompletionCelebration
        open={showStreakGoalCompletion}
        streakGoal={streak?.streak_goal || 7}
        currentStreak={streak?.current_streak || 0}
        onClose={() => setShowStreakGoalCompletion(false)}
        onLevelUp={() => {
          setShowStreakGoalCompletion(false);
          setIsStreakUpgrade(true);
          setShowGoalSelection(true);
        }}
      />

      {userId && showNotificationFlow && (
        <PushNotificationOnboarding
          userId={userId}
          onComplete={() => setShowNotificationFlow(false)}
          onSkip={() => setShowNotificationFlow(false)}
        />
      )}

      <StreakRecoveryPrompt
        open={showRecoveryPrompt}
        previousStreak={streak?.longest_streak || 0}
        onRecover={() => {
          const prev = streak?.longest_streak || 0;
          recoverStreak.mutate(
            { previousStreak: prev, type: "streak" },
            {
              onSuccess: () => {
                setShowRecoveryPrompt(false);
                setShowRecoverySuccess("streak");
              },
            },
          );
        }}
        onDismiss={() => setShowRecoveryPrompt(false)}
        isLoading={recoverStreak.isPending}
      />

      <RecoverySuccessBanner
        open={showRecoverySuccess !== null}
        restoredStreak={streak?.longest_streak || 0}
        type="streak"
        onClose={() => setShowRecoverySuccess(null)}
      />

      {/* Surfaces a small celebration sheet when the user newly unlocks a shield (Day 7 / Day 30). */}
      <ShieldEarnedDetector longestStreak={streak?.longest_streak || 0} />

      <ChallengeDayCelebration
        open={showChallengeDayCelebration}
        onClose={closeChallengeDayCelebration}
        challengeTitle={challengeDayCelebration?.challengeTitle || ""}
        challengeEmoji={challengeDayCelebration?.challengeEmoji || "✨"}
        currentDay={challengeDayCelebration?.currentDay || 0}
        totalDays={challengeDayCelebration?.totalDays || 0}
        badgeImageUrl={challengeDayCelebration?.badgeImageUrl}
      />

      <RoutineEndedCelebration
        open={!!showRoutineEnded}
        onClose={() => closeRoutineEnded?.()}
        routineTitle={routineEndedData?.routineTitle || ""}
        routineEmoji={routineEndedData?.routineEmoji || "✨"}
        totalDays={routineEndedData?.totalDays ?? null}
        badgeImageUrl={routineEndedData?.badgeImageUrl}
        onAddAgain={async () => { await onAddRoutineAgain?.(); }}
        isAddingAgain={!!isAddingRoutineAgain}
      />

      <StepCompletionCelebration
        open={!!stepCelebration}
        onClose={onCloseStepCelebration}
        completedStep={stepCelebration?.completedStep || 1}
        newTaskCount={stepCelebration?.newTaskCount || 0}
      />

      <ProjectCompletionCelebration
        open={!!projectCompletion}
        onClose={onCloseProjectCompletion}
        projectTitle={projectCompletion?.routineTitle || ""}
        projectEmoji={projectCompletion?.routineEmoji || "🎯"}
        totalSteps={projectCompletion?.totalSteps || 0}
        totalTasks={projectCompletion?.totalTasks || 0}
        badgeImageUrl={projectCompletion?.badgeImageUrl}
      />

      {userId && (
        <>
          <ReturningUserPushSheet
            userId={userId}
            open={showReturningSheet}
            onClose={() => setShowReturningSheet(false)}
            consecutiveDays={
              streak?.current_streak ?? streak?.currentStreak ?? 3
            }
          />
          <TaskCompletionPushNudge
            userId={userId}
            open={taskNudge.open}
            onClose={() => setTaskNudge({ open: false })}
            streakDay={taskNudge.streakDay}
            streakGoal={taskNudge.streakGoal}
          />
        </>
      )}

      <SoftReviewPrompt
        isOpen={showIOSSoftReview}
        onClose={() => setShowIOSSoftReview(false)}
        trigger={softReviewTrigger}
        onAccept={async () => {
          setShowIOSSoftReview(false);
          const platform = Capacitor.getPlatform();
          if (platform === "android") {
            // Try Google Play In-App Review first, fall back to Play Store link
            const shown = await maybeRequestReviewAndroidOnly(softReviewTrigger);
            if (!shown) await openAndroidReviewSoftLink(softReviewTrigger);
          } else {
            await openIOSReviewSoftLink(softReviewTrigger);
          }
        }}
      />
    </OverlayPortal>
  );
});
