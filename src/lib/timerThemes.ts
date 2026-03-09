export interface TimerTheme {
  id: string;
  label: string;
  color: string;
}

export const timerThemes: TimerTheme[] = [
  { id: 'focus', label: 'Focus', color: 'bg-purple-100 text-purple-700' },
  { id: 'read', label: 'Read', color: 'bg-amber-100 text-amber-700' },
  { id: 'study', label: 'Study', color: 'bg-blue-100 text-blue-700' },
  { id: 'workout', label: 'Workout', color: 'bg-rose-100 text-rose-700' },
  { id: 'work', label: 'Work', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'meditate', label: 'Meditate', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'relax', label: 'Relax', color: 'bg-cyan-100 text-cyan-700' },
];
