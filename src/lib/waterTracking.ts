import { UserTask } from '@/hooks/useTaskPlanner';
import { RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { Coffee, GlassWater, CupSoda, Wine, Milk } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const WATER_UNITS = ['oz', 'ml', 'cups', 'glasses'] as const;
export type WaterUnit = typeof WATER_UNITS[number];

export interface CupPreset {
  label: string;
  value: number;
  icon: LucideIcon;
}

export const CUP_PRESETS: Record<string, CupPreset[]> = {
  oz: [
    { label: '8oz', value: 8, icon: Coffee },
    { label: '12oz', value: 12, icon: GlassWater },
    { label: '16oz', value: 16, icon: CupSoda },
    { label: '20oz', value: 20, icon: Wine },
    { label: '32oz', value: 32, icon: Milk },
  ],
  ml: [
    { label: '200ml', value: 200, icon: Coffee },
    { label: '250ml', value: 250, icon: GlassWater },
    { label: '350ml', value: 350, icon: CupSoda },
    { label: '500ml', value: 500, icon: Wine },
    { label: '1L', value: 1000, icon: Milk },
  ],
  cups: [
    { label: '½ cup', value: 0.5, icon: Coffee },
    { label: '1 cup', value: 1, icon: GlassWater },
    { label: '1.5 cups', value: 1.5, icon: CupSoda },
    { label: '2 cups', value: 2, icon: Wine },
    { label: '3 cups', value: 3, icon: Milk },
  ],
  glasses: [
    { label: '½ glass', value: 0.5, icon: Coffee },
    { label: '1 glass', value: 1, icon: GlassWater },
    { label: '1.5 glasses', value: 1.5, icon: CupSoda },
    { label: '2 glasses', value: 2, icon: Wine },
    { label: '3 glasses', value: 3, icon: Milk },
  ],
};

export function isWaterTask(task: UserTask): boolean {
  if (!task.goal_enabled || task.goal_type !== 'count') return false;
  if (!task.goal_unit) return false;
  
  const unit = task.goal_unit.toLowerCase();
  return WATER_UNITS.includes(unit as WaterUnit);
}

export function getPresetsForUnit(unit: string): CupPreset[] {
  const normalizedUnit = unit.toLowerCase();
  return CUP_PRESETS[normalizedUnit] || CUP_PRESETS.oz;
}

export function formatWaterUnit(unit: string, value: number): string {
  const normalizedUnit = unit.toLowerCase();
  
  // Handle singular/plural for cups and glasses
  if (normalizedUnit === 'cups') {
    return value === 1 ? 'cup' : 'cups';
  }
  if (normalizedUnit === 'glasses') {
    return value === 1 ? 'glass' : 'glasses';
  }
  
  return unit;
}

// Create a synthetic water routine task for RoutinePreviewSheet
export function createWaterRoutineTask(): RoutinePlanTask {
  return {
    id: 'water-routine-template',
    plan_id: 'synthetic-water-plan',
    title: 'Drink Water 💧',
    icon: '💧',
    color: 'sky', // Match the water theme
    task_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    linked_playlist_id: null,
    // Pro Task link to water tracking tool
    pro_link_type: 'water',
    pro_link_value: null,
  };
}
