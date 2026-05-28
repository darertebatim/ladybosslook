import { motion, AnimatePresence } from 'framer-motion';
import { Settings2 } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { OverlayPortal } from '@/components/app/OverlayPortal';

const DISMISSED_KEY = 'simora_language_settings_hint_dismissed';

interface LanguageSettingsHintPopupProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Secondary educational sheet shown after the user picks (or already has)
 * a preferred language. Tells them where to change the app's UI language
 * later. Shown once per user (localStorage flag).
 */
export function LanguageSettingsHintPopup({ open, onClose }: LanguageSettingsHintPopupProps) {
  // Disabled: replaced by the new onboarding flows. Kept mounted so admin
  // test page still resolves the import, but the sheet never renders.
  void open;
  void onClose;
  return null;

  const handleClose = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    haptic.light();
    onClose();
  };

  return (
    <OverlayPortal>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10100] flex items-end justify-center bg-black/50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-background rounded-t-3xl px-6 pt-6 pb-8"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Settings2 className="w-7 h-7 text-primary" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-foreground text-center">
              Want to change the app's language?
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-2 mb-5 leading-relaxed">
              You can change Rilo's interface language anytime from{' '}
              <span className="font-semibold text-foreground">Settings</span>.
              This is separate from your preferred content language.
            </p>

            <button
              onClick={handleClose}
              className="w-full py-3.5 rounded-2xl font-semibold text-[15px] bg-primary text-primary-foreground active:scale-[0.98] transition-all"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </OverlayPortal>
  );
}

/** Returns true if the hint popup should be shown */
export function shouldShowLanguageSettingsHint(): boolean {
  return localStorage.getItem(DISMISSED_KEY) !== 'true';
}