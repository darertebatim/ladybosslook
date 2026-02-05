import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Sparkles, Star, ChevronRight, Trash2, Eye, EyeOff, CheckSquare, Square, Layers, X, FolderPlus, Wand2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskIcon } from '@/components/app/IconPicker';
import AppTaskCreate, { TaskFormData } from '@/pages/app/AppTaskCreate';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

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
  repeat_pattern: string;
  repeat_interval: number | null;
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
  time_period: string | null;
}

// Admin settings for task bank items (visibility only - description is inline)
interface AdminSettings {
  is_popular: boolean;
  is_active: boolean;
}

export default function TasksBank() {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskBankItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Admin settings state (separate from AppTaskCreate form)
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    is_popular: false,
    is_active: true,
  });
  const [adminSettingsOpen, setAdminSettingsOpen] = useState(false);
  const [adminSettingsTaskId, setAdminSettingsTaskId] = useState<string | null>(null);

  // Selection mode for creating routines
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [createRoutineOpen, setCreateRoutineOpen] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineCategory, setNewRoutineCategory] = useState('general');

  // Add to existing ritual state
  const [addToRoutineOpen, setAddToRoutineOpen] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('');

  // AI description generation state
  const [generatingDescriptionFor, setGeneratingDescriptionFor] = useState<string | null>(null);

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

  // Fetch existing routines for "Add to Ritual" feature
  const { data: existingRoutines = [] } = useQuery({
    queryKey: ['routines-bank-for-adding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines_bank')
        .select('id, title, emoji, category')
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data;
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

  // Quick toggle for is_popular
  const togglePopular = useMutation({
    mutationFn: async ({ id, is_popular }: { id: string; is_popular: boolean }) => {
      const { error } = await supabase
        .from('admin_task_bank')
        .update({ is_popular })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
    },
  });

  // Quick toggle for is_active
  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('admin_task_bank')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
    },
  });

  // AI description generation
  const generateDescription = async (task: TaskBankItem) => {
    setGeneratingDescriptionFor(task.id);
    try {
      const catInfo = getCategoryInfo(task.category);
      const repeatLabel = task.repeat_pattern !== 'none' 
        ? (task.repeat_pattern === 'daily' ? 'daily' :
           task.repeat_pattern === 'weekly' ? 'weekly' : 'monthly')
        : 'one-time';
      const goalInfo = task.goal_enabled 
        ? `with a goal of ${task.goal_target} ${task.goal_unit || 'times'}` 
        : '';
      
      const context = `Action: "${task.title}" | Category: ${catInfo.label} | Frequency: ${repeatLabel} ${goalInfo}`.trim();
      
      const { data, error } = await supabase.functions.invoke('generate-routine-text', {
        body: {
          context,
          fieldType: 'description',
          prompt: `Write a brief 1-sentence description for this action. Make it warm, simple, and encouraging. Focus on the benefit or feeling, not instruction. No pressure words.`,
        },
      });
      
      if (error) throw error;
      
      const generatedText = data?.text;
      if (generatedText) {
        // Update the task with the generated description
        const { error: updateError } = await supabase
          .from('admin_task_bank')
          .update({ description: generatedText })
          .eq('id', task.id);
        
        if (updateError) throw updateError;
        
        queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
        toast.success('Description generated');
      }
    } catch (err) {
      console.error('Failed to generate description:', err);
      toast.error('Failed to generate description');
    } finally {
      setGeneratingDescriptionFor(null);
    }
  };

  const updateAdminSettings = useMutation({
    mutationFn: async (payload: { id: string; settings: AdminSettings }) => {
      const { error } = await supabase
        .from('admin_task_bank')
        .update({
          is_popular: payload.settings.is_popular,
          is_active: payload.settings.is_active,
        })
        .eq('id', payload.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
      toast.success('Admin settings saved');
      setAdminSettingsOpen(false);
      setAdminSettingsTaskId(null);
    },
    onError: (error) => {
      toast.error('Failed to save admin settings: ' + error.message);
    },
  });

  // Fetch subtasks for a task
  const fetchSubtasks = async (taskId: string): Promise<string[]> => {
    const { data } = await supabase
      .from('admin_task_bank_subtasks')
      .select('title')
      .eq('task_id', taskId)
      .order('order_index', { ascending: true });
    return (data || []).map(s => s.title);
  };

  // Create task mutation - includes admin settings
  const createTask = useMutation({
    mutationFn: async (data: { formData: TaskFormData; subtasks: string[]; category: string; adminSettings: AdminSettings }) => {
      const taskData = {
        title: data.formData.title,
        emoji: data.formData.icon,
        color: data.formData.color,
        category: data.category,
        repeat_pattern: data.formData.repeatEnabled ? data.formData.repeatPattern : 'none',
        repeat_interval: data.formData.repeatInterval,
        repeat_days: data.formData.repeatDays,
        reminder_enabled: data.formData.reminderEnabled,
        goal_enabled: data.formData.goalEnabled,
        goal_type: data.formData.goalEnabled ? data.formData.goalType : null,
        goal_target: data.formData.goalEnabled ? data.formData.goalTarget : null,
        goal_unit: data.formData.goalEnabled ? data.formData.goalUnit : null,
        pro_link_type: data.formData.proLinkType,
        pro_link_value: data.formData.proLinkValue,
        linked_playlist_id: data.formData.proLinkType === 'playlist' ? data.formData.proLinkValue : data.formData.linkedPlaylistId,
        tag: data.formData.tag,
        // Description from inline form, admin settings for visibility
        description: data.formData.description || null,
        is_active: data.adminSettings.is_active,
        is_popular: data.adminSettings.is_popular,
        // Time of day setting
        time_period: data.formData.timePeriod || null,
      };

      const { data: newTask, error } = await supabase
        .from('admin_task_bank')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;

      // Insert subtasks
      if (data.subtasks.length > 0) {
        const subtaskRecords = data.subtasks.map((title, index) => ({
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
      toast.success('Action created');
      closeSheet();
    },
    onError: (error) => {
      toast.error('Failed to create action: ' + error.message);
    },
  });

  // Update task mutation - includes admin settings
  const updateTask = useMutation({
    mutationFn: async (data: { id: string; formData: TaskFormData; subtasks: string[]; category: string; adminSettings: AdminSettings }) => {
      const taskData = {
        title: data.formData.title,
        emoji: data.formData.icon,
        color: data.formData.color,
        category: data.category,
        repeat_pattern: data.formData.repeatEnabled ? data.formData.repeatPattern : 'none',
        repeat_interval: data.formData.repeatInterval,
        repeat_days: data.formData.repeatDays,
        reminder_enabled: data.formData.reminderEnabled,
        goal_enabled: data.formData.goalEnabled,
        goal_type: data.formData.goalEnabled ? data.formData.goalType : null,
        goal_target: data.formData.goalEnabled ? data.formData.goalTarget : null,
        goal_unit: data.formData.goalEnabled ? data.formData.goalUnit : null,
        pro_link_type: data.formData.proLinkType,
        pro_link_value: data.formData.proLinkValue,
        linked_playlist_id: data.formData.proLinkType === 'playlist' ? data.formData.proLinkValue : data.formData.linkedPlaylistId,
        tag: data.formData.tag,
        // Description from inline form, admin settings for visibility
        description: data.formData.description || null,
        is_active: data.adminSettings.is_active,
        is_popular: data.adminSettings.is_popular,
        // Time of day setting
        time_period: data.formData.timePeriod || null,
      };

      const { error } = await supabase
        .from('admin_task_bank')
        .update(taskData)
        .eq('id', data.id);

      if (error) throw error;

      // Replace subtasks
      await supabase.from('admin_task_bank_subtasks').delete().eq('task_id', data.id);
      if (data.subtasks.length > 0) {
        const subtaskRecords = data.subtasks.map((title, index) => ({
          task_id: data.id,
          title,
          order_index: index,
        }));
        await supabase.from('admin_task_bank_subtasks').insert(subtaskRecords);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
      toast.success('Action updated');
      closeSheet();
    },
    onError: (error) => {
      toast.error('Failed to update action: ' + error.message);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('admin_task_bank_subtasks').delete().eq('task_id', id);
      const { error } = await supabase.from('admin_task_bank').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
      toast.success('Action deleted');
    },
  });

  // State for sheet initialData
  const [sheetInitialData, setSheetInitialData] = useState<Partial<TaskFormData> | undefined>(undefined);
  const [editSubtasks, setEditSubtasks] = useState<string[]>([]);
  const [editCategory, setEditCategory] = useState<string>('general');

  const openNewSheet = () => {
    setEditingTask(null);
    setSheetInitialData({
      title: '',
      description: null,
      icon: '☀️',
      color: 'mint',
      scheduledDate: new Date(),
      scheduledTime: null,
      repeatEnabled: false,
      repeatPattern: 'daily',
      repeatInterval: 1,
      repeatDays: [],
      reminderEnabled: false,
      reminderTime: '09:00',
      isUrgent: false,
      tag: null,
      subtasks: [],
      linkedPlaylistId: null,
      proLinkType: null,
      proLinkValue: null,
      goalEnabled: false,
      goalType: 'count',
      goalTarget: 2,
      goalUnit: 'times',
    });
    setAdminSettings({
      is_popular: false,
      is_active: true,
    });
    setAdminSettingsOpen(false);
    setAdminSettingsTaskId(null);
    setEditSubtasks([]);
    setEditCategory('general');
    setSheetOpen(true);
  };

  const openEditSheet = async (task: TaskBankItem) => {
    setEditingTask(task);
    
    const subtasks = await fetchSubtasks(task.id);
    setEditSubtasks(subtasks);
    setEditCategory(task.category);
    
    // Find category name from slug to use as tag if no tag is set
    const categoryInfo = routineCategories.find(c => c.slug === task.category);
    const tagValue = task.tag || categoryInfo?.name || null;
    
    setSheetInitialData({
      title: task.title,
      description: task.description || null,
      icon: task.emoji,
      color: task.color as any,
      scheduledDate: new Date(),
      scheduledTime: null,
      repeatEnabled: task.repeat_pattern !== 'none',
      repeatPattern: ['daily', 'weekly', 'monthly'].includes(task.repeat_pattern) 
        ? task.repeat_pattern as 'daily' | 'weekly' | 'monthly' 
        : 'daily',
      repeatInterval: task.repeat_interval || 1,
      repeatDays: task.repeat_days || [],
      reminderEnabled: task.reminder_enabled,
      reminderTime: '09:00',
      isUrgent: false,
      tag: tagValue,
      subtasks,
      linkedPlaylistId: task.linked_playlist_id,
      proLinkType: task.pro_link_type as any,
      proLinkValue: task.pro_link_value,
      goalEnabled: task.goal_enabled,
      goalType: (task.goal_type as 'timer' | 'count') || 'count',
      goalTarget: task.goal_target || 2,
      goalUnit: task.goal_unit || 'times',
    });
    
    // Set admin settings from existing task
    setAdminSettings({
      is_popular: task.is_popular,
      is_active: task.is_active,
    });
    setAdminSettingsOpen(false);
    setAdminSettingsTaskId(null);
    
    setSheetOpen(true);
  };

  const openAdminSettingsForTask = (task: TaskBankItem) => {
    setAdminSettings({
      is_popular: task.is_popular,
      is_active: task.is_active,
    });
    setAdminSettingsTaskId(task.id);
    setAdminSettingsOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingTask(null);
    setSheetInitialData(undefined);
    setEditSubtasks([]);
  };

  const handleSaveSheet = (formData: TaskFormData) => {
    // Use tag as category - the form's "Category" picker sets the tag field
    const categoryToSave = formData.tag || editCategory;
    
    if (editingTask) {
      updateTask.mutate({
        id: editingTask.id,
        formData,
        subtasks: formData.subtasks,
        category: categoryToSave,
        adminSettings,
      });
    } else {
      createTask.mutate({
        formData,
        subtasks: formData.subtasks,
        category: categoryToSave,
        adminSettings,
      });
    }
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Delete this task template?')) {
      deleteTaskMutation.mutate(id);
    }
  };

  const getCategoryInfo = (cat: string) => {
    const found = routineCategories.find(c => c.slug === cat);
    return found ? { value: found.slug, label: found.name, icon: found.icon || '📋' } : { value: cat, label: cat, icon: '📋' };
  };

  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : selectedCategory === 'populars'
    ? tasks.filter(t => t.is_popular)
    : tasks.filter(t => t.category === selectedCategory);

  const usedCategories = [...new Set(tasks.map(t => t.category))];

  // Selection handlers
  const toggleTaskSelection = (taskId: string) => {
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setSelectedTaskIds(newSet);
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
    setSelectionMode(false);
  };

  const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));

  // Create routine from selected tasks
  const createRoutineFromSelection = useMutation({
    mutationFn: async () => {
      if (!newRoutineName.trim()) throw new Error('Routine name is required');
      if (selectedTasks.length === 0) throw new Error('No tasks selected');

      // Create the routine
      const { data: newRoutine, error: routineError } = await supabase
        .from('routines_bank')
        .insert({
          title: newRoutineName.trim(),
          category: newRoutineCategory,
          emoji: '✨',
          color: 'yellow',
        })
        .select()
        .single();
      if (routineError) throw routineError;

      // Create routine tasks
      const taskRecords = selectedTasks.map((task, idx) => ({
        routine_id: newRoutine.id,
        task_id: task.id,
        title: task.title,
        emoji: task.emoji,
        section_title: null,
        task_order: idx,
      }));
      const { error: tasksError } = await supabase.from('routines_bank_tasks').insert(taskRecords);
      if (tasksError) throw tasksError;

      return newRoutine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines-bank'] });
      queryClient.invalidateQueries({ queryKey: ['routines-bank-task-counts'] });
      toast.success('Ritual created! Go to Rituals Bank to edit it.');
      setCreateRoutineOpen(false);
      setNewRoutineName('');
      setNewRoutineCategory('general');
      clearSelection();
    },
    onError: (error) => {
      toast.error('Failed to create ritual: ' + error.message);
    },
  });

  // Add actions to existing routine
  const addToExistingRoutine = useMutation({
    mutationFn: async () => {
      if (!selectedRoutineId) throw new Error('No ritual selected');
      if (selectedTasks.length === 0) throw new Error('No actions selected');

      // Get current max order for this routine
      const { data: existingTasks } = await supabase
        .from('routines_bank_tasks')
        .select('task_order')
        .eq('routine_id', selectedRoutineId)
        .order('task_order', { ascending: false })
        .limit(1);

      const startOrder = existingTasks && existingTasks.length > 0 
        ? (existingTasks[0].task_order || 0) + 1 
        : 0;

      // Add selected tasks to the routine
      const taskRecords = selectedTasks.map((task, idx) => ({
        routine_id: selectedRoutineId,
        task_id: task.id,
        title: task.title,
        emoji: task.emoji,
        section_title: null,
        task_order: startOrder + idx,
      }));

      const { error } = await supabase.from('routines_bank_tasks').insert(taskRecords);
      if (error) throw error;

      return selectedRoutineId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines-bank'] });
      queryClient.invalidateQueries({ queryKey: ['routines-bank-task-counts'] });
      toast.success(`${selectedTasks.length} action(s) added to ritual!`);
      setAddToRoutineOpen(false);
      setSelectedRoutineId('');
      clearSelection();
    },
    onError: (error) => {
      toast.error('Failed to add actions: ' + error.message);
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Actions Bank
          </CardTitle>
          <CardDescription>
            Reusable action templates for ritual planning
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectionMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              if (selectionMode) {
                clearSelection();
              } else {
                setSelectionMode(true);
              }
            }}
            className="gap-2"
          >
            {selectionMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            {selectionMode ? 'Cancel' : 'Select'}
          </Button>
          <Button onClick={openNewSheet} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Action
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Selection bar */}
        {selectionMode && selectedTaskIds.size > 0 && (
          <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="font-medium">{selectedTaskIds.size} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddToRoutineOpen(true)}
                className="gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                Add to Ritual
              </Button>
              <Button
                size="sm"
                onClick={() => setCreateRoutineOpen(true)}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                Create Ritual
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        )}

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              All
            </TabsTrigger>
            <TabsTrigger value="populars" className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              Populars
              <span className="text-xs text-muted-foreground">
                ({tasks.filter(t => t.is_popular).length})
              </span>
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
            No actions yet. Click "Add Action" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const catInfo = getCategoryInfo(task.category);
              const isSelected = selectedTaskIds.has(task.id);
              const repeatLabel = task.repeat_pattern !== 'none' 
                ? (task.repeat_pattern === 'daily' ? 'Daily' :
                   task.repeat_pattern === 'weekly' ? 'Weekly' :
                   task.repeat_pattern === 'monthly' ? 'Monthly' : 'Once')
                : 'Once';
              const timeLabel = task.time_period || 'Anytime';
              return (
                <div
                  key={task.id}
                  className={cn(
                    'rounded-2xl border cursor-pointer hover:shadow-sm transition-shadow group overflow-hidden',
                    !task.is_active && 'opacity-50',
                    isSelected && 'ring-2 ring-primary'
                  )}
                  style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === task.color)?.hex + '40' }}
                  onClick={() => {
                    if (selectionMode) {
                      toggleTaskSelection(task.id);
                    } else {
                      openEditSheet(task);
                    }
                  }}
                >
                  {/* Main content row */}
                  <div className="flex items-center gap-3 p-3">
                    {/* Checkbox for selection mode */}
                    {selectionMode && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleTaskSelection(task.id)}
                        />
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === task.color)?.hex }}>
                      <TaskIcon iconName={task.emoji} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <p className={cn("font-semibold text-[15px] text-foreground truncate", !task.is_active && "line-through")}>
                        {task.title}
                      </p>
                      {/* Category • Repeat • Time */}
                      <p className="text-xs text-muted-foreground">
                        {catInfo.label} • {repeatLabel} • {timeLabel}
                      </p>
                    </div>
                    {/* Quick toggle: Popular */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePopular.mutate({ id: task.id, is_popular: !task.is_popular });
                      }}
                      className={cn(
                        "p-2 transition-all shrink-0",
                        task.is_popular 
                          ? "text-amber-500" 
                          : "text-muted-foreground opacity-0 group-hover:opacity-100"
                      )}
                      title={task.is_popular ? "Remove from popular" : "Mark as popular"}
                    >
                      <Star className={cn("h-4 w-4", task.is_popular && "fill-amber-500")} />
                    </button>
                    {/* Quick toggle: Active */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActive.mutate({ id: task.id, is_active: !task.is_active });
                      }}
                      className={cn(
                        "p-2 transition-all shrink-0",
                        !task.is_active 
                          ? "text-muted-foreground" 
                          : "text-muted-foreground opacity-0 group-hover:opacity-100"
                      )}
                      title={task.is_active ? "Deactivate task" : "Activate task"}
                    >
                      {task.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>

                    {/* Admin settings */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAdminSettingsForTask(task);
                      }}
                      className={cn(
                        "p-2 transition-all shrink-0",
                        "text-muted-foreground opacity-0 group-hover:opacity-100"
                      )}
                      title="Admin settings"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      className="p-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                  
                  {/* Description box - white background */}
                  <div className="mx-3 mb-3 flex items-start gap-2">
                    {task.description ? (
                      <div className="flex-1 p-2.5 bg-white/80 rounded-xl text-sm text-muted-foreground">
                        {task.description}
                      </div>
                    ) : (
                      <div className="flex-1 p-2.5 bg-white/50 rounded-xl text-sm text-muted-foreground/50 italic">
                        No description
                      </div>
                    )}
                    {/* AI Generate button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateDescription(task);
                      }}
                      disabled={generatingDescriptionFor === task.id}
                      className={cn(
                        "p-2 rounded-lg transition-all shrink-0",
                        "bg-violet-100 hover:bg-violet-200 text-violet-600",
                        generatingDescriptionFor === task.id && "opacity-50 cursor-not-allowed"
                      )}
                      title="Generate description with AI"
                    >
                      {generatingDescriptionFor === task.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Admin Settings Dialog - higher z-index to appear above sheet */}
      <Dialog
        open={adminSettingsOpen}
        onOpenChange={(open) => {
          setAdminSettingsOpen(open);
          if (!open) setAdminSettingsTaskId(null);
        }}
      >
        <DialogContent className="sm:max-w-md z-[100]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Admin Settings
            </DialogTitle>
            <DialogDescription>
              Configure template visibility and metadata
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Popular Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Star className={cn("h-4 w-4", adminSettings.is_popular && "text-amber-500 fill-amber-500")} />
                <div>
                  <p className="font-medium text-sm">Popular (Featured)</p>
                  <p className="text-xs text-muted-foreground">Show star icon and prioritize</p>
                </div>
              </div>
              <Switch
                checked={adminSettings.is_popular}
                onCheckedChange={(checked) => setAdminSettings(prev => ({ ...prev, is_popular: checked }))}
              />
            </div>
            
            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {adminSettings.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <div>
                  <p className="font-medium text-sm">Active</p>
                  <p className="text-xs text-muted-foreground">Inactive actions are hidden from users</p>
                </div>
              </div>
              <Switch
                checked={adminSettings.is_active}
                onCheckedChange={(checked) => setAdminSettings(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAdminSettingsOpen(false);
                setAdminSettingsTaskId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!adminSettingsTaskId) return;
                updateAdminSettings.mutate({ id: adminSettingsTaskId, settings: adminSettings });
              }}
              disabled={!adminSettingsTaskId || updateAdminSettings.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Use AppTaskCreate in sheet mode */}
      <AppTaskCreate
        isSheet={true}
        sheetOpen={sheetOpen}
        onSheetOpenChange={setSheetOpen}
        initialData={sheetInitialData}
        onSaveSheet={handleSaveSheet}
      />

      {/* Create Routine from Selection Dialog */}
      <Dialog open={createRoutineOpen} onOpenChange={setCreateRoutineOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Create Ritual from Selection
            </DialogTitle>
            <DialogDescription>
              Create a new ritual with {selectedTaskIds.size} selected action{selectedTaskIds.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="routineName">Ritual Name *</Label>
              <Input
                id="routineName"
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value)}
                placeholder="Morning Energy Boost"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newRoutineCategory} onValueChange={setNewRoutineCategory}>
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

            {/* Preview selected actions */}
            <div className="space-y-2">
              <Label>Selected Actions</Label>
              <div className="border rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                {selectedTasks.map((task, idx) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-4">{idx + 1}.</span>
                    <TaskIcon iconName={task.emoji} size={14} />
                    <span className="truncate flex-1">{task.title}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedTasks.length} actions selected
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRoutineOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createRoutineFromSelection.mutate()}
              disabled={!newRoutineName.trim() || createRoutineFromSelection.isPending}
            >
              Create Ritual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Existing Ritual Dialog */}
      <Dialog open={addToRoutineOpen} onOpenChange={setAddToRoutineOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              Add to Existing Ritual
            </DialogTitle>
            <DialogDescription>
              Add {selectedTaskIds.size} action{selectedTaskIds.size !== 1 ? 's' : ''} to an existing ritual
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Ritual *</Label>
              <Select value={selectedRoutineId} onValueChange={setSelectedRoutineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a ritual..." />
                </SelectTrigger>
                <SelectContent>
                  {existingRoutines.map((routine) => (
                    <SelectItem key={routine.id} value={routine.id}>
                      <span className="flex items-center gap-2">
                        <TaskIcon iconName={routine.emoji || '✨'} size={14} />
                        {routine.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {existingRoutines.length === 0 && (
                <p className="text-xs text-muted-foreground">No rituals found. Create one first.</p>
              )}
            </div>

            {/* Preview selected actions */}
            <div className="space-y-2">
              <Label>Actions to Add</Label>
              <div className="border rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                {selectedTasks.map((task, idx) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-4">{idx + 1}.</span>
                    <TaskIcon iconName={task.emoji} size={14} />
                    <span className="truncate flex-1">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToRoutineOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addToExistingRoutine.mutate()}
              disabled={!selectedRoutineId || addToExistingRoutine.isPending}
            >
              Add to Ritual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
