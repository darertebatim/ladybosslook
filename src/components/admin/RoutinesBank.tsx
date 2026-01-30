import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Layers, Star, Trash2, Eye, EyeOff, Pencil, GripVertical, X, Search, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskIcon } from '@/components/app/IconPicker';
import EmojiPicker from '@/components/app/EmojiPicker';

const COLOR_OPTIONS = [
  { name: 'pink', hex: '#FFD6E8' },
  { name: 'peach', hex: '#FFE4C4' },
  { name: 'yellow', hex: '#FFF59D' },
  { name: 'lime', hex: '#E8F5A3' },
  { name: 'sky', hex: '#C5E8FA' },
  { name: 'mint', hex: '#B8F5E4' },
  { name: 'lavender', hex: '#E8D4F8' },
];

interface RoutineCategory {
  slug: string;
  name: string;
  icon: string | null;
  is_active: boolean;
}

interface RoutineBankItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  category: string;
  color: string;
  emoji: string;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface RoutineBankTask {
  id: string;
  routine_id: string;
  task_id: string | null;
  title: string;
  emoji: string;
  duration_minutes: number;
  section_title: string | null;
  task_order: number;
}

interface TaskBankItem {
  id: string;
  title: string;
  emoji: string;
  duration_minutes: number | null;
  category: string;
  is_active: boolean;
}

