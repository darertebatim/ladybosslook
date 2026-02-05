import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Layers, Star, Trash2, Eye, EyeOff, Pencil, X, Search, Clock, FileText, ChevronUp, ChevronDown, FolderPlus, Edit2, Image, Sparkles, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskIcon } from '@/components/app/IconPicker';
import EmojiPicker from '@/components/app/EmojiPicker';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { AITextGenerator } from '@/components/admin/AITextGenerator';

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
  is_welcome_popup: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface RoutineBankSection {
  id: string;
  routine_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  section_order: number;
  is_active: boolean;
  created_at: string;
}

interface RoutineBankTask {
  id: string;
  routine_id: string;
  task_id: string | null;
  title: string;
  emoji: string;
  section_id: string | null;
  section_title: string | null;
  task_order: number;
}

interface TaskBankItem {
  id: string;
  title: string;
  emoji: string;
  category: string;
  is_active: boolean;
}

// Local state for sections while editing
interface LocalSection {
  id: string;
  title: string;
  content: string;
  image_url: string;
  section_order: number;
  isNew?: boolean;
}

// Local state for tasks while editing
interface LocalTask {
  id: string;
  task_id: string | null;
  title: string;
  emoji: string;
  section_id: string | null;
  task_order: number;
}

export default function RoutinesBank() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineBankItem | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [taskSearchOpen, setTaskSearchOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [addingTaskToSection, setAddingTaskToSection] = useState<string | null>(null); // section_id or 'uncategorized'
  const [dialogTab, setDialogTab] = useState<'basic' | 'sections'>('basic');

  // Section editor state
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<LocalSection | null>(null);

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
  const [localSections, setLocalSections] = useState<LocalSection[]>([]);
  const [localTasks, setLocalTasks] = useState<LocalTask[]>([]);

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
        .select('routine_id');
      if (error) throw error;
      
      const counts: Record<string, { count: number }> = {};
      data.forEach((task) => {
        if (!counts[task.routine_id]) {
          counts[task.routine_id] = { count: 0 };
        }
        counts[task.routine_id].count++;
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
        .select('id, title, emoji, category, is_active')
        .eq('is_active', true)
        .order('title', { ascending: true });
      if (error) throw error;
      return data as TaskBankItem[];
    },
  });

  // Create routine
  const createRoutine = useMutation({
    mutationFn: async (data: { formData: typeof formData; sections: LocalSection[]; tasks: LocalTask[] }) => {
      // Create routine
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

      // Create sections and build id mapping
      const sectionIdMap: Record<string, string> = {};
      if (data.sections.length > 0) {
        const sectionRecords = data.sections.map((s, idx) => ({
          routine_id: newRoutine.id,
          title: s.title,
          content: s.content || null,
          image_url: s.image_url || null,
          section_order: idx,
        }));
        const { data: insertedSections, error: secError } = await supabase
          .from('routines_bank_sections')
          .insert(sectionRecords)
          .select();
        if (secError) throw secError;
        
        // Map local temp ids to real ids
        data.sections.forEach((s, idx) => {
          if (insertedSections && insertedSections[idx]) {
            sectionIdMap[s.id] = insertedSections[idx].id;
          }
        });
      }

      // Insert tasks with mapped section_id
      if (data.tasks.length > 0) {
        const taskRecords = data.tasks.map((t, idx) => ({
          routine_id: newRoutine.id,
          task_id: t.task_id,
          title: t.title,
          emoji: t.emoji,
          section_id: t.section_id ? sectionIdMap[t.section_id] || null : null,
          task_order: idx,
        }));
        await supabase.from('routines_bank_tasks').insert(taskRecords);
      }
      return newRoutine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines-bank'] });
      queryClient.invalidateQueries({ queryKey: ['routines-bank-task-counts'] });
      toast.success('Ritual created');
      closeDialog();
    },
    onError: (error) => toast.error('Failed to create ritual: ' + error.message),
  });

  // Update routine
  const updateRoutine = useMutation({
    mutationFn: async (data: { id: string; formData: typeof formData; sections: LocalSection[]; tasks: LocalTask[] }) => {
      // Update routine basic info
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

      // Delete old sections and tasks
      await supabase.from('routines_bank_tasks').delete().eq('routine_id', data.id);
      await supabase.from('routines_bank_sections').delete().eq('routine_id', data.id);

      // Recreate sections
      const sectionIdMap: Record<string, string> = {};
      if (data.sections.length > 0) {
        const sectionRecords = data.sections.map((s, idx) => ({
          routine_id: data.id,
          title: s.title,
          content: s.content || null,
          image_url: s.image_url || null,
          section_order: idx,
        }));
        const { data: insertedSections, error: secError } = await supabase
          .from('routines_bank_sections')
          .insert(sectionRecords)
          .select();
        if (secError) throw secError;
        
        data.sections.forEach((s, idx) => {
          if (insertedSections && insertedSections[idx]) {
            sectionIdMap[s.id] = insertedSections[idx].id;
          }
        });
      }

      // Recreate tasks
      if (data.tasks.length > 0) {
        const taskRecords = data.tasks.map((t, idx) => ({
          routine_id: data.id,
          task_id: t.task_id,
          title: t.title,
          emoji: t.emoji,
          section_id: t.section_id ? sectionIdMap[t.section_id] || null : null,
          task_order: idx,
        }));
        await supabase.from('routines_bank_tasks').insert(taskRecords);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines-bank'] });
      queryClient.invalidateQueries({ queryKey: ['routines-bank-task-counts'] });
      toast.success('Ritual updated');
      closeDialog();
    },
    onError: (error) => toast.error('Failed to update ritual: ' + error.message),
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
      toast.success('Ritual deleted');
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

  // Fetch sections and tasks for a routine when editing
  const fetchRoutineData = async (routineId: string) => {
    const [sectionsRes, tasksRes] = await Promise.all([
      supabase
        .from('routines_bank_sections')
        .select('*')
        .eq('routine_id', routineId)
        .order('section_order', { ascending: true }),
      supabase
        .from('routines_bank_tasks')
        .select('*')
        .eq('routine_id', routineId)
        .order('task_order', { ascending: true }),
    ]);

    const sections: LocalSection[] = (sectionsRes.data || []).map(s => ({
      id: s.id,
      title: s.title,
      content: s.content || '',
      image_url: s.image_url || '',
      section_order: s.section_order,
    }));

    const tasks: LocalTask[] = (tasksRes.data || []).map(t => ({
      id: t.id,
      task_id: t.task_id,
      title: t.title,
      emoji: t.emoji,
      section_id: t.section_id,
      task_order: t.task_order,
    }));

    return { sections, tasks };
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
    setLocalSections([]);
    setLocalTasks([]);
    setDialogTab('basic');
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
    const { sections, tasks } = await fetchRoutineData(routine.id);
    setLocalSections(sections);
    setLocalTasks(tasks);
    setDialogTab('basic');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRoutine(null);
    setLocalSections([]);
    setLocalTasks([]);
    setTaskSearchOpen(false);
    setTaskSearch('');
    setAddingTaskToSection(null);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (editingRoutine) {
      updateRoutine.mutate({ id: editingRoutine.id, formData, sections: localSections, tasks: localTasks });
    } else {
      createRoutine.mutate({ formData, sections: localSections, tasks: localTasks });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this routine?')) {
      deleteRoutine.mutate(id);
    }
  };

  // Section management
  const addSection = () => {
    const newSection: LocalSection = {
      id: crypto.randomUUID(),
      title: 'New Section',
      content: '',
      image_url: '',
      section_order: localSections.length,
      isNew: true,
    };
    setLocalSections([...localSections, newSection]);
    openSectionEditor(newSection);
  };

  const openSectionEditor = (section: LocalSection) => {
    setEditingSection({ ...section });
    setSectionDialogOpen(true);
  };

  const saveSectionEdit = () => {
    if (!editingSection) return;
    if (!editingSection.title.trim()) {
      toast.error('Section title is required');
      return;
    }
    setLocalSections(localSections.map(s => 
      s.id === editingSection.id ? { ...editingSection, isNew: false } : s
    ));
    setSectionDialogOpen(false);
    setEditingSection(null);
  };

  const deleteSection = (sectionId: string) => {
    // Move tasks from this section to uncategorized
    setLocalTasks(localTasks.map(t => 
      t.section_id === sectionId ? { ...t, section_id: null } : t
    ));
    setLocalSections(localSections.filter(s => s.id !== sectionId));
  };

  const moveSectionUp = (index: number) => {
    if (index <= 0) return;
    const newSections = [...localSections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    setLocalSections(newSections);
  };

  const moveSectionDown = (index: number) => {
    if (index >= localSections.length - 1) return;
    const newSections = [...localSections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    setLocalSections(newSections);
  };

  // Task management
  const addTaskToSection = (task: TaskBankItem, sectionId: string | null) => {
    const newTask: LocalTask = {
      id: crypto.randomUUID(),
      task_id: task.id,
      title: task.title,
      emoji: task.emoji,
      section_id: sectionId,
      task_order: localTasks.filter(t => t.section_id === sectionId).length,
    };
    setLocalTasks([...localTasks, newTask]);
    setTaskSearchOpen(false);
    setTaskSearch('');
    setAddingTaskToSection(null);
  };

  const removeTask = (taskId: string) => {
    setLocalTasks(localTasks.filter(t => t.id !== taskId));
  };

  const moveTaskUp = (taskId: string, sectionId: string | null) => {
    const sectionTasks = localTasks.filter(t => t.section_id === sectionId);
    const idx = sectionTasks.findIndex(t => t.id === taskId);
    if (idx <= 0) return;
    
    const taskToMove = sectionTasks[idx];
    const taskAbove = sectionTasks[idx - 1];
    
    setLocalTasks(localTasks.map(t => {
      if (t.id === taskToMove.id) return { ...t, task_order: taskAbove.task_order };
      if (t.id === taskAbove.id) return { ...t, task_order: taskToMove.task_order };
      return t;
    }));
  };

  const moveTaskDown = (taskId: string, sectionId: string | null) => {
    const sectionTasks = localTasks.filter(t => t.section_id === sectionId);
    const idx = sectionTasks.findIndex(t => t.id === taskId);
    if (idx >= sectionTasks.length - 1) return;
    
    const taskToMove = sectionTasks[idx];
    const taskBelow = sectionTasks[idx + 1];
    
    setLocalTasks(localTasks.map(t => {
      if (t.id === taskToMove.id) return { ...t, task_order: taskBelow.task_order };
      if (t.id === taskBelow.id) return { ...t, task_order: taskToMove.task_order };
      return t;
    }));
  };

  const getCategoryInfo = (cat: string) => {
    const found = routineCategories.find(c => c.slug === cat);
    return found ? { value: found.slug, label: found.name, icon: found.icon || '📋' } : { value: cat, label: cat, icon: '📋' };
  };

  const totalTaskCount = localTasks.length;

  const filteredRoutines = selectedCategory === 'all' 
    ? routines 
    : routines.filter(r => r.category === selectedCategory);

  const filteredTaskBank = taskBank.filter(t => 
    t.title.toLowerCase().includes(taskSearch.toLowerCase())
  );

  // Get tasks for a specific section
  const getTasksForSection = (sectionId: string | null) => {
    return localTasks
      .filter(t => t.section_id === sectionId)
      .sort((a, b) => a.task_order - b.task_order);
  };

  const uncategorizedTasks = getTasksForSection(null);

  const getSectionTaskCount = (sectionId: string) => {
    return localTasks.filter(t => t.section_id === sectionId).length;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Rituals Bank
          </CardTitle>
          <CardDescription>
            Create and manage ritual templates with rich sections
          </CardDescription>
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          New Ritual
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
            No rituals yet. Click "New Ritual" to create one.
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
                      <span className="flex items-center gap-1"><TaskIcon iconName={catInfo.icon} size={12} /> {catInfo.label}</span>
                      <span>•</span>
                      <span>{stats.count} action{stats.count !== 1 ? 's' : ''}</span>
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
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRoutine ? 'Edit Ritual' : 'New Ritual'}</DialogTitle>
            <DialogDescription>
              {editingRoutine ? 'Update ritual details and sections' : 'Create a new ritual template'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as 'basic' | 'sections')} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-fit">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="sections">
                Sections & Tasks
                {localSections.length > 0 && (
                  <span className="ml-1 text-xs bg-muted px-1.5 rounded">{localSections.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="flex-1 min-h-0 overflow-auto mt-0" style={{ maxHeight: 'calc(85vh - 240px)' }}>
              <div className="space-y-4 py-2 pr-4">
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <AITextGenerator
                        context={formData.title}
                        fieldType="subtitle"
                        onGenerate={(text) => setFormData({ ...formData, subtitle: text })}
                        disabled={!formData.title.trim()}
                      />
                    </div>
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

                  {/* Cover Image */}
                  <ImageUploader
                    label="Cover Image"
                    value={formData.cover_image_url}
                    onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                    folder="routine-covers"
                  />

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Description</Label>
                      <AITextGenerator
                        context={`${formData.title} - ${formData.subtitle}`}
                        fieldType="description"
                        onGenerate={(text) => setFormData({ ...formData, description: text })}
                        disabled={!formData.title.trim()}
                      />
                    </div>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Summary stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {localSections.length} section{localSections.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      {localTasks.length} action{localTasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
            </TabsContent>

            <TabsContent value="sections" className="flex-1 min-h-0 overflow-auto mt-0" style={{ maxHeight: 'calc(85vh - 240px)' }}>
              <div className="space-y-4 py-2 pr-4">
                {/* Sections */}
                {localSections.map((section, sIdx) => {
                    const sectionTasks = getTasksForSection(section.id);
                    const sectionTaskCount = getSectionTaskCount(section.id);
                    return (
                      <div key={section.id} className="border rounded-lg overflow-hidden">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 p-3 bg-muted/50 border-b">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => moveSectionUp(sIdx)}
                              disabled={sIdx === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSectionDown(sIdx)}
                              disabled={sIdx === localSections.length - 1}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{section.title}</h4>
                            {section.content && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{section.content}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {sectionTasks.length} task{sectionTasks.length !== 1 ? 's' : ''}
                          </span>
                          {section.image_url && (
                            <Image className="h-4 w-4 text-muted-foreground" />
                          )}
                          <button
                            type="button"
                            onClick={() => openSectionEditor(section)}
                            className="p-1 hover:bg-accent rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSection(section.id)}
                            className="p-1 hover:bg-destructive/10 rounded text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Section Tasks */}
                        <div className="p-2 space-y-1">
                          {sectionTasks.length === 0 ? (
                            <p className="text-center text-muted-foreground text-xs py-2">No tasks in this section</p>
                          ) : (
                            sectionTasks.map((task, tIdx) => (
                              <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-background border">
                                <div className="flex flex-col">
                                  <button
                                    type="button"
                                    onClick={() => moveTaskUp(task.id, section.id)}
                                    disabled={tIdx === 0}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveTaskDown(task.id, section.id)}
                                    disabled={tIdx === sectionTasks.length - 1}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </div>
                                <TaskIcon iconName={task.emoji} size={16} />
                                <span className="flex-1 text-sm truncate">{task.title}</span>
                                {/* Move to section dropdown */}
                                <Select
                                  value=""
                                  onValueChange={(targetSectionId) => {
                                    const newSectionId = targetSectionId === '_uncategorized' ? null : targetSectionId;
                                    setLocalTasks(localTasks.map(t =>
                                      t.id === task.id ? { ...t, section_id: newSectionId } : t
                                    ));
                                  }}
                                >
                                  <SelectTrigger className="w-[100px] h-7 text-xs">
                                    <span className="text-muted-foreground">Move to...</span>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="_uncategorized" className="text-xs">
                                      Uncategorized
                                    </SelectItem>
                                    {localSections.filter(s => s.id !== section.id).map((s) => (
                                      <SelectItem key={s.id} value={s.id} className="text-xs">
                                        {s.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <button
                                  type="button"
                                  onClick={() => removeTask(task.id)}
                                  className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))
                          )}
                          
                          {/* Add task to section */}
                          {addingTaskToSection === section.id ? (
                            <div className="border rounded p-2 space-y-2 bg-muted/30">
                              <div className="relative">
                                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search tasks..."
                                  value={taskSearch}
                                  onChange={(e) => setTaskSearch(e.target.value)}
                                  className="pl-8 h-8 text-sm"
                                  autoFocus
                                />
                              </div>
                              <ScrollArea className="h-32">
                                <div className="space-y-1">
                                  {filteredTaskBank.map((task) => (
                                    <button
                                      key={task.id}
                                      type="button"
                                      onClick={() => addTaskToSection(task, section.id)}
                                    className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-accent text-left text-xs"
                                    >
                                      <TaskIcon iconName={task.emoji} size={14} />
                                      <span className="flex-1 truncate">{task.title}</span>
                                    </button>
                                  ))}
                                </div>
                              </ScrollArea>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setAddingTaskToSection(null);
                                  setTaskSearch('');
                                }}
                                className="w-full h-7"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setAddingTaskToSection(section.id)}
                              className="w-full h-7 text-xs gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add Task
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Section Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSection}
                    className="w-full gap-2"
                  >
                    <FolderPlus className="h-4 w-4" />
                    Add Section
                  </Button>

                  {/* Uncategorized Tasks */}
                  {(uncategorizedTasks.length > 0 || localSections.length === 0) && (
                    <div className="border rounded-lg overflow-hidden border-dashed">
                      <div className="flex items-center gap-2 p-3 bg-muted/30 border-b border-dashed">
                        <h4 className="font-medium text-sm text-muted-foreground flex-1">
                          {localSections.length === 0 ? 'Tasks' : 'Uncategorized Tasks'}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {uncategorizedTasks.length} task{uncategorizedTasks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="p-2 space-y-1">
                        {uncategorizedTasks.map((task, tIdx) => (
                          <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-background border">
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => moveTaskUp(task.id, null)}
                                disabled={tIdx === 0}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveTaskDown(task.id, null)}
                                disabled={tIdx === uncategorizedTasks.length - 1}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                            <TaskIcon iconName={task.emoji} size={16} />
                            <span className="flex-1 text-sm truncate">{task.title}</span>
                            {/* Move to section dropdown */}
                            {localSections.length > 0 && (
                              <Select
                                value=""
                                onValueChange={(sectionId) => {
                                  setLocalTasks(localTasks.map(t =>
                                    t.id === task.id ? { ...t, section_id: sectionId } : t
                                  ));
                                }}
                              >
                                <SelectTrigger className="w-[100px] h-7 text-xs">
                                  <span className="text-muted-foreground">Move to...</span>
                                </SelectTrigger>
                                <SelectContent>
                                  {localSections.map((s) => (
                                    <SelectItem key={s.id} value={s.id} className="text-xs">
                                      {s.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <button
                              type="button"
                              onClick={() => removeTask(task.id)}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        
                        {/* Add uncategorized task */}
                        {addingTaskToSection === 'uncategorized' ? (
                          <div className="border rounded p-2 space-y-2 bg-muted/30">
                            <div className="relative">
                              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search tasks..."
                                value={taskSearch}
                                onChange={(e) => setTaskSearch(e.target.value)}
                                className="pl-8 h-8 text-sm"
                                autoFocus
                              />
                            </div>
                            <ScrollArea className="h-32">
                              <div className="space-y-1">
                                {filteredTaskBank.map((task) => (
                                  <button
                                    key={task.id}
                                    type="button"
                                    onClick={() => addTaskToSection(task, null)}
                                    className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-accent text-left text-xs"
                                  >
                                    <TaskIcon iconName={task.emoji} size={14} />
                                    <span className="flex-1 truncate">{task.title}</span>
                                  </button>
                                ))}
                              </div>
                            </ScrollArea>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAddingTaskToSection(null);
                                setTaskSearch('');
                              }}
                              className="w-full h-7"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setAddingTaskToSection('uncategorized')}
                            className="w-full h-7 text-xs gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add Action
                          </Button>
                        )}
                      </div>
                    </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={createRoutine.isPending || updateRoutine.isPending}>
              {editingRoutine ? 'Save Changes' : 'Create Ritual'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Editor Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSection?.isNew ? 'New Section' : 'Edit Section'}</DialogTitle>
            <DialogDescription>
              Add descriptive content to introduce this part of the ritual
            </DialogDescription>
          </DialogHeader>
          
          {editingSection && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="section-title">Title *</Label>
                <Input
                  id="section-title"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  placeholder="e.g., Get Moving"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="section-content">Content</Label>
                  <AITextGenerator
                    context={`Section "${editingSection.title}" in routine "${formData.title}"`}
                    fieldType="section_content"
                    onGenerate={(text) => setEditingSection({ ...editingSection, content: text })}
                    disabled={!editingSection.title.trim()}
                  />
                </div>
                <Textarea
                  id="section-content"
                  value={editingSection.content}
                  onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                  placeholder="Describe what this section is about and why it's important..."
                  className="min-h-[120px]"
                />
              </div>

              <ImageUploader
                label="Section Image (optional)"
                value={editingSection.image_url}
                onChange={(url) => setEditingSection({ ...editingSection, image_url: url })}
                folder="routine-sections"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveSectionEdit}>Save Section</Button>
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
