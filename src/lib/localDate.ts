import { format, parseISO } from 'date-fns';

/**
 * Centralized local date utilities
 * 
 * IMPORTANT: Never use `.toISOString().split('T')[0]` for local date strings!
 * `.toISOString()` converts to UTC which can shift the date by ±1 day depending on timezone.
 * 
 * Always use these helpers instead, which use `date-fns/format` under the hood
 * and respect the user's local timezone.
 */

/**
 * Get today's date as a local 'yyyy-MM-dd' string.
 * Safe across all timezones.
 */
export function getLocalDateStr(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get the local day of week (0=Sun, 6=Sat) for a date.
 */
export function getLocalDayOfWeek(date: Date = new Date()): number {
  return date.getDay();
}

/**
 * Check if a repeating task should appear on the given date.
 * This is the SINGLE SOURCE OF TRUTH for task-date filtering.
 * 
 * All hooks that filter tasks for a date MUST use this function
 * to avoid inconsistencies.
 */
export function taskAppliesToDate(
  task: {
    scheduled_date: string | null;
    repeat_pattern: string;
    repeat_days: number[] | null;
    created_at?: string;
    repeat_end_date?: string | null;
  },
  dateStr: string
): boolean {
  const date = parseISO(dateStr);
  const dayOfWeek = date.getDay();

  // Check if task existed on or before this date (prevents retroactive changes)
  if (task.created_at) {
    const taskCreatedLocalDate = getLocalDateStr(new Date(task.created_at));
    if (taskCreatedLocalDate > dateStr) {
      return false;
    }
  }

  // Check if task has ended (repeat_end_date)
  if (task.repeat_end_date && dateStr > task.repeat_end_date) {
    return false;
  }

  // Non-repeating tasks - only show on scheduled date
  if (task.repeat_pattern === 'none') {
    return task.scheduled_date === dateStr;
  }

  // All repeating patterns: enforce start date (scheduled_date)
  if (task.scheduled_date && task.scheduled_date > dateStr) {
    return false;
  }

  // Daily tasks
  if (task.repeat_pattern === 'daily') {
    return true;
  }

  // Weekend tasks - only Sat/Sun
  if (task.repeat_pattern === 'weekend') {
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  // Weekly tasks - check repeat_days first, fall back to scheduled_date day
  if (task.repeat_pattern === 'weekly') {
    if (task.repeat_days && task.repeat_days.length > 0) {
      return task.repeat_days.includes(dayOfWeek);
    }
    if (task.scheduled_date) {
      const originalDay = parseISO(task.scheduled_date).getDay();
      return dayOfWeek === originalDay;
    }
  }

  // Monthly tasks - show on same day of month
  if (task.repeat_pattern === 'monthly' && task.scheduled_date) {
    const originalDate = parseISO(task.scheduled_date).getDate();
    return date.getDate() === originalDate;
  }

  // Custom - check repeat_days array
  if (task.repeat_pattern === 'custom' && task.repeat_days) {
    return task.repeat_days.includes(dayOfWeek);
  }

  return false;
}
