import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, MoreVertical, Pin, PinOff, Pencil, Trash2 } from 'lucide-react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  is_system: boolean;
  created_at: string;
  image_url: string | null;
  video_url: string | null;
  display_name: string | null;
  author_id: string | null;
  author: { full_name: string | null; avatar_url: string | null } | null;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  type: string;
  cover_image_url: string | null;
}

interface PostGroup {
  dateLabel: string;
  posts: Array<Post & { isFollowUp: boolean }>;
}

// Accent colors for user bubbles
const ACCENT_COLORS = [
  'hsl(330, 70%, 80%)', // pink
  'hsl(25, 85%, 80%)',  // peach
  'hsl(50, 85%, 75%)',  // yellow
  'hsl(100, 60%, 75%)', // lime
  'hsl(195, 75%, 75%)', // sky
  'hsl(160, 55%, 75%)', // mint
];

const getUserColorIndex = (authorId: string | null): number => {
  if (!authorId) return 1;
  let hash = 5381;
  for (let i = 0; i < authorId.length; i++) {
    hash = ((hash << 5) + hash) ^ authorId.charCodeAt(i);
  }
  return (Math.abs(hash) % 6) + 1;
};

export function AdminChannelChat() {
  const queryClient = useQueryClient();
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    image_url: '',
    video_url: '',
    display_name: '',
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch channels
  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['admin-feed-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_channels')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Channel[];
    },
  });

  // Auto-select first channel
  useEffect(() => {
    if (channels?.length && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  // Fetch posts for selected channel
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['admin-channel-posts', selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return [];
      const { data, error } = await supabase
        .from('feed_posts')
        .select(`
          *,
          author:profiles!feed_posts_author_id_fkey(full_name, avatar_url)
        `)
        .eq('channel_id', selectedChannelId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Post[];
    },
    enabled: !!selectedChannelId,
  });

  // Scroll to bottom when posts change
  useEffect(() => {
    if (posts && posts.length > 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [posts, selectedChannelId]);

  // Group posts by date
  const groupedPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];

    const groups: PostGroup[] = [];
    let currentDateLabel = '';

    posts.forEach((post, index) => {
      const postDate = new Date(post.created_at);
      let dateLabel: string;

      if (isToday(postDate)) {
        dateLabel = 'Today';
      } else if (isYesterday(postDate)) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = format(postDate, 'MMM d, yyyy');
      }

      // Check if this is a follow-up message
      let isFollowUp = false;
      if (index > 0) {
        const prevPost = posts[index - 1];
        const prevPostDate = new Date(prevPost.created_at);
        const sameAuthor = post.author_id === prevPost.author_id;
        const sameDay = format(postDate, 'yyyy-MM-dd') === format(prevPostDate, 'yyyy-MM-dd');
        const withinFiveMinutes = Math.abs(differenceInMinutes(postDate, prevPostDate)) <= 5;
        
        isFollowUp = sameAuthor && sameDay && withinFiveMinutes && !post.is_pinned && !prevPost.is_pinned;
      }

      if (dateLabel !== currentDateLabel) {
        groups.push({ dateLabel, posts: [] });
        currentDateLabel = dateLabel;
      }

      groups[groups.length - 1].posts.push({ ...post, isFollowUp });
    });

    return groups;
  }, [posts]);

  // Mutations
  const togglePin = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from('feed_posts')
        .update({ is_pinned })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-channel-posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast.success('Post updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editForm }) => {
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
      queryClient.invalidateQueries({ queryKey: ['admin-channel-posts'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-channel-posts'] });
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

  // Helper to get display name
  const getDisplayName = (post: Post) => {
    if (post.post_type === 'discussion') {
      return post.author?.full_name || 'Unknown';
    }
    return post.display_name || 'Simora';
  };

  // Helper to get avatar
  const getAvatarUrl = (post: Post) => {
    if (post.post_type === 'discussion') {
      return post.author?.avatar_url || null;
    }
    return '/simora-icon.png';
  };

  const selectedChannel = channels?.find(c => c.id === selectedChannelId);

  return (
    <div className="space-y-4">
      {/* Channel selector */}
      <div className="flex items-center gap-4">
        <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select channel" />
          </SelectTrigger>
          <SelectContent>
            {channels?.filter(c => c.id).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedChannel && (
          <Badge variant="secondary">{selectedChannel.type}</Badge>
        )}
      </div>

      {/* Chat container */}
      <div className="border rounded-xl bg-muted/30 h-[600px] flex flex-col overflow-hidden">
        {channelsLoading || postsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !selectedChannelId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a channel to view messages
          </div>
        ) : groupedPosts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No messages in this channel yet
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            {groupedPosts.map((group) => (
              <div key={group.dateLabel}>
                {/* Date separator */}
                <div className="flex justify-center py-3">
                  <Badge 
                    variant="secondary" 
                    className="bg-background/80 shadow-sm border text-xs font-normal"
                  >
                    {group.dateLabel}
                  </Badge>
                </div>

                {/* Posts */}
                {group.posts.map((post) => {
                  const accentColor = ACCENT_COLORS[(getUserColorIndex(post.author_id) - 1) % 6];
                  const displayName = getDisplayName(post);
                  const avatarUrl = getAvatarUrl(post);
                  const isUserPost = post.post_type === 'discussion';

                  return (
                    <div 
                      key={post.id} 
                      className={cn(
                        "flex gap-2 mb-3 group",
                        post.isFollowUp && "mt-0.5"
                      )}
                    >
                      {/* Avatar */}
                      {!post.isFollowUp && (
                        <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {post.isFollowUp && <div className="w-9 shrink-0" />}

                      {/* Message bubble */}
                      <div className="flex-1 min-w-0 max-w-[85%]">
                        {/* Header */}
                        {!post.isFollowUp && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{displayName}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(post.created_at), 'h:mm a')}
                            </span>
                            {post.is_pinned && (
                              <Badge variant="secondary" className="text-[10px] py-0">Pinned</Badge>
                            )}
                          </div>
                        )}

                        {/* Content */}
                        <div 
                          className="relative px-3.5 py-2.5 bg-background border-2 rounded-2xl"
                          style={{ borderColor: isUserPost ? accentColor : 'hsl(var(--primary) / 0.3)' }}
                        >
                          {/* Title */}
                          {post.title && (
                            <p className="font-semibold text-sm mb-1">{post.title}</p>
                          )}
                          
                          {/* Text content */}
                          <p className="text-sm whitespace-pre-wrap break-words">{post.content}</p>

                          {/* Image */}
                          {post.image_url && (
                            <img 
                              src={post.image_url} 
                              alt="" 
                              className="mt-2 rounded-lg max-h-48 object-cover"
                            />
                          )}

                          {/* Actions menu - always visible for admin */}
                          <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="secondary" 
                                  size="icon" 
                                  className="h-7 w-7 shadow-sm"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => togglePin.mutate({ id: post.id, is_pinned: !post.is_pinned })}>
                                  {post.is_pinned ? (
                                    <>
                                      <PinOff className="h-4 w-4 mr-2" />
                                      Unpin
                                    </>
                                  ) : (
                                    <>
                                      <Pin className="h-4 w-4 mr-2" />
                                      Pin
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(post)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeletePostId(post.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

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
                placeholder="e.g., Simora, The Team..."
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