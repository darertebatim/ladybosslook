import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Trash2, Sparkles, Star, ChevronRight, Bell, Target, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmojiPicker } from '@/components/app/EmojiPicker';
import { TaskIcon } from '@/components/app/IconPicker';
import { ProLinkType, PRO_LINK_CONFIGS } from '@/lib/proTaskTypes';
import { GoalSettingsSheet, GoalSettings, formatGoalTarget } from '@/components/app/GoalSettingsSheet';

// Color options matching the app
const COLOR_OPTIONS = [
  { name: 'pink', hex: '#FFD6E8' },
  { name: 'peach', hex: '#FFE4C4' },
  { name: 'yellow', hex: '#FFF59D' },
  { name: 'lime', hex: '#E8F5A3' },
  { name: 'sky', hex: '#C5E8FA' },
  { name: 'mint', hex: '#B8F5E4' },
  { name: 'lavender', hex: '#E8D4F8' },
];

// Repeat pattern options
const REPEAT_OPTIONS = [
  { value: 'none', label: 'No Repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekend', label: 'Weekends' },
];

// Duration presets
const DURATION_PRESETS = [1, 2, 5, 10, 15, 20, 30, 45, 60];

interface RoutineCategory {
  slug: string;
  name: string;
  icon: string | null;
  is_active: boolean;
}

interface TaskBankItem {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  color: string;
  category: string;
  duration_minutes: number | null;
  repeat_pattern: string;
  repeat_days: number[] | null;
  reminder_enabled: boolean;
  goal_enabled: boolean;
  goal_type: string | null;
  goal_target: number | null;
  goal_unit: string | null;
  pro_link_type: string | null;
  pro_link_value: string | null;
  linked_playlist_id: string | null;
  is_popular: boolean;
  is_active: boolean;
  tag: string | null;
  sort_order: number;
}

const defaultTask = {
  title: '',
  description: null as string | null,
  emoji: '☀️',
  color: 'yellow',
  category: 'general',
  duration_minutes: 5,
  repeat_pattern: 'none',
  repeat_days: [] as number[],
  reminder_enabled: false,
  goal_enabled: false,
  goal_type: null as string | null,
  goal_target: null as number | null,
  goal_unit: null as string | null,
  pro_link_type: null as string | null,
  pro_link_value: null as string | null,
  linked_playlist_id: null as string | null,
  is_popular: false,
  is_active: true,
  tag: null as string | null,
};

