import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLessonCards, useUpsertProgress, usePublishedLessons } from '@/hooks/useReadingLessons';
import { ArrowLeft, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import useEmblaCarousel from 'embla-carousel-react';

export default function AppReadLesson() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { data: cards = [], isLoading } = useLessonCards(lessonId || null);
  const { data: lessons = [] } = usePublishedLessons();
  const upsertProgress = useUpsertProgress();
  const lesson = lessons.find(l => l.id === lessonId);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const totalCards = cards.length;
  const isLastCard = currentIndex === totalCards - 1;

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setCurrentIndex(idx);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  // Save progress on swipe
  useEffect(() => {
    if (!lessonId || totalCards === 0) return;
    const saveProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const isComplete = currentIndex >= totalCards - 1;
      upsertProgress.mutate({
        user_id: user.id,
        lesson_id: lessonId,
        last_card_index: currentIndex,
        completed: isComplete,
        completed_at: isComplete ? new Date().toISOString() : null,
      });
      if (isComplete) setCompleted(true);
    };
    saveProgress();
  }, [currentIndex, lessonId, totalCards]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (completed && isLastCard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-background px-6 text-center">
        <PartyPopper className="h-16 w-16 text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Lesson Complete! 🎉</h2>
        <p className="text-muted-foreground mb-6">You finished "{lesson?.title}"</p>
        <Button onClick={() => navigate('/app/read')} size="lg">Back to Library</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/read')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 mx-4">
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-medium">{currentIndex + 1}/{totalCards}</span>
      </div>

      {/* Cards carousel */}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {cards.map((card, i) => (
            <div key={card.id} className="flex-[0_0_100%] min-w-0 h-full">
              <div
                className="mx-4 my-2 rounded-3xl h-[calc(100vh-140px)] flex flex-col justify-between p-6 shadow-sm"
                style={{ backgroundColor: card.bg_color }}
              >
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">{card.title}</h2>
                  <p className="text-gray-700 text-lg leading-relaxed">{card.content}</p>
                </div>
                {card.key_point && (
                  <div className="mt-auto p-4 rounded-2xl bg-white/50 border border-white/30">
                    <p className="font-semibold text-gray-800">💡 {card.key_point}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation hint */}
      <div className="pb-6 pt-2 flex justify-center gap-1.5">
        {cards.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
