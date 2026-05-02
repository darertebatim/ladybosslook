/**
 * Recovery Shield earning logic.
 *
 * Shields are EARNED through streak milestones, not handed out for free:
 *   - Day 1+   → 1 shield (every user starts with 1 once they have any streak)
 *   - Day 7+   → 2 shields
 *   - Day 30+  → 3 shields (cap)
 *
 * Available = earned - used.
 * No subscription gating — shields are a pure reward for consistency.
 */

export const SHIELD_MILESTONES: Array<{ day: number; total: number }> = [
  { day: 1, total: 1 },
  { day: 7, total: 2 },
  { day: 30, total: 3 },
];

export const MAX_SHIELDS = 3;

/**
 * How many shields the user has earned, given their longest streak ever.
 */
export function getEarnedShields(longestStreak: number): number {
  let earned = 0;
  for (const m of SHIELD_MILESTONES) {
    if (longestStreak >= m.day) earned = m.total;
  }
  return earned;
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
  for (const m of SHIELD_MILESTONES) {
    if (longestStreak < m.day) return m;
  }
  return null;
}

/**
 * Returns the milestone that just unlocked (if any) when longestStreak crosses
 * from `prev` to `current`. Used to trigger the celebration sheet.
 */
export function getJustUnlockedMilestone(prev: number, current: number) {
  for (const m of SHIELD_MILESTONES) {
    if (prev < m.day && current >= m.day) return m;
  }
  return null;
}