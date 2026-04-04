import { useParams, useNavigate } from 'react-router-dom';
import { useReadingContentById, useContentSections, useReadingUserProgress } from '@/hooks/useReading';
import { ArrowLeft, Clock, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { Badge } from '@/components/ui/badge';

export default function AppReadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: content, isLoading } = useReadingContentById(id || null);
  const { data: sections = [] } = useContentSections(id || null);
  const { data: progress = [] } = useReadingUserProgress();

  const prog = progress.find(p => p.content_id === id);
  const isCompleted = prog?.completed;
  const hasProgress = prog && prog.last_section_index > 0;

  // Calculate reading time from actual section content (~200 words/min)
  const totalWords = sections.reduce((sum, s) => {
    const text = [s.heading, s.body, s.quote].filter(Boolean).join(' ');
    return sum + text.split(/\s+/).filter(Boolean).length;
  }, 0);
  const calculatedMinutes = Math.max(1, Math.round(totalWords / 200));

  if (isLoading || !content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  const hasCoverImage = !!content.cover_url;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ backgroundColor: content.theme_color || '#F0E3FF' }}>
        <button onClick={() => navigate('/app/read')} className="absolute top-4 left-4 z-10 bg-white/70 backdrop-blur-sm rounded-full p-2">
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>

        {hasCoverImage ? (
          <div className="relative w-full" style={{ aspectRatio: '6/4' }}>
            <img src={content.cover_url!} alt={content.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h1 className="text-2xl font-bold leading-tight">{content.title}</h1>
              {content.author && <p className="text-sm opacity-80 mt-1">by {content.author}</p>}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-16 pb-10 px-6">
            <div className="w-24 h-24 rounded-3xl bg-white/40 flex items-center justify-center mb-5">
              <FluentEmoji emoji={content.emoji || '📖'} size={56} />
            </div>
            <h1 className="text-2xl font-bold leading-tight text-center text-black">{content.title}</h1>
            {content.author && <p className="text-sm text-black mt-1.5">by {content.author}</p>}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="px-4 -mt-3 relative z-10">
        <div className="bg-card rounded-2xl p-5 shadow-sm border">
          {content.description && (
            <p className="text-sm text-black mb-4 leading-relaxed">{content.description}</p>
          )}

          <div className="flex items-center gap-3 mb-5">
            <span className="flex items-center gap-1.5 text-sm text-black">
              <Clock className="h-4 w-4" /> {content.reading_time_minutes} min
            </span>
            <Badge variant="secondary" className="capitalize text-xs">{content.category}</Badge>
            <span className="flex items-center gap-1.5 text-sm text-black">
              <Layers className="h-4 w-4" /> {sections.length} sections
            </span>
          </div>

          <Button
            className="w-full h-12 text-base font-semibold rounded-xl"
            size="lg"
            onClick={() => navigate(`/app/read/${id}/reader`)}
            disabled={sections.length === 0}
            style={{
              backgroundColor: content.theme_color || undefined,
              color: '#1a1a1a',
            }}
          >
            <BookOpen className="h-5 w-5 mr-2" />
            {isCompleted ? 'Read Again' : hasProgress ? 'Continue Reading' : 'Start Reading'}
          </Button>
        </div>
      </div>
    </div>
  );
}
