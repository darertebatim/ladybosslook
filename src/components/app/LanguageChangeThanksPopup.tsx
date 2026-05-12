import { motion, AnimatePresence } from 'framer-motion';
import { Star, Share2, Heart } from 'lucide-react';
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
            className="w-full max-w-lg bg-background rounded-t-3xl px-6 pt-6 pb-8"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Heart className="w-7 h-7 text-primary fill-primary" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-foreground text-center">
              {copy.title}
            </h2>
            <p className="text-[15px] text-muted-foreground text-center mt-2 mb-5 leading-relaxed">
              {copy.body}
            </p>

            <button
              onClick={handleRate}
              className="w-full py-3.5 rounded-2xl font-semibold text-[15px] bg-primary text-primary-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4 fill-current" />
              {copy.rate}
            </button>

            <button
              onClick={handleShareClick}
              className="w-full mt-2 py-3.5 rounded-2xl font-semibold text-[15px] bg-muted text-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              {copy.share}
            </button>

            <button
              onClick={handleClose}
              className="w-full mt-2 py-2 text-sm text-muted-foreground font-medium"
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