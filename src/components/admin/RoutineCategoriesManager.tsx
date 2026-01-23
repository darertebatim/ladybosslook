import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Wand2, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

const PRESET_COLORS = [
  { name: 'Yellow', value: '#FEF3C7' },
  { name: 'Pink', value: '#FCE7F3' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Purple', value: '#E9D5FF' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Lavender', value: '#E0E7FF' },
  { name: 'Orange', value: '#FED7AA' },
  { name: 'Teal', value: '#CCFBF1' },
];

const ICON_OPTIONS = [
  'Sun', 'Moon', 'Heart', 'Brain', 'Dumbbell', 'Briefcase', 
  'Coffee', 'Book', 'Star', 'Sparkles', 'Zap', 'Target',
  'Clock', 'Calendar', 'CheckCircle', 'Award', 'Flame', 'Leaf'
];

export function RoutineCategoriesManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: 'Sparkles',
    color: '#FEF3C7',
    display_order: 0,
    is_active: true,
  });

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-routine-categories-ai', {
        body: {}
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data.message || `Added ${data.count} new categories`);
      queryClient.invalidateQueries({ queryKey: ['admin-routine-categories'] });
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate categories');
    } finally {
      setIsGenerating(false);
    }
  };

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-routine-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_categories')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch counts for routine plans per category
  const { data: planCounts } = useQuery({
    queryKey: ['admin-routine-plan-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plans')
        .select('category_id');
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(plan => {
        if (plan.category_id) {
          counts[plan.category_id] = (counts[plan.category_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Fetch counts for task templates per category
  const { data: taskCounts } = useQuery({
    queryKey: ['admin-task-template-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('category');
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(task => {
        if (task.category) {
          counts[task.category] = (counts[task.category] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Fetch counts for pro task templates per category
  const { data: proTaskCounts } = useQuery({
    queryKey: ['admin-pro-task-template-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_task_templates')
        .select('category');
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(task => {
        if (task.category) {
          counts[task.category] = (counts[task.category] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('routine_categories').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-categories'] });
      toast.success('Category created');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('routine_categories')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-categories'] });
      toast.success('Category updated');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('routine_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-categories'] });
      toast.success('Category deleted');
      setDeleteId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      icon: 'Sparkles',
      color: '#FEF3C7',
      display_order: (categories?.length || 0) + 1,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      color: category.color,
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required');
      return;
    }
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const renderIcon = (iconName: string) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle>Routine Categories</CardTitle>
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
            AI Generate Categories
          </Button>
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !categories?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No categories yet. Create one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="text-center">Plans</TableHead>
                <TableHead className="text-center">Tasks</TableHead>
                <TableHead className="text-center">Pro Tasks</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const plansCount = planCounts?.[category.id] || 0;
                const tasksCount = taskCounts?.[category.slug] || 0;
                const proTasksCount = proTaskCounts?.[category.slug] || 0;
                
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        {category.display_order}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderIcon(category.icon)}
                        <span className="text-sm text-muted-foreground">{category.icon}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: category.color }}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={plansCount > 0 ? 'font-medium' : 'text-muted-foreground'}>
                        {plansCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={tasksCount > 0 ? 'font-medium' : 'text-muted-foreground'}>
                        {tasksCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={proTasksCount > 0 ? 'font-medium' : 'text-muted-foreground'}>
                        {proTasksCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={category.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                        {category.is_active ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(category.id)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    name,
                    slug: editingCategory ? prev.slug : generateSlug(name),
                  }));
                }}
                placeholder="Morning Routines"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="morning-routines"
              />
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
            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={`p-2 rounded-lg border-2 transition-colors flex items-center gap-2 ${
                      formData.color === color.value 
                        ? 'border-primary' 
                        : 'border-transparent hover:border-muted-foreground/20'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              />
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
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category. Plans in this category will have their category removed.
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
