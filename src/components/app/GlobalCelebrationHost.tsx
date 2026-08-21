import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import { StreakCelebration } from '@/components/app/StreakCelebration';
import { BadgeCelebration, type BadgeCelebrationLevel } from '@/components/app/BadgeCelebration';
import { GoldStreakCelebration } from '@/components/app/GoldStreakCelebration';
import { ChallengeDayCelebration } from '@/components/app/ChallengeDayCelebration';
import { useNewHomeData } from '@/hooks/useNewHomeData';
import { useWeeklyTaskCompletion } from '@/hooks/useWeeklyTaskCompletion';
import { useGoldStreak, useGoldDatesThisWeek, useUpdateGoldStreak } from '@/hooks/useGoldStreak';
import { useCompletionsForDate } from '@/hooks/useTaskPlanner';
import { useChallengeDayCelebration } from '@/hooks/useChallengeDayCelebration';
import { getLocalDateStr } from '@/lib/localDate';
import { useAuth } from '@/hooks/useAuth';

/**
 * Global celebration host — mounted ONCE inside AppProvidersLayout.
 *
 * Detects celebration-worthy events (first action, badge level-ups, gold streak,
 * challenge day) from anywhere in the app and shows the corresponding modal
 * only when the user is on /app/home or /app/path. If a trigger fires
 * elsewhere, it remains pending (via localStorage flags) and pops the next
 * time the user lands on either of those pages.
 *
 * Idempotency comes from localStorage flags (same keys used by AppHome's
 * local instances). Once this host fires a celebration and writes the flag,
 * AppHome's local instance reads the flag and silently skips.
 */
type ActiveCelebration =
  | { kind: 'first-action'; currentStreak: number }
  | { kind: 'badge'; type: BadgeCelebrationLevel; completedCount: number; totalCount: number }
  | { kind: 'gold-streak'; currentGoldStreak: number; goldDatesThisWeek: Date[] }
  | null;

