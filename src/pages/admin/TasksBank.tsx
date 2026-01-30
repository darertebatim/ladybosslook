import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ChevronRight, Music, Wind, Target, X, Clock, Star, Sparkles } from 'lucide-react';
import { EmojiPicker } from '@/components/app/EmojiPicker';
import { PRO_LINK_CONFIGS, ProLinkType } from '@/lib/proTaskTypes';

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

// Category options (matching the app's TemplateCategory + extras)
const CATEGORY_OPTIONS = [
  { value: 'morning', label: 'Morning', emoji: '🌅' },
  { value: 'evening', label: 'Evening', emoji: '🌙' },
  { value: 'selfcare', label: 'Self Care', emoji: '💆' },
  { value: 'business', label: 'Business', emoji: '💼' },
  { value: 'wellness', label: 'Wellness', emoji: '🧘' },
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
  { value: 'mindfulness', label: 'Mindfulness', emoji: '🧠' },
  { value: 'productivity', label: 'Productivity', emoji: '📊' },
  { value: 'general', label: 'General', emoji: '📋' },
];

// Repeat pattern options
const REPEAT_OPTIONS = [
  { value: 'none', label: 'No Repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

// Duration presets (in minutes)
const DURATION_PRESETS = [1, 2, 5, 10, 15, 20, 30, 45, 60];

// Goal unit options
const GOAL_UNITS = ['times', 'minutes', 'pages', 'glasses', 'reps', 'steps'];

interface TaskBankItem {
  id: string;
  title: string;
  emoji: string;
  color: string;
  category: string;
  description: string | null;
  duration_minutes: number | null;
  is_popular: boolean;
  pro_link_type: string | null;
  pro_link_value: string | null;
  linked_playlist_id: string | null;
  goal_enabled: boolean;
  goal_type: string | null;
  goal_target: number | null;
  goal_unit: string | null;
  repeat_pattern: string;
  repeat_days: number[];
  reminder_enabled: boolean;
  tag: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface TaskBankSubtask {
  id: string;
  task_id: string;
  title: string;
  order_index: number;
}

interface FormData {
  title: string;
  emoji: string;
  color: string;
  category: string;
  description: string;
  duration_minutes: number;
  is_popular: boolean;
  pro_link_type: ProLinkType | null;
  pro_link_value: string | null;
  linked_playlist_id: string | null;
  goal_enabled: boolean;
  goal_type: 'timer' | 'count';
  goal_target: number;
  goal_unit: string;
  repeat_pattern: string;
  reminder_enabled: boolean;
  tag: string | null;
  is_active: boolean;
  subtasks: string[];
}

const defaultFormData: FormData = {
  title: '',
  emoji: '☀️',
  color: 'yellow',
  category: 'general',
  description: '',
  duration_minutes: 5,
  is_popular: false,
  pro_link_type: null,
  pro_link_value: null,
  linked_playlist_id: null,
  goal_enabled: false,
  goal_type: 'count',
  goal_target: 2,
  goal_unit: 'times',
  repeat_pattern: 'none',
  reminder_enabled: false,
  tag: null,
  is_active: true,
  subtasks: [],
};

export default function TasksBank() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskBankItem | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch task bank items
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['admin-task-bank'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_task_bank')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TaskBankItem[];
    },
  });

  // Filter tasks by category
  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === selectedCategory);

  // Get unique categories from tasks
  const usedCategories = [...new Set(tasks.map(t => t.category))];

  // Fetch subtasks for editing task
  const { data: editingSubtasks = [] } = useQuery({
    queryKey: ['admin-task-bank-subtasks', editingTask?.id],
    queryFn: async () => {
      if (!editingTask?.id) return [];
      const { data, error } = await supabase
        .from('admin_task_bank_subtasks')
        .select('*')
        .eq('task_id', editingTask.id)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as TaskBankSubtask[];
    },
    enabled: !!editingTask?.id,
  });

  // Load subtasks when they're fetched
  useEffect(() => {
    if (editingSubtasks.length > 0 && editingTask) {
      setFormData(prev => ({
        ...prev,
        subtasks: editingSubtasks.map(s => s.title),
      }));
    }
  }, [editingSubtasks, editingTask]);

  // Fetch playlists for linking
  const { data: playlists = [] } = useQuery({
    queryKey: ['admin-playlists-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name')
        .eq('is_hidden', false)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch breathing exercises
  const { data: breathingExercises = [] } = useQuery({
    queryKey: ['admin-breathing-exercises'],
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { subtasks, ...taskData } = data;
      
      // Insert task
      const { data: newTask, error } = await supabase
        .from('admin_task_bank')
        .insert({
          title: taskData.title,
          emoji: taskData.emoji,
          color: taskData.color,
          category: taskData.category,
          description: taskData.description || null,
          duration_minutes: taskData.duration_minutes,
          is_popular: taskData.is_popular,
          pro_link_type: taskData.pro_link_type,
          pro_link_value: taskData.pro_link_value,
          linked_playlist_id: taskData.pro_link_type === 'playlist' ? taskData.pro_link_value : taskData.linked_playlist_id,
          goal_enabled: taskData.goal_enabled,
          goal_type: taskData.goal_enabled ? taskData.goal_type : null,
          goal_target: taskData.goal_enabled ? taskData.goal_target : null,
          goal_unit: taskData.goal_enabled ? taskData.goal_unit : null,
          repeat_pattern: taskData.repeat_pattern,
          reminder_enabled: taskData.reminder_enabled,
          tag: taskData.tag,
          is_active: taskData.is_active,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Insert subtasks
      if (subtasks.length > 0) {
        const subtaskRows = subtasks.filter(s => s.trim()).map((title, idx) => ({
          task_id: newTask.id,
          title,
          order_index: idx,
        }));
        
        if (subtaskRows.length > 0) {
          const { error: subError } = await supabase
            .from('admin_task_bank_subtasks')
            .insert(subtaskRows);
          
          if (subError) throw subError;
        }
      }
      
      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
      toast({ title: 'Task created', description: 'Task added to bank.' });
      setDialogOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const { subtasks, ...taskData } = data;
      
      // Update task
      const { error } = await supabase
        .from('admin_task_bank')
        .update({
          title: taskData.title,
          emoji: taskData.emoji,
          color: taskData.color,
          category: taskData.category,
          description: taskData.description || null,
          duration_minutes: taskData.duration_minutes,
          is_popular: taskData.is_popular,
          pro_link_type: taskData.pro_link_type,
          pro_link_value: taskData.pro_link_value,
          linked_playlist_id: taskData.pro_link_type === 'playlist' ? taskData.pro_link_value : taskData.linked_playlist_id,
          goal_enabled: taskData.goal_enabled,
          goal_type: taskData.goal_enabled ? taskData.goal_type : null,
          goal_target: taskData.goal_enabled ? taskData.goal_target : null,
          goal_unit: taskData.goal_enabled ? taskData.goal_unit : null,
          repeat_pattern: taskData.repeat_pattern,
          reminder_enabled: taskData.reminder_enabled,
          tag: taskData.tag,
          is_active: taskData.is_active,
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Delete existing subtasks
      await supabase
        .from('admin_task_bank_subtasks')
        .delete()
        .eq('task_id', id);
      
      // Insert new subtasks
      const validSubtasks = subtasks.filter(s => s.trim());
      if (validSubtasks.length > 0) {
        const subtaskRows = validSubtasks.map((title, idx) => ({
          task_id: id,
          title,
          order_index: idx,
        }));
        
        const { error: subError } = await supabase
          .from('admin_task_bank_subtasks')
          .insert(subtaskRows);
        
        if (subError) throw subError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank-subtasks'] });
      toast({ title: 'Task updated' });
      setDialogOpen(false);
      setEditingTask(null);
      setFormData(defaultFormData);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_task_bank')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
      toast({ title: 'Task deleted' });
      setDialogOpen(false);
      setEditingTask(null);
      setFormData(defaultFormData);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const openCreateDialog = () => {
    setEditingTask(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (task: TaskBankItem) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      emoji: task.emoji,
      color: task.color,
      category: task.category || 'general',
      description: task.description || '',
      duration_minutes: task.duration_minutes || 5,
      is_popular: task.is_popular || false,
      pro_link_type: task.pro_link_type as ProLinkType | null,
      pro_link_value: task.pro_link_value,
      linked_playlist_id: task.linked_playlist_id,
      goal_enabled: task.goal_enabled,
      goal_type: (task.goal_type as 'timer' | 'count') || 'count',
      goal_target: task.goal_target || 2,
      goal_unit: task.goal_unit || 'times',
      repeat_pattern: task.repeat_pattern,
      reminder_enabled: task.reminder_enabled,
      tag: task.tag,
      is_active: task.is_active,
      subtasks: [], // Will be populated by useEffect
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, newSubtask.trim()],
      }));
      setNewSubtask('');
    }
  };

  const removeSubtask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index),
    }));
  };

  const getCategoryInfo = (cat: string) => {
    return CATEGORY_OPTIONS.find(c => c.value === cat) || { value: cat, label: cat, emoji: '📋' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks Bank</h1>
          <p className="text-muted-foreground">Reusable task templates (like planner, but no dates)</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            All
          </TabsTrigger>
          {CATEGORY_OPTIONS.map((cat) => (
            <TabsTrigger 
              key={cat.value} 
              value={cat.value}
              className="flex items-center gap-1"
            >
              <span>{cat.emoji}</span>
              {cat.label}
              {usedCategories.includes(cat.value) && (
                <span className="text-xs text-muted-foreground">
                  ({tasks.filter(t => t.category === cat.value).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {selectedCategory === 'all' 
              ? 'No tasks in the bank yet. Click "Add Task" to create one.'
              : `No tasks in "${getCategoryInfo(selectedCategory).label}" category.`
            }
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <Card 
              key={task.id} 
              className={`cursor-pointer hover:bg-muted/50 transition-colors ${!task.is_active ? 'opacity-50' : ''}`}
              onClick={() => openEditDialog(task)}
            >
              <CardContent className="py-3 px-4 flex items-center gap-3">
                {/* Emoji/Icon */}
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === task.color)?.hex || '#FFF59D' }}
                >
                  {task.emoji}
                </div>
                
                {/* Title + metadata */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {task.title}
                    {task.is_popular && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>{getCategoryInfo(task.category).emoji} {getCategoryInfo(task.category).label}</span>
                    {task.duration_minutes && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {task.duration_minutes}m
                      </span>
                    )}
                    {task.pro_link_type && (
                      <span className="flex items-center gap-1">
                        {task.pro_link_type === 'playlist' && <Music className="h-3 w-3" />}
                        {task.pro_link_type === 'breathe' && <Wind className="h-3 w-3" />}
                        {PRO_LINK_CONFIGS[task.pro_link_type as ProLinkType]?.label || task.pro_link_type}
                      </span>
                    )}
                    {task.goal_enabled && (
                      <span className="flex items-center gap-0.5">
                        <Target className="h-3 w-3" />
                        {task.goal_target} {task.goal_unit}
                      </span>
                    )}
                    {task.repeat_pattern !== 'none' && (
                      <span>🔄 {task.repeat_pattern}</span>
                    )}
                  </div>
                </div>
                
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-4 pb-4">
              {/* Title + Emoji */}
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-10 w-10 p-0 text-lg shrink-0"
                  style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === formData.color)?.hex }}
                  onClick={() => setShowEmojiPicker(true)}
                >
                  {formData.emoji}
                </Button>
                <Input
                  placeholder="Task title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="flex-1"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Description (optional)</Label>
                <Textarea
                  placeholder="Describe the task..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Category */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Picker */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Color</Label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color.name ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.name }))}
                    />
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Duration (minutes)</Label>
                <div className="flex gap-2 flex-wrap">
                  {DURATION_PRESETS.map((mins) => (
                    <Button
                      key={mins}
                      type="button"
                      variant={formData.duration_minutes === mins ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, duration_minutes: mins }))}
                    >
                      {mins}m
                    </Button>
                  ))}
                </div>
              </div>

              {/* Pro Link Type */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Pro Link (optional)</Label>
                <Select
                  value={formData.pro_link_type || 'none'}
                  onValueChange={(v) => setFormData(prev => ({ 
                    ...prev, 
                    pro_link_type: v === 'none' ? null : v as ProLinkType,
                    pro_link_value: null,
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No link</SelectItem>
                    {Object.entries(PRO_LINK_CONFIGS).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.badgeText} - {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pro Link Value - Playlist */}
              {formData.pro_link_type === 'playlist' && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Select Playlist</Label>
                  <Select
                    value={formData.pro_link_value || 'none'}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, pro_link_value: v === 'none' ? null : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select playlist</SelectItem>
                      {playlists.map((pl) => (
                        <SelectItem key={pl.id} value={pl.id}>{pl.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Pro Link Value - Breathing */}
              {formData.pro_link_type === 'breathe' && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Select Exercise</Label>
                  <Select
                    value={formData.pro_link_value || 'none'}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, pro_link_value: v === 'none' ? null : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any exercise</SelectItem>
                      {breathingExercises.map((ex) => (
                        <SelectItem key={ex.id} value={ex.id}>{ex.emoji} {ex.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Goal Settings */}
              <Card className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <Label>Goal</Label>
                  </div>
                  <Switch
                    checked={formData.goal_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, goal_enabled: checked }))}
                  />
                </div>
                
                {formData.goal_enabled && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={formData.goal_type === 'count' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setFormData(prev => ({ ...prev, goal_type: 'count' }))}
                      >
                        Count
                      </Button>
                      <Button
                        type="button"
                        variant={formData.goal_type === 'timer' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setFormData(prev => ({ ...prev, goal_type: 'timer' }))}
                      >
                        Timer
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={formData.goal_target}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          goal_target: Math.max(1, parseInt(e.target.value) || 1) 
                        }))}
                        className="w-20"
                      />
                      {formData.goal_type === 'count' ? (
                        <Select
                          value={formData.goal_unit}
                          onValueChange={(v) => setFormData(prev => ({ ...prev, goal_unit: v }))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GOAL_UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex-1 flex items-center text-sm text-muted-foreground">
                          minutes
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* Repeat Pattern */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Default Repeat</Label>
                <Select
                  value={formData.repeat_pattern}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, repeat_pattern: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPEAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Toggles Row */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <Label>Popular / Featured</Label>
                  </div>
                  <Switch
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Reminder by default</Label>
                  <Switch
                    checked={formData.reminder_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminder_enabled: checked }))}
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

              {/* Tag */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Tag (optional)</Label>
                <Input
                  placeholder="e.g., Morning Routine"
                  value={formData.tag || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value || null }))}
                />
              </div>

              {/* Subtasks */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Subtasks</Label>
                <div className="space-y-2">
                  {formData.subtasks.map((subtask, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={subtask}
                        onChange={(e) => {
                          const newSubtasks = [...formData.subtasks];
                          newSubtasks[idx] = e.target.value;
                          setFormData(prev => ({ ...prev, subtasks: newSubtasks }));
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubtask(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
            </div>
          </ScrollArea>

          <DialogFooter className="flex-row justify-between pt-4 border-t">
            {editingTask && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm('Delete this task?')) {
                    deleteMutation.mutate(editingTask.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingTask ? 'Save' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emoji Picker */}
      <EmojiPicker
        open={showEmojiPicker}
        onOpenChange={setShowEmojiPicker}
        selectedEmoji={formData.emoji}
        onSelect={(emoji) => setFormData(prev => ({ ...prev, emoji }))}
      />
    </div>
  );
}
