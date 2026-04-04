import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Quiz {
  id: string;
  title: string;
  slug: string;
  overview: string;
  description: string;
  cover_url: string;
  theme_color: string;
}

export default function QuizDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase.from('admin_quizzes').select('*').eq('slug', slug).eq('is_active', true).single();
      if (data) {
        setQuiz(data);
        const { count } = await supabase.from('admin_quiz_questions').select('*', { count: 'exact', head: true }).eq('quiz_id', data.id).eq('is_active', true);
        setQuestionCount(count || 0);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Skeleton className="h-8 w-8 rounded-full" /></div>;
  if (!quiz) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Quiz not found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="relative" style={{ backgroundColor: quiz.theme_color }}>
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/20 text-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="aspect-[6/4] w-full overflow-hidden">
          {quiz.cover_url ? (
            <img src={quiz.cover_url} alt={quiz.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🧠</div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 -mt-6 relative bg-background rounded-t-[28px] px-5 pt-6 pb-28 space-y-5">
        <h1 className="text-xl font-bold">{quiz.title}</h1>
        
        {quiz.overview && (
          <div className="bg-card rounded-xl p-4 border">
            <h3 className="text-sm font-semibold mb-1">Overview</h3>
            <p className="text-sm text-muted-foreground">{quiz.overview}</p>
          </div>
        )}

        {quiz.description && (
          <div className="bg-card rounded-xl p-4 border">
            <h3 className="text-sm font-semibold mb-1">What you'll get</h3>
            <p className="text-sm text-muted-foreground">{quiz.description}</p>
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground">
          {questionCount} questions • ~{Math.ceil(questionCount * 0.5)} min
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t safe-bottom">
        <Button className="w-full h-12 text-base font-semibold rounded-xl" onClick={() => navigate(`/app/quiz/${slug}/play`)}>
          Start Test
        </Button>
      </div>
    </div>
  );
}