function getCelebratedLevels(dateKey: string): Set<string> {
  try {
    const stored = localStorage.getItem(`simora_celebrated_${dateKey}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCelebratedLevel(dateKey: string, level: string) {
  try {
    const current = getCelebratedLevels(dateKey);
    current.add(level);
    localStorage.setItem(`simora_celebrated_${dateKey}`, JSON.stringify([...current]));
  } catch {
    // ignore
  }
}

export function GlobalCelebrationHost() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const allowedRoute =
    pathname.startsWith('/app/home') || pathname.startsWith('/app/path');

  const todayStr = getLocalDateStr();
  const today = useMemo(() => new Date(), []);

  const homeData = useNewHomeData();
  const totalCompletions = homeData.totalCompletions ?? 0;
  const streak = homeData.streak;

  const { data: weeklyCompletion } = useWeeklyTaskCompletion();
  const { data: goldStreak } = useGoldStreak();
  const { data: goldDatesThisWeek = [] } = useGoldDatesThisWeek();
  const updateGoldStreak = useUpdateGoldStreak();

  // For challenge day detection — needs today's completedTaskIds
  const { data: completions } = useCompletionsForDate(today);
  const completedTaskIds = useMemo(
    () => new Set(completions?.tasks?.map((c: any) => c.task_id) ?? []),
    [completions],
  );
  const {
    celebrationData: challengeDayData,
    closeCelebration: closeChallengeDay,
    showCelebration: showChallengeDay,
  } = useChallengeDayCelebration([], completedTaskIds, todayStr);

  const [active, setActive] = useState<ActiveCelebration>(null);

  const todayStats = weeklyCompletion?.[todayStr];

  // Detection effect — re-runs whenever underlying data changes
  useEffect(() => {
    if (!user) return;
    if (!allowedRoute) return;
    if (active) return;
    if (showChallengeDay) return; // challenge takes its own slot

    // Auto-mark first-action flag for legacy users (more than 1 lifetime completion)
    if (
      totalCompletions > 1 &&
      localStorage.getItem('simora_first_action_celebrated') !== 'true'
    ) {
      localStorage.setItem('simora_first_action_celebrated', 'true');
    }

    // 1. First action — fires once, lifetime
    if (
      totalCompletions >= 1 &&
      totalCompletions <= 1 &&
      localStorage.getItem('simora_first_action_celebrated') !== 'true'
    ) {
      localStorage.setItem('simora_first_action_celebrated', 'true');
      setActive({
        kind: 'first-action',
        currentStreak: streak?.current_streak || 1,
      });
      return;
    }

    // 2. Badge celebrations (priority: gold > almostGold > silver)
    if (todayStats) {
      const celebrated = getCelebratedLevels(todayStr);
      const completed = todayStats.completedTasks || 0;
      const total = todayStats.totalTasks || 0;

      if (todayStats.badgeLevel === 'gold' && !celebrated.has('gold') && completed > 0) {
        saveCelebratedLevel(todayStr, 'gold');
        setActive({ kind: 'badge', type: 'gold', completedCount: completed, totalCount: total });
        return;
      }
      if (
        total > 0 &&
        completed === total - 1 &&
        !celebrated.has('almostGold') &&
        !celebrated.has('gold')
      ) {
        saveCelebratedLevel(todayStr, 'almostGold');
        setActive({ kind: 'badge', type: 'almostGold', completedCount: completed, totalCount: total });
        return;
      }
      if (todayStats.badgeLevel === 'silver' && !celebrated.has('silver') && completed > 0) {
        saveCelebratedLevel(todayStr, 'silver');
        setActive({ kind: 'badge', type: 'silver', completedCount: completed, totalCount: total });
        return;
      }
    }

    // 3. Gold streak — fires after gold day recorded on server
    const goldShownKey = `simora_gold_celebration_shown_${todayStr}`;
    if (
      goldStreak &&
      goldStreak.currentGoldStreak >= 1 &&
      goldStreak.lastGoldDate === todayStr &&
      localStorage.getItem(goldShownKey) !== 'true'
    ) {
      localStorage.setItem(goldShownKey, 'true');
      setActive({
        kind: 'gold-streak',
        currentGoldStreak: goldStreak.currentGoldStreak,
        goldDatesThisWeek,
      });
      return;
    }
  }, [
    user,
    allowedRoute,
    active,
    showChallengeDay,
    totalCompletions,
    streak?.current_streak,
    todayStats?.badgeLevel,
    todayStats?.completedTasks,
    todayStats?.totalTasks,
    goldStreak?.currentGoldStreak,
    goldStreak?.lastGoldDate,
    goldDatesThisWeek,
    todayStr,
  ]);

  // Reset active when route leaves allowed area so it doesn't get stuck visible
  useEffect(() => {
    if (!allowedRoute && active) {
      setActive(null);
    }
  }, [allowedRoute, active]);

  const close = () => setActive(null);

  if (!user) return null;

  return (
    <>
      {/* First-action streak */}
      <OverlayPortal>
        <StreakCelebration
          open={allowedRoute && active?.kind === 'first-action'}
          onClose={close}
          isFirstAction
          currentStreak={
            active?.kind === 'first-action' ? active.currentStreak : 1
          }
        />
      </OverlayPortal>

      {/* Badge (silver / almost gold / gold) */}
      <BadgeCelebration
        type={allowedRoute && active?.kind === 'badge' ? active.type : null}
        onClose={close}
        onGoldCollected={() => {
          // Mirror AppHome behavior: update server gold streak after gold collect
          updateGoldStreak.mutate();
        }}
        completedCount={active?.kind === 'badge' ? active.completedCount : 0}
        totalCount={active?.kind === 'badge' ? active.totalCount : 0}
      />

      {/* Gold streak */}
      <OverlayPortal>
        <GoldStreakCelebration
          open={allowedRoute && active?.kind === 'gold-streak'}
          onClose={close}
          currentGoldStreak={
            active?.kind === 'gold-streak' ? active.currentGoldStreak : 0
          }
          goldDatesThisWeek={
            active?.kind === 'gold-streak' ? active.goldDatesThisWeek : []
          }
        />
      </OverlayPortal>

      {/* Challenge day */}
      <OverlayPortal>
        <ChallengeDayCelebration
          open={allowedRoute && showChallengeDay && !!challengeDayData}
          onClose={closeChallengeDay}
          challengeTitle={challengeDayData?.challengeTitle || ''}
          challengeEmoji={challengeDayData?.challengeEmoji || '✨'}
          currentDay={challengeDayData?.currentDay || 1}
          totalDays={challengeDayData?.totalDays || 1}
          badgeImageUrl={challengeDayData?.badgeImageUrl}
        />
      </OverlayPortal>
    </>
  );
}