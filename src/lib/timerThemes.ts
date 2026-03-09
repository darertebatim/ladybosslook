export interface TimerTheme {
  id: string;
  label: string;
  color: string;
}

export const timerThemes: TimerTheme[] = [
  { id: 'focus', label: 'Focus', color: 'bg-muted text-foreground' },
  { id: 'read', label: 'Read', color: 'bg-muted text-foreground' },
  { id: 'study', label: 'Study', color: 'bg-muted text-foreground' },
  { id: 'workout', label: 'Workout', color: 'bg-muted text-foreground' },
  { id: 'work', label: 'Work', color: 'bg-muted text-foreground' },
  { id: 'meditate', label: 'Meditate', color: 'bg-muted text-foreground' },
  { id: 'relax', label: 'Relax', color: 'bg-muted text-foreground' },
];
