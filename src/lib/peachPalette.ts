const PEACHES = [
  'hsl(31 100% 89%)',
  'hsl(28 100% 84%)',
  'hsl(22 100% 87%)',
  'hsl(35 100% 90%)',
  'hsl(18 100% 88%)',
  'hsl(30 90% 82%)',
];

export function pickPeach(seed: string | undefined | null): string {
  const s = seed || '';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PEACHES[h % PEACHES.length];
}