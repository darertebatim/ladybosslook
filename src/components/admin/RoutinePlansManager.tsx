import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Pencil, Trash2, Image, Settings, Wand2, Loader2, Sparkles, ListTodo } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Plan {
  id: string;
  category_id: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  icon: string;
  color: string;
  estimated_minutes: number;
  points: number;
  is_featured: boolean;
  is_popular: boolean;
  is_pro_routine: boolean;
  display_order: number;
  is_active: boolean;
  category?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface RoutinePlansManagerProps {
  onSelectPlan: (planId: string) => void;
}

const ICON_OPTIONS = [
  'Sun', 'Moon', 'Heart', 'Brain', 'Dumbbell', 'Briefcase', 
  'Coffee', 'Book', 'Star', 'Sparkles', 'Zap', 'Target',
  'Clock', 'Calendar', 'CheckCircle', 'Award', 'Flame', 'Leaf'
];

const COLOR_OPTIONS = [
  { name: 'Yellow', value: 'yellow' },
  { name: 'Pink', value: 'pink' },
  { name: 'Blue', value: 'blue' },
  { name: 'Purple', value: 'purple' },
  { name: 'Green', value: 'green' },
  { name: 'Orange', value: 'orange' },
];

type TypeFilter = 'all' | 'pro' | 'regular';

export function RoutinePlansManager({ onSelectPlan }: RoutinePlansManagerProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [isGeneratingFromTemplates, setIsGeneratingFromTemplates] = useState(false);
  const [isGeneratingFromTaskTemplates, setIsGeneratingFromTaskTemplates] = useState(false);
  const [aiTheme, setAiTheme] = useState('');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [formData, setFormData] = useState({
    category_id: '' as string | null,
    title: '',
    subtitle: '',
    description: '',
    cover_image_url: '',
    icon: 'Sun',
    color: 'yellow',
    estimated_minutes: 10,
    points: 10,
    is_featured: false,
    is_popular: false,
    is_pro_routine: false,
    display_order: 0,
    is_active: true,
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-routine-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-routine-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plans')
        .select('*, category:routine_categories(name)')
        .order('display_order');
      if (error) throw error;
      return data as Plan[];
    },
  });

  // Filter plans based on type
  const filteredPlans = plans?.filter(plan => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'pro') return plan.is_pro_routine;
    return !plan.is_pro_routine;
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const insertData = {
        ...data,
        category_id: data.category_id || null,
      };
      const { error } = await supabase.from('routine_plans').insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plans'] });
      toast.success('Plan created');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const updateData = {
        ...data,
        category_id: data.category_id || null,
      };
      const { error } = await supabase
        .from('routine_plans')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plans'] });
      toast.success('Plan updated');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('routine_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plans'] });
      toast.success('Plan deleted');
      setDeleteId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('routine-covers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('routine-covers')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      category_id: null,
      title: '',
      subtitle: '',
      description: '',
      cover_image_url: '',
      icon: 'Sun',
      color: 'yellow',
      estimated_minutes: 10,
      points: 10,
      is_featured: false,
      is_popular: false,
      is_pro_routine: typeFilter === 'pro',
      display_order: (plans?.length || 0) + 1,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      category_id: plan.category_id,
      title: plan.title,
      subtitle: plan.subtitle || '',
      description: plan.description || '',
      cover_image_url: plan.cover_image_url || '',
      icon: plan.icon,
      color: plan.color,
      estimated_minutes: plan.estimated_minutes,
      points: plan.points,
      is_featured: plan.is_featured,
      is_popular: plan.is_popular,
      is_pro_routine: plan.is_pro_routine,
      display_order: plan.display_order,
      is_active: plan.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
  };

  const handleSubmit = () => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const renderIcon = (iconName: string) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  const plansWithoutCovers = plans?.filter(p => !p.cover_image_url) || [];

  const handleBulkGenerate = async (onlyMissing: boolean) => {
    const targetPlans = onlyMissing ? plansWithoutCovers : plans;
    if (!targetPlans?.length) {
      toast.error('No plans to generate covers for');
      return;
    }

    setIsBulkGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-routine-covers-bulk', {
        body: { 
          planIds: targetPlans.map(p => p.id),
          onlyMissing 
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`Generated ${data.successCount} covers, ${data.failedCount} failed`);
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plans'] });
    } catch (error) {
      console.error('Bulk generation error:', error);
      toast.error('Failed to generate covers');
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const handleAIGeneratePlan = async () => {
    setIsAIGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-routine-plan-ai', {
        body: { 
          categoryId: formData.category_id || null,
          theme: aiTheme || undefined
        }
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data.message || 'Plan created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plans'] });
      setShowAIDialog(false);
      setAiTheme('');
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate plan');
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleGenerateFromTemplates = async () => {
    setIsGeneratingFromTemplates(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pro-routines-from-templates');
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      toast.success(data.message || `Created ${data.createdCount} Pro Routines`);
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plans'] });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate Pro Routines from templates');
    } finally {
      setIsGeneratingFromTemplates(false);
    }
  };

  const handleGenerateFromTaskTemplates = async () => {
    setIsGeneratingFromTaskTemplates(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-plans-from-task-templates');
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      toast.success(data.message || `Created ${data.createdCount} plans`);
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plans'] });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate plans from task templates');
    } finally {
      setIsGeneratingFromTaskTemplates(false);
    }
  };

  const proCount = plans?.filter(p => p.is_pro_routine).length || 0;
  const regularCount = plans?.filter(p => !p.is_pro_routine).length || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle>Routine Plans</CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleGenerateFromTemplates} 
            size="sm" 
            variant="outline"
            disabled={isGeneratingFromTemplates}
            className="text-violet-600 border-violet-200 hover:bg-violet-50 dark:text-violet-400 dark:border-violet-800 dark:hover:bg-violet-950"
          >
            {isGeneratingFromTemplates ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Pro from Templates
          </Button>
          <Button 
            onClick={handleGenerateFromTaskTemplates} 
            size="sm" 
            variant="outline"
            disabled={isGeneratingFromTaskTemplates}
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"
          >
            {isGeneratingFromTaskTemplates ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ListTodo className="h-4 w-4 mr-2" />
            )}
            Plans from Tasks
          </Button>
          <Button 
            onClick={() => setShowAIDialog(true)} 
            size="sm" 
            variant="outline"
            disabled={isAIGenerating}
          >
            {isAIGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            AI Generate Plan
          </Button>
          {plansWithoutCovers.length > 0 && (
            <Button 
              onClick={() => handleBulkGenerate(true)} 
              size="sm" 
              variant="outline"
              disabled={isBulkGenerating}
            >
              {isBulkGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              AI Covers ({plansWithoutCovers.length})
            </Button>
          )}
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Type Filter */}
        <div className="flex gap-2 mb-4">
          <Button 
            variant={typeFilter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            All ({plans?.length || 0})
          </Button>
          <Button 
            variant={typeFilter === 'pro' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTypeFilter('pro')}
            className={typeFilter === 'pro' ? '' : 'text-violet-600 border-violet-200 hover:bg-violet-50 dark:text-violet-400 dark:border-violet-800 dark:hover:bg-violet-950'}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Pro Routines ({proCount})
          </Button>
          <Button 
            variant={typeFilter === 'regular' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTypeFilter('regular')}
          >
            <ListTodo className="h-4 w-4 mr-1" />
            Regular ({regularCount})
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !filteredPlans?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            {typeFilter === 'all' 
              ? 'No plans yet. Create one to get started.'
              : typeFilter === 'pro'
              ? 'No Pro routines yet. Create a playlist-based routine.'
              : 'No regular routines yet. Create a simple task routine.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Cover</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    {plan.cover_image_url ? (
                      <img 
                        src={plan.cover_image_url} 
                        alt={plan.title}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        {renderIcon(plan.icon)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{plan.title}</div>
                      {plan.subtitle && (
                        <div className="text-sm text-muted-foreground">{plan.subtitle}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {plan.is_pro_routine ? (
                      <Badge className="bg-violet-500/20 text-violet-700 dark:text-violet-300 border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Pro
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <ListTodo className="h-3 w-3 mr-1" />
                        Regular
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{plan.category?.name || '—'}</TableCell>
                  <TableCell>{plan.estimated_minutes} min</TableCell>
                  <TableCell>{plan.points} pts</TableCell>
                  <TableCell>
                    {plan.is_featured && <span className="text-amber-500">⭐</span>}
                    {plan.is_popular && <span className="text-rose-500">🔥</span>}
                  </TableCell>
                  <TableCell>
                    <span className={plan.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                      {plan.is_active ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectPlan(plan.id)}
                        title="Manage sections & tasks"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(plan.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Edit Plan' : 'Create Plan'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Rise & Shine: 10-Minute Morning"
              />
            </div>
            <div className="col-span-2">
              <Label>Subtitle</Label>
              <Input
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Start your day with energy"
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A quick morning routine to boost your energy..."
                rows={3}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={formData.category_id || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  category_id: value === 'none' ? null : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cover Image</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                  placeholder="Image URL"
                  className="flex-1"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" size="icon" disabled={isUploading} asChild>
                    <span><Image className="h-4 w-4" /></span>
                  </Button>
                </label>
              </div>
              {formData.cover_image_url && (
                <img 
                  src={formData.cover_image_url} 
                  alt="Preview" 
                  className="mt-2 w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-1 mt-2">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`p-2 rounded-lg border transition-colors ${
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
              <div className="grid grid-cols-3 gap-2 mt-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={`p-2 rounded-lg border transition-colors ${
                      formData.color === color.value 
                        ? 'border-primary' 
                        : 'border-muted hover:border-muted-foreground/20'
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Estimated Minutes</Label>
              <Input
                type="number"
                value={formData.estimated_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_minutes: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Points</Label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            {/* Pro Routine Toggle */}
            <div className="col-span-2 p-3 rounded-lg border border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  <div>
                    <Label className="font-semibold">Pro Routine</Label>
                    <p className="text-xs text-muted-foreground">Enable for playlist/feature-based routines with app links</p>
                  </div>
                </div>
                <Switch
                  checked={formData.is_pro_routine}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_pro_routine: checked }))}
                />
              </div>
            </div>

            <div className="col-span-2 flex gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label>Featured (⭐ Banner)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                />
                <Label>Popular (🔥)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Active</Label>
              </div>
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
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this plan and all its sections and tasks.
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

      {/* AI Generate Plan Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Generate Routine Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category (optional)</Label>
              <Select
                value={formData.category_id || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  category_id: value === 'none' ? null : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any category</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Theme / Topic (optional)</Label>
              <Input
                value={aiTheme}
                onChange={(e) => setAiTheme(e.target.value)}
                placeholder="e.g. 5-minute stress relief, productivity boost, evening relaxation..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Describe the type of routine you want to generate
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAIGeneratePlan}
              disabled={isAIGenerating}
            >
              {isAIGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
