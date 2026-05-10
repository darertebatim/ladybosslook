import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { PersianFlag } from '@/components/ui/PersianFlag';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/haptics';

const LANGUAGE_CHOICES = [
  { label: 'English only', code: 'en', emoji: '🇺🇸' },
  { label: 'فارسی (Persian)', code: 'fa', emoji: 'flag:persian' },
  { label: 'Türkçe (Turkish)', code: 'tr', emoji: '🇹🇷' },
  { label: 'Español (Spanish)', code: 'es', emoji: '🇪🇸' },
] as const;

const DISMISSED_KEY = 'simora_language_popup_dismissed';

interface LanguagePreferencePopupProps {
  open: boolean;
  onClose: () => void;
}

export function LanguagePreferencePopup({ open, onClose }: LanguagePreferencePopupProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSelect = (code: string) => {
    haptic.light();
    setSelected(code);
  };

  const handleConfirm = async () => {
    if (!selected || !user) return;
    setSaving(true);
    haptic.medium();

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_language: selected === 'en' ? null : selected })
        .eq('id', user.id);

      if (error) console.error('[LanguagePopup] Save failed:', error);
    } catch (err) {
      console.error('[LanguagePopup] Error:', err);
    }

    localStorage.setItem(DISMISSED_KEY, 'true');
    setSaving(false);
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10100] flex items-end justify-center bg-black/50"
          onClick={handleSkip}
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
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-7 h-7 text-primary" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground text-center">
              Do you speak a second language?
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-1 mb-5">
              We'll prioritize content in your preferred language.
            </p>

            {/* Language options */}
            <div className="space-y-2">
              {LANGUAGE_CHOICES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                    selected === lang.code
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border bg-background'
                  }`}
                >
                  <span className="text-xl shrink-0">
                    {lang.emoji === 'flag:persian' ? (
                      <PersianFlag size={24} />
                    ) : (
                      lang.emoji
                    )}
                  </span>
                  <span className="text-[15px] font-medium text-foreground flex-1 text-left">
                    {lang.label}
                  </span>
                  {selected === lang.code && (
                    <Check className="w-5 h-5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={!selected || saving}
              className={`w-full mt-5 py-3.5 rounded-2xl font-semibold text-[15px] transition-all ${
                selected
                  ? 'bg-primary text-primary-foreground active:scale-[0.98]'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {saving ? 'Saving...' : 'Continue'}
            </button>

            {/* Skip */}
            <button
              onClick={handleSkip}
              className="w-full mt-2 py-2 text-sm text-muted-foreground font-medium"
            >
              Skip for now
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Returns true if the popup should be shown */
export function shouldShowLanguagePopup(preferredLanguage: string | null | undefined): boolean {
  if (preferredLanguage) return false;
  const dismissed = localStorage.getItem(DISMISSED_KEY);
  return dismissed !== 'true';
}
