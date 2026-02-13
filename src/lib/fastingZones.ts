export interface FastingZone {
  id: string;
  emoji: string;
  name: string;
  minHours: number;
  maxHours: number;
  color: string;
  description: string;
}

export const FASTING_ZONES: FastingZone[] = [
  {
    id: 'anabolic',
    emoji: '🍴',
    name: 'Anabolic',
    minHours: 0,
    maxHours: 4,
    color: '#F59E0B',
    description: 'Your body is digesting and absorbing nutrients from your last meal. Blood sugar and insulin levels are elevated.',
  },
  {
    id: 'catabolic',
    emoji: '⚡',
    name: 'Catabolic',
    minHours: 4,
    maxHours: 16,
    color: '#EF4444',
    description: 'Blood sugar drops and your body begins burning through glycogen stores. Growth hormone starts to increase.',
  },
  {
    id: 'fat-burning',
    emoji: '🔥',
    name: 'Fat Burning',
    minHours: 16,
    maxHours: 24,
    color: '#8B5CF6',
    description: 'Glycogen is depleted and your body switches to burning fat for energy. Autophagy begins.',
  },
  {
    id: 'ketosis',
    emoji: '🥑',
    name: 'Ketosis',
    minHours: 24,
    maxHours: 72,
    color: '#3B82F6',
    description: 'Your liver converts fatty acids into ketone bodies. Mental clarity increases and inflammation decreases.',
  },
  {
    id: 'deep-ketosis',
    emoji: '🚀',
    name: 'Deep Ketosis',
    minHours: 72,
    maxHours: Infinity,
    color: '#06B6D4',
    description: 'Peak autophagy — your body recycles damaged cells. Immune system regeneration and cellular repair.',
  },
];

export function getCurrentZone(elapsedHours: number): FastingZone {
  for (let i = FASTING_ZONES.length - 1; i >= 0; i--) {
    if (elapsedHours >= FASTING_ZONES[i].minHours) {
      return FASTING_ZONES[i];
    }
  }
  return FASTING_ZONES[0];
}

export function getZoneProgress(elapsedHours: number, zone: FastingZone): number {
  if (zone.maxHours === Infinity) return Math.min((elapsedHours - zone.minHours) / 48, 1);
  const range = zone.maxHours - zone.minHours;
  return Math.min((elapsedHours - zone.minHours) / range, 1);
}

export interface FastingProtocol {
  id: string;
  name: string;
  label: string;
  fastingHours: number;
  color: string;
}

export const FASTING_PROTOCOLS: FastingProtocol[] = [
  { id: 'circadian', name: 'Circadian', label: '13h', fastingHours: 13, color: '#FFD6E8' },
  { id: '15:9', name: '15:9 TRF', label: '15h', fastingHours: 15, color: '#FFE4C4' },
  { id: '16:8', name: '16:8 TRF', label: '16h', fastingHours: 16, color: '#FFF59D' },
  { id: '18:6', name: '18:6 TRF', label: '18h', fastingHours: 18, color: '#C5E8FA' },
  { id: '20:4', name: '20:4 TRF', label: '20h', fastingHours: 20, color: '#B8F5E4' },
  { id: 'omad', name: 'OMAD', label: '23h', fastingHours: 23, color: '#E8D4F8' },
];
