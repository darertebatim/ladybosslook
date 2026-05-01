import { useNavigate } from 'react-router-dom';
import { useGoBack } from '@/hooks/useGoBack';
import { useTranslation } from 'react-i18next';
import { usePublishedContent, useReadingUserProgress, ReadingContent } from '@/hooks/useReading';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { CachedImage } from '@/components/ui/CachedImage';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';


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

  const getProgress = (contentId: string) => progress.find(p => p.content_id === contentId);

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
                  onClick={() => navigate(`/app/read/${item.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
