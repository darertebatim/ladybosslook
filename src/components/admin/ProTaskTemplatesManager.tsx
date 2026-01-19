import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Sparkles, Wand2, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { PRO_LINK_TYPES, PRO_LINK_CONFIGS, ProLinkType } from '@/lib/proTaskTypes';

interface Template {
  id: string;
  title: string;
  duration_minutes: number;
  icon: string;
  pro_link_type: string;
  pro_link_value: string | null;
  linked_playlist_id: string | null;
  description: string | null;
  category: string | null;
  is_active: boolean;
  display_order: number;
  linked_playlist?: { id: string; name: string } | null;
}

interface Playlist {
  id: string;
  name: string;
  category: string | null;
}

const ICON_OPTIONS = [
  'Sun', 'Moon', 'Heart', 'Brain', 'Dumbbell', 'Coffee', 
  'Book', 'Star', 'Sparkles', 'Zap', 'Target', 'Clock',
  'CheckCircle', 'Award', 'Flame', 'Leaf', 'Music', 'BookOpen'
];

const CATEGORY_OPTIONS = [
  'Morning', 'Evening', 'Productivity', 'Wellness', 'Learning', 'Community'
];

export function ProTaskTemplatesManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    duration_minutes: 5,
    icon: 'Sparkles',
    pro_link_type: 'playlist' as string,
    pro_link_value: null as string | null,
    linked_playlist_id: null as string | null,
    description: '',
    category: null as string | null,
    is_active: true,
    display_order: 0,
  });

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pro-task-templates-ai');
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      toast.success(data.message || `Created ${data.count} new templates`);
      queryClient.invalidateQueries({ queryKey: ['admin-pro-task-templates'] });
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate templates');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin-pro-task-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_task_templates')
        .select(`
          *,
          linked_playlist:audio_playlists!linked_playlist_id(id, name)
        `)
        .order('display_order');
      if (error) throw error;
      return data as Template[];
    },
  });

  // Fetch playlists for linking
  const { data: playlists } = useQuery({
    queryKey: ['admin-playlists-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name, category')
        .eq('is_hidden', false)
        .order('name');
      if (error) throw error;
      return data as Playlist[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('routine_task_templates').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pro-task-templates'] });
      toast.success('Template created');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('routine_task_templates')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pro-task-templates'] });
      toast.success('Template updated');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('routine_task_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pro-task-templates'] });
      toast.success('Template deleted');
      setDeleteId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({
      title: '',
      duration_minutes: 5,
      icon: 'Sparkles',
      pro_link_type: 'playlist',
      pro_link_value: null,
      linked_playlist_id: null,
      description: '',
      category: null,
      is_active: true,
      display_order: (templates?.length || 0) + 1,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      duration_minutes: template.duration_minutes,
      icon: template.icon,
      pro_link_type: template.pro_link_type,
      pro_link_value: template.pro_link_value,
      linked_playlist_id: template.linked_playlist_id,
      description: template.description || '',
      category: template.category,
      is_active: template.is_active,
      display_order: template.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleSubmit = () => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }
    if (!formData.pro_link_type) {
      toast.error('Pro link type is required');
      return;
    }
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const renderIcon = (iconName: string) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  const getLinkTypeConfig = (type: string) => {
    return PRO_LINK_CONFIGS[type as ProLinkType];
  };

  // Group playlists by category
  const playlistsByCategory = playlists?.reduce((acc, playlist) => {
    const cat = playlist.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(playlist);
    return acc;
  }, {} as Record<string, Playlist[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Pro Task Templates
          </CardTitle>
          <CardDescription>
            Reusable Pro Task library for quick addition to routines
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleAIGenerate} 
            size="sm" 
            variant="outline"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            AI Generate
          </Button>
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !templates?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No templates yet. Create reusable Pro Tasks for quick routine building.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Icon</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => {
                const config = getLinkTypeConfig(template.pro_link_type);
                const Icon = config?.icon;
                return (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {renderIcon(template.icon)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{template.title}</div>
                      {template.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {template.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={config?.badgeColorClass}>
                        {Icon && <Icon className="h-3 w-3 mr-1" />}
                        {config?.label || template.pro_link_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {template.linked_playlist?.name || template.pro_link_value || '—'}
                    </TableCell>
                    <TableCell>{template.duration_minutes} min</TableCell>
                    <TableCell>
                      {template.category && (
                        <Badge variant="secondary">{template.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={template.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                        {template.is_active ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Morning Meditation"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Start your day with a calming meditation..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value === 'none' ? null : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                      formData.icon === icon 
                        ? 'border-primary bg-primary/10' 
                        : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    {renderIcon(icon)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Pro Link Configuration */}
            <div className="space-y-3 p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <Label className="font-semibold">Pro Link Type</Label>
              </div>
              
              <Select
                value={formData.pro_link_type}
                onValueChange={(value) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    pro_link_type: value,
                    pro_link_value: null,
                    linked_playlist_id: null,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRO_LINK_TYPES.map((config) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={config.value} value={config.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Value selector based on link type */}
              {formData.pro_link_type === 'playlist' && (
                <div>
                  <Label className="text-xs">Select Playlist</Label>
                  <Select
                    value={formData.pro_link_value || 'none'}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      pro_link_value: value === 'none' ? null : value,
                      linked_playlist_id: value === 'none' ? null : value,
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a playlist..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No playlist</SelectItem>
                      {Object.entries(playlistsByCategory || {}).map(([category, pls]) => (
                        <div key={category}>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {category}
                          </div>
                          {pls.map((playlist) => (
                            <SelectItem key={playlist.id} value={playlist.id}>
                              {playlist.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.pro_link_type === 'channel' && (
                <div>
                  <Label className="text-xs">Channel Slug</Label>
                  <Input
                    value={formData.pro_link_value || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pro_link_value: e.target.value || null }))}
                    placeholder="e.g., general, announcements"
                    className="mt-1"
                  />
                </div>
              )}

              {formData.pro_link_type === 'program' && (
                <div>
                  <Label className="text-xs">Program Slug</Label>
                  <Input
                    value={formData.pro_link_value || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pro_link_value: e.target.value || null }))}
                    placeholder="e.g., courageous-character"
                    className="mt-1"
                  />
                </div>
              )}

              {formData.pro_link_type === 'route' && (
                <div>
                  <Label className="text-xs">Custom Route Path</Label>
                  <Input
                    value={formData.pro_link_value || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pro_link_value: e.target.value || null }))}
                    placeholder="e.g., /app/profile"
                    className="mt-1"
                  />
                </div>
              )}

              {formData.pro_link_type && !['playlist', 'channel', 'program', 'route'].includes(formData.pro_link_type) && (
                <p className="text-xs text-muted-foreground italic">
                  This link type doesn't require a value.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. Routines using tasks from this template will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
