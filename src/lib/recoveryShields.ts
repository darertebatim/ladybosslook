/**
 * Recovery Shield earning logic.
 *
 * Shields are EARNED through streak milestones, not handed out for free:
 *   - Day 1+   → 1 shield
 *   - Day 7+   → 2 shields
 *   - Every 30 days → +3 shields cumulative (Day 30 = 3, Day 60 = 6, Day 90 = 9…)
 *   - Every 90 days → +7 bonus shields cumulative (Day 90 = +7, Day 180 = +14…)
 *     So Day 90 = 9 + 7 = 16 total, Day 180 = 18 + 14 = 32 total.
 *
 * Available = earned - used.
 * No subscription gating — shields are a pure reward for consistency.
 */

/**
 * How many shields the user has earned, given their longest streak ever.
 */
export function getEarnedShields(longestStreak: number): number {
  if (!longestStreak || longestStreak < 1) return 0;
  if (longestStreak < 7) return 1;
  if (longestStreak < 30) return 2;
  const thirtyCycles = Math.floor(longestStreak / 30);
  const ninetyCycles = Math.floor(longestStreak / 90);
  return thirtyCycles * 3 + ninetyCycles * 7;
}

/**
 * Ordered list of milestones up to (and including) the next one after `longestStreak`.
 * Useful for rendering "next unlock" labels.
 */
export function getShieldMilestonesUpTo(longestStreak: number): Array<{ day: number; total: number }> {
  const milestones: Array<{ day: number; total: number }> = [
    { day: 1, total: 1 },
    { day: 7, total: 2 },
  ];
  // Add every 30-day milestone up to one past the user's streak
  const targetDay = Math.max(30, Math.ceil((longestStreak + 1) / 30) * 30);
  for (let d = 30; d <= targetDay; d += 30) {
    milestones.push({ day: d, total: getEarnedShields(d) });
  }
  return milestones;
}

/**
 * How many shields the user can still spend.
 */
export function getAvailableShields(longestStreak: number, usedCount: number): number {
  return Math.max(0, getEarnedShields(longestStreak) - (usedCount || 0));
}

/**
 * Returns the next milestone the user has not yet reached (for "Day 7" / "Day 30" labels),
 * or null if all unlocked.
 */
export function getNextShieldMilestone(longestStreak: number) {
  for (const m of getShieldMilestonesUpTo(longestStreak)) {
    if (longestStreak < m.day) return m;
  }
  return null;
}

/**
 * Returns the milestone that just unlocked (if any) when longestStreak crosses
 * from `prev` to `current`. Used to trigger the celebration sheet.
 */
export function getJustUnlockedMilestone(prev: number, current: number) {
  for (const m of getShieldMilestonesUpTo(current)) {
    if (prev < m.day && current >= m.day) return m;
  }
  return null;
}