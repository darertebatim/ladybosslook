import { motion } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

interface Props {
  emoji: string;
  label?: string;
  size?: number;
  delay?: number;
  amplitude?: number;
  className?: string;
  style?: React.CSSProperties;
  emojiSize?: number;
}

/**
 * A floating 3D-emoji chip that gently drifts up/down. Used as decorative
 * elements scattered around the visual area.
 */
export function FloatingChip({
  emoji,
  label,
  delay = 0,
  amplitude = 6,
  className = '',
  style,
  emojiSize = 22,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 4 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -amplitude, 0, amplitude * 0.6, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay, type: 'spring', stiffness: 200, damping: 16 },
        y: { duration: 4 + (delay % 2), delay, repeat: Infinity, ease: 'easeInOut' },
      }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-sm border border-white shadow-[0_8px_24px_-10px_rgba(138,92,240,0.45)] ${className}`}
      style={style}
    >
      <FluentEmoji emoji={emoji} size={emojiSize} />
      {label && <span className="text-[12px] font-bold text-[#1a1f3d]">{label}</span>}
    </motion.div>
  );
}