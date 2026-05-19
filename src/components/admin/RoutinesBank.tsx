import { useState, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSensors, useSensor, TouchSensor, MouseSensor } from '@dnd-kit/core';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Layers, Star, Trash2, Eye, EyeOff, Pencil, X, Search, Clock, FileText, ChevronUp, ChevronDown, FolderPlus, Edit2, Image, Sparkles, Calendar, Flame, CalendarIcon, Upload, GripVertical, Zap, Loader2 } from 'lucide-react';
import { optimizeCoversForTable } from '@/lib/imageUtils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { TaskIcon } from '@/components/app/IconPicker';
import EmojiPicker from '@/components/app/EmojiPicker';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { AITextGenerator } from '@/components/admin/AITextGenerator';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import AppTaskCreate, { TaskFormData } from '@/pages/app/AppTaskCreate';
import { MediaLibraryPicker } from '@/components/admin/MediaLibraryPicker';
import { HostPicker, HostAssignment, saveContentHosts, loadContentHosts } from '@/components/admin/HostPicker';

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
  video_url: string | null;
  audio_url: string | null;
  category: string;
  color: string;
  emoji: string;
  is_active: boolean;
  is_popular: boolean;
  is_featured: boolean;
  is_free: boolean;
  is_welcome_popup: boolean;
  sort_order: number;
  schedule_type: string;
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
  color: string;
  is_active: boolean;
  repeat_pattern: string;
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
  color: string;
  section_id: string | null;
  task_order: number;
  schedule_days: number[];
  drip_day: number | null;
  monthly_day: number | null;
  is_once: boolean;
  duration_minutes: number | null;
}

