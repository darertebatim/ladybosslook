import { useNavigate } from 'react-router-dom';
import { useGoBack } from '@/hooks/useGoBack';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { getMoodEmoji } from '@/components/app/MoodSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface NoteItem {
  id: string;
  type: 'guided' | 'free';
  title: string;
  cover: string | null;
  completed_at: string;
  preview: string | null;
  mood?: string | null;
}

export default function AppReflectionNotes() {
  const navigate = useNavigate();
  const goBack = useGoBack('/app/reflections');
  const { user } = useAuth();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['reflection-notes', user?.id],
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const result: NoteItem[] = [];

      // 1. Guided reflections (existing logic)
      const { data: responses } = await supabase
        .from('user_reflection_responses' as any)
        .select('*')
        .eq('user_id', user!.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      const completedMap = new Map<string, any>();
      for (const r of (responses || []) as any[]) {
        if (!completedMap.has(r.reflection_id)) {
          completedMap.set(r.reflection_id, r);
        }
      }

      const reflectionIds = Array.from(completedMap.keys());
      if (reflectionIds.length > 0) {
        const { data: reflections } = await supabase
          .from('reflections' as any)
          .select('*')
          .in('id', reflectionIds);

        const reflectionMap = new Map<string, any>();
        for (const r of (reflections || []) as any[]) {
          reflectionMap.set(r.id, r);
        }

        for (const [refId, response] of completedMap) {
          const ref = reflectionMap.get(refId);
          if (!ref) continue;

          // Get first question page for preview
          const { data: pages } = await supabase
            .from('reflection_pages' as any)
            .select('*')
            .eq('reflection_id', refId)
            .eq('type', 'question')
            .order('page_order', { ascending: true })
            .limit(1);

          let preview: string | null = null;
          if (pages && (pages as any[]).length > 0) {
            const page = (pages as any[])[0];
            const { data: ans } = await supabase
              .from('user_reflection_responses' as any)
              .select('response_text')
              .eq('user_id', user!.id)
              .eq('page_id', page.id)
              .maybeSingle();
            preview = [page.content, (ans as any)?.response_text].filter(Boolean).join('  ');
          }

          result.push({
            id: refId,
            type: 'guided',
            title: ref.title,
            cover: ref.cover_image_url,
            completed_at: response.completed_at,
            preview,
          });
        }
      }

      // 2. Free-form reflections
      const { data: freeForm } = await supabase
        .from('free_form_reflections' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      for (const ff of (freeForm || []) as any[]) {
        result.push({
          id: ff.id,
          type: 'free',
          title: ff.title,
          cover: null,
          completed_at: ff.created_at,
          preview: ff.content || null,
          mood: ff.mood || null,
        });
      }

      // Sort by date descending
      result.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

      return result;
    },
  });

  // Group by date
  const grouped = new Map<string, NoteItem[]>();
  for (const note of notes || []) {
    const key = format(new Date(note.completed_at), 'd MMM');
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(note);
  }

  const handleTap = (note: NoteItem) => {
    if (note.type === 'guided') {
      navigate(`/app/reflections/notes/${note.id}`, {
        state: { completedAt: note.completed_at },
      });
    } else {
      navigate(`/app/reflections/notes/free/${note.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="px-4 pb-3 flex items-center gap-3 border-b"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button onClick={() => goBack()} className="active:scale-95 transition-transform p-1">
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
              {items.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleTap(item)}
                  className="w-full bg-card rounded-xl p-4 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {item.cover ? (
                      <img src={item.cover} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg">
                        {item.mood ? getMoodEmoji(item.mood) || '✍️' : (item.type === 'free' ? '✍️' : '📝')}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.completed_at), 'MMM d, yyyy • hh:mm a')}
                      </p>
                    </div>
                  </div>
                  {item.preview && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.preview}</p>
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
