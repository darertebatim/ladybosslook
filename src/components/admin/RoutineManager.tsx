import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { toast } from 'sonner';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Settings,
  ArrowLeft,
  Image,
  Loader2,
  GripVertical,
} from 'lucide-react';
import { PRO_LINK_TYPES, PRO_LINK_CONFIGS, ProLinkType } from '@/lib/proTaskTypes';
import { EmojiPicker } from '@/components/app/EmojiPicker';

// Types
interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

interface RoutinePlan {
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

interface RoutineTask {
  id: string;
  plan_id: string;
  title: string;
  duration_minutes: number;
  icon: string;
  task_order: number;
  is_active: boolean;
  linked_playlist_id: string | null;
  pro_link_type: ProLinkType | null;
  pro_link_value: string | null;
}

interface Playlist {
  id: string;
  name: string;
  category: string | null;
}

interface BreathingExercise {
  id: string;
  name: string;
  emoji: string | null;
  category: string;
}

const COLOR_OPTIONS = [
  { name: 'Yellow', value: 'yellow' },
  { name: 'Pink', value: 'pink' },
  { name: 'Blue', value: 'blue' },
  { name: 'Purple', value: 'purple' },
  { name: 'Green', value: 'green' },
  { name: 'Orange', value: 'orange' },
  { name: 'Peach', value: 'peach' },
  { name: 'Sky', value: 'sky' },
  { name: 'Mint', value: 'mint' },
  { name: 'Lavender', value: 'lavender' },
];

export function RoutineManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'pro' | 'regular'>('all');

