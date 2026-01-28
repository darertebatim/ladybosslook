import { useState } from 'react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  useBreathingExercises,
  useCreateBreathingExercise,
  useUpdateBreathingExercise,
  useDeleteBreathingExercise,
  BreathingExercise,
  BREATHING_CATEGORIES,
} from '@/hooks/useBreathingExercises';
import { Skeleton } from '@/components/ui/skeleton';

type FormData = Omit<BreathingExercise, 'id' | 'created_at' | 'updated_at'>;

const defaultFormData: FormData = {
  name: '',
  description: '',
  category: 'calm',
  emoji: '🫁',
  inhale_seconds: 4,
  inhale_hold_seconds: 0,
  exhale_seconds: 4,
  exhale_hold_seconds: 0,
  inhale_method: 'nose',
  exhale_method: 'mouth',
  sort_order: 0,
  is_active: true,
};

export function BreathingExercisesManager() {
  const { toast } = useToast();
  const { data: exercises, isLoading } = useBreathingExercises();
  const createExercise = useCreateBreathingExercise();
  const updateExercise = useUpdateBreathingExercise();
  const deleteExercise = useDeleteBreathingExercise();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<BreathingExercise | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const handleOpenCreate = () => {
    setEditingExercise(null);
    setFormData({
      ...defaultFormData,
      sort_order: (exercises?.length || 0) + 1,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (exercise: BreathingExercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      description: exercise.description || '',
      category: exercise.category,
      emoji: exercise.emoji,
      inhale_seconds: exercise.inhale_seconds,
      inhale_hold_seconds: exercise.inhale_hold_seconds,
      exhale_seconds: exercise.exhale_seconds,
      exhale_hold_seconds: exercise.exhale_hold_seconds,
      inhale_method: exercise.inhale_method,
      exhale_method: exercise.exhale_method,
      sort_order: exercise.sort_order,
      is_active: exercise.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingExercise) {
        await updateExercise.mutateAsync({ id: editingExercise.id, ...formData });
        toast({ title: 'Exercise updated successfully' });
      } else {
        await createExercise.mutateAsync(formData);
        toast({ title: 'Exercise created successfully' });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;
    
    try {
      await deleteExercise.mutateAsync(id);
      toast({ title: 'Exercise deleted successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Breathing Exercises</h3>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Exercise
        </Button>
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        {exercises?.map((exercise) => (
          <Card key={exercise.id} className={!exercise.is_active ? 'opacity-50' : ''}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                
                <span className="text-2xl">{exercise.emoji}</span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{exercise.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded capitalize">
                      {exercise.category}
                    </span>
                    {!exercise.is_active && (
                      <span className="text-xs text-red-500 bg-red-100 px-2 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {exercise.inhale_seconds}s in
                    {exercise.inhale_hold_seconds > 0 && ` → ${exercise.inhale_hold_seconds}s hold`}
                    {` → ${exercise.exhale_seconds}s out`}
                    {exercise.exhale_hold_seconds > 0 && ` → ${exercise.exhale_hold_seconds}s hold`}
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(exercise)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(exercise.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExercise ? 'Edit Exercise' : 'Create Exercise'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-[60px_1fr] gap-3">
              <div>
                <Label>Emoji</Label>
                <Input
                  value={formData.emoji}
                  onChange={(e) => updateField('emoji', e.target.value)}
                  className="text-center text-2xl"
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Calm Breathing"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="A brief description of this technique..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => updateField('category', v as FormData['category'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BREATHING_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Breathing timings */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Breathing Pattern</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Inhale (seconds)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.inhale_seconds}
                    onChange={(e) => updateField('inhale_seconds', parseInt(e.target.value) || 4)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Inhale Hold (0 = none)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={formData.inhale_hold_seconds}
                    onChange={(e) => updateField('inhale_hold_seconds', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Exhale (seconds)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.exhale_seconds}
                    onChange={(e) => updateField('exhale_seconds', parseInt(e.target.value) || 4)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Exhale Hold (0 = none)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={formData.exhale_hold_seconds}
                    onChange={(e) => updateField('exhale_hold_seconds', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Inhale Through</Label>
                  <Select
                    value={formData.inhale_method}
                    onValueChange={(v) => updateField('inhale_method', v as 'nose' | 'mouth')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nose">Nose</SelectItem>
                      <SelectItem value="mouth">Mouth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Exhale Through</Label>
                  <Select
                    value={formData.exhale_method}
                    onValueChange={(v) => updateField('exhale_method', v as 'nose' | 'mouth')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nose">Nose</SelectItem>
                      <SelectItem value="mouth">Mouth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => updateField('is_active', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createExercise.isPending || updateExercise.isPending}
            >
              {editingExercise ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
