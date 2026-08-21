import { UserTask } from '@/hooks/useTaskPlanner';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { Egg, Drumstick, Milk, Beef, Fish, Cookie, Bean, Ham, Utensils } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const PROTEIN_UNITS = ['g'] as const;
export type ProteinUnit = typeof PROTEIN_UNITS[number];

export interface ProteinPreset {
  label: string;
  value: number;
  icon: LucideIcon;
  /** Explicit portion so the grams are never ambiguous */
  portion?: string;
  iconKey?: string;
}

// Icon registry so user-customised presets can persist an icon by key
export const PRESET_ICONS: Record<string, LucideIcon> = {
  egg: Egg,
  milk: Milk,
  whey: Beef,
  chicken: Drumstick,
  thigh: Ham,
  wing: Drumstick,
  fish: Fish,
  bar: Cookie,
  bean: Bean,
  other: Utensils,
};

export function getPresetIcon(key?: string | null): LucideIcon {
  return (key && PRESET_ICONS[key]) || Utensils;
}

// Common protein sources with explicit portions
export const PROTEIN_PRESETS: ProteinPreset[] = [
  { label: 'Egg', value: 6, icon: Egg, iconKey: 'egg', portion: '1 large egg' },
  { label: 'Greek yogurt', value: 17, icon: Milk, iconKey: 'milk', portion: '1 cup (170g)' },
  { label: 'Whey', value: 25, icon: Beef, iconKey: 'whey', portion: '1 scoop' },
  { label: 'Chicken breast', value: 27, icon: Drumstick, iconKey: 'chicken', portion: '½ breast (~85g)' },
  { label: 'Chicken thigh', value: 21, icon: Ham, iconKey: 'thigh', portion: '1 thigh (~85g)' },
  { label: 'Chicken wings', value: 12, icon: Drumstick, iconKey: 'wing', portion: '2 wings' },
  { label: 'Tuna', value: 30, icon: Fish, iconKey: 'fish', portion: '1 can drained (142g)' },
  { label: 'Cottage cheese', value: 14, icon: Milk, iconKey: 'milk', portion: '½ cup' },
  { label: 'Protein bar', value: 20, icon: Cookie, iconKey: 'bar', portion: '1 bar' },
  { label: 'Tofu', value: 10, icon: Bean, iconKey: 'bean', portion: '½ cup firm' },
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
