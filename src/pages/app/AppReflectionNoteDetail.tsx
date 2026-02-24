import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function AppReflectionNoteDetail() {
  const { reflectionId } = useParams<{ reflectionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['reflection-note-detail', reflectionId, user?.id],
    enabled: !!reflectionId && !!user?.id,
    queryFn: async () => {
      // Get reflection metadata
      const { data: ref } = await supabase
        .from('reflections' as any)
        .select('*')
        .eq('id', reflectionId!)
        .maybeSingle();

      // Get all question pages
      const { data: pages } = await supabase
        .from('reflection_pages' as any)
        .select('*')
        .eq('reflection_id', reflectionId!)
        .eq('type', 'question')
        .order('page_order', { ascending: true });

      // Get user responses
      const { data: responses } = await supabase
        .from('user_reflection_responses' as any)
        .select('*')
        .eq('user_id', user!.id)
        .eq('reflection_id', reflectionId!);

      const responseMap = new Map<string, any>();
      for (const r of (responses || []) as any[]) {
        responseMap.set(r.page_id, r);
      }

      const completedResponse = (responses as any[] || []).find((r: any) => r.completed_at);

      return {
        reflection: ref as any,
        qaPairs: ((pages || []) as any[]).map((p: any) => ({
          question: p.content,
          answer: responseMap.get(p.id)?.response_text || '',
        })),
        completedAt: completedResponse?.completed_at || null,
      };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="px-4 pb-3 flex items-center justify-between border-b"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button className="p-1">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : data?.reflection ? (
        <div className="px-5 py-5 space-y-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
          {/* Title section */}
          <div className="flex items-center gap-3">
            {data.reflection.cover_image_url ? (
              <img src={data.reflection.cover_image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-xl">📝</div>
            )}
            <div>
              <h1 className="text-xl font-bold">{data.reflection.title}</h1>
              {data.completedAt && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(data.completedAt), 'MMM d, yyyy • hh:mm a')}
                </p>
              )}
            </div>
          </div>

          {/* Q&A pairs */}
          <div className="space-y-0 divide-y divide-border">
            {data.qaPairs.map((qa, idx) => (
              <div key={idx} className="py-5 first:pt-0">
                <p className="text-base text-muted-foreground leading-relaxed">{qa.question}</p>
                {qa.answer && (
                  <p className="mt-2 text-base font-medium">{qa.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">Reflection not found.</p>
      )}
    </div>
  );
}
