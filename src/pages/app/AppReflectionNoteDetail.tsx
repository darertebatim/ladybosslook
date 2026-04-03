import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGoBack } from '@/hooks/useGoBack';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, Share2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useShareContent } from '@/hooks/useShareContent';

export default function AppReflectionNoteDetail() {
  const { reflectionId } = useParams<{ reflectionId: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack('/app/reflections/notes');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const { handleShare } = useShareContent({
    title: 'Reflection',
    text: `🪞 I just reflected on Routine Ladyboss 💫`,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['reflection-note-detail', reflectionId, user?.id],
    enabled: !!reflectionId && !!user?.id,
    queryFn: async () => {
      const { data: ref } = await supabase
        .from('reflections' as any)
        .select('*')
        .eq('id', reflectionId!)
        .maybeSingle();

      const { data: pages } = await supabase
        .from('reflection_pages' as any)
        .select('*')
        .eq('reflection_id', reflectionId!)
        .eq('type', 'question')
        .order('page_order', { ascending: true });

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
          pageId: p.id,
          question: p.content,
          answer: responseMap.get(p.id)?.response_text || '',
          responseId: responseMap.get(p.id)?.id || null,
        })),
        completedAt: completedResponse?.completed_at || null,
      };
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ responseId, text }: { responseId: string; text: string }) => {
      const { error } = await supabase
        .from('user_reflection_responses' as any)
        .update({ response_text: text } as any)
        .eq('id', responseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflection-note-detail', reflectionId] });
      toast.success('Answer updated');
      setEditingIdx(null);
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_reflection_responses' as any)
        .delete()
        .eq('user_id', user!.id)
        .eq('reflection_id', reflectionId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflection-notes'] });
      toast.success('Reflection deleted');
      goBack();
    },
    onError: () => toast.error('Failed to delete'),
  });

  const handleEdit = (idx: number) => {
    if (!data) return;
    setEditingIdx(idx);
    setEditText(data.qaPairs[idx].answer);
  };

  const handleDelete = () => {
    if (!confirm('Delete all your answers for this reflection?')) return;
    deleteMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="px-4 pb-3 flex items-center justify-between border-b"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button onClick={() => goBack()} className="active:scale-95 transition-transform p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShare}
            className="active:scale-95 transition-transform p-1"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5 text-muted-foreground" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="active:scale-95 transition-transform p-1">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(0)} disabled={!data?.qaPairs.length}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
              <button
                key={idx}
                className="py-5 first:pt-0 w-full text-left active:bg-muted/50 transition-colors rounded-lg"
                onClick={() => handleEdit(idx)}
              >
                <p className="text-base text-muted-foreground leading-relaxed">{qa.question}</p>
                {qa.answer && (
                  <p className="mt-2 text-base font-medium">{qa.answer}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">Reflection not found.</p>
      )}

      {/* Edit Dialog */}
      <Dialog open={editingIdx !== null} onOpenChange={(o) => !o && setEditingIdx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base leading-relaxed font-normal text-muted-foreground">
              {editingIdx !== null && data?.qaPairs[editingIdx]?.question}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-[120px]"
            placeholder="Type your answer…"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIdx(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editingIdx === null || !data) return;
                const qa = data.qaPairs[editingIdx];
                if (qa.responseId) {
                  updateMutation.mutate({ responseId: qa.responseId, text: editText });
                }
              }}
              disabled={updateMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}