/**
 * Central utility for clearing all client-side localStorage flags.
 * Use this for "ultimate reset" to ensure new feature flags don't need manual updates.
 */

// Tour feature keys
const TOUR_FEATURES = ['home', 'rituals', 'breathe', 'journal', 'player', 'period', 'programs', 'round', 'explore'] as const;

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
  
  // Any other onboarding/first-time flags
  'simora_onboarding_complete',
  'simora_planner_intro_seen',
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
  
  console.log('[clientReset] All tours reset');
}

/**
 * Clears a specific tour
 */
export function resetTour(feature: typeof TOUR_FEATURES[number]): void {
  localStorage.removeItem(`simora_tour_${feature}_done`);
  console.log(`[clientReset] Tour "${feature}" reset`);
}

/**
 * Full client-side reset - clears ALL onboarding and tour flags
 * Call this after admin data reset to ensure complete "Day 1" experience
 */
export function fullClientReset(): void {
  CLIENT_RESET_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Also set force new user flag for testing
  localStorage.setItem('simora_force_new_user', 'true');
  
  console.log('[clientReset] Full client reset complete');
}

/**
 * Check if any tour has been completed
 */
export function hasCompletedAnyTour(): boolean {
  return TOUR_FEATURES.some(feature => 
    localStorage.getItem(`simora_tour_${feature}_done`) === 'true'
  ) || localStorage.getItem('appTourCompleted') === 'true';
}
