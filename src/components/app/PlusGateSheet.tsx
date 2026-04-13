import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Crown, Sparkles, ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlusGateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolName: string;
  toolEmoji: string;
  toolDescription: string;
  onStartTrial: () => void;
}

export function PlusGateSheet({
  open,
  onOpenChange,
  toolName,
  toolEmoji,
  toolDescription,
  onStartTrial,
}: PlusGateSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[28px] px-6 pb-8 pt-6 border-0 bg-white">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-muted/80 active:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Tool icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-4"
          >
            <span className="text-4xl">{toolEmoji}</span>
          </motion.div>

          {/* Plus badge */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1.5 bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-xs font-bold mb-3"
          >
            <Crown className="h-3.5 w-3.5" />
            Simora Plus Feature
          </motion.div>

          {/* Premium explainer box */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.22 }}
            className="w-full rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 px-4 py-3.5 mb-4"
          >
            <p className="text-[13px] text-foreground font-semibold leading-snug">
              ✨ Premium tools are designed for professionals who want to level up their daily life.
            </p>
            <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
              Are you ready to become a Simora Plus member?
            </p>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-xl font-extrabold text-foreground mb-2"
          >
            {toolName}
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-[280px]"
          >
            {toolDescription}
          </motion.p>

          {/* Gift box CTA */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="w-full rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/60 px-5 py-4 mb-4 relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">🎁</div>
            <p className="text-[15px] text-foreground font-bold mt-1">
              Get Your 7-Day Free Trial
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Answer a few questions & unlock all Plus features
            </p>
          </motion.div>

          {/* Primary CTA */}
          <motion.button
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={onStartTrial}
            className="w-full py-4 rounded-2xl bg-[#1a1f3d] text-white font-semibold text-[15px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Start Free Trial Journey
            <ArrowRight className="h-4 w-4" />
          </motion.button>

          {/* Secondary */}
          <button
            onClick={() => onOpenChange(false)}
            className="mt-3 text-sm text-muted-foreground font-medium active:opacity-60"
          >
            Maybe Later
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
