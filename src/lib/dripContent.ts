import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

/**
 * Calculate the availability status and countdown text for a drip content track
 * 
 * Logic:
 * - drip_delay_days = 0: Always available immediately upon enrollment
 * - drip_delay_days >= 1: Available at firstSessionDate + (drip_delay_days - 1) days
 * 
 * @param dripDelayDays - Drip delay value (0 = immediate, 1 = at first session, 2 = 1 day after, etc.)
 * @param firstSessionDate - The first session date/time (YYYY-MM-DD or ISO timestamp)
 * @param roundDripOffset - Additional offset days (positive = delay/freeze, negative = release earlier)
 */
export function getTrackAvailabilityWithCountdown(
  dripDelayDays: number,
  firstSessionDate: string | null | undefined,
  roundDripOffset: number = 0
): {
  isAvailable: boolean;
  availableDate: Date | null;
  countdownText: string | null;
} {
  // drip_delay_days = 0 means immediately available (no drip)
  if (dripDelayDays === 0) {
    return { isAvailable: true, availableDate: null, countdownText: null };
  }

  // No first session date set = all content available (fallback)
  if (!firstSessionDate) {
    return { isAvailable: true, availableDate: null, countdownText: null };
  }

  // Parse first session date - supports both date-only and ISO timestamp formats
  const firstSession = firstSessionDate.includes('T') 
    ? new Date(firstSessionDate)
    : new Date(firstSessionDate + 'T00:00:00');
  
  // Calculate available date: firstSession + (dripDelayDays - 1) + offset
  // drip_delay_days = 1 means at first session time
  // drip_delay_days = 2 means 1 day after first session
  const availableDate = new Date(firstSession);
  availableDate.setDate(availableDate.getDate() + (dripDelayDays - 1) + roundDripOffset);
  
  const now = new Date();

  // Compare full datetime (not just date) for more precise timing
  const isAvailable = now >= availableDate;

  if (isAvailable) {
    return { isAvailable: true, availableDate, countdownText: null };
  }

  // Calculate countdown with time precision
  const totalMinutesUntil = differenceInMinutes(availableDate, now);
  const daysUntil = Math.floor(totalMinutesUntil / (60 * 24));
  const hoursUntil = Math.floor((totalMinutesUntil % (60 * 24)) / 60);
  const minutesUntil = totalMinutesUntil % 60;

  let countdownText: string;
  if (daysUntil > 1) {
    countdownText = `Available in ${daysUntil} days`;
  } else if (daysUntil === 1) {
    countdownText = hoursUntil > 0 
      ? `Available in 1 day, ${hoursUntil}h` 
      : `Available in 1 day`;
  } else if (hoursUntil > 1) {
    countdownText = `Available in ${hoursUntil} hours`;
  } else if (hoursUntil === 1) {
    countdownText = minutesUntil > 0
      ? `Available in 1h ${minutesUntil}m`
      : `Available in 1 hour`;
  } else if (minutesUntil > 0) {
    countdownText = `Available in ${minutesUntil} minutes`;
  } else {
    countdownText = `Available soon`;
  }

  return { isAvailable: false, availableDate, countdownText };
}

/**
 * Drip schedule templates for admin UI
 */
export const DRIP_SCHEDULE_TEMPLATES = [
  {
    id: 'immediate',
    name: 'All Immediate',
    description: 'All tracks available immediately',
    getDays: (index: number) => 0,
  },
  {
    id: 'weekly',
    name: 'Weekly Release',
    description: 'New track every week (0, 7, 14, 21...)',
    getDays: (index: number) => index * 7,
  },
  {
    id: 'biweekly',
    name: 'Bi-Weekly Release',
    description: 'New track every 2 weeks (0, 14, 28...)',
    getDays: (index: number) => index * 14,
  },
  {
    id: 'daily',
    name: 'Daily Release',
    description: 'New track every day (0, 1, 2, 3...)',
    getDays: (index: number) => index,
  },
  {
    id: 'every3days',
    name: 'Every 3 Days',
    description: 'New track every 3 days (0, 3, 6, 9...)',
    getDays: (index: number) => index * 3,
  },
] as const;

export type DripScheduleTemplateId = typeof DRIP_SCHEDULE_TEMPLATES[number]['id'];
