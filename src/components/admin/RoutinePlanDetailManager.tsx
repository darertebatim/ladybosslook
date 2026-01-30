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
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Image, Music, Sparkles, Copy, Eye, ListPlus, Clock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { PRO_LINK_TYPES, PRO_LINK_CONFIGS, ProLinkType } from '@/lib/proTaskTypes';

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
  cover_image_url: string | null;
  icon: string;
  color: string;
  estimated_minutes: number;
  is_pro_routine: boolean;
}

interface Template {
  id: string;
  title: string;
  duration_minutes: number;
  icon: string;
  pro_link_type: string;
  pro_link_value: string | null;
  linked_playlist_id: string | null;
}

interface TaskTemplate {
  id: string;
  title: string;
  emoji: string;
  color: string;
  category: string;
}

interface Props {
  planId: string;
  onBack: () => void;
}

const EMOJI_OPTIONS = [
  '☀️', '🌙', '❤️', '🧠', '💪', '☕',
  '📖', '⭐', '✨', '⚡', '🎯', '🕐',
  '✅', '🏆', '🔥', '🌿', '💧', '💨',
];

const colorGradients: Record<string, string> = {
  yellow: 'from-yellow-200 to-amber-300',
  pink: 'from-pink-200 to-rose-300',
  blue: 'from-blue-200 to-cyan-300',
  purple: 'from-purple-200 to-violet-300',
  green: 'from-green-200 to-emerald-300',
  orange: 'from-orange-200 to-amber-300',
};

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
    icon: '✅',
    task_order: 0,
    is_active: true,
    linked_playlist_id: null as string | null,
    pro_link_type: null as string | null,
    pro_link_value: null as string | null,
  });

  // Bulk task dialog
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkTasks, setBulkTasks] = useState('');

  const [isUploading, setIsUploading] = useState(false);

  // Fetch plan details
  const { data: plan } = useQuery({
    queryKey: ['admin-routine-plan', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plans')
        .select('id, title, subtitle, cover_image_url, icon, color, estimated_minutes, is_pro_routine')
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

  // Fetch Pro Task templates
  const { data: templates } = useQuery({
    queryKey: ['admin-pro-task-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_task_templates')
        .select('id, title, duration_minutes, icon, pro_link_type, pro_link_value, linked_playlist_id')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as Template[];
    },
  });

  // Fetch regular Task templates (for adding to regular tasks)
  const { data: taskTemplates } = useQuery({
    queryKey: ['admin-task-templates-for-routine'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('id, title, emoji, color, category')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as TaskTemplate[];
    },
  });

  // Separate regular tasks and pro tasks
  const regularTasks = tasks?.filter(t => !t.pro_link_type) || [];
  const proTasks = tasks?.filter(t => t.pro_link_type) || [];

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
  const handleOpenCreateTask = (isPro: boolean = false) => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      duration_minutes: isPro ? 5 : 1,
      icon: isPro ? '✨' : '✅',
      task_order: (tasks?.length || 0) + 1,
      is_active: true,
      linked_playlist_id: null,
      pro_link_type: isPro ? 'playlist' : null,
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

  // Duplicate task
  const handleDuplicateTask = async (task: Task) => {
    const newTaskData = {
      title: `${task.title} (copy)`,
      duration_minutes: task.duration_minutes,
      icon: task.icon,
      task_order: (tasks?.length || 0) + 1,
      is_active: task.is_active,
      linked_playlist_id: task.linked_playlist_id,
      pro_link_type: task.pro_link_type,
      pro_link_value: task.pro_link_value,
    };
    createTaskMutation.mutate(newTaskData);
  };

  // Add from pro template
  const handleAddFromTemplate = async (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (!template) return;

    const newTaskData = {
      title: template.title,
      duration_minutes: template.duration_minutes,
      icon: template.icon,
      task_order: (tasks?.length || 0) + 1,
      is_active: true,
      linked_playlist_id: template.linked_playlist_id,
      pro_link_type: template.pro_link_type,
      pro_link_value: template.pro_link_value,
    };
    createTaskMutation.mutate(newTaskData);
  };

  // Add from regular task template
  const handleAddFromTaskTemplate = async (templateId: string) => {
    const template = taskTemplates?.find(t => t.id === templateId);
    if (!template) return;

    const newTaskData = {
      title: template.title,
      duration_minutes: 5, // Default duration
      icon: template.emoji,
      task_order: (tasks?.length || 0) + 1,
      is_active: true,
      linked_playlist_id: null,
      pro_link_type: null,
      pro_link_value: null,
    };
    createTaskMutation.mutate(newTaskData);
  };

  // Bulk create tasks
  const handleBulkCreate = async () => {
    const lines = bulkTasks.split('\n').filter(line => line.trim());
    if (!lines.length) {
      toast.error('No tasks to create');
      return;
    }

    let successCount = 0;
    for (let i = 0; i < lines.length; i++) {
      try {
        const { error } = await supabase.from('routine_plan_tasks').insert({
          plan_id: planId,
          title: lines[i].trim(),
          duration_minutes: 5,
          icon: '✅',
          task_order: (tasks?.length || 0) + i + 1,
          is_active: true,
          pro_link_type: null,
          pro_link_value: null,
          linked_playlist_id: null,
        });
        if (!error) successCount++;
      } catch (err) {
        console.error('Failed to create task:', err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['admin-routine-tasks', planId] });
    toast.success(`Created ${successCount} tasks`);
    setShowBulkDialog(false);
    setBulkTasks('');
  };

  const renderIcon = (iconOrEmoji: string) => {
    // Check if it's an emoji (not a Lucide icon name)
    const isEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1FA00}-\u{1FAFF}]/u.test(iconOrEmoji);
    if (isEmoji) {
      return <span className="text-lg">{iconOrEmoji}</span>;
    }
    // Fallback to Lucide icon for legacy data
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconOrEmoji];
    return Icon ? <Icon className="h-4 w-4" /> : <span className="text-lg">✨</span>;
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

  const getLinkTypeConfig = (type: string) => {
    return PRO_LINK_CONFIGS[type as ProLinkType];
  };

  // Render task list
  const renderTaskList = (taskList: Task[], isPro: boolean) => (
    <div className="space-y-2">
      {taskList.map((task, index) => (
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
              disabled={index === taskList.length - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center relative">
            {renderIcon(task.icon)}
            {task.pro_link_type && (
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
                <Badge variant="outline" className={getLinkTypeConfig(task.pro_link_type)?.badgeColorClass}>
                  {getLinkTypeConfig(task.pro_link_type)?.badgeText}
                </Badge>
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
              onClick={() => handleDuplicateTask(task)}
              title="Duplicate task"
            >
              <Copy className="h-4 w-4" />
            </Button>
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
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{plan?.title || 'Loading...'}</h2>
            {plan?.is_pro_routine && (
              <Badge className="bg-violet-500/20 text-violet-700 dark:text-violet-300 border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            )}
          </div>
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
          <TabsTrigger value="regular-tasks">
            Tasks ({regularTasks.length})
          </TabsTrigger>
          <TabsTrigger value="pro-tasks" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Pro Tasks ({proTasks.length})
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Sections Tab */}
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

        {/* Regular Tasks Tab */}
        <TabsContent value="regular-tasks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Regular Tasks</CardTitle>
                <CardDescription>Simple checklist tasks for this routine</CardDescription>
              </div>
              <div className="flex gap-2">
                {taskTemplates && taskTemplates.length > 0 && (
                  <Select onValueChange={handleAddFromTaskTemplate}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Add from template" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <span>{template.emoji}</span>
                            {template.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button onClick={() => setShowBulkDialog(true)} size="sm" variant="outline">
                  <ListPlus className="h-4 w-4 mr-2" />
                  Bulk Add
                </Button>
                <Button onClick={() => handleOpenCreateTask(false)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : !regularTasks.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No regular tasks yet. Add simple checklist items.
                </div>
              ) : (
                renderTaskList(regularTasks, false)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pro Tasks Tab */}
        <TabsContent value="pro-tasks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                  Pro Tasks
                </CardTitle>
                <CardDescription>Tasks that link to app features like playlists, journal, etc.</CardDescription>
              </div>
              <div className="flex gap-2">
                {templates && templates.length > 0 && (
                  <Select onValueChange={handleAddFromTemplate}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Add from template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => {
                        const config = getLinkTypeConfig(template.pro_link_type);
                        const Icon = config?.icon;
                        return (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              {Icon && <Icon className="h-3 w-3" />}
                              {template.title}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
                <Button onClick={() => handleOpenCreateTask(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pro Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : !proTasks.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No Pro tasks yet. Add tasks that link to app features.
                </div>
              ) : (
                renderTaskList(proTasks, true)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Preview</CardTitle>
              <CardDescription>How this routine appears in the Inspire page</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-full max-w-sm">
                {/* Routine Card Preview */}
                <div className="border rounded-2xl overflow-hidden bg-card shadow-lg">
                  <div className={`relative aspect-[16/10] bg-gradient-to-br ${colorGradients[plan?.color || 'yellow']}`}>
                    {plan?.cover_image_url ? (
                      <img 
                        src={plan.cover_image_url} 
                        alt={plan?.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {renderIcon(plan?.icon || 'Sun')}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-bold text-lg">{plan?.title || 'Routine Title'}</h3>
                      {plan?.subtitle && (
                        <p className="text-sm text-white/80">{plan.subtitle}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {plan?.estimated_minutes || 0} min
                      </div>
                      <span>•</span>
                      <span>{tasks?.length || 0} tasks</span>
                      {proTasks.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                            <Sparkles className="h-3 w-3" />
                            {proTasks.length} pro
                          </span>
                        </>
                      )}
                    </div>

                    {/* Task preview list */}
                    <div className="space-y-2">
                      {tasks?.slice(0, 5).map(task => {
                        const config = task.pro_link_type ? getLinkTypeConfig(task.pro_link_type) : null;
                        return (
                          <div 
                            key={task.id} 
                            className={`flex items-center gap-2 p-2 rounded-lg ${
                              config ? config.gradientClass : 'bg-muted'
                            }`}
                          >
                            <div className="w-6 h-6 rounded-full bg-background/50 flex items-center justify-center">
                              {renderIcon(task.icon)}
                            </div>
                            <span className="text-sm flex-1">{task.title}</span>
                            {config && (
                              <Badge variant="secondary" className="text-xs">
                                {config.badgeText}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                      {tasks && tasks.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{tasks.length - 5} more tasks
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
              {editingTask ? 'Edit Task' : taskForm.pro_link_type ? 'Add Pro Task' : 'Add Task'}
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
              <Label>Emoji</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setTaskForm(prev => ({ ...prev, icon: emoji }))}
                    className={`p-2 rounded-lg border-2 transition-colors text-xl ${
                      taskForm.icon === emoji 
                        ? 'border-primary bg-primary/10' 
                        : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    {emoji}
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

      {/* Bulk Task Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Add Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Enter tasks (one per line)</Label>
              <Textarea
                value={bulkTasks}
                onChange={(e) => setBulkTasks(e.target.value)}
                placeholder={`Wake up with gratitude\nStretch for 5 minutes\nDrink water\nReview daily goals`}
                rows={8}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Each line will create a 5-minute task with a checkmark icon
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkCreate}>
              Create {bulkTasks.split('\n').filter(l => l.trim()).length} Tasks
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
