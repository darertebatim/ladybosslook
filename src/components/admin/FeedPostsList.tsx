import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Trash2, Pin, PinOff, Loader2, MessageSquare, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Post {
  id: string;
  channel_id: string;
  post_type: string;
  title: string | null;
  content: string;
  is_pinned: boolean;
  created_at: string;
  image_url: string | null;
  video_url: string | null;
  display_name: string | null;
  author: { full_name: string | null } | null;
  channel: { name: string } | null;
}

interface EditFormData {
  title: string;
  content: string;
  image_url: string;
  video_url: string;
  display_name: string;
}

export function FeedPostsList() {
  const queryClient = useQueryClient();
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({
    title: '',
    content: '',
    image_url: '',
    video_url: '',
    display_name: '',
  });

  const { data: channels } = useQuery({
    queryKey: ['admin-feed-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_channels')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-feed-posts', filterChannel],
    queryFn: async () => {
      let query = supabase
        .from('feed_posts')
        .select(`
          *,
          author:profiles!feed_posts_author_id_fkey(full_name),
          channel:feed_channels!feed_posts_channel_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (filterChannel !== 'all') {
        query = query.eq('channel_id', filterChannel);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Post[];
    },
  });

  const { data: commentsData } = useQuery({
    queryKey: ['admin-feed-comments-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_comments')
        .select('post_id, is_hidden');
      if (error) throw error;
      
      const counts: Record<string, { total: number; hidden: number }> = {};
      data.forEach((c) => {
        if (!counts[c.post_id]) {
          counts[c.post_id] = { total: 0, hidden: 0 };
        }
        counts[c.post_id].total++;
        if (c.is_hidden) counts[c.post_id].hidden++;
      });
      return counts;
    },
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from('feed_posts')
        .update({ is_pinned })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast.success('Post updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EditFormData> }) => {
      const { error } = await supabase
        .from('feed_posts')
        .update({
          title: data.title || null,
          content: data.content,
          image_url: data.image_url || null,
          video_url: data.video_url || null,
          display_name: data.display_name || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast.success('Post updated');
      setEditingPost(null);
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feed_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast.success('Post deleted');
      setDeletePostId(null);
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const openEditDialog = (post: Post) => {
    setEditForm({
      title: post.title || '',
      content: post.content,
      image_url: post.image_url || '',
      video_url: post.video_url || '',
      display_name: post.display_name || '',
    });
    setEditingPost(post);
  };

  const handleEditSubmit = () => {
    if (!editingPost) return;
    if (!editForm.content.trim()) {
      toast.error('Content is required');
      return;
    }
    updatePost.mutate({ id: editingPost.id, data: editForm });
  };

  const POST_TYPE_EMOJI: Record<string, string> = {
    announcement: '📢',
    drip_unlock: '🎧',
    session_reminder: '📅',
    media: '📁',
    discussion: '💬',
    voice_message: '🎙️',
    update: '✅',
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filterChannel} onValueChange={setFilterChannel}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            {channels?.filter(c => c.id).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : posts?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No posts yet. Create your first post!
        </div>
      ) : (
        <div className="space-y-3">
          {posts?.map((post) => {
            const commentInfo = commentsData?.[post.id];
            
            return (
              <Card key={post.id}>
                <CardHeader className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">
                          {POST_TYPE_EMOJI[post.post_type] || '📄'} {post.post_type}
                        </Badge>
                        <Badge variant="secondary">{post.channel?.name}</Badge>
                        {post.is_pinned && (
                          <Badge className="bg-primary/20 text-primary">Pinned</Badge>
                        )}
                        {post.display_name && (
                          <Badge variant="outline" className="text-xs">
                            as {post.display_name}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">
                        {post.title || post.content.slice(0, 60) + (post.content.length > 60 ? '...' : '')}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        By {post.author?.full_name || 'Unknown'} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(post)}
                        title="Edit post"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePin.mutate({ id: post.id, is_pinned: !post.is_pinned })}
                        title={post.is_pinned ? 'Unpin' : 'Pin'}
                      >
                        {post.is_pinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletePostId(post.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {post.title && (
                  <CardContent className="py-2 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.content}
                    </p>
                  </CardContent>
                )}
                {commentInfo && commentInfo.total > 0 && (
                  <CardContent className="py-2 pt-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span>{commentInfo.total} comments</span>
                      {commentInfo.hidden > 0 && (
                        <span className="text-amber-500">({commentInfo.hidden} hidden)</span>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Post title..."
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="Post content..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Name (optional)</Label>
              <Input
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                placeholder="e.g., Razie, The Team..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={editForm.image_url}
                  onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Video URL</Label>
                <Input
                  value={editForm.video_url}
                  onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updatePost.isPending}>
              {updatePost.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the post and all its comments and reactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostId && deletePost.mutate(deletePostId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePost.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
