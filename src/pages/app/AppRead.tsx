import { useNavigate } from 'react-router-dom';
import { usePublishedContent, useReadingUserProgress } from '@/hooks/useReading';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

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
        <p className="text-muted-foreground text-sm mt-1">Stories & lessons for your mind</p>
      </div>

      {/* Content List */}
      <div className="px-4 pt-3 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[88px] rounded-2xl bg-muted animate-pulse" />
          ))
        ) : content.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nothing here yet</p>
            <p className="text-sm">New reading content will appear here</p>
          </div>
        ) : (
          content.map(item => {
            const prog = getProgress(item.id);
            const isCompleted = prog?.completed;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/app/read/${item.id}`)}
                className="w-full flex items-center gap-4 p-3.5 rounded-2xl transition-transform active:scale-[0.98] text-left relative overflow-hidden"
                style={{ backgroundColor: item.theme_color || '#F0E3FF' }}
              >
                {/* Cover: Emoji or Image */}
                <div
                  className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    backgroundImage: item.cover_url ? `url(${item.cover_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!item.cover_url && (
                    <FluentEmoji emoji={item.emoji || '📖'} size={36} />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-black text-[15px] leading-tight line-clamp-1">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-xs text-black/70 mt-0.5 line-clamp-1">{item.subtitle}</p>
                  )}
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3" /> {item.reading_time_minutes} min
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/50 text-gray-600 capitalize font-medium">
                      {item.category}
                    </span>
                    {isCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
