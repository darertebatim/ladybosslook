import { useNavigate } from 'react-router-dom';
import { usePublishedContent, useReadingUserProgress, ReadingContent } from '@/hooks/useReading';
import { BookOpen, CheckCircle2 } from 'lucide-react';
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
        {/* Title Header - only for square covers */}
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

          {/* Completed overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="flex items-center gap-1.5 bg-emerald-500 rounded-full px-3 py-1.5 shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-white" />
                <span className="text-white text-xs font-bold">Completed</span>
              </div>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

export default function AppRead() {
  const navigate = useNavigate();
  const { data: content = [], isLoading } = usePublishedContent();
  const { data: progress = [] } = useReadingUserProgress();

  const getProgress = (contentId: string) => progress.find(p => p.content_id === contentId);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Read
        </h1>
        <p className="text-black text-sm mt-1">Stories & lessons for your mind</p>
      </div>

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
            <p className="font-medium">Nothing here yet</p>
            <p className="text-sm">New reading content will appear here</p>
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
