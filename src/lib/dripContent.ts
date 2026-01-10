import { differenceInDays, differenceInHours } from "date-fns";

/**
 * Calculate the availability status and countdown text for a drip content track
 * @param dripDelayDays - Days after round start when the track becomes available
 * @param roundStartDate - The start date of the round (YYYY-MM-DD format)
 * @param roundDripOffset - Additional offset days (positive = delay/freeze, negative = release earlier)
 */
export function getTrackAvailabilityWithCountdown(
  dripDelayDays: number,
  roundStartDate: string | null | undefined,
  roundDripOffset: number = 0
): {
  isAvailable: boolean;
  availableDate: Date | null;
  countdownText: string | null;
} {
  // No round = all tracks available
  if (!roundStartDate) {
    return { isAvailable: true, availableDate: null, countdownText: null };
  }

  const roundStart = new Date(roundStartDate + 'T00:00:00');
  const availableDate = new Date(roundStart);
  // Include the round's drip offset in the calculation
  availableDate.setDate(availableDate.getDate() + dripDelayDays + roundDripOffset);
  
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isAvailable = today >= availableDate;

  if (isAvailable) {
    return { isAvailable: true, availableDate, countdownText: null };
  }

  // Calculate countdown
  const daysUntil = differenceInDays(availableDate, now);
  const hoursUntil = differenceInHours(availableDate, now) % 24;

  let countdownText: string;
  if (daysUntil > 1) {
    countdownText = `Available in ${daysUntil} days`;
  } else if (daysUntil === 1) {
    countdownText = hoursUntil > 0 
      ? `Available in 1 day, ${hoursUntil} hours` 
      : `Available in 1 day`;
  } else if (hoursUntil > 1) {
    countdownText = `Available in ${hoursUntil} hours`;
  } else if (hoursUntil === 1) {
    countdownText = `Available in 1 hour`;
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
