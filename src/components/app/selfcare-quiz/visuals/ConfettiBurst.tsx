import { motion } from 'framer-motion';

interface Props {
  count?: number;
  delay?: number;
}

const COLORS = ['#F08A3E', '#EC4899', '#8A5CF0', '#FFD27A', '#FFB6D1'];

/**
 * Lightweight CSS-only confetti burst — small color shards radiating from
 * the center of its container. Use absolutely positioned over visual area.
 */
export function ConfettiBurst({ count = 18, delay = 0 }: Props) {
  const pieces = Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const dist = 90 + ((i * 13) % 50);
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const color = COLORS[i % COLORS.length];
    const rot = (i * 53) % 360;
    const size = 6 + ((i * 7) % 6);
    return { x, y, color, rot, size, key: i };
  });
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.key}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: p.x,
            y: p.y,
            scale: [0.4, 1.1, 1, 0.9],
            rotate: p.rot,
          }}
          transition={{ duration: 1.4, delay, ease: 'easeOut' }}
          className="absolute rounded-[2px]"
          style={{ width: p.size, height: p.size * 1.6, background: p.color }}
        />
      ))}
    </div>
  );
}