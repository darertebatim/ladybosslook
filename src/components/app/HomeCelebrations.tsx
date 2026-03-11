import { memo } from 'react';
import { format } from 'date-fns';
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { StreakGoalSelection } from '@/components/app/StreakGoalSelection';
import { StreakGoalCompletionCelebration } from '@/components/app/StreakGoalCompletionCelebration';
import { StreakGoalConfirmation } from '@/components/app/StreakGoalConfirmation';
import { StreakRecoveryPrompt } from '@/components/app/StreakRecoveryPrompt';
import { BadgeCelebration } from '@/components/app/BadgeCelebration';
import { GoldStreakCelebration } from '@/components/app/GoldStreakCelebration';
import { TaskSkipSheet } from '@/components/app/TaskSkipSheet';
import { GoalInputSheet } from '@/components/app/GoalInputSheet';
import { TaskTimerScreen } from '@/components/app/TaskTimerScreen';
import { PaywallSheet } from '@/components/app/PaywallSheet';
import { ActionLimitSheet } from '@/components/app/ActionLimitSheet';
import { TaskQuickStartSheet } from '@/components/app/TaskQuickStartSheet';
import { TaskDetailModal } from '@/components/app/TaskDetailModal';
import { PushNotificationOnboarding } from '@/components/app/PushNotificationOnboarding';
import type { UserTask, TaskTemplate } from '@/hooks/useTaskPlanner';
import type { BadgeLevel } from '@/hooks/useWeeklyTaskCompletion';

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

  // Streak
  showStreakModal: boolean;
  setShowStreakModal: (v: boolean) => void;
  isFirstActionCelebration: boolean;
  setIsFirstActionCelebration: (v: boolean) => void;
  setShowTapCoachMark: (v: boolean) => void;
  streak: any;
  shouldShowGoalSelection: boolean;
  celebrationStreakCount: number;

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
  maybeRequestReview: () => void;

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

  // Notification
  userId?: string;
  showNotificationFlow: boolean;
  setShowNotificationFlow: (v: boolean) => void;
}

export const HomeCelebrations = memo(function HomeCelebrations(props: HomeCelebrationsProps) {
  const {
    showPaywall, setShowPaywall, showActionLimit, setShowActionLimit,
    showQuickStart, setShowQuickStart, onQuickStartContinue,
    selectedTask, setSelectedTask, selectedDate, completedTaskIds, completedSubtaskIds,
    goalProgressMap, onEditTask, onDeleteTask, onSkipTask, onOpenGoalInput, onOpenTimer,
    showStreakModal, setShowStreakModal, isFirstActionCelebration, setIsFirstActionCelebration,
    setShowTapCoachMark, streak, shouldShowGoalSelection, celebrationStreakCount,
    showGoalSelection, setShowGoalSelection, isStreakUpgrade, setIsStreakUpgrade,
    showGoalConfirmation, setShowGoalConfirmation, confirmedGoal, setConfirmedGoal, setStreakGoal,
    badgeCelebrationType, closeBadgeCelebration, badgeCompletedCount, badgeTotalCount, maybeRequestReview,
    showGoldStreakCelebration, setShowGoldStreakCelebration, goldStreakData, goldDatesThisWeek, updateGoldStreak,
    showStreakGoalCompletion, setShowStreakGoalCompletion,
    skipTask, setSkipTask, goalInputTask, setGoalInputTask, onGoalInputConfirm,
    timerTask, setTimerTask, onTimerSaveProgress, onTimerMarkComplete,
    showRecoveryPrompt, setShowRecoveryPrompt, recoverStreak,
    userId, showNotificationFlow, setShowNotificationFlow,
  } = props;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const goldCelebrationShownKey = `simora_gold_celebration_shown_${todayStr}`;

  return (
    <>
      <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />
      <ActionLimitSheet
        open={showActionLimit}
        onOpenChange={setShowActionLimit}
        onTakeChallenge={() => setShowPaywall(true)}
      />

      <TaskQuickStartSheet open={showQuickStart} onOpenChange={setShowQuickStart} onContinue={onQuickStartContinue} />

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        date={selectedDate}
        isCompleted={selectedTask ? completedTaskIds.has(selectedTask.id) : false}
        completedSubtaskIds={completedSubtaskIds}
        goalProgress={selectedTask ? (goalProgressMap.get(selectedTask.id) || 0) : 0}
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        onStreakIncrease={(newStreak: number) => {
          setShowStreakModal(true);
        }}
        onOpenGoalInput={onOpenGoalInput}
        onOpenTimer={onOpenTimer}
        onSkip={onSkipTask}
      />

      <StreakCelebration
        open={showStreakModal}
        streakCount={celebrationStreakCount}
        onClose={() => {
          setShowStreakModal(false);
          if (isFirstActionCelebration && localStorage.getItem('simora_tap_coach_shown') !== 'true') {
            setTimeout(() => setShowTapCoachMark(true), 600);
            localStorage.setItem('simora_tap_coach_shown', 'true');
          }
          setIsFirstActionCelebration(false);
        }}
        isFirstAction={isFirstActionCelebration}
        shouldShowGoalSelection={shouldShowGoalSelection}
        onShowGoalSelection={() => {
          setIsStreakUpgrade(false);
          setShowGoalSelection(true);
        }}
      />

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
        minGoal={isStreakUpgrade ? (streak?.streak_goal || 0) : 0}
        isUpgrade={isStreakUpgrade}
      />

      <StreakGoalConfirmation
        open={showGoalConfirmation}
        goal={confirmedGoal}
        onClose={() => setShowGoalConfirmation(false)}
      />

      <BadgeCelebration
        type={badgeCelebrationType}
        onClose={() => {
          const wassilver = badgeCelebrationType === 'silver';
          closeBadgeCelebration();
          if (wassilver) maybeRequestReview();
        }}
        onCollectGold={closeBadgeCelebration}
        onGoldCollected={() => {
          if (localStorage.getItem(goldCelebrationShownKey) === 'true') return;
          localStorage.setItem(goldCelebrationShownKey, 'true');
          updateGoldStreak.mutate(undefined, {
            onSuccess: () => setShowGoldStreakCelebration(true),
          });
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
        unit={goalInputTask?.goal_unit || 'times'}
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
          recoverStreak.mutate({ previousStreak: prev, type: 'streak' }, {
            onSuccess: () => setShowRecoveryPrompt(false),
          });
        }}
        onDismiss={() => setShowRecoveryPrompt(false)}
        isLoading={recoverStreak.isPending}
      />
    </>
  );
});
