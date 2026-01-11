import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Image, Video, Link, Play, FileText, ExternalLink } from 'lucide-react';

const POST_TYPES = [
  { value: 'announcement', label: 'Announcement', icon: '📢' },
  { value: 'drip_unlock', label: 'New Content', icon: '🎧' },
  { value: 'session_reminder', label: 'Session Reminder', icon: '📅' },
  { value: 'media', label: 'Media Post', icon: '📁' },
  { value: 'discussion', label: 'Discussion', icon: '💬' },
];

const ACTION_TYPES = [
  { value: 'none', label: 'No Action', icon: null },
  { value: 'play_audio', label: 'Play Audio', icon: Play },
  { value: 'join_session', label: 'Join Session', icon: Video },
  { value: 'view_materials', label: 'View Materials', icon: FileText },
  { value: 'external_link', label: 'External Link', icon: ExternalLink },
];

interface FeedPostCreatorProps {
  onSuccess?: () => void;
}

export function FeedPostCreator({ onSuccess }: FeedPostCreatorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    channel_id: '',
    post_type: 'announcement',
    title: '',
    content: '',
    image_url: '',
    video_url: '',
    action_type: 'none',
    action_label: '',
    action_url: '',
    action_audio_id: '',
    action_playlist_id: '',
    is_pinned: false,
    send_push: false,
  });

  const { data: channels } = useQuery({
    queryKey: ['admin-feed-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_channels')
        .select('*')
        .eq('is_archived', false)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: playlists } = useQuery({
    queryKey: ['playlists-for-action'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const createPost = useMutation({
    mutationFn: async () => {
      const actionData: Record<string, any> = {};
      
      if (formData.action_type !== 'none') {
        actionData.label = formData.action_label || undefined;
        
        if (formData.action_type === 'play_audio') {
          if (formData.action_playlist_id) {
            actionData.playlistId = formData.action_playlist_id;
          }
          if (formData.action_audio_id) {
            actionData.audioId = formData.action_audio_id;
          }
        } else if (formData.action_type === 'join_session') {
          actionData.meetingUrl = formData.action_url;
        } else if (formData.action_type === 'view_materials' || formData.action_type === 'external_link') {
          actionData.url = formData.action_url;
        }
      }

      const { error } = await supabase.from('feed_posts').insert({
        channel_id: formData.channel_id,
        author_id: user?.id,
        post_type: formData.post_type,
        title: formData.title || null,
        content: formData.content,
        image_url: formData.image_url || null,
        video_url: formData.video_url || null,
        action_type: formData.action_type,
        action_data: actionData,
        is_pinned: formData.is_pinned,
        send_push: formData.send_push,
      });

      if (error) throw error;

      // TODO: Send push notification if send_push is true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast.success('Post created successfully');
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Failed to create post: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      channel_id: '',
      post_type: 'announcement',
      title: '',
      content: '',
      image_url: '',
      video_url: '',
      action_type: 'none',
      action_label: '',
      action_url: '',
      action_audio_id: '',
      action_playlist_id: '',
      is_pinned: false,
      send_push: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.channel_id || !formData.content) {
      toast.error('Please select a channel and add content');
      return;
    }
    createPost.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Channel Selection */}
          <div>
            <Label>Channel *</Label>
            <Select
              value={formData.channel_id}
              onValueChange={(value) => setFormData({ ...formData, channel_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {channels?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Post Type */}
          <div>
            <Label>Post Type</Label>
            <Select
              value={formData.post_type}
              onValueChange={(value) => setFormData({ ...formData, post_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POST_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title (optional) */}
          <div>
            <Label>Title (optional)</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Post title"
            />
          </div>

          {/* Content */}
          <div>
            <Label>Content *</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your post content..."
              rows={5}
            />
          </div>

          {/* Media URLs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" /> Image URL
              </Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" /> Video URL (YouTube)
              </Label>
              <Input
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action Button</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Action Type</Label>
            <Select
              value={formData.action_type}
              onValueChange={(value) => setFormData({ ...formData, action_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.action_type !== 'none' && (
            <>
              <div>
                <Label>Button Label</Label>
                <Input
                  value={formData.action_label}
                  onChange={(e) => setFormData({ ...formData, action_label: e.target.value })}
                  placeholder="e.g., Listen Now, Join Session"
                />
              </div>

              {formData.action_type === 'play_audio' && (
                <div>
                  <Label>Playlist</Label>
                  <Select
                    value={formData.action_playlist_id}
                    onValueChange={(value) => setFormData({ ...formData, action_playlist_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      {playlists?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(formData.action_type === 'join_session' || 
                formData.action_type === 'view_materials' || 
                formData.action_type === 'external_link') && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Link className="h-4 w-4" /> URL
                  </Label>
                  <Input
                    value={formData.action_url}
                    onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Pin Post</Label>
              <p className="text-sm text-muted-foreground">Show at top of feed</p>
            </div>
            <Switch
              checked={formData.is_pinned}
              onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Send Push Notification</Label>
              <p className="text-sm text-muted-foreground">Notify users about this post</p>
            </div>
            <Switch
              checked={formData.send_push}
              onCheckedChange={(checked) => setFormData({ ...formData, send_push: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={createPost.isPending}>
        {createPost.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Create Post
      </Button>
    </form>
  );
}
