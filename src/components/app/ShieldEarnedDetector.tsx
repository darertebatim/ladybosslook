import { useEffect, useState } from 'react';
import { ShieldEarnedSheet } from './ShieldEarnedSheet';
import { SHIELD_MILESTONES, getEarnedShields } from '@/lib/recoveryShields';

interface ShieldEarnedDetectorProps {
  longestStreak: number;
}

/**
 * Watches the user's longest_streak and surfaces the ShieldEarnedSheet
 * the first time they cross a shield milestone (Day 7 or Day 30).
 * Day 1 is implicit — no celebration since every user starts with 1 shield.
 *
 * Persistence: localStorage key `simora_shield_earned_seen_<day>` ensures
 * each milestone celebrates at most once.
 */
export const ShieldEarnedDetector = ({ longestStreak }: ShieldEarnedDetectorProps) => {
  const [active, setActive] = useState<{ day: number; total: number } | null>(null);

  useEffect(() => {
    if (!longestStreak || longestStreak < 7) return;
    // Skip Day 1 (implicit) — only celebrate Day 7 and Day 30
    for (const m of SHIELD_MILESTONES) {
      if (m.day < 7) continue;
      if (longestStreak < m.day) continue;
      const key = `simora_shield_earned_seen_${m.day}`;
      if (localStorage.getItem(key) === 'true') continue;
      localStorage.setItem(key, 'true');
      setActive({ day: m.day, total: m.total });
      break;
    }
  }, [longestStreak]);

  if (!active) return null;

  return (
    <ShieldEarnedSheet
      open={!!active}
      milestoneDay={active.day}
      totalShields={active.total ?? getEarnedShields(longestStreak)}
      onClose={() => setActive(null)}
    />
  );
};