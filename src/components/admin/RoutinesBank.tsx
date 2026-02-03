import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Image, Layers, ListTodo } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

interface RoutineBankItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  category: string;
  color: string | null;
  emoji: string | null;
  is_active: boolean | null;
  is_popular: boolean | null;
  sort_order: number | null;
}

interface RoutineBankSection {
  id: string;
  routine_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  section_order: number | null;
  is_active: boolean | null;
}

interface RoutineBankTask {
  id: string;
  routine_id: string;
  task_id: string | null;
  title: string;
  emoji: string | null;
  section_id: string | null;
  section_title: string | null;
  task_order: number | null;
}

interface TaskBankItem {
  id: string;
  title: string;
  emoji: string;
  category: string;
}

// Fetch all routines from bank
function useRoutinesBankAdmin() {
  return useQuery({
    queryKey: ['admin-routines-bank'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines_bank')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as RoutineBankItem[];
    },
  });
}

// Fetch sections for a routine
function useRoutineSections(routineId: string | null) {
  return useQuery({
    queryKey: ['admin-routine-sections', routineId],
    queryFn: async () => {
      if (!routineId) return [];
      const { data, error } = await supabase
        .from('routines_bank_sections')
        .select('*')
        .eq('routine_id', routineId)
        .order('section_order', { ascending: true });

      if (error) throw error;
      return data as RoutineBankSection[];
    },
    enabled: !!routineId,
  });
}

// Fetch tasks for a routine
function useRoutineTasks(routineId: string | null) {
  return useQuery({
    queryKey: ['admin-routine-tasks', routineId],
    queryFn: async () => {
      if (!routineId) return [];
      const { data, error } = await supabase
        .from('routines_bank_tasks')
        .select('*')
        .eq('routine_id', routineId)
        .order('task_order', { ascending: true });

      if (error) throw error;
      return data as RoutineBankTask[];
    },
    enabled: !!routineId,
  });
}

// Fetch task bank items for selection
function useTaskBankItems() {
  return useQuery({
    queryKey: ['admin-task-bank-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_task_bank')
        .select('id, title, emoji, category')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as TaskBankItem[];
    },
  });
}

