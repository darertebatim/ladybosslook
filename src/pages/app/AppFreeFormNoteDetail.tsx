import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGoBack } from '@/hooks/useGoBack';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, Share2 } from 'lucide-react';
import { getMoodEmoji } from '@/components/app/MoodSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useShareContent } from '@/hooks/useShareContent';

export default function AppFreeFormNoteDetail() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const { handleShare } = useShareContent({
    title: 'Reflection',
    text: `🪞 I just reflected on Routine Ladyboss 💫`,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['free-form-note', noteId],
    enabled: !!noteId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('free_form_reflections' as any)
        .select('*')
        .eq('id', noteId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('free_form_reflections' as any)
        .update({ title: editTitle.trim(), content: editContent.trim() } as any)
        .eq('id', noteId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['free-form-note', noteId] });
      queryClient.invalidateQueries({ queryKey: ['reflection-notes'] });
      toast.success('Updated');
      setEditing(false);
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('free_form_reflections' as any)
        .delete()
        .eq('id', noteId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflection-notes'] });
      toast.success('Deleted');
      goBack();
    },
    onError: () => toast.error('Failed to delete'),
  });

  const handleEdit = () => {
    if (!data) return;
    setEditTitle(data.title);
    setEditContent(data.content);
    setEditing(true);
  };

  const handleDelete = () => {
    if (!confirm('Delete this reflection?')) return;
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
          <button onClick={handleShare} className="active:scale-95 transition-transform p-1" aria-label="Share">
            <Share2 className="h-5 w-5 text-muted-foreground" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="active:scale-95 transition-transform p-1">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
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
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : data ? (
        <div className="px-5 py-5 space-y-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-xl">
              {data.mood ? getMoodEmoji(data.mood) || '✍️' : '✍️'}
            </div>
            <div>
              <h1 className="text-xl font-bold">{data.title}</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(data.created_at), 'MMM d, yyyy • hh:mm a')}
              </p>
            </div>
          </div>
          <div className="py-4">
            <p className="text-base leading-relaxed whitespace-pre-line">{data.content}</p>
          </div>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">Reflection not found.</p>
      )}

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={(o) => !o && setEditing(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reflection</DialogTitle>
          </DialogHeader>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title"
            className="mb-2"
          />
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[160px]"
            placeholder="Your reflection…"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