// Sortable task row wrapper for drag-and-drop
function SortableTaskRowItem({ id, children }: { id: string; children: (dragHandleProps: Record<string, any>) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

// Sortable routine row wrapper for drag-and-drop reordering in RoutinesBank list
function SortableRoutineRow({ id, children }: { id: string; children: (dragHandleProps: Record<string, any>) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
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
  const [isOptimizingCovers, setIsOptimizingCovers] = useState(false);

  // Create action sheet state
  const [createActionSheetOpen, setCreateActionSheetOpen] = useState(false);
  const [createActionSectionId, setCreateActionSectionId] = useState<string | null>(null);

  // Edit action sheet state
  const [editActionSheetOpen, setEditActionSheetOpen] = useState(false);
  const [editActionTaskBankId, setEditActionTaskBankId] = useState<string | null>(null);
  const [editActionInitialData, setEditActionInitialData] = useState<Partial<TaskFormData> | undefined>(undefined);

  // Section editor state
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<LocalSection | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    cover_image_url: '',
    cover_aspect: 'square' as string,
    video_url: '',
    audio_url: '',
    category: 'general',
    color: 'yellow',
    emoji: '✨',
    schedule_type: 'daily' as 'daily' | 'challenge' | 'project' | 'program',
    challenge_start_date: null as Date | null,
    start_day_of_week: null as number | null,
    start_mode: 'none' as 'none' | 'date' | 'weekday',
    end_mode: 'never' as 'never' | 'date' | 'after_days',
    end_date: null as Date | null,
    end_after_days: null as number | null,
    badge_image_url: '',
    is_focus: false,
    is_moment: false,
    linked_program_slug: null as string | null,
  });
  const [localSections, setLocalSections] = useState<LocalSection[]>([]);
  const [localTasks, setLocalTasks] = useState<LocalTask[]>([]);
  const [hosts, setHosts] = useState<HostAssignment[]>([]);

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

  // Fetch program catalog for program type routines
  const { data: programCatalog = [] } = useQuery({
    queryKey: ['program-catalog-for-routines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('slug, title')
        .eq('is_active', true)
        .order('title', { ascending: true });
      if (error) throw error;
      return data as { slug: string; title: string }[];
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
      return data as unknown as RoutineBankItem[];
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
        .select('id, title, emoji, category, color, is_active, repeat_pattern')
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
          video_url: data.formData.video_url || null,
          audio_url: data.formData.audio_url || null,
          category: data.formData.category,
          color: data.formData.color,
          emoji: data.formData.emoji,
           schedule_type: data.formData.schedule_type,
           cover_aspect: data.formData.cover_aspect,
          challenge_start_date: data.formData.start_mode === 'date' && data.formData.challenge_start_date ? data.formData.challenge_start_date.toISOString().split('T')[0] : null,
          start_day_of_week: data.formData.start_mode === 'weekday' ? data.formData.start_day_of_week : null,
          end_mode: data.formData.end_mode,
          end_date: data.formData.end_mode === 'date' && data.formData.end_date ? data.formData.end_date.toISOString().split('T')[0] : null,
           end_after_days: data.formData.end_mode === 'after_days' ? data.formData.end_after_days : null,
           badge_image_url: data.formData.badge_image_url || null,
            is_focus: data.formData.is_focus,
            is_moment: data.formData.is_moment,
            linked_program_slug: data.formData.schedule_type === 'program' ? data.formData.linked_program_slug : null,
         } as any)
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
        const taskRecords = data.tasks.map((t) => ({
          routine_id: newRoutine.id,
          task_id: t.task_id,
          title: t.title,
          emoji: t.emoji,
          section_id: t.section_id ? sectionIdMap[t.section_id] || null : null,
          task_order: t.task_order,
          schedule_days: t.schedule_days?.length ? t.schedule_days : [],
          drip_day: t.drip_day,
          monthly_day: t.monthly_day,
        }));
        await supabase.from('routines_bank_tasks').insert(taskRecords);
      }
      await saveContentHosts('routine', newRoutine.id, hosts);
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
    mutationFn: async (data: { id: string; formData: typeof formData; sections: LocalSection[]; tasks: LocalTask[] }) => {
      // Update routine basic info
      const { error } = await supabase
        .from('routines_bank')
        .update({
          title: data.formData.title,
          subtitle: data.formData.subtitle || null,
          description: data.formData.description || null,
          cover_image_url: data.formData.cover_image_url || null,
          video_url: data.formData.video_url || null,
          audio_url: data.formData.audio_url || null,
          category: data.formData.category,
          color: data.formData.color,
          emoji: data.formData.emoji,
           schedule_type: data.formData.schedule_type,
           cover_aspect: data.formData.cover_aspect,
          challenge_start_date: data.formData.start_mode === 'date' && data.formData.challenge_start_date ? data.formData.challenge_start_date.toISOString().split('T')[0] : null,
          start_day_of_week: data.formData.start_mode === 'weekday' ? data.formData.start_day_of_week : null,
          end_mode: data.formData.end_mode,
          end_date: data.formData.end_mode === 'date' && data.formData.end_date ? data.formData.end_date.toISOString().split('T')[0] : null,
           end_after_days: data.formData.end_mode === 'after_days' ? data.formData.end_after_days : null,
           badge_image_url: data.formData.badge_image_url || null,
            is_focus: data.formData.is_focus,
            is_moment: data.formData.is_moment,
            linked_program_slug: data.formData.schedule_type === 'program' ? data.formData.linked_program_slug : null,
         } as any)
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
        const taskRecords = data.tasks.map((t) => ({
          routine_id: data.id,
          task_id: t.task_id,
          title: t.title,
          emoji: t.emoji,
          section_id: t.section_id ? sectionIdMap[t.section_id] || null : null,
          task_order: t.task_order,
          schedule_days: t.schedule_days?.length ? t.schedule_days : [],
          drip_day: t.drip_day,
          monthly_day: t.monthly_day,
          is_once: t.is_once ?? false,
        }));
        await supabase.from('routines_bank_tasks').insert(taskRecords);
      }
      await saveContentHosts('routine', data.id, hosts);
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

  // Toggle popular/active/featured
  const togglePopular = useMutation({
    mutationFn: async ({ id, is_popular }: { id: string; is_popular: boolean }) => {
      const { error } = await supabase.from('routines_bank').update({ is_popular }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines-bank'] }),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await (supabase.from('routines_bank').update({ is_featured } as any).eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines-bank'] });
      queryClient.invalidateQueries({ queryKey: ['routines-bank-featured'] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('routines_bank').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines-bank'] });
    },
  });

  // Toggle free
  const toggleFree = useMutation({
    mutationFn: async ({ id, is_free }: { id: string; is_free: boolean }) => {
      const { error } = await supabase.from('routines_bank').update({ is_free } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines-bank'] }),
  });

  const updateSortOrder = useMutation({
    mutationFn: async ({ id, sort_order }: { id: string; sort_order: number }) => {
      const { error } = await supabase.from('routines_bank').update({ sort_order }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines-bank'] }),
  });

  // Bulk reorder routines
  const bulkReorderRoutines = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const updates = items.map(item =>
        supabase.from('routines_bank').update({ sort_order: item.sort_order }).eq('id', item.id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines-bank'] }),
    onError: (error) => toast.error('Failed to reorder: ' + error.message),
  });

  const handleRoutineDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredRoutines.findIndex(r => r.id === active.id);
    const newIndex = filteredRoutines.findIndex(r => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filteredRoutines, oldIndex, newIndex);
    const updates = reordered.map((r, i) => ({ id: r.id, sort_order: i }));

    // Optimistic update
    queryClient.setQueryData(['routines-bank'], (old: RoutineBankItem[] | undefined) => {
      if (!old) return old;
      const orderMap = new Map(updates.map(u => [u.id, u.sort_order]));
      return old.map(r => orderMap.has(r.id) ? { ...r, sort_order: orderMap.get(r.id)! } : r)
        .sort((a, b) => a.sort_order - b.sort_order);
    });

    bulkReorderRoutines.mutate(updates);
  };

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
      emoji: t.emoji || '📝',
      color: '', // will be resolved from taskBank at render time
      section_id: t.section_id,
      task_order: t.task_order ?? 0,
      schedule_days: (t as any).schedule_days || [],
      drip_day: (t as any).drip_day ?? null,
      monthly_day: (t as any).monthly_day ?? null,
      is_once: (t as any).is_once ?? false,
      duration_minutes: t.duration_minutes ?? null,
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
      cover_aspect: 'square',
      video_url: '',
      audio_url: '',
      category: 'general',
      color: 'yellow',
      emoji: '✨',
      schedule_type: 'daily' as 'daily' | 'challenge' | 'project' | 'program',
      challenge_start_date: null,
      start_day_of_week: null,
      start_mode: 'none',
      end_mode: 'never',
      end_date: null,
      end_after_days: null,
      badge_image_url: '',
      is_focus: false,
      is_moment: false,
      linked_program_slug: null,
    });
    setLocalSections([]);
    setLocalTasks([]);
    setHosts([]);
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
      cover_aspect: (routine as any).cover_aspect || 'square',
      video_url: (routine as any).video_url || '',
      audio_url: (routine as any).audio_url || '',
      category: routine.category,
      color: routine.color,
      emoji: routine.emoji,
      schedule_type: (['challenge', 'project', 'program'].includes(routine.schedule_type) ? routine.schedule_type : 'daily') as 'daily' | 'challenge' | 'project' | 'program',
      challenge_start_date: (routine as any).challenge_start_date ? new Date((routine as any).challenge_start_date) : null,
      start_day_of_week: (routine as any).start_day_of_week ?? null,
      start_mode: (routine as any).start_day_of_week != null ? 'weekday' : ((routine as any).challenge_start_date ? 'date' : 'none'),
      end_mode: ((routine as any).end_mode || 'never') as 'never' | 'date' | 'after_days',
      end_date: (routine as any).end_date ? new Date((routine as any).end_date) : null,
      end_after_days: (routine as any).end_after_days ?? null,
      badge_image_url: (routine as any).badge_image_url || '',
      is_focus: (routine as any).is_focus ?? false,
      is_moment: (routine as any).is_moment ?? false,
      linked_program_slug: (routine as any).linked_program_slug ?? null,
    });
    const { sections, tasks } = await fetchRoutineData(routine.id);
    setLocalSections(sections);
    setLocalTasks(tasks);
    try {
      setHosts(await loadContentHosts('routine', routine.id));
    } catch {
      setHosts([]);
    }
    setDialogTab('basic');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRoutine(null);
    setLocalSections([]);
    setLocalTasks([]);
    setHosts([]);
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

  const handleGenerateCover = async () => {
    if (!editingRoutine?.id) {
      toast.error('Please save the routine first before generating a cover');
      return;
    }
    setIsGeneratingCover(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-routine-cover', {
        body: {
          planId: editingRoutine.id,
          planTitle: formData.title,
          planSubtitle: formData.subtitle,
          planDescription: formData.description,
          categoryName: formData.category || '',
        },
      });
      if (error) throw error;
      if (data?.coverUrl) {
        setFormData(prev => ({ ...prev, cover_image_url: data.coverUrl }));
        toast.success('Cover image generated successfully!');
      } else {
        throw new Error(data?.error || 'No image returned');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate cover image');
    } finally {
      setIsGeneratingCover(false);
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
      color: task.color || 'sky',
      section_id: sectionId,
      task_order: localTasks.filter(t => t.section_id === sectionId).length,
      schedule_days: [],
      drip_day: formData.schedule_type === 'challenge' ? localTasks.length + 1 : formData.schedule_type === 'project' ? localTasks.length + 1 : null,
      monthly_day: null,
      is_once: task.repeat_pattern === 'none',
      duration_minutes: (task as any).duration_minutes ?? null,
    };
    setLocalTasks([...localTasks, newTask]);
    setTaskSearchOpen(false);
    setTaskSearch('');
    setAddingTaskToSection(null);
  };

  // Create a new action in the bank and add it to the current routine
  const createActionMutation = useMutation({
    mutationFn: async (data: { formData: TaskFormData; sectionId: string | null }) => {
      const taskData = {
        title: data.formData.title,
        emoji: data.formData.icon,
        color: data.formData.color,
        category: data.formData.tag || 'general',
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
        description: data.formData.description || null,
        is_active: true,
        is_popular: false,
        time_period: data.formData.timePeriod || null,
      };

      const { data: newTask, error } = await supabase
        .from('admin_task_bank')
        .insert(taskData)
        .select('id, title, emoji, category, is_active, repeat_pattern')
        .single();
      if (error) throw error;

      // Insert subtasks
      if (data.formData.subtasks && data.formData.subtasks.length > 0) {
        const subtaskRecords = data.formData.subtasks.map((title, index) => ({
          task_id: newTask.id,
          title,
          order_index: index,
        }));
        await supabase.from('admin_task_bank_subtasks').insert(subtaskRecords);
      }

      return { task: newTask as TaskBankItem, sectionId: data.sectionId };
    },
    onSuccess: ({ task, sectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank-for-picker'] });
      // Auto-add the new task to the routine
      addTaskToSection(task, sectionId);
      toast.success('Task created and added');
      setCreateActionSheetOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create task: ' + error.message);
    },
  });

  const openCreateActionSheet = (sectionId: string | null) => {
    setCreateActionSectionId(sectionId);
    setCreateActionSheetOpen(true);
  };

  const handleCreateActionSave = (formData: TaskFormData) => {
    createActionMutation.mutate({ formData, sectionId: createActionSectionId });
  };

  // Edit existing action in task bank
  const fetchSubtasks = async (taskId: string): Promise<string[]> => {
    const { data } = await supabase
      .from('admin_task_bank_subtasks')
      .select('title')
      .eq('task_id', taskId)
      .order('order_index', { ascending: true });
    return (data || []).map(s => s.title);
  };

  const openEditActionSheet = async (taskBankId: string) => {
    const { data: task } = await supabase
      .from('admin_task_bank')
      .select('*')
      .eq('id', taskBankId)
      .single();
    if (!task) return;

    const subtasks = await fetchSubtasks(taskBankId);
    setEditActionTaskBankId(taskBankId);
    setEditActionInitialData({
      title: task.title,
      description: task.description || null,
      icon: task.emoji,
      color: task.color as any,
      scheduledDate: new Date(),
      scheduledTime: null,
      timePeriod: task.time_period as any || null,
      repeatEnabled: task.repeat_pattern !== 'none',
      repeatPattern: ['daily', 'weekly', 'monthly'].includes(task.repeat_pattern)
        ? task.repeat_pattern as 'daily' | 'weekly' | 'monthly'
        : 'daily',
      repeatInterval: task.repeat_interval || 1,
      repeatDays: task.repeat_days || [],
      reminderEnabled: task.reminder_enabled,
      reminderTime: '09:00',
      tag: task.category,
      subtasks,
      linkedPlaylistId: task.linked_playlist_id,
      proLinkType: task.pro_link_type as any,
      proLinkValue: task.pro_link_value,
      goalEnabled: task.goal_enabled,
      goalType: (task.goal_type as 'timer' | 'count') || 'count',
      goalTarget: task.goal_target || 2,
      goalUnit: task.goal_unit || 'times',
      durationMinutes: task.duration_minutes || null,
    });
    setEditActionSheetOpen(true);
  };

  const editActionMutation = useMutation({
    mutationFn: async (data: { id: string; formData: TaskFormData }) => {
      const taskData = {
        title: data.formData.title,
        emoji: data.formData.icon,
        color: data.formData.color,
        category: data.formData.tag || 'general',
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
        description: data.formData.description || null,
        time_period: data.formData.timePeriod || null,
        duration_minutes: data.formData.durationMinutes || null,
      };

      const { error } = await supabase.from('admin_task_bank').update(taskData).eq('id', data.id);
      if (error) throw error;

      // Replace subtasks
      await supabase.from('admin_task_bank_subtasks').delete().eq('task_id', data.id);
      if (data.formData.subtasks && data.formData.subtasks.length > 0) {
        const subtaskRecords = data.formData.subtasks.map((title, index) => ({
          task_id: data.id,
          title,
          order_index: index,
        }));
        await supabase.from('admin_task_bank_subtasks').insert(subtaskRecords);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
      queryClient.invalidateQueries({ queryKey: ['admin-task-bank-for-picker'] });
      // Update local task list with new data
      if (editActionTaskBankId) {
        supabase.from('admin_task_bank').select('*').eq('id', editActionTaskBankId).single().then(({ data: updated }) => {
          if (updated) {
            const rp = updated.repeat_pattern;
            const isOnce = rp === 'none';
            const isWeekly = rp === 'weekly';
            setLocalTasks(prev => prev.map(t => t.task_id === editActionTaskBankId
              ? {
                  ...t,
                  title: updated.title,
                  emoji: updated.emoji,
                  color: updated.color,
                  is_once: isOnce,
                  schedule_days: isWeekly ? (updated.repeat_days || []) : [],
                  monthly_day: rp === 'monthly' ? 1 : null,
                }
              : t
            ));
          }
        });
      }
      toast.success('Task updated');
      setEditActionSheetOpen(false);
      setEditActionTaskBankId(null);
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const handleEditActionSave = (formData: TaskFormData) => {
    if (!editActionTaskBankId) return;
    editActionMutation.mutate({ id: editActionTaskBankId, formData });
  };

  const removeTask = (taskId: string) => {
    setLocalTasks(localTasks.filter(t => t.id !== taskId));
  };

  const moveTaskUp = (taskId: string, sectionId: string | null) => {
    const sectionTasks = localTasks
      .filter(t => t.section_id === sectionId)
      .sort((a, b) => a.task_order - b.task_order);
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
    const sectionTasks = localTasks
      .filter(t => t.section_id === sectionId)
      .sort((a, b) => a.task_order - b.task_order);
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

  // Drag-and-drop sensors and handler
  const dndSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleTaskDragEnd = (event: DragEndEvent, taskList: LocalTask[], sectionId: string | null) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = taskList.findIndex(t => t.id === active.id);
    const newIndex = taskList.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(taskList, oldIndex, newIndex);
    setLocalTasks(prev => {
      const otherTasks = prev.filter(t => !taskList.some(tl => tl.id === t.id));
      const updated = reordered.map((t, i) => ({ ...t, task_order: i + 1 }));
      return [...otherTasks, ...updated];
    });
  };

  const getCategoryInfo = (cat: string) => {
    const found = routineCategories.find(c => c.slug === cat);
    return found ? { value: found.slug, label: found.name, icon: found.icon || '📋' } : { value: cat, label: cat, icon: '📋' };
  };

  const totalTaskCount = localTasks.length;

  const filteredRoutines = selectedCategory === 'all' 
    ? routines 
    : selectedCategory === 'popular'
    ? routines.filter(r => r.is_popular)
    : selectedCategory === 'featured'
    ? routines.filter(r => r.is_featured)
    : selectedCategory === 'challenges'
    ? routines.filter(r => r.schedule_type === 'challenge')
    : selectedCategory === 'projects'
    ? routines.filter(r => r.schedule_type === 'project')
    : selectedCategory === 'programs'
    ? routines.filter(r => r.schedule_type === 'program')
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

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderTaskScheduleConfig = (task: LocalTask) => {
    if (formData.schedule_type === 'challenge') {
      return (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">Day</span>
          <Input
            type="number"
            min={1}
            value={task.drip_day ?? ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value) : null;
              setLocalTasks(localTasks.map(t => t.id === task.id ? { ...t, drip_day: val } : t));
            }}
            className="w-12 h-6 text-xs text-center p-0"
          />
        </div>
      );
    }
    if (formData.schedule_type === 'project') {
      return (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">Step</span>
          <Input
            type="number"
            min={1}
            value={task.drip_day ?? ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value) : null;
              setLocalTasks(localTasks.map(t => t.id === task.id ? { ...t, drip_day: val } : t));
            }}
            className="w-12 h-6 text-xs text-center p-0"
          />
        </div>
      );
    }
    // Normal mode: show Daily / Weekly / Monthly / Once selector
    const days = task.schedule_days || [];
    const isWeekly = days.length > 0;
    const isMonthly = task.monthly_day != null;
    const isOnce = task.is_once === true;
    const currentMode = isOnce ? 'once' : isMonthly ? 'monthly' : isWeekly ? 'weekly' : 'daily';

    const cycleMode = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (currentMode === 'daily') {
        // → Weekly (use sentinel [-1] meaning "weekly, day set when user adds routine")
        setLocalTasks(localTasks.map(t => t.id === task.id ? { ...t, schedule_days: [-1], monthly_day: null, is_once: false } : t));
      } else if (currentMode === 'weekly') {
        // → Monthly
        setLocalTasks(localTasks.map(t => t.id === task.id ? { ...t, schedule_days: [], monthly_day: 1, is_once: false } : t));
      } else if (currentMode === 'monthly') {
        // → Once
        setLocalTasks(localTasks.map(t => t.id === task.id ? { ...t, schedule_days: [], monthly_day: null, is_once: true } : t));
      } else {
        // → Daily
        setLocalTasks(localTasks.map(t => t.id === task.id ? { ...t, schedule_days: [], monthly_day: null, is_once: false } : t));
      }
    };

    return (
      <div className="flex items-center gap-1">
        {isOnce ? (
          <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">Once</span>
        ) : isMonthly ? (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Day</span>
            <Input
              type="number"
              min={1}
              max={31}
              value={task.monthly_day || 1}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const val = Math.min(31, Math.max(1, parseInt(e.target.value) || 1));
                setLocalTasks(localTasks.map(t => t.id === task.id ? { ...t, monthly_day: val } : t));
              }}
              className="w-12 h-6 text-xs text-center p-0"
            />
          </div>
        ) : isWeekly ? (
          <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">Weekly</span>
        ) : (
          <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">Daily</span>
        )}
        <button
          type="button"
          onClick={cycleMode}
          className="text-[9px] text-muted-foreground hover:text-foreground underline"
        >
          {currentMode === 'daily' ? '→ Weekly' : currentMode === 'weekly' ? '→ Monthly' : currentMode === 'monthly' ? '→ Once' : '→ Daily'}
        </button>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Routines Bank
          </CardTitle>
          <CardDescription>
            Create and manage routine templates with rich sections
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {routines.some(r => r.cover_image_url && !r.cover_image_url.endsWith('.webp')) && (
            <Button variant="outline" onClick={async () => {
              const items = routines
                .filter(r => r.cover_image_url && !r.cover_image_url.endsWith('.webp'))
                .map(r => ({ id: r.id, coverUrl: r.cover_image_url! }));
              setIsOptimizingCovers(true);
              const { done, failed } = await optimizeCoversForTable(items, 'routines_bank', 'cover_image_url');
              setIsOptimizingCovers(false);
              toast.success(`Optimized ${done} covers${failed ? `, ${failed} failed` : ''}`);
              queryClient.invalidateQueries({ queryKey: ['routines-bank'] });
            }} disabled={isOptimizingCovers}>
              {isOptimizingCovers ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Optimize Covers
            </Button>
          )}
          <Button onClick={openNewDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            New Routine
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 mb-4">
          {[
            { value: 'all', label: 'All', icon: <Layers className="h-3 w-3" /> },
            { value: 'popular', label: 'Popular', icon: <Star className="h-3 w-3" /> },
            { value: 'featured', label: 'Featured', icon: <Flame className="h-3 w-3" /> },
            { value: 'challenges', label: '🔥 Challenges', icon: null },
            { value: 'projects', label: '🎯 Projects', icon: null },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setSelectedCategory(item.value)}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                selectedCategory === item.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          {routineCategories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                selectedCategory === cat.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <TaskIcon iconName={cat.icon || '📋'} size={14} />
              {cat.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredRoutines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No routines yet. Click "New Routine" to create one.
          </div>
        ) : (
          <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleRoutineDragEnd}>
            <SortableContext items={filteredRoutines.map(r => r.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {filteredRoutines.map((routine) => {
                  const catInfo = getCategoryInfo(routine.category);
                  const stats = taskCounts[routine.id] || { count: 0, duration: 0 };
                  return (
                    <SortableRoutineRow key={routine.id} id={routine.id}>
                      {(dragHandleProps) => (
                        <div
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow group',
                            !routine.is_active && 'opacity-50'
                          )}
                          style={{ backgroundColor: COLOR_OPTIONS.find(c => c.name === routine.color)?.hex + '40' }}
                          onClick={() => openEditDialog(routine)}
                        >
                          <div
                            {...dragHandleProps}
                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
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
                              <span>{stats.count} task{stats.count !== 1 ? 's' : ''}</span>
                              {routine.schedule_type !== 'daily' && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    {routine.schedule_type === 'weekly' ? <Calendar className="h-3 w-3" /> : routine.schedule_type === 'project' ? '🎯' : routine.schedule_type === 'program' ? '🎓' : <Flame className="h-3 w-3" />}
                                    {routine.schedule_type === 'weekly' ? 'Weekly' : routine.schedule_type === 'project' ? 'Project' : routine.schedule_type === 'program' ? 'Program' : 'Drip'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {selectedCategory === 'featured' && (
                            <input
                              type="number"
                              value={routine.sort_order}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                updateSortOrder.mutate({ id: routine.id, sort_order: val });
                              }}
                              className="w-14 h-8 text-center text-xs border rounded bg-background"
                              title="Sort order (lower = first)"
                            />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFree.mutate({ id: routine.id, is_free: !routine.is_free });
                            }}
                            className={cn(
                              "p-2 transition-all",
                              routine.is_free ? "text-green-500" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                            )}
                            title={routine.is_free ? "Remove free access" : "Mark as free"}
                          >
                            <span className={cn("text-xs font-bold", routine.is_free && "text-green-500")}>FREE</span>
                          </button>
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
                              toggleFeatured.mutate({ id: routine.id, is_featured: !routine.is_featured });
                            }}
                            className={cn(
                              "p-2 transition-all",
                              routine.is_featured ? "text-emerald-500" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                            )}
                            title={routine.is_featured ? "Remove from featured (home)" : "Feature on home"}
                          >
                            <Flame className={cn("h-4 w-4", routine.is_featured && "fill-emerald-500")} />
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
                      )}
                    </SortableRoutineRow>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRoutine ? 'Edit Routine' : 'New Routine'}</DialogTitle>
            <DialogDescription>
              {editingRoutine ? 'Update routine details and sections' : 'Create a new routine template'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as 'basic' | 'sections')} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-fit">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="sections">
                Sections & Actions
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

                  {/* Cover Aspect */}
                  <div className="space-y-2">
                    <Label>Cover Aspect Ratio</Label>
                    <Select
                      value={(formData as any).cover_aspect || 'square'}
                      onValueChange={(val) => setFormData({ ...formData, cover_aspect: val } as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square (1:1) — shows title header</SelectItem>
                        <SelectItem value="6x4">Tall (6:4) — cover only, no title</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cover Image */}
                  <ImageUploader
                    label="Cover Image"
                    value={formData.cover_image_url}
                    onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                    folder="routine-covers"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCover}
                    disabled={isGeneratingCover}
                    className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors mt-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGeneratingCover ? 'Generating...' : 'Generate with AI'}
                  </button>

                  {/* Video URL */}

                  {/* Video URL */}
                  <div className="space-y-2">
                    <Label htmlFor="video_url">Video URL (YouTube, Vimeo, or MP4)</Label>
                    <Input
                      id="video_url"
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <MediaLibraryPicker
                        kind="video"
                        triggerLabel="Pick from video library"
                        onPick={(item) => setFormData({ ...formData, video_url: item.file_url })}
                      />
                      {formData.video_url && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, video_url: '' })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    {formData.video_url && (
                      <p className="text-xs text-muted-foreground">Video will appear below the cover image on the routine page.</p>
                    )}
                  </div>

                  {/* Audio URL */}
                  <div className="space-y-2">
                    <Label htmlFor="audio_url">Intro Audio URL (MP3)</Label>
                    <Input
                      id="audio_url"
                      value={formData.audio_url}
                      onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                      placeholder="https://example.com/intro.mp3"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <MediaLibraryPicker
                        kind="audio"
                        triggerLabel="Pick from audio library"
                        onPick={(item) => setFormData({ ...formData, audio_url: item.file_url })}
                      />
                      {formData.audio_url && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, audio_url: '' })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    {formData.audio_url && (
                      <p className="text-xs text-muted-foreground">Plays as an intro on the routine page so users can learn about it.</p>
                    )}
                  </div>

                  {/* Hosts */}
                  <div className="space-y-2">
                    <HostPicker
                      value={hosts}
                      onChange={setHosts}
                      hint="Who presents this routine? Shown to users on the routine page."
                    />
                  </div>

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
                    <RichTextEditor
                      value={formData.description}
                      onChange={(value) => setFormData({ ...formData, description: value })}
                      placeholder="Write your routine description..."
                    />
                  </div>

                  {/* Schedule Type */}
                  <div className="space-y-2 border-t pt-4">
                    <Label>Routine Type</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 'daily', label: 'Normal', desc: 'Tasks with their own repeat settings', icon: '☀️' },
                        { value: 'challenge', label: 'Drip', desc: 'Sequential drip (Day 1, 2...)', icon: '💧' },
                        { value: 'project', label: 'Project', desc: 'Ordered steps toward a goal', icon: '🎯' },
                        { value: 'program', label: 'Program', desc: 'Auto-enroll in a program', icon: '🎓' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const updates: any = { schedule_type: opt.value as any };
                            if (opt.value === 'project' || opt.value === 'program') {
                              updates.end_mode = 'never';
                              updates.start_mode = 'none';
                            }
                            if (opt.value !== 'program') {
                              updates.linked_program_slug = null;
                            }
                            setFormData(prev => ({ ...prev, ...updates }));
                          }}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-center transition-all",
                            formData.schedule_type === opt.value 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <span className="text-lg">{opt.icon}</span>
                          <span className="text-xs font-medium">{opt.label}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Program Selector (only for program type) */}
                    {formData.schedule_type === 'program' && (
                      <div className="mt-3 space-y-2 border rounded-lg p-3 bg-muted/30">
                        <Label className="text-xs flex items-center gap-1.5">🎓 Linked Program</Label>
                        <Select
                          value={formData.linked_program_slug || ''}
                          onValueChange={(val) => setFormData({ ...formData, linked_program_slug: val || null })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a program..." />
                          </SelectTrigger>
                          <SelectContent>
                            {programCatalog.map(p => (
                              <SelectItem key={p.slug} value={p.slug}>
                                {p.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">Users will be auto-enrolled in this program (and its active round) when they add this routine.</p>
                      </div>
                    )}

                    {/* Start Mode Selector */}
                    {formData.schedule_type !== 'program' && (
                      <div className="mt-3 space-y-2">
                        <Label className="text-xs">When does it start?</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'none', label: 'Immediately', desc: 'Starts today' },
                            { value: 'date', label: 'Specific date', desc: 'Pick a date' },
                            { value: 'weekday', label: 'Day of week', desc: 'e.g. Next Monday' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, start_mode: opt.value as any })}
                              className={cn(
                                "flex flex-col items-center gap-0.5 p-2 rounded-lg border-2 text-center transition-all",
                                formData.start_mode === opt.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-muted-foreground/30"
                              )}
                            >
                              <span className="text-xs font-medium">{opt.label}</span>
                              <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
                            </button>
                          ))}
                        </div>

                        {/* Date picker */}
                        {formData.start_mode === 'date' && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !formData.challenge_start_date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.challenge_start_date
                                  ? format(formData.challenge_start_date, 'PPP')
                                  : <span>Pick a start date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={formData.challenge_start_date || undefined}
                                onSelect={(date) => setFormData({ ...formData, challenge_start_date: date || null })}
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                        )}

                        {/* Weekday picker */}
                        {formData.start_mode === 'weekday' && (
                          <div className="flex gap-1.5 justify-center">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => setFormData({ ...formData, start_day_of_week: idx })}
                                className={cn(
                                  "w-9 h-9 rounded-full text-xs font-medium transition-all",
                                  formData.start_day_of_week === idx
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* End Mode Selector */}
                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-xs">When does it end?</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'never', label: 'Never', desc: 'Runs forever' },
                        { value: 'date', label: 'Specific date', desc: 'Pick an end date' },
                        { value: 'after_days', label: 'After X days', desc: 'Auto-expire' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, end_mode: opt.value as any })}
                          className={cn(
                            "flex flex-col items-center gap-0.5 p-2 rounded-lg border-2 text-center transition-all",
                            formData.end_mode === opt.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <span className="text-xs font-medium">{opt.label}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* End date picker */}
                    {formData.end_mode === 'date' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.end_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.end_date
                              ? format(formData.end_date, 'PPP')
                              : <span>Pick an end date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={formData.end_date || undefined}
                            onSelect={(date) => setFormData({ ...formData, end_date: date || null })}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    )}

                    {/* After X days input */}
                    {formData.end_mode === 'after_days' && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={formData.end_after_days ?? ''}
                          onChange={(e) => setFormData({ ...formData, end_after_days: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="Number of days"
                          className="w-full"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">days</span>
                      </div>
                    )}
                  </div>

                  {/* Challenge Badge (only for challenge type) */}
                  {formData.schedule_type === 'challenge' && (
                    <div className="space-y-2 border-t pt-4">
                      <Label className="text-xs flex items-center gap-1.5">
                        🏆 Completion Badge
                        <span className="text-muted-foreground font-normal">(awarded when challenge is finished)</span>
                      </Label>
                      <ImageUploader
                        label="Badge Image (square)"
                        value={formData.badge_image_url}
                        onChange={(url) => setFormData({ ...formData, badge_image_url: url })}
                        folder="challenge-badges"
                      />
                      {formData.badge_image_url && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <img
                            src={formData.badge_image_url}
                            alt="Badge preview"
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="text-xs text-muted-foreground">
                            Users will earn this badge when they complete all {formData.end_after_days || '?'} days
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Focus Routine Toggle */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <Label className="text-xs font-medium">🎯 Focus Routine</Label>
                      <p className="text-xs text-muted-foreground">Tasks have timer goals based on duration</p>
                    </div>
                    <Switch
                      checked={formData.is_focus}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_focus: checked })}
                    />
                  </div>

                  {/* Reset Routine Toggle */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <Label className="text-xs font-medium">🫧 Reset Routine</Label>
                      <p className="text-xs text-muted-foreground">User can play once without adding to planner</p>
                    </div>
                    <Switch
                      checked={formData.is_moment}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_moment: checked })}
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
                      {localTasks.length} task{localTasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
            </TabsContent>

            <TabsContent value="sections" className="flex-1 min-h-0 overflow-auto mt-0" style={{ maxHeight: 'calc(85vh - 240px)' }}>
              <div className="space-y-4 py-2 pr-4">
                {/* Bulk sync unlinked tasks to task bank */}
                {(() => {
                  const unlinked = localTasks.filter(t => !t.task_id);
                  if (unlinked.length === 0) return null;
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={async () => {
                        let synced = 0;
                        for (const task of unlinked) {
                          const scheduleDays = task.schedule_days || [];
                          const repeatPattern = task.is_once ? 'none' : scheduleDays.length === 7 ? 'daily' : scheduleDays.length > 0 ? 'weekly' : 'daily';
                          const hasDuration = task.duration_minutes && task.duration_minutes > 0;
                          const { data: inserted, error } = await supabase
                            .from('admin_task_bank')
                            .insert({
                              title: task.title,
                              emoji: task.emoji || '📝',
                              category: formData.category || 'general',
                              color: task.color || formData.color || 'sky',
                              repeat_pattern: repeatPattern,
                              repeat_days: scheduleDays.length > 0 && scheduleDays.length < 7 ? scheduleDays : null,
                              duration_minutes: task.duration_minutes || null,
                              goal_enabled: hasDuration ? true : false,
                              goal_type: hasDuration ? 'timer' : null,
                              goal_target: hasDuration ? task.duration_minutes * 60 : null,
                              is_active: true,
                              is_popular: false,
                              sort_order: 0,
                            })
                            .select('id')
                            .single();
                          if (!error && inserted) {
                            // Link the routine task to the new bank entry
                            if (editingRoutine) {
                              await supabase
                                .from('routines_bank_tasks')
                                .update({ task_id: inserted.id })
                                .eq('id', task.id);
                            }
                            setLocalTasks(prev => prev.map(t => t.id === task.id ? { ...t, task_id: inserted.id } : t));
                            synced++;
                          }
                        }
                        queryClient.invalidateQueries({ queryKey: ['admin-task-bank'] });
                        toast.success(`Synced ${synced} task${synced !== 1 ? 's' : ''} to Task Bank`);
                      }}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Sync {unlinked.length} unlinked task{unlinked.length !== 1 ? 's' : ''} to Task Bank
                    </Button>
                  );
                })()}
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
                            <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={(e) => handleTaskDragEnd(e, sectionTasks, section.id)}>
                              <SortableContext items={sectionTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                {sectionTasks.map((task, tIdx) => (
                                  <SortableTaskRowItem key={task.id} id={task.id}>
                                    {(dragHandleProps) => (
                                      <div className="rounded bg-background border">
                                        <div className="flex items-center gap-2 p-2">
                                          <button type="button" {...dragHandleProps} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground p-0.5">
                                            <GripVertical className="h-4 w-4" />
                                          </button>
                                          <TaskIcon iconName={task.emoji} size={16} />
                                          <span className="flex-1 text-sm truncate">{task.title}</span>
                                          {renderTaskScheduleConfig(task)}
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
                                              <SelectItem value="_uncategorized" className="text-xs">Uncategorized</SelectItem>
                                              {localSections.filter(s => s.id !== section.id).map((s) => (
                                                <SelectItem key={s.id} value={s.id} className="text-xs">{s.title}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <button type="button" onClick={() => removeTask(task.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </SortableTaskRowItem>
                                ))}
                              </SortableContext>
                            </DndContext>
                          )}
                          
                          {/* Add task to section */}
                          {addingTaskToSection === section.id ? (
                            <div className="border rounded p-2 space-y-2 bg-muted/30">
                              <div className="relative">
                                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search actions..."
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

                  {/* Tasks grouped by schedule */}
                  {(() => {
                     const dailyTasks = uncategorizedTasks.filter(t => (!t.schedule_days || t.schedule_days.length === 0) && t.monthly_day == null && !t.is_once);
                     const weeklyTasks = uncategorizedTasks.filter(t => t.schedule_days && t.schedule_days.length > 0 && !t.is_once);
                     const monthlyTasks = uncategorizedTasks.filter(t => t.monthly_day != null && !t.is_once);
                     const onceTasks = uncategorizedTasks.filter(t => t.is_once === true);
                     const showGroups = formData.schedule_type !== 'challenge' && (dailyTasks.length > 0 || weeklyTasks.length > 0 || monthlyTasks.length > 0 || onceTasks.length > 0 || localSections.length === 0);

                    if (!showGroups && uncategorizedTasks.length === 0 && localSections.length > 0) return null;

                    const getTaskColor = (task: LocalTask): string => {
                      if (task.color) return task.color;
                      if (task.task_id) {
                        const bankItem = taskBank.find(b => b.id === task.task_id);
                        if (bankItem?.color) return bankItem.color;
                      }
                      return 'sky';
                    };

                    const colorHexMap: Record<string, string> = {
                      pink: '#FFD6E8', peach: '#FFE4C4', yellow: '#FFF59D', lime: '#E8F5A3',
                      sky: '#C5E8FA', mint: '#B8F5E4', lavender: '#E8D4F8', purple: '#E8D4F8',
                      blue: '#C5E8FA', red: '#FFD6E8', orange: '#FFE4C4', green: '#E8F5A3',
                    };

                    const renderTaskRow = (task: LocalTask, tIdx: number, listLength: number, sectionId: string | null) => {
                      const taskColor = getTaskColor(task);
                      const colorHex = colorHexMap[taskColor] || '#C5E8FA';
                      return (
                      <SortableTaskRowItem key={task.id} id={task.id}>
                        {(dragHandleProps) => (
                        <div className="rounded border overflow-hidden" style={{ backgroundColor: `${colorHex}30` }}>
                          <div className="flex items-center gap-2 p-2">
                            <button type="button" {...dragHandleProps} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground p-0.5">
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colorHex }} />
                            <TaskIcon iconName={task.emoji} size={16} />
                            <span className="flex-1 text-sm truncate">{task.title}</span>
                            {renderTaskScheduleConfig(task)}
                            {localSections.length > 0 && (
                              <Select value="" onValueChange={(sid) => { setLocalTasks(localTasks.map(t => t.id === task.id ? { ...t, section_id: sid } : t)); }}>
                                <SelectTrigger className="w-[100px] h-7 text-xs"><span className="text-muted-foreground">Move to...</span></SelectTrigger>
                                <SelectContent>
                                  {localSections.map((s) => (
                                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.title}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {task.task_id && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openEditActionSheet(task.task_id!); }}
                                className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-accent"
                                title="Edit task"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            )}
                            <button type="button" onClick={() => removeTask(task.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        )}
                      </SortableTaskRowItem>
                    );};

                    const renderSortableList = (tasks: LocalTask[], sectionId: string | null) => (
                      <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={(e) => handleTaskDragEnd(e, tasks, sectionId)}>
                        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                          {tasks.map((task, tIdx) => renderTaskRow(task, tIdx, tasks.length, sectionId))}
                        </SortableContext>
                      </DndContext>
                    );
                    // For challenge/project mode, show flat list
                    if (formData.schedule_type === 'challenge' || formData.schedule_type === 'project') {
                      const modeLabel = formData.schedule_type === 'project' ? 'Steps' : 'Tasks';
                      return (uncategorizedTasks.length > 0 || localSections.length === 0) && (
                        <div className="border rounded-lg overflow-hidden border-dashed">
                          <div className="flex items-center gap-2 p-3 bg-muted/30 border-b border-dashed">
                            <h4 className="font-medium text-sm text-muted-foreground flex-1">
                              {localSections.length === 0 ? modeLabel : `Uncategorized ${modeLabel}`}
                            </h4>
                            <span className="text-xs text-muted-foreground">{uncategorizedTasks.length} {modeLabel.toLowerCase()}</span>
                          </div>
                          <div className="p-2 space-y-1">
                            {renderSortableList(uncategorizedTasks, null)}
                            {addingTaskToSection === 'uncategorized' ? (
                              <div className="border rounded p-2 space-y-2 bg-muted/30">
                                <div className="relative">
                                  <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="Search actions..." value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} className="pl-8 h-8 text-sm" autoFocus />
                                </div>
                                <ScrollArea className="h-32">
                                  <div className="space-y-1">
                                    {filteredTaskBank.map((task) => (
                                      <button key={task.id} type="button" onClick={() => addTaskToSection(task, null)} className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-accent text-left text-xs">
                                        <TaskIcon iconName={task.emoji} size={14} />
                                        <span className="flex-1 truncate">{task.title}</span>
                                      </button>
                                    ))}
                                  </div>
                                </ScrollArea>
                                <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingTaskToSection(null); setTaskSearch(''); }} className="w-full h-7">Cancel</Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setAddingTaskToSection('uncategorized')} className="flex-1 h-7 text-xs gap-1">
                                   <Plus className="h-3 w-3" /> Add Step
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => openCreateActionSheet(null)} className="h-7 text-xs gap-1">
                                  <Sparkles className="h-3 w-3" /> Create New
                                </Button>
                              </div>
                            )}
                          </div>
                         </div>
                       );
                    }

                    // Normal mode: group by Daily / Weekly / Monthly
                    return (
                      <div className="space-y-3">
                        {/* Daily Tasks */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border-b">
                            <span className="text-sm">☀️</span>
                            <h4 className="font-medium text-sm flex-1">Daily tasks</h4>
                            <span className="text-xs text-muted-foreground">{dailyTasks.length}</span>
                          </div>
                          <div className="p-2 space-y-1">
                            {dailyTasks.length === 0 && (
                              <p className="text-center text-muted-foreground text-xs py-2">No daily tasks</p>
                            )}
                            {renderSortableList(dailyTasks, null)}
                          </div>
                        </div>

                        {/* Weekly Tasks */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border-b">
                            <span className="text-sm">📅</span>
                            <h4 className="font-medium text-sm flex-1">Weekly actions</h4>
                            <span className="text-xs text-muted-foreground">{weeklyTasks.length}</span>
                          </div>
                          <div className="p-2 space-y-1">
                            {weeklyTasks.length === 0 && (
                              <p className="text-center text-muted-foreground text-xs py-2">No weekly actions</p>
                            )}
                            {renderSortableList(weeklyTasks, null)}
                          </div>
                        </div>

                        {/* Monthly Tasks */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border-b">
                            <span className="text-sm">📆</span>
                            <h4 className="font-medium text-sm flex-1">Monthly actions</h4>
                            <span className="text-xs text-muted-foreground">{monthlyTasks.length}</span>
                          </div>
                          <div className="p-2 space-y-1">
                            {monthlyTasks.length === 0 && (
                              <p className="text-center text-muted-foreground text-xs py-2">No monthly actions</p>
                            )}
                            {renderSortableList(monthlyTasks, null)}
                          </div>
                        </div>

                        {/* Once Tasks */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 border-b">
                            <span className="text-sm">1️⃣</span>
                            <h4 className="font-medium text-sm flex-1">One-time actions</h4>
                            <span className="text-xs text-muted-foreground">{onceTasks.length}</span>
                          </div>
                          <div className="p-2 space-y-1">
                            {onceTasks.length === 0 && (
                              <p className="text-center text-muted-foreground text-xs py-2">No one-time actions</p>
                            )}
                            {renderSortableList(onceTasks, null)}
                          </div>
                        </div>

                        {/* Add task button */}
                        {addingTaskToSection === 'uncategorized' ? (
                          <div className="border rounded p-2 space-y-2 bg-muted/30">
                            <div className="relative">
                              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Search actions..." value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} className="pl-8 h-8 text-sm" autoFocus />
                            </div>
                            <ScrollArea className="h-32">
                              <div className="space-y-1">
                                {filteredTaskBank.map((task) => (
                                  <button key={task.id} type="button" onClick={() => addTaskToSection(task, null)} className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-accent text-left text-xs">
                                    <TaskIcon iconName={task.emoji} size={14} />
                                    <span className="flex-1 truncate">{task.title}</span>
                                  </button>
                                ))}
                              </div>
                            </ScrollArea>
                            <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingTaskToSection(null); setTaskSearch(''); }} className="w-full h-7">Cancel</Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setAddingTaskToSection('uncategorized')} className="flex-1 h-7 text-xs gap-1">
                              <Plus className="h-3 w-3" /> Add Task
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => openCreateActionSheet(null)} className="h-7 text-xs gap-1">
                              <Sparkles className="h-3 w-3" /> Create New
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={createRoutine.isPending || updateRoutine.isPending}>
              {editingRoutine ? 'Save Changes' : 'Create Routine'}
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
              Add descriptive content to introduce this part of the routine
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

      {/* Create Action Sheet */}
      <AppTaskCreate
        isSheet={true}
        sheetOpen={createActionSheetOpen}
        onSheetOpenChange={setCreateActionSheetOpen}
        initialData={{
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
          tag: null,
          subtasks: [],
          proLinkType: null,
          proLinkValue: null,
          goalEnabled: false,
          goalType: 'count',
          goalTarget: 2,
          goalUnit: 'times',
        }}
        onSaveSheet={handleCreateActionSave}
      />

      {/* Edit Action Sheet */}
      {editActionInitialData && (
        <AppTaskCreate
          isSheet={true}
          sheetOpen={editActionSheetOpen}
          onSheetOpenChange={setEditActionSheetOpen}
          initialData={editActionInitialData}
          onSaveSheet={handleEditActionSave}
        />
      )}
    </Card>
  );
}
