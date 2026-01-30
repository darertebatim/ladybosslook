import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Sparkles, Star, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskIcon } from '@/components/app/IconPicker';
import AppTaskCreate, { TaskFormData } from '@/pages/app/AppTaskCreate';

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

export default function TasksBank() {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskBankItem | null>(null);
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
  const fetchSubtasks = async (taskId: string): Promise<string[]> => {
    const { data } = await supabase
      .from('admin_task_bank_subtasks')
      .select('title')
      .eq('task_id', taskId)
      .order('order_index', { ascending: true });
    return (data || []).map(s => s.title);
  };

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (data: { formData: TaskFormData; subtasks: string[]; category: string }) => {
      const taskData = {
        title: data.formData.title,
        emoji: data.formData.icon,
        color: data.formData.color,
        category: data.category,
        repeat_pattern: data.formData.repeatEnabled ? data.formData.repeatPattern : 'none',
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
        is_active: true,
        is_popular: false,
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
      toast.success('Task created');
      closeSheet();
    },
    onError: (error) => {
      toast.error('Failed to create task: ' + error.message);
    },
  });

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: async (data: { id: string; formData: TaskFormData; subtasks: string[]; category: string }) => {
      const taskData = {
        title: data.formData.title,
        emoji: data.formData.icon,
        color: data.formData.color,
        category: data.category,
        repeat_pattern: data.formData.repeatEnabled ? data.formData.repeatPattern : 'none',
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
      toast.success('Task updated');
      closeSheet();
    },
    onError: (error) => {
      toast.error('Failed to update task: ' + error.message);
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
      toast.success('Task deleted');
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
      icon: '☀️',
      color: 'yellow',
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
      icon: task.emoji,
      color: task.color as any,
      scheduledDate: new Date(),
      scheduledTime: null,
      repeatEnabled: task.repeat_pattern !== 'none',
      repeatPattern: ['daily', 'weekly', 'monthly'].includes(task.repeat_pattern) 
        ? task.repeat_pattern as 'daily' | 'weekly' | 'monthly' 
        : 'daily',
      repeatInterval: 1,
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
    
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingTask(null);
    setSheetInitialData(undefined);
    setEditSubtasks([]);
  };

  const handleSaveSheet = (formData: TaskFormData) => {
    if (editingTask) {
      updateTask.mutate({
        id: editingTask.id,
        formData,
        subtasks: formData.subtasks,
        category: editCategory,
      });
    } else {
      createTask.mutate({
        formData,
        subtasks: formData.subtasks,
        category: editCategory,
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
        <Button onClick={openNewSheet} className="gap-2">
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
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow group',
                    !task.is_active && 'opacity-50'
                  )}
                  style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === task.color)?.hex + '40' }}
                  onClick={() => openEditSheet(task)}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task.id);
                    }}
                    className="p-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Use AppTaskCreate in sheet mode */}
      <AppTaskCreate
        isSheet={true}
        sheetOpen={sheetOpen}
        onSheetOpenChange={setSheetOpen}
        initialData={sheetInitialData}
        onSaveSheet={handleSaveSheet}
      />
    </Card>
  );
}
