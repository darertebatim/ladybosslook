/**
 * Soft tint tokens shared across brand primitives.
 * Each key maps to background + mid utility classes.
 * Light/dark resolution is handled automatically by the CSS variables
 * defined in src/index.css under .app-theme / .app-theme.dark.
 */
export const TINT_KEYS = ['peach', 'mint', 'lavender', 'yellow', 'pink'] as const;
export type TintKey = typeof TINT_KEYS[number];

export const TINT_BG: Record<TintKey, string> = {
  peach: 'bg-peach',
  mint: 'bg-mint',
  lavender: 'bg-lavender',
  yellow: 'bg-yellow',
  pink: 'bg-pink',
};

export const TINT_BG_MID: Record<TintKey, string> = {
  peach: 'bg-peach-mid',
  mint: 'bg-mint-mid',
  lavender: 'bg-lavender-mid',
  yellow: 'bg-yellow-mid',
  pink: 'bg-pink-mid',
};