export default function RoutinesBank() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineBankItem | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [taskSearchOpen, setTaskSearchOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [sectionInputIndex, setSectionInputIndex] = useState<number | null>(null);
  const [sectionInputValue, setSectionInputValue] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    cover_image_url: '',
    category: 'general',
    color: 'yellow',
    emoji: '✨',
  });
  const [routineTasks, setRoutineTasks] = useState<RoutineBankTask[]>([]);

  // Fetch categories
  const { data: routineCategories = [] } = useQuery({
    queryKey: ['routine-categories-for-routines-bank'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_categories')
        .select('slug, name, icon, is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as RoutineCategory[];
    },
  });

  // Fetch routines with task count
  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['routines-bank'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines_bank')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as RoutineBankItem[];
    },
  });

  // Fetch task counts for routines
  const { data: taskCounts = {} } = useQuery({
    queryKey: ['routines-bank-task-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines_bank_tasks')
        .select('routine_id, duration_minutes');
      if (error) throw error;
      
      const counts: Record<string, { count: number; duration: number }> = {};
      data.forEach((task) => {
        if (!counts[task.routine_id]) {
          counts[task.routine_id] = { count: 0, duration: 0 };
        }
        counts[task.routine_id].count++;
        counts[task.routine_id].duration += task.duration_minutes || 0;
      });
      return counts;
    },
  });

  // Fetch task bank for picker
  const { data: taskBank = [] } = useQuery({
    queryKey: ['admin-task-bank-for-picker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_task_bank')
        .select('id, title, emoji, duration_minutes, category, is_active')
        .eq('is_active', true)
        .order('title', { ascending: true });
      if (error) throw error;
      return data as TaskBankItem[];
    },
  });

  // Create routine
  const createRoutine = useMutation({
    mutationFn: async (data: { formData: typeof formData; tasks: RoutineBankTask[] }) => {
      const { data: newRoutine, error } = await supabase
        .from('routines_bank')
        .insert({
          title: data.formData.title,
          subtitle: data.formData.subtitle || null,
          description: data.formData.description || null,
          cover_image_url: data.formData.cover_image_url || null,
          category: data.formData.category,
          color: data.formData.color,
          emoji: data.formData.emoji,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert tasks
      if (data.tasks.length > 0) {
        const taskRecords = data.tasks.map((t, idx) => ({
          routine_id: newRoutine.id,
          task_id: t.task_id,
          title: t.title,
          emoji: t.emoji,
          duration_minutes: t.duration_minutes,
          section_title: t.section_title,
          task_order: idx,
        }));
        await supabase.from('routines_bank_tasks').insert(taskRecords);
      }
      return newRoutine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines-bank'] });
      queryClient.invalidateQueries({ queryKey: ['routines-bank-task-counts'] });
      toast.success('Routine created');
      closeDialog();
    },
    onError: (error) => toast.error('Failed to create routine: ' + error.message),
  });

  // Update routine
  const updateRoutine = useMutation({
    mutationFn: async (data: { id: string; formData: typeof formData; tasks: RoutineBankTask[] }) => {
      const { error } = await supabase
        .from('routines_bank')
        .update({
          title: data.formData.title,
          subtitle: data.formData.subtitle || null,
          description: data.formData.description || null,
          cover_image_url: data.formData.cover_image_url || null,
          category: data.formData.category,
          color: data.formData.color,
          emoji: data.formData.emoji,
        })
        .eq('id', data.id);
      if (error) throw error;

      // Replace tasks
      await supabase.from('routines_bank_tasks').delete().eq('routine_id', data.id);
      if (data.tasks.length > 0) {
        const taskRecords = data.tasks.map((t, idx) => ({
          routine_id: data.id,
          task_id: t.task_id,
          title: t.title,
          emoji: t.emoji,
          duration_minutes: t.duration_minutes,
          section_title: t.section_title,
          task_order: idx,
        }));
        await supabase.from('routines_bank_tasks').insert(taskRecords);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines-bank'] });
      queryClient.invalidateQueries({ queryKey: ['routines-bank-task-counts'] });
      toast.success('Routine updated');
      closeDialog();
    },
    onError: (error) => toast.error('Failed to update routine: ' + error.message),
  });

  // Delete routine
  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routines_bank').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines-bank'] });
      queryClient.invalidateQueries({ queryKey: ['routines-bank-task-counts'] });
      toast.success('Routine deleted');
    },
  });

  // Toggle popular/active
  const togglePopular = useMutation({
    mutationFn: async ({ id, is_popular }: { id: string; is_popular: boolean }) => {
      const { error } = await supabase.from('routines_bank').update({ is_popular }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines-bank'] }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('routines_bank').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines-bank'] }),
  });

  // Fetch tasks for a routine when editing
  const fetchRoutineTasks = async (routineId: string): Promise<RoutineBankTask[]> => {
    const { data } = await supabase
      .from('routines_bank_tasks')
      .select('*')
      .eq('routine_id', routineId)
      .order('task_order', { ascending: true });
    return (data || []) as RoutineBankTask[];
  };

  const openNewDialog = () => {
    setEditingRoutine(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      cover_image_url: '',
      category: 'general',
      color: 'yellow',
      emoji: '✨',
    });
    setRoutineTasks([]);
    setDialogOpen(true);
  };

  const openEditDialog = async (routine: RoutineBankItem) => {
    setEditingRoutine(routine);
    setFormData({
      title: routine.title,
      subtitle: routine.subtitle || '',
      description: routine.description || '',
      cover_image_url: routine.cover_image_url || '',
      category: routine.category,
      color: routine.color,
      emoji: routine.emoji,
    });
    const tasks = await fetchRoutineTasks(routine.id);
    setRoutineTasks(tasks);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRoutine(null);
    setRoutineTasks([]);
    setTaskSearchOpen(false);
    setTaskSearch('');
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (editingRoutine) {
      updateRoutine.mutate({ id: editingRoutine.id, formData, tasks: routineTasks });
    } else {
      createRoutine.mutate({ formData, tasks: routineTasks });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this routine?')) {
      deleteRoutine.mutate(id);
    }
  };

  const addTaskFromBank = (task: TaskBankItem) => {
    const newTask: RoutineBankTask = {
      id: crypto.randomUUID(),
      routine_id: editingRoutine?.id || '',
      task_id: task.id,
      title: task.title,
      emoji: task.emoji,
      duration_minutes: task.duration_minutes || 1,
      section_title: null,
      task_order: routineTasks.length,
    };
    setRoutineTasks([...routineTasks, newTask]);
    setTaskSearchOpen(false);
    setTaskSearch('');
  };

  const removeTask = (index: number) => {
    setRoutineTasks(routineTasks.filter((_, i) => i !== index));
  };

  const moveTask = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= routineTasks.length) return;
    const newTasks = [...routineTasks];
    [newTasks[fromIndex], newTasks[toIndex]] = [newTasks[toIndex], newTasks[fromIndex]];
    setRoutineTasks(newTasks);
  };

  const updateTaskSection = (index: number, sectionTitle: string | null) => {
    const newTasks = [...routineTasks];
    newTasks[index] = { ...newTasks[index], section_title: sectionTitle };
    setRoutineTasks(newTasks);
  };

  const getCategoryInfo = (cat: string) => {
    const found = routineCategories.find(c => c.slug === cat);
    return found ? { value: found.slug, label: found.name, icon: found.icon || '📋' } : { value: cat, label: cat, icon: '📋' };
  };

  const totalDuration = routineTasks.reduce((sum, t) => sum + (t.duration_minutes || 0), 0);

  const filteredRoutines = selectedCategory === 'all' 
    ? routines 
    : routines.filter(r => r.category === selectedCategory);

  const filteredTaskBank = taskBank.filter(t => 
    t.title.toLowerCase().includes(taskSearch.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Routines Bank
          </CardTitle>
          <CardDescription>
            Create and manage routine templates
          </CardDescription>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          New Routine
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              All
            </TabsTrigger>
            {routineCategories.map((cat) => (
              <TabsTrigger 
                key={cat.slug} 
                value={cat.slug}
                className="flex items-center gap-1"
              >
                <TaskIcon iconName={cat.icon || '📋'} size={14} />
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredRoutines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No routines yet. Click "New Routine" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRoutines.map((routine) => {
              const catInfo = getCategoryInfo(routine.category);
              const stats = taskCounts[routine.id] || { count: 0, duration: 0 };
              return (
                <div
                  key={routine.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow group',
                    !routine.is_active && 'opacity-50'
                  )}
                  style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === routine.color)?.hex + '40' }}
                  onClick={() => openEditDialog(routine)}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === routine.color)?.hex }}>
                    <TaskIcon iconName={routine.emoji} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium truncate", !routine.is_active && "line-through")}>{routine.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{stats.duration}m</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><TaskIcon iconName={catInfo.icon} size={12} /> {catInfo.label}</span>
                      <span>•</span>
                      <span>{stats.count} task{stats.count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePopular.mutate({ id: routine.id, is_popular: !routine.is_popular });
                    }}
                    className={cn(
                      "p-2 transition-all",
                      routine.is_popular ? "text-amber-500" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                    )}
                    title={routine.is_popular ? "Remove from popular" : "Mark as popular"}
                  >
                    <Star className={cn("h-4 w-4", routine.is_popular && "fill-amber-500")} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive.mutate({ id: routine.id, is_active: !routine.is_active });
                    }}
                    className={cn(
                      "p-2 transition-all",
                      !routine.is_active ? "text-muted-foreground" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                    )}
                    title={routine.is_active ? "Deactivate" : "Activate"}
                  >
                    {routine.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(routine);
                    }}
                    className="p-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(routine.id);
                    }}
                    className="p-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRoutine ? 'Edit Routine' : 'New Routine'}</DialogTitle>
            <DialogDescription>
              {editingRoutine ? 'Update routine details and tasks' : 'Create a new routine template'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-2">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Morning Energy Boost"
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Start your day right"
                />
              </div>

              {/* Row: Category, Color, Emoji */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {routineCategories.map((cat) => (
                        <SelectItem key={cat.slug} value={cat.slug}>
                          <span className="flex items-center gap-2">
                            <TaskIcon iconName={cat.icon || '📋'} size={14} />
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-1 flex-wrap">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c.name })}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all",
                          formData.color === c.name ? "border-primary scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEmojiPickerOpen(true)}
                    className="w-full justify-start gap-2"
                  >
                    <TaskIcon iconName={formData.emoji} size={18} />
                    Change
                  </Button>
                </div>
              </div>

              {/* Cover Image URL */}
              <div className="space-y-2">
                <Label htmlFor="cover">Cover Image URL</Label>
                <Input
                  id="cover"
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  className="min-h-[60px]"
                />
              </div>

              {/* Tasks Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Tasks ({routineTasks.length})
                    {totalDuration > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {totalDuration}m total
                      </span>
                    )}
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setTaskSearchOpen(!taskSearchOpen)}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Task
                  </Button>
                </div>

                {/* Task Search Picker */}
                {taskSearchOpen && (
                  <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tasks..."
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        className="pl-8"
                        autoFocus
                      />
                    </div>
                    <ScrollArea className="h-40">
                      <div className="space-y-1">
                        {filteredTaskBank.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => addTaskFromBank(task)}
                            className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent text-left text-sm"
                          >
                            <TaskIcon iconName={task.emoji} size={16} />
                            <span className="flex-1 truncate">{task.title}</span>
                            <span className="text-xs text-muted-foreground">{task.duration_minutes || 1}m</span>
                          </button>
                        ))}
                        {filteredTaskBank.length === 0 && (
                          <p className="text-center text-muted-foreground text-sm py-4">No tasks found</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Task List */}
                <div className="space-y-1">
                  {routineTasks.map((task, index) => (
                    <div key={task.id}>
                      {/* Section Header */}
                      {task.section_title && (
                        <div className="flex items-center gap-2 py-1 px-2 text-xs font-medium text-muted-foreground bg-muted/50 rounded mb-1">
                          <span className="flex-1">{task.section_title}</span>
                          <button
                            type="button"
                            onClick={() => updateTaskSection(index, null)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 p-2 rounded border bg-background">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveTask(index, 'up')}
                            disabled={index === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <GripVertical className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTask(index, 'down')}
                            disabled={index === routineTasks.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <GripVertical className="h-3 w-3" />
                          </button>
                        </div>
                        <TaskIcon iconName={task.emoji} size={16} />
                        <span className="flex-1 text-sm truncate">{task.title}</span>
                        <span className="text-xs text-muted-foreground">{task.duration_minutes}m</span>
                        {sectionInputIndex === index ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={sectionInputValue}
                              onChange={(e) => setSectionInputValue(e.target.value)}
                              placeholder="Section title"
                              className="h-6 text-xs w-24"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateTaskSection(index, sectionInputValue || null);
                                  setSectionInputIndex(null);
                                  setSectionInputValue('');
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1"
                              onClick={() => {
                                updateTaskSection(index, sectionInputValue || null);
                                setSectionInputIndex(null);
                                setSectionInputValue('');
                              }}
                            >
                              ✓
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSectionInputIndex(index);
                              setSectionInputValue(task.section_title || '');
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                            title="Add section header"
                          >
                            § 
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeTask(index)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {routineTasks.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4 border border-dashed rounded">
                      No tasks added yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={createRoutine.isPending || updateRoutine.isPending}>
              {editingRoutine ? 'Save Changes' : 'Create Routine'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emoji Picker */}
      <EmojiPicker
        open={emojiPickerOpen}
        onOpenChange={setEmojiPickerOpen}
        onSelect={(emoji) => {
          setFormData({ ...formData, emoji });
          setEmojiPickerOpen(false);
        }}
        selectedEmoji={formData.emoji}
      />
    </Card>
  );
}