// Fetch routine categories
function useRoutineCategories() {
  return useQuery({
    queryKey: ['admin-routine-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export default function RoutinesBank() {
  const queryClient = useQueryClient();
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineBankItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editTab, setEditTab] = useState<'details' | 'sections' | 'tasks'>('details');

  const { data: routines, isLoading } = useRoutinesBankAdmin();
  const { data: sections } = useRoutineSections(selectedRoutine?.id || null);
  const { data: tasks } = useRoutineTasks(selectedRoutine?.id || null);
  const { data: taskBankItems } = useTaskBankItems();
  const { data: categories } = useRoutineCategories();

  // Mutations
  const createRoutine = useMutation({
    mutationFn: async (data: { title: string; subtitle?: string | null; description?: string | null; category?: string; emoji?: string; cover_image_url?: string | null; is_active?: boolean; is_popular?: boolean }) => {
      const { error } = await supabase.from('routines_bank').insert({
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        category: data.category || 'general',
        emoji: data.emoji,
        cover_image_url: data.cover_image_url,
        is_active: data.is_active ?? true,
        is_popular: data.is_popular ?? false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routines-bank'] });
      toast.success('Routine created');
      setIsCreating(false);
    },
  });

  const updateRoutine = useMutation({
    mutationFn: async ({ id, ...data }: Partial<RoutineBankItem> & { id: string }) => {
      const { error } = await supabase.from('routines_bank').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routines-bank'] });
      toast.success('Routine updated');
    },
  });

  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routines_bank').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routines-bank'] });
      setSelectedRoutine(null);
      toast.success('Routine deleted');
    },
  });

  // Section mutations
  const createSection = useMutation({
    mutationFn: async (data: { routine_id: string; title: string; section_order?: number; is_active?: boolean }) => {
      const { error } = await supabase.from('routines_bank_sections').insert({
        routine_id: data.routine_id,
        title: data.title,
        section_order: data.section_order ?? 0,
        is_active: data.is_active ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-sections'] });
      toast.success('Section created');
    },
  });

  const updateSection = useMutation({
    mutationFn: async ({ id, ...data }: Partial<RoutineBankSection> & { id: string }) => {
      const { error } = await supabase.from('routines_bank_sections').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-sections'] });
      toast.success('Section updated');
    },
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routines_bank_sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-sections'] });
      toast.success('Section deleted');
    },
  });

  // Task mutations
  const createTask = useMutation({
    mutationFn: async (data: { routine_id: string; title: string; task_id?: string | null; emoji?: string | null; section_id?: string | null; section_title?: string | null; task_order?: number }) => {
      const { error } = await supabase.from('routines_bank_tasks').insert({
        routine_id: data.routine_id,
        title: data.title,
        task_id: data.task_id ?? null,
        emoji: data.emoji ?? null,
        section_id: data.section_id ?? null,
        section_title: data.section_title ?? null,
        task_order: data.task_order ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-tasks'] });
      toast.success('Task added');
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routines_bank_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-tasks'] });
      toast.success('Task removed');
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Routines Bank
        </h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Routine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Routine</DialogTitle>
            </DialogHeader>
            <RoutineForm
              onSubmit={(data) => createRoutine.mutate(data)}
              isSubmitting={createRoutine.isPending}
              categories={categories}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Routines List */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">All Routines ({routines?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
            {routines?.map((routine) => (
              <div
                key={routine.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRoutine?.id === routine.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedRoutine(routine)}
              >
                <div className="flex items-center gap-2">
                  <FluentEmoji emoji={routine.emoji || '✨'} size={24} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{routine.title}</p>
                    <p className="text-xs text-muted-foreground">{routine.category}</p>
                  </div>
                  {routine.is_popular && (
                    <Badge variant="secondary" className="text-xs">Popular</Badge>
                  )}
                  {!routine.is_active && (
                    <Badge variant="outline" className="text-xs">Inactive</Badge>
                  )}
                </div>
              </div>
            ))}
            {routines?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No routines yet. Create one to get started.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Routine Editor */}
        <Card className="md:col-span-2">
          <CardContent className="pt-4">
            {selectedRoutine ? (
              <Tabs value={editTab} onValueChange={(v) => setEditTab(v as typeof editTab)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="sections">Sections</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  <RoutineForm
                    routine={selectedRoutine}
                    onSubmit={(data) => updateRoutine.mutate({ id: selectedRoutine.id, ...data })}
                    onDelete={() => deleteRoutine.mutate(selectedRoutine.id)}
                    isSubmitting={updateRoutine.isPending}
                    categories={categories}
                  />
                </TabsContent>

                <TabsContent value="sections">
                  <SectionsEditor
                    routineId={selectedRoutine.id}
                    sections={sections || []}
                    onCreate={(data) => createSection.mutate(data)}
                    onUpdate={(id, data) => updateSection.mutate({ id, ...data })}
                    onDelete={(id) => deleteSection.mutate(id)}
                  />
                </TabsContent>

                <TabsContent value="tasks">
                  <TasksEditor
                    routineId={selectedRoutine.id}
                    tasks={tasks || []}
                    sections={sections || []}
                    taskBankItems={taskBankItems || []}
                    onCreate={(data) => createTask.mutate(data)}
                    onDelete={(id) => deleteTask.mutate(id)}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Select a routine to edit or create a new one
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Routine Form Component
function RoutineForm({
  routine,
  onSubmit,
  onDelete,
  isSubmitting,
  categories,
}: {
  routine?: RoutineBankItem;
  onSubmit: (data: { title: string; subtitle?: string | null; description?: string | null; emoji?: string; category?: string; cover_image_url?: string | null; is_active?: boolean; is_popular?: boolean }) => void;
  onDelete?: () => void;
  isSubmitting: boolean;
  categories?: { slug: string; name: string; icon: string }[];
}) {
  const [title, setTitle] = useState(routine?.title || '');
  const [subtitle, setSubtitle] = useState(routine?.subtitle || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [emoji, setEmoji] = useState(routine?.emoji || '✨');
  const [category, setCategory] = useState(routine?.category || 'general');
  const [coverImageUrl, setCoverImageUrl] = useState(routine?.cover_image_url || '');
  const [isActive, setIsActive] = useState(routine?.is_active ?? true);
  const [isPopular, setIsPopular] = useState(routine?.is_popular ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      subtitle: subtitle || null,
      description: description || null,
      emoji,
      category,
      cover_image_url: coverImageUrl || null,
      is_active: isActive,
      is_popular: isPopular,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Emoji</Label>
          <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-20" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Subtitle</Label>
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="morning">Morning</SelectItem>
            <SelectItem value="evening">Evening</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Cover Image</Label>
        <ImageUploader
          value={coverImageUrl}
          onChange={setCoverImageUrl}
          bucket="routine-images"
          folder="covers"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <Label>Active</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isPopular} onCheckedChange={setIsPopular} />
          <Label>Popular</Label>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {routine ? 'Update' : 'Create'} Routine
        </Button>
        {onDelete && (
          <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}

// Sections Editor Component
function SectionsEditor({
  routineId,
  sections,
  onCreate,
  onUpdate,
  onDelete,
}: {
  routineId: string;
  sections: RoutineBankSection[];
  onCreate: (data: { routine_id: string; title: string; section_order?: number; is_active?: boolean }) => void;
  onUpdate: (id: string, data: Partial<RoutineBankSection>) => void;
  onDelete: (id: string) => void;
}) {
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    onCreate({
      routine_id: routineId,
      title: newTitle,
      section_order: sections.length,
      is_active: true,
    });
    setNewTitle('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="New section title..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <SectionItem
            key={section.id}
            section={section}
            onUpdate={(data) => onUpdate(section.id, data)}
            onDelete={() => onDelete(section.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SectionItem({
  section,
  onUpdate,
  onDelete,
}: {
  section: RoutineBankSection;
  onUpdate: (data: Partial<RoutineBankSection>) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [content, setContent] = useState(section.content || '');
  const [imageUrl, setImageUrl] = useState(section.image_url || '');

  const handleSave = () => {
    onUpdate({ title, content: content || null, image_url: imageUrl || null });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 border rounded-lg space-y-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Section title" />
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content..." rows={3} />
        <ImageUploader
          value={imageUrl}
          onChange={setImageUrl}
          bucket="routine-images"
          folder="sections"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border rounded-lg flex items-start gap-3">
      <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
      <div className="flex-1">
        <p className="font-medium">{section.title}</p>
        {section.content && <p className="text-sm text-muted-foreground line-clamp-2">{section.content}</p>}
      </div>
      <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Tasks Editor Component
function TasksEditor({
  routineId,
  tasks,
  sections,
  taskBankItems,
  onCreate,
  onDelete,
}: {
  routineId: string;
  tasks: RoutineBankTask[];
  sections: RoutineBankSection[];
  taskBankItems: TaskBankItem[];
  onCreate: (data: { routine_id: string; title: string; task_id?: string | null; emoji?: string | null; section_id?: string | null; section_title?: string | null; task_order?: number }) => void;
  onDelete: (id: string) => void;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const handleAdd = () => {
    if (!selectedTaskId) return;
    const task = taskBankItems.find((t) => t.id === selectedTaskId);
    if (!task) return;

    const section = sections.find((s) => s.id === selectedSectionId);

    onCreate({
      routine_id: routineId,
      task_id: task.id,
      title: task.title,
      emoji: task.emoji,
      section_id: selectedSectionId || null,
      section_title: section?.title || null,
      task_order: tasks.length,
    });
    setSelectedTaskId('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select task from bank..." />
          </SelectTrigger>
          <SelectContent>
            {taskBankItems.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.emoji} {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Section (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No section</SelectItem>
            {sections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                {section.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleAdd} size="sm" disabled={!selectedTaskId}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="p-3 border rounded-lg flex items-center gap-3">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <FluentEmoji emoji={task.emoji || '✨'} size={24} />
            <div className="flex-1">
              <p className="font-medium">{task.title}</p>
              {task.section_title && (
                <p className="text-xs text-muted-foreground">Section: {task.section_title}</p>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tasks added yet. Add tasks from the bank above.
          </p>
        )}
      </div>
    </div>
  );
}