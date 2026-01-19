import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, ChevronUp, ChevronDown, Image, Music, Sparkles, BookOpen, MessageCircle, GraduationCap, Calendar, Link } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { PRO_LINK_TYPES, ProLinkType } from '@/lib/proTaskTypes';

interface Playlist {
  id: string;
  name: string;
  category: string | null;
}

interface Section {
  id: string;
  plan_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  section_order: number;
  is_active: boolean;
}

interface Task {
  id: string;
  plan_id: string;
  title: string;
  duration_minutes: number;
  icon: string;
  task_order: number;
  is_active: boolean;
  linked_playlist_id: string | null;
  pro_link_type: string | null;
  pro_link_value: string | null;
  linked_playlist?: {
    id: string;
    name: string;
  } | null;
}

interface Plan {
  id: string;
  title: string;
  subtitle: string | null;
}

interface Props {
  planId: string;
  onBack: () => void;
}

const ICON_OPTIONS = [
  'Sun', 'Moon', 'Heart', 'Brain', 'Dumbbell', 'Coffee', 
  'Book', 'Star', 'Sparkles', 'Zap', 'Target', 'Clock',
  'CheckCircle', 'Award', 'Flame', 'Leaf', 'Droplet', 'Wind'
];

export function RoutinePlanDetailManager({ planId, onBack }: Props) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sections');
  
  // Section state
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    content: '',
    image_url: '',
    section_order: 0,
    is_active: true,
  });
  
  // Task state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    duration_minutes: 1,
    icon: 'CheckCircle',
    task_order: 0,
    is_active: true,
    linked_playlist_id: null as string | null,
    pro_link_type: null as string | null,
    pro_link_value: null as string | null,
  });

  const [isUploading, setIsUploading] = useState(false);

  // Fetch plan details
  const { data: plan } = useQuery({
    queryKey: ['admin-routine-plan', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plans')
        .select('id, title, subtitle')
        .eq('id', planId)
        .single();
      if (error) throw error;
      return data as Plan;
    },
  });

  // Fetch sections
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['admin-routine-sections', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plan_sections')
        .select('*')
        .eq('plan_id', planId)
        .order('section_order');
      if (error) throw error;
      return data as Section[];
    },
  });

  // Fetch tasks with linked playlist info
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['admin-routine-tasks', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plan_tasks')
        .select(`
          *,
          linked_playlist:audio_playlists!linked_playlist_id(id, name)
        `)
        .eq('plan_id', planId)
        .order('task_order');
      if (error) throw error;
      return data as Task[];
    },
  });

  // Fetch playlists for linking
  const { data: playlists } = useQuery({
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

  // Section mutations
  const createSectionMutation = useMutation({
    mutationFn: async (data: typeof sectionForm) => {
      const { error } = await supabase.from('routine_plan_sections').insert({
        ...data,
        plan_id: planId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-sections', planId] });
      toast.success('Section created');
      setIsSectionDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof sectionForm }) => {
      const { error } = await supabase
        .from('routine_plan_sections')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-sections', planId] });
      toast.success('Section updated');
      setIsSectionDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('routine_plan_sections')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-sections', planId] });
      toast.success('Section deleted');
      setDeleteSectionId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reorderSectionMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from('routine_plan_sections')
        .update({ section_order: newOrder })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-sections', planId] });
    },
  });

  // Task mutations
  const createTaskMutation = useMutation({
    mutationFn: async (data: typeof taskForm) => {
      const { error } = await supabase.from('routine_plan_tasks').insert({
        ...data,
        plan_id: planId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-tasks', planId] });
      toast.success('Task created');
      setIsTaskDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof taskForm }) => {
      const { error } = await supabase
        .from('routine_plan_tasks')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-tasks', planId] });
      toast.success('Task updated');
      setIsTaskDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
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
      queryClient.invalidateQueries({ queryKey: ['admin-routine-tasks', planId] });
      toast.success('Task deleted');
      setDeleteTaskId(null);
    },
    onError: (error: Error) => toast.error(error.message),
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
      queryClient.invalidateQueries({ queryKey: ['admin-routine-tasks', planId] });
    },
  });

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `sections/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('routine-covers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('routine-covers')
        .getPublicUrl(fileName);

      setSectionForm(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Section handlers
  const handleOpenCreateSection = () => {
    setEditingSection(null);
    setSectionForm({
      title: '',
      content: '',
      image_url: '',
      section_order: (sections?.length || 0) + 1,
      is_active: true,
    });
    setIsSectionDialogOpen(true);
  };

  const handleOpenEditSection = (section: Section) => {
    setEditingSection(section);
    setSectionForm({
      title: section.title,
      content: section.content || '',
      image_url: section.image_url || '',
      section_order: section.section_order,
      is_active: section.is_active,
    });
    setIsSectionDialogOpen(true);
  };

  const handleSubmitSection = () => {
    if (!sectionForm.title) {
      toast.error('Title is required');
      return;
    }
    if (editingSection) {
      updateSectionMutation.mutate({ id: editingSection.id, data: sectionForm });
    } else {
      createSectionMutation.mutate(sectionForm);
    }
  };

  // Task handlers
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      duration_minutes: 1,
      icon: 'CheckCircle',
      task_order: (tasks?.length || 0) + 1,
      is_active: true,
      linked_playlist_id: null,
      pro_link_type: null,
      pro_link_value: null,
    });
    setIsTaskDialogOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      duration_minutes: task.duration_minutes,
      icon: task.icon,
      task_order: task.task_order,
      is_active: task.is_active,
      linked_playlist_id: task.linked_playlist_id,
      pro_link_type: task.pro_link_type,
      pro_link_value: task.pro_link_value,
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

  const renderIcon = (iconName: string) => {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  const moveSection = (section: Section, direction: 'up' | 'down') => {
    if (!sections) return;
    const currentIndex = sections.findIndex(s => s.id === section.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    
    const targetSection = sections[targetIndex];
    reorderSectionMutation.mutate({ id: section.id, newOrder: targetSection.section_order });
    reorderSectionMutation.mutate({ id: targetSection.id, newOrder: section.section_order });
  };

  const moveTask = (task: Task, direction: 'up' | 'down') => {
    if (!tasks) return;
    const currentIndex = tasks.findIndex(t => t.id === task.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= tasks.length) return;
    
    const targetTask = tasks[targetIndex];
    reorderTaskMutation.mutate({ id: task.id, newOrder: targetTask.task_order });
    reorderTaskMutation.mutate({ id: targetTask.id, newOrder: task.task_order });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{plan?.title || 'Loading...'}</h2>
          {plan?.subtitle && (
            <p className="text-muted-foreground">{plan.subtitle}</p>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sections">
            Sections ({sections?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks ({tasks?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Educational Sections</CardTitle>
                <CardDescription>Content shown on the plan detail page</CardDescription>
              </div>
              <Button onClick={handleOpenCreateSection} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </CardHeader>
            <CardContent>
              {sectionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : !sections?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sections yet. Add educational content for this routine.
                </div>
              ) : (
                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <div 
                      key={section.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveSection(section, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveSection(section, 'down')}
                          disabled={index === sections.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                      {section.image_url && (
                        <img 
                          src={section.image_url} 
                          alt="" 
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{section.title}</div>
                        {section.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {section.content}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditSection(section)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteSectionId(section.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Routine Tasks</CardTitle>
                <CardDescription>Tasks added to user's planner when they adopt this routine</CardDescription>
              </div>
              <Button onClick={handleOpenCreateTask} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : !tasks?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks yet. Add the steps users will complete.
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <div 
                      key={task.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveTask(task, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveTask(task, 'down')}
                          disabled={index === tasks.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center relative">
                        {renderIcon(task.icon)}
                        {(task.pro_link_type || task.linked_playlist_id) && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                            <Sparkles className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {task.duration_minutes} min
                          {task.pro_link_type && (
                            <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400">
                              <Sparkles className="h-3 w-3" />
                              {task.pro_link_type}
                              {task.pro_link_value && `: ${task.pro_link_value.slice(0, 20)}...`}
                            </span>
                          )}
                          {!task.pro_link_type && task.linked_playlist && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <Music className="h-3 w-3" />
                              {task.linked_playlist.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditTask(task)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTaskId(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Section Dialog */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? 'Edit Section' : 'Add Section'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={sectionForm.title}
                onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Introduction"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={sectionForm.content}
                onChange={(e) => setSectionForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Explain what this section covers..."
                rows={4}
              />
            </div>
            <div>
              <Label>Image (optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={sectionForm.image_url}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, image_url: e.target.value }))}
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
              {sectionForm.image_url && (
                <img 
                  src={sectionForm.image_url} 
                  alt="Preview" 
                  className="mt-2 w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={sectionForm.is_active}
                onCheckedChange={(checked) => setSectionForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitSection}
              disabled={createSectionMutation.isPending || updateSectionMutation.isPending}
            >
              {editingSection ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Edit Task' : 'Add Task'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Morning stretch"
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={1}
                value={taskForm.duration_minutes}
                onChange={(e) => setTaskForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setTaskForm(prev => ({ ...prev, icon }))}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                      taskForm.icon === icon 
                        ? 'border-primary bg-primary/10' 
                        : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    {renderIcon(icon)}
                  </button>
                ))}
              </div>
            </div>
            {/* Pro Task Link Type */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <Label className="font-semibold">Pro Task Link (optional)</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Make this a Pro Task that links to an app feature when tapped.
              </p>
              
              <Select
                value={taskForm.pro_link_type || 'none'}
                onValueChange={(value) => {
                  const linkType = value === 'none' ? null : value;
                  setTaskForm(prev => ({ 
                    ...prev, 
                    pro_link_type: linkType,
                    pro_link_value: null,
                    // Auto-set linked_playlist_id when playlist is selected
                    linked_playlist_id: null,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select link type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No link (regular task)</SelectItem>
                  {PRO_LINK_TYPES.map((config) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={config.value} value={config.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Value selector based on link type */}
              {taskForm.pro_link_type === 'playlist' && (
                <div>
                  <Label className="text-xs">Select Playlist</Label>
                  <Select
                    value={taskForm.pro_link_value || 'none'}
                    onValueChange={(value) => setTaskForm(prev => ({ 
                      ...prev, 
                      pro_link_value: value === 'none' ? null : value,
                      linked_playlist_id: value === 'none' ? null : value,
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a playlist..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No playlist</SelectItem>
                      {playlists?.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          {playlist.name} {playlist.category && `(${playlist.category})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {taskForm.pro_link_type === 'channel' && (
                <div>
                  <Label className="text-xs">Channel Slug</Label>
                  <Input
                    value={taskForm.pro_link_value || ''}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, pro_link_value: e.target.value || null }))}
                    placeholder="e.g., general, announcements"
                    className="mt-1"
                  />
                </div>
              )}

              {taskForm.pro_link_type === 'program' && (
                <div>
                  <Label className="text-xs">Program Slug</Label>
                  <Input
                    value={taskForm.pro_link_value || ''}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, pro_link_value: e.target.value || null }))}
                    placeholder="e.g., courageous-character"
                    className="mt-1"
                  />
                </div>
              )}

              {taskForm.pro_link_type === 'route' && (
                <div>
                  <Label className="text-xs">Custom Route Path</Label>
                  <Input
                    value={taskForm.pro_link_value || ''}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, pro_link_value: e.target.value || null }))}
                    placeholder="e.g., /app/profile"
                    className="mt-1"
                  />
                </div>
              )}

              {taskForm.pro_link_type && !['playlist', 'channel', 'program', 'route'].includes(taskForm.pro_link_type) && (
                <p className="text-xs text-muted-foreground italic">
                  This link type doesn't require a value - it will open the {taskForm.pro_link_type} page directly.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={taskForm.is_active}
                onCheckedChange={(checked) => setTaskForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitTask}
              disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
            >
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Confirmation */}
      <AlertDialog open={!!deleteSectionId} onOpenChange={() => setDeleteSectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSectionId && deleteSectionMutation.mutate(deleteSectionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Confirmation */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this task.
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
