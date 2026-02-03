/**
 * Fluent Emoji 3D utilities
 * Converts native emoji characters to Microsoft Fluent Emoji 3D images via CDN
 */

const CDN_BASE = 'https://registry.npmmirror.com/@lobehub/fluent-emoji-3d/latest/files/assets';

/**
 * Convert an emoji character to its unicode hex representation
 * Handles compound emojis, variation selectors, and ZWJ sequences
 */
export function emojiToUnicode(emoji: string): string {
  if (!emoji) return '';
  
  const codePoints: string[] = [];
  
  for (const char of emoji) {
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined) {
      codePoints.push(codePoint.toString(16).toLowerCase());
    }
  }
  
  // Join with hyphen for compound emojis (ZWJ sequences, skin tones, etc.)
  return codePoints.join('-');
}

/**
 * Get the CDN URL for a 3D Fluent Emoji
 */
export function getFluentEmojiUrl(emoji: string): string {
  const unicode = emojiToUnicode(emoji);
  if (!unicode) return '';
  return `${CDN_BASE}/${unicode}.webp`;
}

/**
 * Alternative URL without variation selector (fe0f)
 * Some emojis work better without the variation selector
 */
export function getFluentEmojiUrlAlt(emoji: string): string {
  const unicode = emojiToUnicode(emoji);
  if (!unicode) return '';
  
  // Remove fe0f (variation selector-16) which is often optional
  const cleanUnicode = unicode.replace(/-fe0f/g, '').replace(/fe0f-/g, '');
  return `${CDN_BASE}/${cleanUnicode}.webp`;
}

/**
 * Check if a string is an emoji
 */
export function isEmoji(str: string): boolean {
  if (!str) return false;
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1FA00}-\u{1FAFF}]/u;
  return emojiRegex.test(str);
}