export default function TasksBank() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskBankItem | null>(null);
  const [formData, setFormData] = useState(defaultTask);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch routine categories from database
  const { data: routineCategories = [] } = useQuery({
    queryKey: ['routine-categories-for-tasks-bank'],
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

  // Fetch task bank items
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['admin-task-bank'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_task_bank')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as TaskBankItem[];
    },
  });

  // Fetch subtasks for a task
  const fetchSubtasks = async (taskId: string) => {
    const { data } = await supabase
      .from('admin_task_bank_subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('order_index', { ascending: true });
    return data || [];
  };

  // Fetch playlists for Pro Link
  const { data: playlists = [] } = useQuery({
    queryKey: ['admin-playlists-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name, cover_image_url')
        .eq('is_hidden', false)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch breathing exercises for Pro Link
  const { data: breathingExercises = [] } = useQuery({
    queryKey: ['admin-breathing-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breathing_exercises')
        .select('id, name, emoji')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (data: typeof defaultTask & { subtasks: string[] }) => {
      const { subtasks: subtaskList, ...taskData } = data;
      
      const finalData = {
        ...taskData,
        linked_playlist_id: taskData.pro_link_type === 'playlist' ? taskData.pro_link_value : taskData.linked_playlist_id,
      };
      
      const { data: newTask, error } = await supabase
        .from('admin_task_bank')
        .insert([finalData])
        .select()
        .single();
      
      if (error) throw error;

      if (subtaskList.length > 0) {
        const subtaskRecords = subtaskList.map((title, index) => ({
          task_id: newTask.id,
          title,
          order_index: index,
        }));
        await supabase.from('admin_task_bank_subtasks').insert(subtaskRecords);
      }

      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
      toast.success('Task created');
      closeDialog();
    },
    onError: (error) => {
      toast.error('Failed to create task: ' + error.message);
    },
  });

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: async (data: TaskBankItem & { subtasks: string[] }) => {
      const { subtasks: subtaskList, id, sort_order, ...taskData } = data;
      
      const finalData = {
        ...taskData,
        linked_playlist_id: taskData.pro_link_type === 'playlist' ? taskData.pro_link_value : taskData.linked_playlist_id,
      };
      
      const { error } = await supabase
        .from('admin_task_bank')
        .update(finalData)
        .eq('id', id);
      
      if (error) throw error;

      await supabase.from('admin_task_bank_subtasks').delete().eq('task_id', id);
      if (subtaskList.length > 0) {
        const subtaskRecords = subtaskList.map((title, index) => ({
          task_id: id,
          title,
          order_index: index,
        }));
        await supabase.from('admin_task_bank_subtasks').insert(subtaskRecords);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
      toast.success('Task updated');
      closeDialog();
    },
    onError: (error) => {
      toast.error('Failed to update task: ' + error.message);
    },
  });

  // Delete task mutation
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('admin_task_bank_subtasks').delete().eq('task_id', id);
      const { error } = await supabase.from('admin_task_bank').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
      toast.success('Task deleted');
    },
  });

  const openNewDialog = () => {
    setEditingTask(null);
    setFormData(defaultTask);
    setSubtasks([]);
    setDialogOpen(true);
  };

  const openEditDialog = async (task: TaskBankItem) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      emoji: task.emoji,
      color: task.color,
      category: task.category,
      duration_minutes: task.duration_minutes,
      repeat_pattern: task.repeat_pattern,
      repeat_days: task.repeat_days || [],
      reminder_enabled: task.reminder_enabled,
      goal_enabled: task.goal_enabled,
      goal_type: task.goal_type,
      goal_target: task.goal_target,
      goal_unit: task.goal_unit,
      pro_link_type: task.pro_link_type,
      pro_link_value: task.pro_link_value,
      linked_playlist_id: task.linked_playlist_id,
      is_popular: task.is_popular,
      is_active: task.is_active,
      tag: task.tag,
    });
    
    const existingSubtasks = await fetchSubtasks(task.id);
    setSubtasks(existingSubtasks.map(s => s.title));
    
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
    setFormData(defaultTask);
    setSubtasks([]);
    setNewSubtask('');
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (editingTask) {
      updateTask.mutate({ ...editingTask, ...formData, subtasks } as TaskBankItem & { subtasks: string[] });
    } else {
      createTask.mutate({ ...formData, subtasks });
    }
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const goalSettings: GoalSettings = {
    enabled: formData.goal_enabled,
    type: (formData.goal_type as 'timer' | 'count') || 'count',
    target: formData.goal_target || 2,
    unit: formData.goal_unit || 'times',
  };

  const handleGoalChange = (settings: GoalSettings) => {
    setFormData({
      ...formData,
      goal_enabled: settings.enabled,
      goal_type: settings.enabled ? settings.type : null,
      goal_target: settings.enabled ? settings.target : null,
      goal_unit: settings.enabled ? settings.unit : null,
    });
  };

  const getCategoryInfo = (cat: string) => {
    const found = routineCategories.find(c => c.slug === cat);
    return found ? { value: found.slug, label: found.name, icon: found.icon || '📋' } : { value: cat, label: cat, icon: '📋' };
  };

  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === selectedCategory);

  const usedCategories = [...new Set(tasks.map(t => t.category))];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Tasks Bank
          </CardTitle>
          <CardDescription>
            Reusable task templates for routine planning
          </CardDescription>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
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
                {usedCategories.includes(cat.slug) && (
                  <span className="text-xs text-muted-foreground">
                    ({tasks.filter(t => t.category === cat.slug).length})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tasks yet. Click "Add Task" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const catInfo = getCategoryInfo(task.category);
              return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow',
                    !task.is_active && 'opacity-50'
                  )}
                  style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === task.color)?.hex + '40' }}
                  onClick={() => openEditDialog(task)}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === task.color)?.hex }}>
                    <TaskIcon iconName={task.emoji} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{task.title}</span>
                      {task.is_popular && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><TaskIcon iconName={catInfo.icon} size={12} /> {catInfo.label}</span>
                      {task.goal_enabled && <span>• Goal</span>}
                      {task.pro_link_type && <span>• Pro</span>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pb-4">
              {/* Icon + Title */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(true)}
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors"
                  style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === formData.color)?.hex }}
                >
                  <TaskIcon iconName={formData.emoji} size={28} />
                </button>
                <Input
                  placeholder="Task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="flex-1 text-lg font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description (optional)</label>
                <Textarea
                  placeholder="Describe the task..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                  rows={2}
                  className="mt-1"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="mt-1">
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

              {/* Color */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Color</label>
                <div className="flex gap-2 mt-1">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.name })}
                      className={cn(
                        'w-9 h-9 rounded-full transition-all',
                        formData.color === color.name 
                          ? 'ring-2 ring-offset-2 ring-foreground scale-110' 
                          : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Duration (minutes)</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {DURATION_PRESETS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData({ ...formData, duration_minutes: d })}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                        formData.duration_minutes === d
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-background border-border hover:bg-muted'
                      )}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Pro Link */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pro Link (optional)</label>
                <Select
                  value={formData.pro_link_type || 'none'}
                  onValueChange={(v) => {
                    const linkType = v === 'none' ? null : v;
                    setFormData({ 
                      ...formData, 
                      pro_link_type: linkType,
                      pro_link_value: null,
                      linked_playlist_id: null,
                    });
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="No link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No link</SelectItem>
                    {(Object.keys(PRO_LINK_CONFIGS) as ProLinkType[]).map((type) => {
                      const config = PRO_LINK_CONFIGS[type];
                      const Icon = config.icon;
                      return (
                        <SelectItem key={type} value={type}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {config.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {formData.pro_link_type === 'playlist' && (
                  <Select
                    value={formData.pro_link_value || ''}
                    onValueChange={(v) => setFormData({ 
                      ...formData, 
                      pro_link_value: v,
                      linked_playlist_id: v,
                    })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      {playlists.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            <Music className="h-4 w-4" />
                            {p.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {formData.pro_link_type === 'breathe' && (
                  <Select
                    value={formData.pro_link_value || ''}
                    onValueChange={(v) => setFormData({ ...formData, pro_link_value: v })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      {breathingExercises.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          <span className="flex items-center gap-2">
                            {e.emoji || '🫁'} {e.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Goal */}
              <div 
                onClick={() => setShowGoalSettings(true)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-muted/50',
                  formData.goal_enabled && 'bg-emerald-50 border-emerald-200'
                )}
              >
                <div className="flex items-center gap-3">
                  <Target className={cn("h-5 w-5", formData.goal_enabled ? "text-emerald-600" : "text-muted-foreground")} />
                  <span className="font-medium">Goal</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{formData.goal_enabled ? formatGoalTarget(goalSettings) : 'Off'}</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              {/* Default Repeat */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Default Repeat</label>
                <Select
                  value={formData.repeat_pattern}
                  onValueChange={(v) => setFormData({ ...formData, repeat_pattern: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPEAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subtasks */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Subtasks</label>
                <div className="mt-1 space-y-1">
                  {subtasks.map((sub, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <span className="flex-1">{sub}</span>
                      <button 
                        type="button"
                        onClick={() => removeSubtask(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add subtask..."
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addSubtask}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span>Popular / Featured</span>
                  </div>
                  <Switch
                    checked={formData.is_popular}
                    onCheckedChange={(v) => setFormData({ ...formData, is_popular: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span>Reminder by default</span>
                  </div>
                  <Switch
                    checked={formData.reminder_enabled}
                    onCheckedChange={(v) => setFormData({ ...formData, reminder_enabled: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>Active</span>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            {editingTask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('Delete this task?')) {
                    deleteTask.mutate(editingTask.id);
                    closeDialog();
                  }
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingTask ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EmojiPicker
        open={showEmojiPicker}
        onOpenChange={setShowEmojiPicker}
        selectedEmoji={formData.emoji}
        onSelect={(emoji) => setFormData({ ...formData, emoji })}
      />

      <GoalSettingsSheet
        open={showGoalSettings}
        onOpenChange={setShowGoalSettings}
        value={goalSettings}
        onChange={handleGoalChange}
      />
    </Card>
  );
}
