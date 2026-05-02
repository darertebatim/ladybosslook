import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoBack } from '@/hooks/useGoBack';
import { useTranslation } from 'react-i18next';
import { usePublishedContent, useReadingUserProgress, ReadingContent } from '@/hooks/useReading';
import { ArrowLeft, BookOpen, CheckCircle2, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { CachedImage } from '@/components/ui/CachedImage';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallSheet } from '@/components/app/PaywallSheet';

const FREE_READS = 3;
// Distinct content IDs the user has opened (lifetime). Prefixed with `simora_`
// so it's wiped by `fullClientReset`.
const openedKey = (uid?: string | null) => `simora_reads_opened_${uid || 'anon'}`;
const giftSeenKey = (uid?: string | null) => `simora_reads_gift_seen_${uid || 'anon'}`;

const readOpenedSet = (uid?: string | null): Set<string> => {
  try {
    const raw = localStorage.getItem(openedKey(uid));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch { return new Set(); }
};
const writeOpenedSet = (uid: string | null | undefined, set: Set<string>) => {
  try { localStorage.setItem(openedKey(uid), JSON.stringify(Array.from(set))); } catch {}
};
const readGiftSeen = (uid?: string | null): boolean => {
  try { return localStorage.getItem(giftSeenKey(uid)) === '1'; } catch { return false; }
};
const writeGiftSeen = (uid?: string | null) => {
  try { localStorage.setItem(giftSeenKey(uid), '1'); } catch {}
};


// Map theme_color hex to tailwind-friendly bg classes (fallback to inline style)
function themeColorToBg(color: string) {
  return color || '#F0E3FF';
}

function ReadingCard({ item, isCompleted, onClick }: { item: ReadingContent; isCompleted?: boolean; onClick: () => void }) {
  const isTall = item.cover_aspect === '6x4';
  const bgColor = themeColorToBg(item.theme_color);
  const emoji = item.emoji || '📖';

  return (
    <div className="relative">
      <button
        className="overflow-hidden cursor-pointer transition-all active:scale-[0.98] w-full text-left rounded-2xl shadow-lg border border-border/50"
        onClick={() => { haptic.light(); onClick(); }}
      >
        {/* Title Header - only for square/emoji covers (not 6x4) */}
        {!isTall && (
          <div
            className="px-3 py-3 rounded-t-2xl h-[5rem] flex items-start"
            style={{ backgroundColor: bgColor }}
          >
            <h3 className="font-bold text-lg text-black line-clamp-3 leading-snug">
              {item.title}
            </h3>
          </div>
        )}

        {/* Cover Image */}
        <div className={cn(
          "relative w-full overflow-hidden",
          isTall ? 'aspect-[4/6]' : 'aspect-square',
          isTall ? 'rounded-2xl' : 'rounded-b-2xl'
        )}>
          {item.cover_url ? (
            <CachedImage
              src={item.cover_url}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className={cn(
                "w-full h-full object-cover",
                isTall && "object-bottom"
              )}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: bgColor }}
            >
              <FluentEmoji emoji={emoji} size={72} className="opacity-40" />
            </div>
          )}

          {/* Completed badge */}
          {isCompleted && (
            <div className="absolute top-2 right-2 z-10 bg-emerald-500 rounded-full p-1 shadow-lg">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

export default function AppRead() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = useGoBack('/app/tools');
  const { data: content = [], isLoading } = usePublishedContent();
  const { data: progress = [] } = useReadingUserProgress();
  const { user } = useAuth();
  const { isSubscribed, isLoading: subLoading } = useSubscription();

  const [openedIds, setOpenedIds] = useState<Set<string>>(() => readOpenedSet(user?.id));
  const [showPaywall, setShowPaywall] = useState(false);
  const [showGift, setShowGift] = useState(false);

  useEffect(() => { setOpenedIds(readOpenedSet(user?.id)); }, [user?.id]);

  // First-visit gift reveal — non-subscribers who haven't opened any read yet.
  useEffect(() => {
    if (subLoading) return;
    if (isSubscribed) return;
    if (readGiftSeen(user?.id)) return;
    if (readOpenedSet(user?.id).size > 0) {
      writeGiftSeen(user?.id);
      return;
    }
    const tm = setTimeout(() => {
      setShowGift(true);
      haptic.medium();
    }, 350);
    return () => clearTimeout(tm);
  }, [user?.id, isSubscribed, subLoading]);

  const dismissGift = () => {
    writeGiftSeen(user?.id);
    haptic.light?.();
    setShowGift(false);
  };

  const remainingFree = Math.max(0, FREE_READS - openedIds.size);
  const showCounter = !subLoading && !isSubscribed;

  const getProgress = (contentId: string) => progress.find(p => p.content_id === contentId);

  const handleOpen = (item: ReadingContent) => {
    haptic.light();
    // Already-opened items remain free to revisit forever.
    const alreadyOpened = openedIds.has(item.id);
    if (!subLoading && !isSubscribed && !alreadyOpened) {
      if (openedIds.size >= FREE_READS) {
        haptic.medium();
        setShowPaywall(true);
        return;
      }
      const next = new Set(openedIds);
      next.add(item.id);
      writeOpenedSet(user?.id, next);
      setOpenedIds(next);
    }
    navigate(`/app/read/${item.id}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Fixed Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 pb-3 flex items-center gap-3 border-b bg-background"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button onClick={() => goBack()} className="active:scale-95 transition-transform p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold flex-1">{t('read.title')}</h1>
      </div>

      {/* Spacer for fixed header */}
      <div style={{ height: 'calc(env(safe-area-inset-top, 0px) + 56px)' }} />

      {/* Plus upsell banner — non-subscribers only, sits on top */}
      {showCounter && (
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => { haptic.medium(); setShowPaywall(true); }}
            className="relative w-full rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform shadow-ios"
            style={{
              background: 'linear-gradient(120deg, #1a1f3d 0%, #3d2a5c 45%, #6b3d7a 100%)',
            }}
          >
            {/* Shimmer overlay */}
            <motion.div
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '220%' }}
              transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-y-0 w-1/3"
              style={{
                background:
                  'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
              }}
            />
            {/* Glow blob */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-60 blur-2xl"
              style={{ background: 'radial-gradient(circle, #FFB37A 0%, transparent 70%)' }}
            />
            <div className="relative flex items-center gap-3 p-3.5">
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #FFD27A 0%, #FF8A5C 100%)',
                  boxShadow: '0 6px 16px -6px rgba(255,138,92,0.7)',
                }}
              >
                <Crown className="h-5 w-5 text-[#1a1f3d]" strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-[14px] leading-tight">
                  {remainingFree > 0
                    ? `${remainingFree} free ${remainingFree === 1 ? 'read' : 'reads'} left`
                    : 'Unlock the full library'}
                </p>
                <p className="text-white/70 text-[12px] leading-tight mt-0.5">
                  Rilo Plus · unlimited stories & lessons
                </p>
              </div>
              <span className="text-white/80 text-[13px] font-semibold shrink-0">Open →</span>
            </div>
          </button>
        </div>
      )}

      <p className="text-foreground text-sm px-4 pt-3">{t('read.subtitle')}</p>

      {/* Content Grid */}
      <div className="px-4 pt-3">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : content.length === 0 ? (
          <div className="py-16 text-center text-black">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{t('read.nothingHere')}</p>
            <p className="text-sm">{t('read.newWillAppear')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {content.map(item => {
              const prog = getProgress(item.id);
              return (
                <ReadingCard
                  key={item.id}
                  item={item}
                  isCompleted={prog?.completed}
                  onClick={() => handleOpen(item)}
                />
              );
            })}
          </div>
        )}
      </div>

      <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />

      {/* First-visit gift reveal */}
      <AnimatePresence>
        {showGift && (
          <motion.div
            key="reads-gift-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10050] flex items-center justify-center px-6"
            style={{ background: 'rgba(20, 14, 30, 0.55)', backdropFilter: 'blur(8px)' }}
            onClick={dismissGift}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="relative w-full max-w-[340px] rounded-3xl overflow-hidden shadow-ios"
              style={{
                background: 'linear-gradient(160deg, #FFE9D6 0%, #FFD3C4 55%, #F4B5D6 100%)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                aria-hidden
                animate={{ y: [0, -6, 0], rotate: [0, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-4 right-5 text-2xl"
              >
                ✨
              </motion.div>
              <motion.div
                aria-hidden
                animate={{ y: [0, 5, 0], rotate: [0, -10, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                className="absolute bottom-20 left-5 text-xl opacity-80"
              >
                📖
              </motion.div>

              <div className="px-6 pt-8 pb-6 text-center">
                <motion.div
                  initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
                  className="mx-auto mb-4 h-20 w-20 rounded-2xl flex items-center justify-center text-5xl"
                  style={{
                    background: 'linear-gradient(135deg, #FFD27A 0%, #FF8A5C 100%)',
                    boxShadow: '0 12px 28px -8px rgba(255,138,92,0.55)',
                  }}
                >
                  🎁
                </motion.div>
                <h2 className="text-[#1a1f3d] font-bold text-[22px] leading-tight">
                  A little gift for you
                </h2>
                <p className="mt-2 text-[#3d2a5c]/80 text-[15px] leading-snug">
                  Enjoy <span className="font-bold text-[#1a1f3d]">3 free reads</span> on us — dive into stories & lessons whenever you need a moment. 📖
                </p>

                <button
                  type="button"
                  onClick={dismissGift}
                  className="mt-6 w-full h-12 rounded-2xl text-white font-bold text-[15px] active:scale-[0.98] transition-transform shadow-ios"
                  style={{
                    background: 'linear-gradient(120deg, #1a1f3d 0%, #3d2a5c 50%, #6b3d7a 100%)',
                  }}
                >
                  Start reading
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
