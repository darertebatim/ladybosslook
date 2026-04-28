import { getLocalDateStr } from '@/lib/localDate';
import { clearOfflineQueryCache } from '@/lib/offline/idbPersister';

/**
 * Central utility for clearing all client-side localStorage flags.
 * Use this for "ultimate reset" to ensure new feature flags don't need manual updates.
 */

// Tour feature keys
const TOUR_FEATURES = ['home', 'routines', 'breathe', 'journal', 'player', 'period', 'programs', 'round', 'explore', 'playlist', 'action-sheet'] as const;

// All localStorage keys that should be cleared on reset
const CLIENT_RESET_KEYS = [
  // Legacy app tour
  'appTourCompleted',
  
  // New feature tours
  ...TOUR_FEATURES.map(f => `simora_tour_${f}_done`),
  
  // Onboarding flags
  'simora_force_new_user',
  'simora_first_action_celebrated',
  'simora_welcome_card_dismissed',
  'simora_welcome_card_action_added',
  
  // Any other onboarding/first-time flags
  'simora_onboarding_complete',
  'simora_onboarding_banner_dismissed',
  'simora_planner_intro_seen',
  
  // Mood check-in banner
  'mood-banner-dismissed',
  
  // Hand hint guidance
  'routine_add_hint_dismissed',
  'routine_save_hint_dismissed',
  
  // Coach marks
  'simora_tap_coach_shown',
  
  // Dismissed routine suggestions
  'simora_dismissed_routine_ids',
  'simora_dismissed_ritual_ids',
] as const;

/**
 * Clears all tour completion flags only
 */
export function resetAllTours(): void {
  // Legacy tour
  localStorage.removeItem('appTourCompleted');
  
  // Feature tours
  TOUR_FEATURES.forEach(feature => {
    localStorage.removeItem(`simora_tour_${feature}_done`);
  });
  
  // Tour welcome popup flags - so it re-appears
  localStorage.removeItem('simora_tour_prompt_shown');
  localStorage.removeItem('simora_tour_prompt_dismissed_at');

  // First-action coach marks (the 3 small spotlights on Home:
  //   1) "mark off your first task"
  //   2) "tap to manage"
  //   3) "tap + to add")
  localStorage.removeItem('simora_first_action_celebrated');
  localStorage.removeItem('simora_tap_coach_shown');
  localStorage.removeItem('simora_welcome_card_dismissed');
  localStorage.removeItem('simora_welcome_card_action_added');

  // Force the home page to treat this session as a brand-new user so the
  // first-action coach marks fire again even if the server still shows
  // historical completions.
  localStorage.setItem('simora_force_new_user', 'true');

  // Set a flag to force tour popup to show immediately (opt-in banner)
  localStorage.setItem('simora_tours_just_reset', 'true');

  console.log('[clientReset] All tours + first-action coach marks reset');
}

/**
 * Clears a specific tour
 */
export function resetTour(feature: typeof TOUR_FEATURES[number]): void {
  localStorage.removeItem(`simora_tour_${feature}_done`);
  console.log(`[clientReset] Tour "${feature}" reset`);
}

/**
 * Full client-side reset - clears ALL onboarding, tour, and app state flags.
 * Sweeps all simora_* keys plus known app keys so nothing is missed.
 */
export function fullClientReset(): void {
  // 1. Remove all explicitly listed keys
  CLIENT_RESET_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });

  // 2. Sweep ALL localStorage keys matching app prefixes or dynamic patterns
  //    This catches celebration keys, gold streak, streak goal, etc.
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key.startsWith('simora_') ||
      key.startsWith('mood-banner') ||
      key.startsWith('routine_') ||
      key.startsWith('appTour') ||
      key === 'autoSyncCalendar'
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // 3. Clear React Query persisted cache
  localStorage.removeItem('lb-query-cache-v4');
  // Also clear the IndexedDB-backed offline cache
  void clearOfflineQueryCache();

  // 4. Set flags to force tour banner/popup and new-user experience
  localStorage.setItem('simora_tours_just_reset', 'true');
  localStorage.setItem('simora_force_new_user', 'true');

  console.log(`[clientReset] Full client reset complete — cleared ${keysToRemove.length + CLIENT_RESET_KEYS.length} keys`);
}

/**
 * Check if any tour has been completed
 */
export function hasCompletedAnyTour(): boolean {
  return TOUR_FEATURES.some(feature => 
    localStorage.getItem(`simora_tour_${feature}_done`) === 'true'
  ) || localStorage.getItem('appTourCompleted') === 'true';
}
