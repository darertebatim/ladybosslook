import { motion, AnimatePresence } from 'framer-motion';
import { Star, Share2, Gift, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { haptic } from '@/lib/haptics';
import { openIOSReviewPage, openAndroidReviewPage } from '@/hooks/useAppReview';
import { useShareContent } from '@/hooks/useShareContent';

const DISMISSED_KEY = 'simora_language_change_thanks_dismissed';

interface LanguageChangeThanksPopupProps {
  open: boolean;
  /** Language the user just switched to (e.g. 'fa'). Drives copy. */
  lang: string;
  onClose: () => void;
}

const COPY: Record<string, {
  title: string;
  body: string;
  rate: string;
  share: string;
  later: string;
  shareTitle: string;
  shareText: string;
  dir: 'ltr' | 'rtl';
}> = {
  fa: {
    title: '❤️ از انتخابت ممنونیم',
    body: 'ترجمه و آماده‌سازی ریلو به زبان فارسی برای ما کار سختی بود — تا تجربه‌ات راحت‌تر باشه. اگه دوستش داری، با ۵ ستاره و معرفی به دوستات از ما حمایت کن.',
    rate: '⭐ امتیاز ۵ ستاره',
    share: 'به دوستات معرفی کن',
    later: 'بعداً',
    shareTitle: 'ریلو',
    shareText: 'ریلو رو امتحان کن — به فارسی هم هست! 💛',
    dir: 'rtl',
  },
  en: {
    title: '❤️ Thanks for switching',
    body: 'Translating Rilo into your language took real work — to make your experience feel like home. If you love it, support us with a 5-star rating and tell a friend.',
    rate: '⭐ Rate 5 stars',
    share: 'Share with a friend',
    later: 'Maybe later',
    shareTitle: 'Rilo',
    shareText: 'Try Rilo — it now speaks your language! 💛',
    dir: 'ltr',
  },
};

export function LanguageChangeThanksPopup({ open, lang, onClose }: LanguageChangeThanksPopupProps) {
  const copy = COPY[lang] ?? COPY.en;
  const isFarsi = lang === 'fa';
  const fontClass = isFarsi ? 'font-farsi' : '';

  const { handleShare } = useShareContent({
    title: copy.shareTitle,
    text: copy.shareText,
    source: 'language_change_thanks',
  });

  const handleClose = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    onClose();
  };

  const handleRate = async () => {
    haptic.medium();
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') await openIOSReviewPage('language_change_thanks');
    else if (platform === 'android') await openAndroidReviewPage('language_change_thanks');
    handleClose();
  };

  const handleShareClick = async () => {
    haptic.light();
    await handleShare();
    handleClose();
  };

  return (
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
            dir={copy.dir}
            className={`w-full max-w-lg bg-background rounded-t-3xl px-6 pt-6 pb-8 relative overflow-hidden ${fontClass}`}
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            {/* Soft gift glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute top-6 right-6 text-primary/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="pointer-events-none absolute top-10 left-8 text-primary/30">
              <Sparkles className="w-3.5 h-3.5" />
            </div>

            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            <div className="relative flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 0.05 }}
                className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-ios"
              >
                <Gift className="w-10 h-10 text-primary-foreground" strokeWidth={2.2} />
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: 'spring', damping: 12 }}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-background flex items-center justify-center"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </motion.div>
              </motion.div>
            </div>

            <h2 className={`text-2xl font-bold text-foreground text-center leading-snug ${fontClass}`}>
              {copy.title}
            </h2>
            <p className={`text-[15px] text-muted-foreground text-center mt-3 mb-6 leading-relaxed px-1 ${fontClass}`}>
              {copy.body}
            </p>

            <button
              onClick={handleRate}
              className={`w-full py-4 rounded-2xl font-semibold text-[15px] bg-gradient-to-r from-primary to-primary/85 text-primary-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-ios ${fontClass}`}
            >
              <Star className="w-4 h-4 fill-current" />
              {copy.rate}
            </button>

            <button
              onClick={handleShareClick}
              className={`w-full mt-2 py-4 rounded-2xl font-semibold text-[15px] bg-muted text-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${fontClass}`}
            >
              <Share2 className="w-4 h-4" />
              {copy.share}
            </button>

            <button
              onClick={handleClose}
              className={`w-full mt-3 py-2 text-sm text-muted-foreground font-medium ${fontClass}`}
            >
              {copy.later}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Returns true if the thanks popup should be shown for this user. */
export function shouldShowLanguageChangeThanks(): boolean {
  return localStorage.getItem(DISMISSED_KEY) !== 'true';
}