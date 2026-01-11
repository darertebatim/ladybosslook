import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Archive, ArchiveRestore, Loader2 } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  slug: string;
  type: 'general' | 'program' | 'round';
  program_slug: string | null;
  round_id: string | null;
  allow_reactions: boolean;
  allow_comments: boolean;
  is_archived: boolean;
  sort_order: number;
}

export function FeedChannelManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'general' as 'general' | 'program' | 'round',
    program_slug: '',
    round_id: '',
    allow_reactions: true,
    allow_comments: true,
  });

  const { data: channels, isLoading } = useQuery({
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

  const { data: programs } = useQuery({
    queryKey: ['programs-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('slug, title')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  const { data: rounds } = useQuery({
    queryKey: ['rounds-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_rounds')
        .select('id, round_name, program_slug')
        .order('program_slug')
        .order('round_number', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createChannel = useMutation({
    mutationFn: async (channelData: typeof formData) => {
      const { error } = await supabase.from('feed_channels').insert({
        name: channelData.name,
        slug: channelData.slug,
        type: channelData.type,
        program_slug: channelData.type === 'program' ? channelData.program_slug : null,
        round_id: channelData.type === 'round' ? channelData.round_id : null,
        allow_reactions: channelData.allow_reactions,
        allow_comments: channelData.allow_comments,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feed-channels'] });
      queryClient.invalidateQueries({ queryKey: ['feed-channels'] });
      toast.success('Channel created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create channel: ' + error.message);
    },
  });

  const updateChannel = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Channel> & { id: string }) => {
      const { error } = await supabase
        .from('feed_channels')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feed-channels'] });
      queryClient.invalidateQueries({ queryKey: ['feed-channels'] });
      toast.success('Channel updated');
      setIsDialogOpen(false);
      setEditingChannel(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update channel: ' + error.message);
    },
  });

  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feed_channels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feed-channels'] });
      queryClient.invalidateQueries({ queryKey: ['feed-channels'] });
      toast.success('Channel deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete channel: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      type: 'general',
      program_slug: '',
      round_id: '',
      allow_reactions: true,
      allow_comments: true,
    });
  };

  const openEditDialog = (channel: Channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      slug: channel.slug,
      type: channel.type,
      program_slug: channel.program_slug || '',
      round_id: channel.round_id || '',
      allow_reactions: channel.allow_reactions,
      allow_comments: channel.allow_comments,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingChannel) {
      updateChannel.mutate({
        id: editingChannel.id,
        name: formData.name,
        slug: formData.slug,
        type: formData.type,
        program_slug: formData.type === 'program' ? formData.program_slug : null,
        round_id: formData.type === 'round' ? formData.round_id : null,
        allow_reactions: formData.allow_reactions,
        allow_comments: formData.allow_comments,
      });
    } else {
      createChannel.mutate(formData);
    }
  };

  const toggleArchive = (channel: Channel) => {
    updateChannel.mutate({ id: channel.id, is_archived: !channel.is_archived });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Channels</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingChannel(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Channel</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChannel ? 'Edit Channel' : 'Create Channel'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Channel name"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="channel-slug"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'general' | 'program' | 'round') => 
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General (All Users)</SelectItem>
                    <SelectItem value="program">Program (Enrolled Users)</SelectItem>
                    <SelectItem value="round">Round (Specific Round)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.type === 'program' && (
                <div>
                  <Label>Program</Label>
                  <Select
                    value={formData.program_slug}
                    onValueChange={(value) => setFormData({ ...formData, program_slug: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs?.map((p) => (
                        <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.type === 'round' && (
                <div>
                  <Label>Round</Label>
                  <Select
                    value={formData.round_id}
                    onValueChange={(value) => setFormData({ ...formData, round_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select round" />
                    </SelectTrigger>
                    <SelectContent>
                      {rounds?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.round_name} ({r.program_slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Allow Reactions</Label>
                <Switch
                  checked={formData.allow_reactions}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_reactions: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow Comments</Label>
                <Switch
                  checked={formData.allow_comments}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_comments: checked })}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={createChannel.isPending || updateChannel.isPending}
                className="w-full"
              >
                {(createChannel.isPending || updateChannel.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingChannel ? 'Update Channel' : 'Create Channel'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-3">
          {channels?.map((channel) => (
            <Card key={channel.id} className={channel.is_archived ? 'opacity-60' : ''}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{channel.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      /{channel.slug} • {channel.type}
                      {channel.is_archived && ' • Archived'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleArchive(channel)}
                      title={channel.is_archived ? 'Unarchive' : 'Archive'}
                    >
                      {channel.is_archived ? (
                        <ArchiveRestore className="h-4 w-4" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(channel)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this channel? All posts will be deleted.')) {
                          deleteChannel.mutate(channel.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2 pt-0">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Reactions: {channel.allow_reactions ? 'Yes' : 'No'}</span>
                  <span>Comments: {channel.allow_comments ? 'Yes' : 'No'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
