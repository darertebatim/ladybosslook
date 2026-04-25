import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, Share2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { buildShareOneLink, logAppsFlyerEvent } from '@/lib/appsflyer';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';

interface QuizOption { label: string; emoji?: string; score?: number; }
interface Question { id: string; question_text: string; type: string; options: QuizOption[]; sort_order: number; }
interface QuizResult { result_key: string; title: string; subtitle: string; description: string; image_url: string; characteristics: string[]; strengths: string[]; weaknesses: string[]; suggestions: string[]; score_min: number; score_max: number; }
interface Quiz { id: string; title: string; slug: string; cover_url: string; theme_color: string; }

type Phase = 'playing' | 'analyzing' | 'result';

export default function QuizPlay() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<Phase>('playing');
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [matchedResult, setMatchedResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: q } = await supabase.from('admin_quizzes').select('*').eq('slug', slug).single();
      if (!q) { setLoading(false); return; }
      setQuiz(q);
      const { data: qs } = await supabase.from('admin_quiz_questions').select('*').eq('quiz_id', q.id).eq('is_active', true).order('sort_order');
      setQuestions((qs || []) as unknown as Question[]);
      const { data: rs } = await supabase.from('admin_quiz_results').select('*').eq('quiz_id', q.id).order('score_min');
      setQuizResults((rs || []) as QuizResult[]);
      setLoading(false);
    })();
  }, [slug]);

  const question = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0;

  function selectOption(opt: QuizOption) {
    if (!question) return;
    const qId = question.id;
    if (question.type === 'multi-select') {
      const prev = (answers[qId] as string[]) || [];
      const newAns = prev.includes(opt.label) ? prev.filter(l => l !== opt.label) : [...prev, opt.label];
      setAnswers({ ...answers, [qId]: newAns });
      // Sum scores for multi-select
      const selectedOpts = question.options.filter(o => newAns.includes(o.label));
      setScores({ ...scores, [qId]: selectedOpts.reduce((s, o) => s + (o.score || 0), 0) });
    } else {
      setAnswers({ ...answers, [qId]: opt.label });
      setScores({ ...scores, [qId]: opt.score || 0 });
      // Auto-advance after a short delay for single-select
      setTimeout(() => advanceQuestion(), 400);
    }
  }

  function advanceQuestion() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      startAnalysis();
    }
  }

  const totalScore = useMemo(() => Object.values(scores).reduce((s, v) => s + v, 0), [scores]);

  async function startAnalysis() {
    setPhase('analyzing');
    // Animate progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) { p = 100; clearInterval(interval); }
      setAnalyzeProgress(Math.min(p, 100));
    }, 200);

    setTimeout(async () => {
      clearInterval(interval);
      setAnalyzeProgress(100);
      // Match result
      const total = Object.values(scores).reduce((s, v) => s + v, 0);
      const matched = quizResults.find(r => total >= r.score_min && total <= r.score_max) || quizResults[0];
      setMatchedResult(matched || null);

      // Save submission
      if (quiz) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('quiz_submissions').insert({
            user_id: user.id,
            quiz_id: quiz.id,
            answers: answers as any,
            total_score: total,
            result_key: matched?.result_key || '',
          });
        }
      }

      setTimeout(() => setPhase('result'), 500);
    }, 3000);
  }

  async function shareResult() {
    if (!matchedResult || !quiz) return;
    haptic.light();
    const shareUrl = buildShareOneLink('quiz_result', quiz.slug, matchedResult.title);
    const fullText = `I got "${matchedResult.title}" on the ${quiz.title} quiz! Try it yourself on Rilo ✨\nGet the app: ${shareUrl}`;
    try { logAppsFlyerEvent('af_share', { source: 'quiz_result', content_id: quiz.slug }); } catch { /* ignore */ }
    try {
      if (navigator.share) {
        await navigator.share({ title: quiz.title, text: fullText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(fullText);
        toast.success('Link copied to clipboard!');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(fullText);
        toast.success('Link copied to clipboard!');
      } catch { /* ignore */ }
    }
  }

  function retake() {
    setCurrentIdx(0);
    setAnswers({});
    setScores({});
    setPhase('playing');
    setAnalyzeProgress(0);
    setMatchedResult(null);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
  if (!quiz) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Quiz not found</div>;

  // ─── ANALYZING PHASE ───
  if (phase === 'analyzing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <div className="relative w-32 h-32 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={quiz.theme_color} strokeWidth="8"
              strokeDasharray={`${analyzeProgress * 2.83} 283`} strokeLinecap="round" className="transition-all duration-200" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
            {Math.round(analyzeProgress)}%
          </span>
        </div>
        <p className="text-lg font-semibold">Analyzing your answers...</p>
        <p className="text-sm text-muted-foreground mt-1">Just a moment ✨</p>
      </div>
    );
  }

  // ─── RESULT PHASE ───
  if (phase === 'result' && matchedResult) {
    return (
      <div className="min-h-screen bg-background pb-28">
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-3 border-b">
          <button onClick={() => navigate(`/app/quiz/${slug}`)} className="p-1"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-semibold flex-1">{quiz.title}</h1>
        </div>

        <div className="px-5 pt-6 space-y-5">
          {/* Result Card */}
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl p-6 text-center" style={{ backgroundColor: quiz.theme_color }}>
            <p className="text-xs text-white/70 uppercase tracking-wider mb-2">My Result</p>
            <h2 className="text-2xl font-bold text-white mb-1">{matchedResult.title}</h2>
            {matchedResult.subtitle && <p className="text-sm text-white/80">{matchedResult.subtitle}</p>}
            {matchedResult.image_url && (
              <img src={matchedResult.image_url} alt={matchedResult.title} className="w-24 h-24 mx-auto mt-4 rounded-xl object-cover" />
            )}
          </motion.div>

          {/* Description */}
          {matchedResult.description && (
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="text-sm font-semibold mb-2">About Your Result</h3>
              <p className="text-sm text-muted-foreground">{matchedResult.description}</p>
            </div>
          )}

          {/* Characteristics */}
          {(matchedResult.characteristics as string[])?.length > 0 && (
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="text-sm font-semibold mb-2">Characteristics</h3>
              <div className="flex flex-wrap gap-2">
                {(matchedResult.characteristics as string[]).map((c, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-muted">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {(matchedResult.strengths as string[])?.length > 0 && (
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="text-sm font-semibold mb-2">💪 Strengths</h3>
              <ul className="space-y-1">
                {(matchedResult.strengths as string[]).map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2"><span>•</span>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {(matchedResult.weaknesses as string[])?.length > 0 && (
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="text-sm font-semibold mb-2">🔍 Areas to Improve</h3>
              <ul className="space-y-1">
                {(matchedResult.weaknesses as string[]).map((w, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2"><span>•</span>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {(matchedResult.suggestions as string[])?.length > 0 && (
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="text-sm font-semibold mb-2">✨ Suggestions</h3>
              <ul className="space-y-1">
                {(matchedResult.suggestions as string[]).map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2"><span>•</span>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Fixed bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t safe-bottom flex gap-3">
          <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={retake}>
            <RotateCcw className="h-4 w-4 mr-2" />Retake
          </Button>
          <Button className="flex-1 h-12 rounded-xl" onClick={shareResult}>
            <Share2 className="h-4 w-4 mr-2" />Share
          </Button>
        </div>
      </div>
    );
  }

  // ─── PLAYING PHASE ───
  if (!question) return null;
  const selectedAnswer = answers[question.id];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <button onClick={() => currentIdx > 0 ? setCurrentIdx(currentIdx - 1) : navigate(-1)} className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">QUESTION {currentIdx + 1}/{questions.length}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-5 pt-8 pb-4">
        <AnimatePresence mode="wait">
          <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <h2 className="text-xl font-bold mb-8 leading-tight">{question.question_text}</h2>
            <div className="space-y-3">
              {question.options.map((opt, i) => {
                const isSelected = question.type === 'multi-select'
                  ? (selectedAnswer as string[] || []).includes(opt.label)
                  : selectedAnswer === opt.label;
                return (
                  <button
                    key={i}
                    onClick={() => selectOption(opt)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
                    <span className="text-sm font-medium flex-1">{opt.label}</span>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next button for multi-select */}
      {question.type === 'multi-select' && (
        <div className="px-5 pb-6 safe-bottom">
          <Button className="w-full h-12 rounded-xl" onClick={advanceQuestion}
            disabled={!(selectedAnswer as string[])?.length}>
            {currentIdx < questions.length - 1 ? 'Next' : 'See Results'}
          </Button>
        </div>
      )}
    </div>
  );
}