  // Plan dialog state
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RoutinePlan | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [showPlanEmojiPicker, setShowPlanEmojiPicker] = useState(false);
  const [planForm, setPlanForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    icon: '✨',
    color: 'yellow',
    estimated_minutes: 10,
    points: 10,
    is_featured: false,
    is_popular: false,
    is_pro_routine: false,
    is_active: true,
    category_id: null as string | null,
    cover_image_url: '',
  });

  // Task dialog state  
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RoutineTask | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [showTaskEmojiPicker, setShowTaskEmojiPicker] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    duration_minutes: 5,
    icon: '☀️',
    task_order: 0,
    is_active: true,
    pro_link_type: null as ProLinkType | null,
    pro_link_value: null as string | null,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
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

  // Fetch plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['admin-routine-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plans')
        .select('*, category:routine_categories(name)')
        .order('display_order');
      if (error) throw error;
      return data as RoutinePlan[];
    },
  });

  // Filter plans
  const filteredPlans = plans.filter(plan => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'pro') return plan.is_pro_routine;
    return !plan.is_pro_routine;
  });

  // Fetch tasks for selected plan
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['admin-routine-tasks', selectedPlanId],
    queryFn: async () => {
      if (!selectedPlanId) return [];
      const { data, error } = await supabase
        .from('routine_plan_tasks')
        .select('*')
        .eq('plan_id', selectedPlanId)
        .order('task_order');
      if (error) throw error;
      return data as RoutineTask[];
    },
    enabled: !!selectedPlanId,
  });

  // Fetch playlists
  const { data: playlists = [] } = useQuery({
    queryKey: ['admin-playlists-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name, category')
        .eq('is_hidden', false)
        .order('name');
      if (error) throw error;
      return data as Playlist[];
    },
  });

  // Fetch breathing exercises
  const { data: breathingExercises = [] } = useQuery({
    queryKey: ['admin-breathing-exercises-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breathing_exercises')
        .select('id, name, emoji, category')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as BreathingExercise[];
    },
  });

  // Get selected plan info
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Plan mutations
  const createPlanMutation = useMutation({
    mutationFn: async (data: typeof planForm) => {
      const { error } = await supabase.from('routine_plans').insert({
        ...data,
        display_order: plans.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plans'] });
      toast.success('Plan created');
      setIsPlanDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof planForm }) => {
      const { error } = await supabase
        .from('routine_plans')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plans'] });
      toast.success('Plan updated');
      setIsPlanDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deletePlanMutation = useMutation({
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
      setDeletePlanId(null);
      if (selectedPlanId === deletePlanId) {
        setSelectedPlanId(null);
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Task mutations
  const createTaskMutation = useMutation({
    mutationFn: async (data: typeof taskForm) => {
      if (!selectedPlanId) throw new Error('No plan selected');
      const { error } = await supabase.from('routine_plan_tasks').insert({
        ...data,
        plan_id: selectedPlanId,
        linked_playlist_id: data.pro_link_type === 'playlist' ? data.pro_link_value : null,
        task_order: tasks.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-tasks', selectedPlanId] });
      toast.success('Task added');
      setIsTaskDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof taskForm }) => {
      const { error } = await supabase
        .from('routine_plan_tasks')
        .update({
          ...data,
          linked_playlist_id: data.pro_link_type === 'playlist' ? data.pro_link_value : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-tasks', selectedPlanId] });
      toast.success('Task updated');
      setIsTaskDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('routine_plan_tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-tasks', selectedPlanId] });
      toast.success('Task deleted');
      setDeleteTaskId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reorderTaskMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from('routine_plan_tasks')
        .update({ task_order: newOrder })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-tasks', selectedPlanId] });
    },
  });

  // Handlers
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({
      title: '',
      subtitle: '',
      description: '',
      icon: '✨',
      color: 'yellow',
      estimated_minutes: 10,
      points: 10,
      is_featured: false,
      is_popular: false,
      is_pro_routine: typeFilter === 'pro',
      is_active: true,
      category_id: null,
      cover_image_url: '',
    });
    setIsPlanDialogOpen(true);
  };

  const handleOpenEditPlan = (plan: RoutinePlan) => {
    setEditingPlan(plan);
    setPlanForm({
      title: plan.title,
      subtitle: plan.subtitle || '',
      description: plan.description || '',
      icon: plan.icon,
      color: plan.color,
      estimated_minutes: plan.estimated_minutes,
      points: plan.points,
      is_featured: plan.is_featured,
      is_popular: plan.is_popular,
      is_pro_routine: plan.is_pro_routine,
      is_active: plan.is_active,
      category_id: plan.category_id,
      cover_image_url: plan.cover_image_url || '',
    });
    setIsPlanDialogOpen(true);
  };

  const handleSubmitPlan = () => {
    if (!planForm.title) {
      toast.error('Title is required');
      return;
    }
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data: planForm });
    } else {
      createPlanMutation.mutate(planForm);
    }
  };

  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      duration_minutes: 5,
      icon: '☀️',
      task_order: tasks.length + 1,
      is_active: true,
      pro_link_type: null,
      pro_link_value: null,
    });
    setIsTaskDialogOpen(true);
  };

  const handleOpenEditTask = (task: RoutineTask) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      duration_minutes: task.duration_minutes,
      icon: task.icon,
      task_order: task.task_order,
      is_active: task.is_active,
      pro_link_type: task.pro_link_type,
      pro_link_value: task.pro_link_value || task.linked_playlist_id,
    });
    setIsTaskDialogOpen(true);
  };

  const handleSubmitTask = () => {
    if (!taskForm.title) {
      toast.error('Title is required');
      return;
    }
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data: taskForm });
    } else {
      createTaskMutation.mutate(taskForm);
    }
  };

  const handleMoveTask = (taskId: string, direction: 'up' | 'down') => {
    const currentIndex = tasks.findIndex(t => t.id === taskId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= tasks.length) return;

    const currentTask = tasks[currentIndex];
    const swapTask = tasks[newIndex];

    reorderTaskMutation.mutate({ id: currentTask.id, newOrder: swapTask.task_order });
    reorderTaskMutation.mutate({ id: swapTask.id, newOrder: currentTask.task_order });
  };

  // Get pro link config
  const proConfig = taskForm.pro_link_type ? PRO_LINK_CONFIGS[taskForm.pro_link_type] : null;

  // If a plan is selected, show task management view
  if (selectedPlanId && selectedPlan) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedPlanId(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Button>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-2xl">{selectedPlan.icon}</span>
              {selectedPlan.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage tasks for this routine
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Tasks ({tasks.length})</CardTitle>
            <Button size="sm" onClick={handleOpenCreateTask}>
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tasks yet. Add the first one!
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task, index) => {
                  const taskProConfig = task.pro_link_type ? PRO_LINK_CONFIGS[task.pro_link_type] : null;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
                    >
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          disabled={index === 0}
                          onClick={() => handleMoveTask(task.id, 'up')}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          disabled={index === tasks.length - 1}
                          onClick={() => handleMoveTask(task.id, 'down')}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <span className="text-2xl">{task.icon}</span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{task.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{task.duration_minutes} min</span>
                          {taskProConfig && (
                            <Badge variant="secondary" className="text-xs">
                              <taskProConfig.icon className="h-3 w-3 mr-1" />
                              {taskProConfig.label}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEditTask(task)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteTaskId(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Dialog */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Edit Task' : 'Add Task'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Task title"
                />
              </div>

              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={taskForm.duration_minutes}
                  onChange={(e) => setTaskForm({ ...taskForm, duration_minutes: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Emoji</Label>
                <button
                  type="button"
                  onClick={() => setShowTaskEmojiPicker(true)}
                  className="w-full h-12 flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors text-3xl"
                >
                  {taskForm.icon}
                </button>
              </div>

              {/* Pro Task Link Section */}
              <div className="space-y-2 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  <span className="font-medium text-sm">Pro Task Link (optional)</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Make this a Pro Task that links to an app feature when tapped.
                </p>

                <Select
                  value={taskForm.pro_link_type || 'none'}
                  onValueChange={(value) => {
                    const linkType = value === 'none' ? null : value as ProLinkType;
                    setTaskForm({ 
                      ...taskForm, 
                      pro_link_type: linkType,
                      pro_link_value: null // Reset value when type changes
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select link type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {PRO_LINK_TYPES.map(config => (
                      <SelectItem key={config.value} value={config.value}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Value selector based on link type */}
                {proConfig?.requiresValue && (
                  <div className="mt-3">
                    {taskForm.pro_link_type === 'playlist' && (
                      <>
                        <Label className="text-xs">Select Playlist</Label>
                        <Select
                          value={taskForm.pro_link_value || ''}
                          onValueChange={(value) => setTaskForm({ ...taskForm, pro_link_value: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Choose a playlist" />
                          </SelectTrigger>
                          <SelectContent>
                            {playlists.map(playlist => (
                              <SelectItem key={playlist.id} value={playlist.id}>
                                {playlist.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}

                    {taskForm.pro_link_type === 'breathe' && (
                      <>
                        <Label className="text-xs">Select Breathing Exercise</Label>
                        <Select
                          value={taskForm.pro_link_value || ''}
                          onValueChange={(value) => setTaskForm({ ...taskForm, pro_link_value: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Choose an exercise" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Any exercise</SelectItem>
                            {breathingExercises.map(exercise => (
                              <SelectItem key={exercise.id} value={exercise.id}>
                                {exercise.emoji} {exercise.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}

                    {taskForm.pro_link_type === 'route' && (
                      <>
                        <Label className="text-xs">Custom Route</Label>
                        <Input
                          className="mt-1"
                          value={taskForm.pro_link_value || ''}
                          onChange={(e) => setTaskForm({ ...taskForm, pro_link_value: e.target.value })}
                          placeholder="/app/custom-route"
                        />
                      </>
                    )}

                    {taskForm.pro_link_type === 'channel' && (
                      <>
                        <Label className="text-xs">Channel ID</Label>
                        <Input
                          className="mt-1"
                          value={taskForm.pro_link_value || ''}
                          onChange={(e) => setTaskForm({ ...taskForm, pro_link_value: e.target.value })}
                          placeholder="Channel ID"
                        />
                      </>
                    )}

                    {taskForm.pro_link_type === 'program' && (
                      <>
                        <Label className="text-xs">Program Slug</Label>
                        <Input
                          className="mt-1"
                          value={taskForm.pro_link_value || ''}
                          onChange={(e) => setTaskForm({ ...taskForm, pro_link_value: e.target.value })}
                          placeholder="program-slug"
                        />
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={taskForm.is_active}
                  onCheckedChange={(checked) => setTaskForm({ ...taskForm, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitTask}>
                {editingTask ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task Emoji Picker */}
        <EmojiPicker
          open={showTaskEmojiPicker}
          onOpenChange={setShowTaskEmojiPicker}
          selectedEmoji={taskForm.icon}
          onSelect={(emoji) => setTaskForm({ ...taskForm, icon: emoji })}
        />

        {/* Delete Task Confirmation */}
        <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this task? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteTaskId && deleteTaskMutation.mutate(deleteTaskId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Main plans list view
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="plans">Routine Plans</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Routine Plans</CardTitle>
                  <CardDescription>
                    Create and manage routine templates users can add to their planner
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ({plans.length})</SelectItem>
                      <SelectItem value="pro">
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Pro ({plans.filter(p => p.is_pro_routine).length})
                        </span>
                      </SelectItem>
                      <SelectItem value="regular">Regular ({plans.filter(p => !p.is_pro_routine).length})</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleOpenCreatePlan}>
                    <Plus className="h-4 w-4 mr-1" />
                    New Plan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {plansLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No plans found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors group"
                    >
                      <span className="text-2xl">{plan.icon}</span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{plan.title}</span>
                          {plan.is_pro_routine && (
                            <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Pro
                            </Badge>
                          )}
                          {!plan.is_active && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {plan.category?.name && <span>{plan.category.name}</span>}
                          <span>{plan.estimated_minutes} min</span>
                          <span>{plan.points} pts</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPlanId(plan.id)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Tasks
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEditPlan(plan)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeletePlanId(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Organize routine plans into categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No categories yet
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-xl">{category.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs text-muted-foreground">{category.slug}</div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={`bg-${category.color}-100 text-${category.color}-700`}
                      >
                        {category.color}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Edit Routine Plan' : 'Create Routine Plan'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={planForm.title}
                onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                placeholder="Morning Routine"
              />
            </div>

            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={planForm.subtitle}
                onChange={(e) => setPlanForm({ ...planForm, subtitle: e.target.value })}
                placeholder="Start your day right"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="A complete morning routine to boost productivity..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emoji</Label>
                <button
                  type="button"
                  onClick={() => setShowPlanEmojiPicker(true)}
                  className="w-full h-12 flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors text-3xl"
                >
                  {planForm.icon}
                </button>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <Select
                  value={planForm.color}
                  onValueChange={(value) => setPlanForm({ ...planForm, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        {color.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={planForm.estimated_minutes}
                  onChange={(e) => setPlanForm({ ...planForm, estimated_minutes: parseInt(e.target.value) || 10 })}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  value={planForm.points}
                  onChange={(e) => setPlanForm({ ...planForm, points: parseInt(e.target.value) || 10 })}
                  min={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={planForm.category_id || 'none'}
                onValueChange={(value) => setPlanForm({ ...planForm, category_id: value === 'none' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  Pro Routine
                </Label>
                <Switch
                  checked={planForm.is_pro_routine}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_pro_routine: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Featured</Label>
                <Switch
                  checked={planForm.is_featured}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_featured: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Popular</Label>
                <Switch
                  checked={planForm.is_popular}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_popular: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={planForm.is_active}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPlan}>
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Emoji Picker */}
      <EmojiPicker
        open={showPlanEmojiPicker}
        onOpenChange={setShowPlanEmojiPicker}
        selectedEmoji={planForm.icon}
        onSelect={(emoji) => setPlanForm({ ...planForm, icon: emoji })}
      />

      {/* Delete Plan Confirmation */}
      <AlertDialog open={!!deletePlanId} onOpenChange={() => setDeletePlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Routine Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this routine plan? All associated tasks will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletePlanId && deletePlanMutation.mutate(deletePlanId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
