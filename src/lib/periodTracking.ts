import { format, differenceInDays, addDays, subDays, parseISO, isValid } from 'date-fns';

// Cycle phase types
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface CyclePhaseInfo {
  phase: CyclePhase;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
}

export interface CycleStatus {
  dayOfCycle: number;
  cycleLength: number;
  phase: CyclePhaseInfo;
  daysUntilPeriod: number | null;
  daysUntilOvulation: number | null;
  isOnPeriod: boolean;
  nextPeriodDate: Date | null;
  ovulationDate: Date | null;
}

export interface PeriodLog {
  id: string;
  user_id: string;
  date: string;
  is_period_day: boolean;
  flow_intensity: 'light' | 'medium' | 'heavy' | null;
  symptoms: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PeriodSettings {
  id: string;
  user_id: string;
  average_cycle: number;
  average_period: number;
  last_period_start: string | null;
  reminder_enabled: boolean;
  reminder_days: number;
  show_on_home: boolean;
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
}

// Symptom options with emojis
export const SYMPTOM_OPTIONS = [
  { id: 'cramps', label: 'Cramps', emoji: '😣' },
  { id: 'bloating', label: 'Bloating', emoji: '🫃' },
  { id: 'headache', label: 'Headache', emoji: '🤕' },
  { id: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { id: 'mood_swings', label: 'Mood swings', emoji: '🎭' },
  { id: 'cravings', label: 'Cravings', emoji: '🍫' },
  { id: 'back_pain', label: 'Back pain', emoji: '🔙' },
  { id: 'tender_breasts', label: 'Tender breasts', emoji: '💔' },
] as const;

// Flow intensity options
export const FLOW_OPTIONS = [
  { id: 'light', label: 'Light', emoji: '💧' },
  { id: 'medium', label: 'Medium', emoji: '💧💧' },
  { id: 'heavy', label: 'Heavy', emoji: '💧💧💧' },
] as const;

// Get cycle phase info based on day of cycle
export function getCyclePhaseInfo(dayOfCycle: number, cycleLength: number): CyclePhaseInfo {
  const ovulationDay = cycleLength - 14; // ~14 days before next period

  if (dayOfCycle <= 5) {
    return {
      phase: 'menstrual',
      name: 'Menstrual',
      emoji: '🩸',
      color: 'rose',
      bgColor: 'bg-rose-100 dark:bg-rose-900/30',
      description: 'Period phase - rest and recover',
    };
  }
  
  if (dayOfCycle < ovulationDay - 2) {
    return {
      phase: 'follicular',
      name: 'Follicular',
      emoji: '🌱',
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: 'Building energy - great for new projects',
    };
  }
  
  if (dayOfCycle <= ovulationDay + 2) {
    return {
      phase: 'ovulation',
      name: 'Ovulation',
      emoji: '✨',
      color: 'amber',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      description: 'Peak energy - most fertile window',
    };
  }
  
  return {
    phase: 'luteal',
    name: 'Luteal',
    emoji: '🌙',
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Winding down - focus on self-care',
  };
}

// Calculate current cycle status
export function getCycleStatus(
  lastPeriodStart: string | null,
  averageCycle: number,
  todayLogs: PeriodLog[]
): CycleStatus | null {
  if (!lastPeriodStart) return null;

  const lastStart = parseISO(lastPeriodStart);
  if (!isValid(lastStart)) return null;

  const today = new Date();
  const dayOfCycle = differenceInDays(today, lastStart) + 1;
  
  // Handle if we're past the expected cycle length (period should have started)
  const effectiveDayOfCycle = dayOfCycle > averageCycle + 7 ? dayOfCycle : Math.min(dayOfCycle, averageCycle);
  
  const phase = getCyclePhaseInfo(effectiveDayOfCycle, averageCycle);
  const ovulationDay = averageCycle - 14;
  const daysUntilOvulation = ovulationDay - effectiveDayOfCycle;
  const daysUntilPeriod = averageCycle - effectiveDayOfCycle;
  
  const nextPeriodDate = addDays(lastStart, averageCycle);
  const ovulationDate = addDays(lastStart, ovulationDay);
  
  // Check if currently on period (either first 5 days or has period log for today)
  const isOnPeriod = effectiveDayOfCycle <= 5 || todayLogs.some(log => log.is_period_day);

  return {
    dayOfCycle: effectiveDayOfCycle,
    cycleLength: averageCycle,
    phase,
    daysUntilPeriod: daysUntilPeriod > 0 ? daysUntilPeriod : null,
    daysUntilOvulation: daysUntilOvulation > 0 && daysUntilOvulation <= ovulationDay ? daysUntilOvulation : null,
    isOnPeriod,
    nextPeriodDate,
    ovulationDate,
  };
}

// Calculate predicted period days for a date range
export function getPredictedPeriodDays(
  lastPeriodStart: string | null,
  averageCycle: number,
  averagePeriodLength: number,
  startDate: Date,
  endDate: Date
): Set<string> {
  const predicted = new Set<string>();
  
  if (!lastPeriodStart) return predicted;
  
  const lastStart = parseISO(lastPeriodStart);
  if (!isValid(lastStart)) return predicted;
  
  // Calculate how many cycles from last period to cover the date range
  let cycleStart = lastStart;
  
  // Go back a few cycles if needed
  while (cycleStart > startDate) {
    cycleStart = subDays(cycleStart, averageCycle);
  }
  
  // Go forward and mark predicted period days
  while (cycleStart < endDate) {
    // Mark period days for this cycle
    for (let i = 0; i < averagePeriodLength; i++) {
      const periodDay = addDays(cycleStart, i);
      if (periodDay >= startDate && periodDay <= endDate) {
        predicted.add(format(periodDay, 'yyyy-MM-dd'));
      }
    }
    cycleStart = addDays(cycleStart, averageCycle);
  }
  
  return predicted;
}

// Calculate ovulation days for a date range
export function getPredictedOvulationDays(
  lastPeriodStart: string | null,
  averageCycle: number,
  startDate: Date,
  endDate: Date
): Set<string> {
  const ovulationDays = new Set<string>();
  
  if (!lastPeriodStart) return ovulationDays;
  
  const lastStart = parseISO(lastPeriodStart);
  if (!isValid(lastStart)) return ovulationDays;
  
  const ovulationOffset = averageCycle - 14; // Ovulation ~14 days before next period
  
  let cycleStart = lastStart;
  
  // Go back a few cycles if needed
  while (cycleStart > startDate) {
    cycleStart = subDays(cycleStart, averageCycle);
  }
  
  // Go forward and mark ovulation days (window of about 5 days)
  while (cycleStart < endDate) {
    const ovulationCenter = addDays(cycleStart, ovulationOffset);
    
    for (let i = -2; i <= 2; i++) {
      const ovDay = addDays(ovulationCenter, i);
      if (ovDay >= startDate && ovDay <= endDate) {
        ovulationDays.add(format(ovDay, 'yyyy-MM-dd'));
      }
    }
    
    cycleStart = addDays(cycleStart, averageCycle);
  }
  
  return ovulationDays;
}

// Format status text for display
export function getStatusText(status: CycleStatus | null): string {
  if (!status) return 'Start tracking';
  
  if (status.isOnPeriod) {
    return `Day ${status.dayOfCycle} · Period`;
  }
  
  if (status.daysUntilPeriod !== null && status.daysUntilPeriod <= 3 && status.daysUntilPeriod > 0) {
    return `Period in ${status.daysUntilPeriod} day${status.daysUntilPeriod === 1 ? '' : 's'}`;
  }
  
  return `Day ${status.dayOfCycle} · ${status.phase.name}`;
}

// Get subtitle text for home card
export function getSubtitleText(status: CycleStatus | null): string {
  if (!status) return 'Tap to set up';
  
  return `Day ${status.dayOfCycle} of ${status.cycleLength}`;
}

// Calculate average cycle length from period logs
export function calculateAverageCycle(logs: PeriodLog[]): number | null {
  // Find all period start days (first day of each period)
  const periodStartDays: Date[] = [];
  const sortedLogs = [...logs]
    .filter(log => log.is_period_day)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (sortedLogs.length < 2) return null;
  
  let previousDate: Date | null = null;
  
  for (const log of sortedLogs) {
    const currentDate = parseISO(log.date);
    
    // If this is the first day or there's a gap of more than 3 days, it's a new period
    if (!previousDate || differenceInDays(currentDate, previousDate) > 3) {
      periodStartDays.push(currentDate);
    }
    previousDate = currentDate;
  }
  
  if (periodStartDays.length < 2) return null;
  
  // Calculate cycle lengths between consecutive period starts
  const cycleLengths: number[] = [];
  for (let i = 1; i < periodStartDays.length; i++) {
    const cycleLength = differenceInDays(periodStartDays[i], periodStartDays[i - 1]);
    if (cycleLength >= 21 && cycleLength <= 45) {
      cycleLengths.push(cycleLength);
    }
  }
  
  if (cycleLengths.length === 0) return null;
  
  // Calculate weighted average (recent cycles weighted more)
  const weights = cycleLengths.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = cycleLengths.reduce((sum, len, i) => sum + len * weights[i], 0);
  
  return Math.round(weightedSum / totalWeight);
}
