import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { BilingualText } from '@/components/ui/BilingualText';

interface CompletedReflection {
  reflection_id: string;
  reflection_title: string;
  reflection_cover: string | null;
  completed_at: string;
  first_question: string | null;
  first_answer: string | null;
}

export default function AppReflectionNotes() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['reflection-notes', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Get all completed responses (those with completed_at)
      const { data: responses, error } = await supabase
        .from('user_reflection_responses' as any)
        .select('*')
        .eq('user_id', user!.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });
      if (error) throw error;

      const completedMap = new Map<string, any>();
      for (const r of responses as any[]) {
        if (!completedMap.has(r.reflection_id)) {
          completedMap.set(r.reflection_id, r);
        }
      }

      // Get reflection metadata
      const reflectionIds = Array.from(completedMap.keys());
      if (reflectionIds.length === 0) return [];

      const { data: reflections } = await supabase
        .from('reflections' as any)
        .select('*')
        .in('id', reflectionIds);

      const reflectionMap = new Map<string, any>();
      for (const r of (reflections || []) as any[]) {
        reflectionMap.set(r.id, r);
      }

      // For each completed reflection, get the first question+answer
      const result: CompletedReflection[] = [];
      for (const [refId, response] of completedMap) {
        const ref = reflectionMap.get(refId);
        if (!ref) continue;

        // Get first question page
        const { data: pages } = await supabase
          .from('reflection_pages' as any)
          .select('*')
          .eq('reflection_id', refId)
          .eq('type', 'question')
          .order('page_order', { ascending: true })
          .limit(1);

        let firstQuestion: string | null = null;
        let firstAnswer: string | null = null;

        if (pages && (pages as any[]).length > 0) {
          const page = (pages as any[])[0];
          firstQuestion = page.content;
          const { data: ans } = await supabase
            .from('user_reflection_responses' as any)
            .select('response_text')
            .eq('user_id', user!.id)
            .eq('page_id', page.id)
            .maybeSingle();
          firstAnswer = (ans as any)?.response_text || null;
        }

        result.push({
          reflection_id: refId,
          reflection_title: ref.title,
          reflection_cover: ref.cover_image_url,
          completed_at: response.completed_at,
          first_question: firstQuestion,
          first_answer: firstAnswer,
        });
      }

      return result;
    },
  });

  // Group by month
  const grouped = new Map<string, CompletedReflection[]>();
  for (const note of notes || []) {
    const key = format(new Date(note.completed_at), 'd MMM');
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(note);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="px-4 pb-3 flex items-center gap-3 border-b"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold flex-1 text-center pr-6">Reflection Notes</h1>
      </div>

      <div className="px-4 py-4 space-y-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        )}

        {!isLoading && (notes?.length || 0) === 0 && (
          <p className="text-center text-muted-foreground py-12">No completed reflections yet.</p>
        )}

        {Array.from(grouped.entries()).map(([dateLabel, items]) => (
          <div key={dateLabel}>
            <h2 className="text-base font-bold mb-3">{dateLabel}</h2>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <button
                  key={`${item.reflection_id}-${idx}`}
                  onClick={() => navigate(`/app/reflections/notes/${item.reflection_id}`, {
                    state: { completedAt: item.completed_at },
                  })}
                  className="w-full bg-card rounded-xl p-4 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {item.reflection_cover ? (
                      <img src={item.reflection_cover} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg">📝</div>
                    )}
                    <div>
                      <BilingualText as="p" className="font-semibold text-sm">{item.reflection_title}</BilingualText>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.completed_at), 'MMM d, yyyy • hh:mm a')}
                      </p>
                    </div>
                  </div>
                  {item.first_question && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.first_question}  {item.first_answer || ''}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
