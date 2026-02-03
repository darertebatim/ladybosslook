/**
 * Time of Day Scheduling Configuration
 * 
 * Finch-style approximate time categories for flexible task scheduling.
 * Users can choose approximate time periods instead of specific clock times.
 */

export type TimePeriod = 
  | 'start_of_day' 
  | 'morning' 
  | 'afternoon' 
  | 'evening' 
  | 'night';

export type TimeMode = 'anytime' | 'part_of_day' | 'specific';

export interface TimePeriodConfig {
  id: TimePeriod;
  label: string;
  emoji: string;
  timeRange: { start: string; end: string }; // HH:mm format
  defaultReminder: string; // HH:mm format for push notifications
}

export const TIME_PERIODS: TimePeriodConfig[] = [
  { 
    id: 'start_of_day', 
    label: 'Start of Day', 
    emoji: '☀️', 
    timeRange: { start: '06:00', end: '09:00' },
    defaultReminder: '07:00' 
  },
  { 
    id: 'morning', 
    label: 'Morning', 
    emoji: '🌤️', 
    timeRange: { start: '09:00', end: '12:00' },
    defaultReminder: '09:00' 
  },
  { 
    id: 'afternoon', 
    label: 'Afternoon', 
    emoji: '🌞', 
    timeRange: { start: '12:00', end: '17:00' },
    defaultReminder: '12:00' 
  },
  { 
    id: 'evening', 
    label: 'Evening', 
    emoji: '🌅', 
    timeRange: { start: '17:00', end: '21:00' },
    defaultReminder: '18:00' 
  },
  { 
    id: 'night', 
    label: 'Night', 
    emoji: '🌙', 
    timeRange: { start: '21:00', end: '24:00' },
    defaultReminder: '21:00' 
  },
];

/**
 * Get time mode from task data
 */
export function getTimeMode(task: { scheduled_time?: string | null; time_period?: string | null }): TimeMode {
  if (task.time_period) return 'part_of_day';
  if (task.scheduled_time) return 'specific';
  return 'anytime';
}

/**
 * Get TimePeriodConfig by id
 */
export function getTimePeriodConfig(id: TimePeriod | string | null): TimePeriodConfig | undefined {
  if (!id) return undefined;
  return TIME_PERIODS.find(p => p.id === id);
}

/**
 * Format time display for task cards
 * Returns emoji + label for time periods, formatted time for specific, or "Anytime"
 */
export function formatTimeLabel(task: { scheduled_time?: string | null; time_period?: string | null }): string {
  if (task.time_period) {
    const period = TIME_PERIODS.find(p => p.id === task.time_period);
    return period ? period.label : 'Anytime';
  }
  if (task.scheduled_time) {
    // Format as 12-hour time
    const [hours, minutes] = task.scheduled_time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
  return 'Anytime';
}

/**
 * Format time display with emoji for task cards
 */
export function formatTimeLabelWithEmoji(task: { scheduled_time?: string | null; time_period?: string | null }): string {
  if (task.time_period) {
    const period = TIME_PERIODS.find(p => p.id === task.time_period);
    return period ? `${period.emoji} ${period.label}` : 'Anytime';
  }
  if (task.scheduled_time) {
    const [hours, minutes] = task.scheduled_time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
  return 'Anytime';
}

/**
 * Format time range display (e.g., "6am - 9am")
 */
export function formatTimeRange(period: TimePeriodConfig): string {
  const formatHour = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour === 0 || hour === 24) return '12am';
    if (hour === 12) return '12pm';
    return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
  };
  
  return `${formatHour(period.timeRange.start)} - ${formatHour(period.timeRange.end)}`;
}

/**
 * Get sort order for time period (used in task sorting)
 */
export function getTimePeriodSortOrder(timePeriod: string | null): number {
  if (!timePeriod) return 999; // Anytime tasks go last
  const index = TIME_PERIODS.findIndex(p => p.id === timePeriod);
  return index >= 0 ? index : 999;
}

/**
 * Convert time period to its default reminder time
 * Returns HH:mm format string
 */
export function getDefaultReminderTime(timePeriod: TimePeriod | string | null): string | null {
  if (!timePeriod) return null;
  const period = TIME_PERIODS.find(p => p.id === timePeriod);
  return period?.defaultReminder || null;
}
