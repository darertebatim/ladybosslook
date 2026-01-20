import { useState, useMemo } from 'react';
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
import { Plus, Pencil, Trash2, ListTodo, Star } from 'lucide-react';
import { TASK_COLOR_CLASSES } from '@/hooks/useTaskPlanner';

interface Template {
  id: string;
  title: string;
  emoji: string;
  color: string;
  category: string;
  description: string | null;
  repeat_pattern: string;
  suggested_time: string | null;
  is_active: boolean;
  is_popular: boolean;
  display_order: number;
}



const REPEAT_PATTERN_OPTIONS = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'weekdays', label: 'Weekdays' },
];

const EMOJI_OPTIONS = [
  '☀️', '🌙', '💪', '📚', '🧘', '✨', '🎯', '⚡', '🔥', '💡',
  '📝', '🏃', '💼', '🎨', '🌸', '☕', '🧠', '❤️', '🌿', '⭐'
];

export function TaskTemplatesManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    emoji: '✨',
    color: 'lavender' as string,
    category: 'morning' as string,
    description: '',
    repeat_pattern: 'none' as string,
    suggested_time: null as string | null,
    is_active: true,
    is_popular: false,
    display_order: 0,
  });

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin-task-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .order('category')
        .order('display_order');
      if (error) throw error;
      return data as Template[];
    },
  });

  // Derive unique categories from existing templates
  const categoryOptions = useMemo(() => {
    if (!templates) return [];
    const uniqueCategories = [...new Set(templates.map(t => t.category).filter(Boolean))];
    return uniqueCategories.sort();
  }, [templates]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('task_templates').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-templates'] });
      toast.success('Template created');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('task_templates')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-templates'] });
      toast.success('Template updated');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-templates'] });
      toast.success('Template deleted');
      setDeleteId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({
      title: '',
      emoji: '✨',
      color: 'lavender',
      category: 'morning',
      description: '',
      repeat_pattern: 'none',
      suggested_time: null,
      is_active: true,
      is_popular: false,
      display_order: (templates?.length || 0) + 1,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      emoji: template.emoji,
      color: template.color,
      category: template.category,
      description: template.description || '',
      repeat_pattern: template.repeat_pattern,
      suggested_time: template.suggested_time,
      is_active: template.is_active,
      is_popular: template.is_popular,
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
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Group templates by category
  const templatesByCategory = templates?.reduce((acc, template) => {
    const cat = template.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-blue-500" />
            Task Templates
          </CardTitle>
          <CardDescription>
            Basic task templates users can quickly add to their planner
          </CardDescription>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !templates?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No templates yet. Create task templates for users to quickly add tasks.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Icon</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Repeat</TableHead>
                <TableHead>Popular</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => {
                const colorClass = TASK_COLOR_CLASSES[template.color as keyof typeof TASK_COLOR_CLASSES] || 'bg-gray-100';
                return (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center text-lg`}>
                        {template.emoji}
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
                      <Badge variant="secondary" className="capitalize">
                        {template.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`w-6 h-6 rounded ${colorClass}`} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">
                      {template.repeat_pattern === 'none' ? 'One-time' : template.repeat_pattern}
                    </TableCell>
                    <TableCell>
                      {template.is_popular ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
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
                placeholder="Morning Stretch"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A quick stretch to start your day..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Repeat Pattern</Label>
                <Select
                  value={formData.repeat_pattern}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, repeat_pattern: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPEAT_PATTERN_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Emoji</Label>
              <div className="grid grid-cols-10 gap-2 mt-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                    className={`p-2 rounded-lg border-2 text-xl transition-colors ${
                      formData.emoji === emoji 
                        ? 'border-primary bg-primary/10' 
                        : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {Object.keys(TASK_COLOR_CLASSES).map((color) => {
                  const colorClass = TASK_COLOR_CLASSES[color as keyof typeof TASK_COLOR_CLASSES];
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`h-8 rounded-lg border-2 transition-colors ${colorClass} ${
                        formData.color === color 
                          ? 'border-foreground ring-2 ring-offset-2' 
                          : 'border-transparent'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Suggested Time (optional)</Label>
              <Input
                type="time"
                value={formData.suggested_time || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, suggested_time: e.target.value || null }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_popular}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
              />
              <Label className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                Popular
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
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
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this task template. This action cannot be undone.
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
