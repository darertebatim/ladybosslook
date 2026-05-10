import { motion } from 'framer-motion';

export type GlowPalette = 'warm' | 'rosé' | 'sunrise' | 'mint' | 'lavender' | 'peach' | 'pink' | 'gold';

const PALETTES: Record<GlowPalette, { color: string; pos: string }[]> = {
  warm: [
    { color: '#FFD6A5', pos: '-top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px]' },
    { color: '#CDE7FF', pos: 'top-1/3 -right-20 w-[260px] h-[260px]' },
    { color: '#E5D6FF', pos: 'bottom-10 -left-16 w-[300px] h-[300px]' },
  ],
  'rosé': [
    { color: '#FFC3D6', pos: '-top-20 -left-16 w-[360px] h-[360px]' },
    { color: '#FFE2C5', pos: 'bottom-10 -right-12 w-[300px] h-[300px]' },
  ],
  sunrise: [
    { color: '#FFD27A', pos: '-top-16 left-1/2 -translate-x-1/2 w-[440px] h-[440px]' },
    { color: '#FFB3C0', pos: 'bottom-0 -left-20 w-[320px] h-[320px]' },
    { color: '#FFD6A5', pos: 'bottom-10 -right-12 w-[260px] h-[260px]' },
  ],
  mint: [
    { color: '#B5EAD0', pos: '-top-20 -right-16 w-[360px] h-[360px]' },
    { color: '#D6F5E8', pos: 'bottom-0 -left-12 w-[320px] h-[320px]' },
  ],
  lavender: [
    { color: '#D6C4FF', pos: '-top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px]' },
    { color: '#FFD6E8', pos: 'bottom-0 -right-12 w-[300px] h-[300px]' },
  ],
  peach: [
    { color: '#FFC498', pos: '-top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px]' },
    { color: '#FFE8D2', pos: 'bottom-10 -left-12 w-[280px] h-[280px]' },
  ],
  pink: [
    { color: '#FFB6D1', pos: '-top-20 -left-12 w-[360px] h-[360px]' },
    { color: '#FFD2A5', pos: 'bottom-0 -right-16 w-[320px] h-[320px]' },
  ],
  gold: [
    { color: '#FFE08A', pos: '-top-16 left-1/2 -translate-x-1/2 w-[420px] h-[420px]' },
    { color: '#FFB6D1', pos: 'bottom-0 -right-12 w-[280px] h-[280px]' },
    { color: '#FFD27A', pos: 'top-1/2 -left-12 w-[240px] h-[240px]' },
  ],
};

interface Props {
  palette?: GlowPalette;
  /** Render gentle drifting sparkles overlay */
  sparkles?: boolean;
}

/**
 * Soft radial glow blobs + optional sparkle overlay used as the ambient
 * backdrop on every redesigned Self-Care Quiz screen.
 */
export function AmbientGlow({ palette = 'warm', sparkles = true }: Props) {
  const blobs = PALETTES[palette];
  const dots = sparkles ? Array.from({ length: 12 }) : [];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {blobs.map((b, i) => (
        <div
          key={i}
          className={`absolute rounded-full blur-3xl opacity-60 ${b.pos}`}
          style={{ background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)` }}
        />
      ))}
      {dots.map((_, i) => {
        const left = (i * 41) % 100;
        const top = (i * 53) % 100;
        const delay = (i % 7) * 0.35;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.85, 0], scale: [0.4, 1, 0.4] }}
            transition={{ duration: 2.4, delay, repeat: Infinity, repeatDelay: 1.4 }}
            className="absolute text-[10px]"
            style={{ left: `${left}%`, top: `${top}%`, color: '#1a1f3d', opacity: 0.55 }}
          >
            ✨
          </motion.span>
        );
      })}
    </div>
  );
}