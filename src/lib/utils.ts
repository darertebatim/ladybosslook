import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Determines if a hex color is "light" (should use dark text) or "dark" (should use white text)
 * Uses relative luminance calculation for accurate contrast determination
 */
export function isLightColor(hexColor: string): boolean {
  // Handle named colors
  const namedColors: Record<string, string> = {
    amber: '#F59E0B',
    red: '#EF4444',
    green: '#22C55E',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    cyan: '#06B6D4',
    orange: '#F97316',
    yellow: '#FBBF24',
    teal: '#14B8A6',
    lime: '#84CC16',
    emerald: '#10B981',
    violet: '#8B5CF6',
    fuchsia: '#D946EF',
    rose: '#F43F5E',
    sky: '#0EA5E9',
    slate: '#64748B',
    gray: '#6B7280',
    zinc: '#71717A',
    neutral: '#737373',
    stone: '#78716C',
  };
  
  // Convert named color to hex if needed
  let hex = namedColors[hexColor.toLowerCase()] || hexColor;
  
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance using sRGB
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if color is light (luminance > 0.5)
  return luminance > 0.5;
}

/**
 * Returns appropriate text color class for a given background color
 */
export function getContrastTextColor(bgColor: string): string {
  return isLightColor(bgColor) ? 'text-gray-900' : 'text-white';
}
