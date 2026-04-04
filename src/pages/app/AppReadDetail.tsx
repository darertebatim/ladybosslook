import { useParams, useNavigate } from 'react-router-dom';
import { useReadingContentById, useContentSections, useReadingUserProgress } from '@/hooks/useReading';
import { ArrowLeft, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export default function AppReadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: content, isLoading } = useReadingContentById(id || null);
  const { data: sections = [] } = useContentSections(id || null);
  const { data: progress = [] } = useReadingUserProgress();

  const prog = progress.find(p => p.content_id === id);
  const isCompleted = prog?.completed;
  const hasProgress = prog && prog.last_section_index > 0;

  if (isLoading || !content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative" style={{ backgroundColor: content.theme_color || '#F0E3FF' }}>
        <button onClick={() => navigate('/app/read')} className="absolute top-4 left-4 z-10 bg-background/80 rounded-full p-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <AspectRatio ratio={6 / 4}>
          {content.cover_url ? (
            <img src={content.cover_url} alt={content.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">{content.type === 'story' ? '📖' : '📚'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-2xl font-bold leading-tight">{content.title}</h1>
            {content.author && <p className="text-sm opacity-80 mt-1">by {content.author}</p>}
          </div>
        </AspectRatio>
      </div>

      {/* Info Card */}
      <div className="px-4 -mt-2 relative z-10">
        <div className="bg-card rounded-2xl p-5 shadow-sm border">
          {content.description && (
            <p className="text-sm text-muted-foreground mb-4">{content.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {content.reading_time_minutes} min read
            </span>
            <span className="capitalize">{content.category}</span>
            <span>{sections.length} sections</span>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate(`/app/read/${id}/reader`)}
            disabled={sections.length === 0}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {isCompleted ? 'Read Again' : hasProgress ? 'Continue Reading' : 'Start Reading'}
          </Button>
        </div>
      </div>
    </div>
  );
}
