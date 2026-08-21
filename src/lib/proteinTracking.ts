import { UserTask } from '@/hooks/useTaskPlanner';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { Egg, Drumstick, Milk, Beef, Fish, Cookie, Bean } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const PROTEIN_UNITS = ['g'] as const;
export type ProteinUnit = typeof PROTEIN_UNITS[number];

export interface ProteinPreset {
  label: string;
  value: number;
  icon: LucideIcon;
}

// Common protein sources (grams of protein per serving), arranged in 2 rows of 4
export const PROTEIN_PRESETS: ProteinPreset[] = [
  { label: 'Egg 6g', value: 6, icon: Egg },
  { label: 'Yogurt 17g', value: 17, icon: Milk },
  { label: 'Whey 25g', value: 25, icon: Beef },
  { label: '½ Chicken 27g', value: 27, icon: Drumstick },
  { label: 'Tuna 30g', value: 30, icon: Fish },
  { label: 'Cottage 14g', value: 14, icon: Milk },
  { label: 'Protein bar 20g', value: 20, icon: Cookie },
  { label: 'Tofu 10g', value: 10, icon: Bean },
];

export function isProteinTask(task: UserTask): boolean {
  if (task.pro_link_type === 'protein') return true;
  if (!task.goal_enabled || task.goal_type !== 'count') return false;
  if (!task.goal_unit) return false;
  return task.goal_unit.toLowerCase() === 'g';
}

export function getProteinPresets(): ProteinPreset[] {
  return PROTEIN_PRESETS;
}

// Create a synthetic protein routine task for RoutinePreviewSheet
export function createProteinRoutineTask(): RoutinePlanTask {
  return {
    id: 'protein-routine-template',
    plan_id: 'synthetic-protein-plan',
    title: 'Hit Protein Goal 🍗',
    icon: '🍗',
    color: 'peach',
    task_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    linked_playlist_id: null,
    pro_link_type: 'protein',
    pro_link_value: null,
    tag: 'pro',
  };
}
