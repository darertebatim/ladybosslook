import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AmbientGlow, GlowPalette } from './AmbientGlow';

interface QuizShellProps {
  children: ReactNode;
  /** Visible visual area on top */
  visual?: ReactNode;
  /** Title/subtitle/CTA region underneath */
  footer?: ReactNode;
  gradient?: string;
  glow?: GlowPalette;
  /** Use scrollable body (forms with many fields) */
  scrollable?: boolean;
  className?: string;
}

/**
 * Shared shell for the redesigned Self-Care Quiz, mirroring the "What is Rilo?"
 * design language. No mascot images — pure gradient + ambient glow + animated
 * visual components.
 */
export function QuizShell({
  children,
  visual,
  footer,
  gradient = 'bg-gradient-to-b from-[#FFF1E0] via-[#FFE8F0] to-[#F0E6FF]',
  glow = 'warm',
  scrollable = false,
  className = '',
}: QuizShellProps) {
  return (
    <div className={`h-full w-full flex flex-col relative overflow-hidden ${gradient} ${className}`}>
      <AmbientGlow palette={glow} />
      {visual !== undefined ? (
        <>
          <div className="flex-1 flex items-center justify-center px-6 pt-6 pb-2 relative z-10 min-h-0">
            {visual}
          </div>
          <div className="shrink-0 px-6 pb-8 relative z-10" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)' }}>
            {footer}
          </div>
        </>
      ) : (
        <div className={`flex-1 ${scrollable ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden'} relative z-10 px-6 pt-6`}
             style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface QuizHeadProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  delay?: number;
}

/** Standard heading block (eyebrow + title + subtitle) used across quiz pages. */
export function QuizHead({ eyebrow, title, subtitle, align = 'center', delay = 0 }: QuizHeadProps) {
  const alignCls = align === 'center' ? 'text-center' : 'text-left';
  return (
    <div className={alignCls}>
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay }}
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8590E]"
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: delay + 0.06 }}
        className={`text-[24px] leading-[1.2] font-extrabold text-[#1a1f3d] whitespace-pre-line ${eyebrow ? 'mt-2' : ''}`}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.14 }}
          className="mt-3 text-[14px] text-[#1a1f3d]/70 leading-snug whitespace-pre-line"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  delay?: number;
}

/** Gradient warm CTA used everywhere in the quiz. */
export function PrimaryButton({ children, onClick, disabled, delay = 0 }: PrimaryButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[56px] rounded-2xl text-white font-bold text-[16px] active:opacity-80 transition-opacity bg-gradient-to-r from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] shadow-[0_12px_30px_-8px_rgba(138,92,240,0.55)] disabled:opacity-50"
    >
      {children}
    </motion.button>
  );
}

interface SecondaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  delay?: number;
}

export function SecondaryButton({ children, onClick, delay = 0 }: SecondaryButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className="mt-3 w-full h-[44px] rounded-xl text-[#1a1f3d]/70 font-semibold text-[14px] active:opacity-60 transition-opacity"
    >
      {children}
    </motion.button>
  );
}