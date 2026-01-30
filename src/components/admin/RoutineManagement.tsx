import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, Pencil, Trash2, Sparkles, FolderOpen, ListTodo, Star, 
  ChevronDown, ChevronUp, GripVertical, Crown
} from 'lucide-react';
import { EmojiPicker } from '@/components/app/EmojiPicker';
import { PRO_LINK_TYPES, PRO_LINK_CONFIGS, ProLinkType } from '@/lib/proTaskTypes';
import { TASK_COLOR_CLASSES, TaskColor } from '@/hooks/useTaskPlanner';

// =====================================
// TYPES
// =====================================

interface RoutinePlan {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  icon: string;
  color: string;
  category_id: string | null;
  estimated_minutes: number;
  points: number;
  is_featured: boolean;
  is_popular: boolean;
  is_pro_routine: boolean;
  is_active: boolean;
  cover_image_url: string | null;
  display_order: number;
  category?: { id: string; name: string; slug: string } | null;
}

interface RoutinePlanTask {
  id: string;
  plan_id: string;
  title: string;
  duration_minutes: number;
  icon: string;
  task_order: number;
  is_active: boolean;
  pro_link_type: string | null;
  pro_link_value: string | null;
}

interface RoutineCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

interface Playlist {
  id: string;
  name: string;
  category: string | null;
}

interface BreathingExercise {
  id: string;
  name: string;
  emoji: string;
  category: string;
}

// =====================================
// CONSTANTS
// =====================================

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

// Legacy icon name to emoji mapping for old data
const LEGACY_ICON_MAP: Record<string, string> = {
  'Sun': '☀️',
  'Moon': '🌙',
  'Coffee': '☕',
  'Heart': '❤️',
  'Star': '⭐',
  'Music': '🎵',
  'Book': '📖',
  'BookOpen': '📖',
  'Target': '🎯',
  'Users': '👥',
  'Award': '🏆',
  'Sparkles': '✨',
  'Zap': '⚡',
  'Flame': '🔥',
  'Droplet': '💧',
  'Dumbbell': '💪',
  'Brain': '🧠',
  'Smile': '😊',
  'Crown': '👑',
  'Leaf': '🍃',
  'Wind': '🌬️',
  'Calendar': '📅',
  'Clock': '🕐',
  'Check': '✅',
  'CheckCircle': '✅',
  'Play': '▶️',
  'Pause': '⏸️',
  'Home': '🏠',
  'Settings': '⚙️',
  'Bell': '🔔',
  'Mail': '📧',
  'MessageCircle': '💬',
  'Phone': '📱',
  'Camera': '📷',
  'Image': '🖼️',
  'File': '📄',
  'Folder': '📁',
  'Search': '🔍',
  'Plus': '➕',
  'Minus': '➖',
  'X': '❌',
  'AlertCircle': '⚠️',
  'Info': 'ℹ️',
  'HelpCircle': '❓',
  'Gift': '🎁',
  'ShoppingBag': '🛍️',
  'DollarSign': '💵',
  'CreditCard': '💳',
  'Utensils': '🍴',
  'Apple': '🍎',
  'Salad': '🥗',
  'Activity': '📊',
  'TrendingUp': '📈',
  'BarChart': '📊',
  'Compass': '🧭',
  'Map': '🗺️',
  'Navigation': '🧭',
  'Plane': '✈️',
  'Car': '🚗',
  'Bike': '🚴',
  'Run': '🏃',
  'Walk': '🚶',
  'Bed': '🛏️',
  'Bath': '🛁',
  'Shower': '🚿',
  'Glasses': '👓',
  'Eye': '👁️',
  'Ear': '👂',
  'Hand': '✋',
  'ThumbsUp': '👍',
  'ThumbsDown': '👎',
  'Briefcase': '💼',
  'Building': '🏢',
  'Headphones': '🎧',
  'Mic': '🎤',
  'Video': '📹',
  'Film': '🎬',
  'Tv': '📺',
  'Monitor': '🖥️',
  'Laptop': '💻',
  'Keyboard': '⌨️',
  'Mouse': '🖱️',
  'Printer': '🖨️',
  'Wifi': '📶',
  'Bluetooth': '📶',
  'Battery': '🔋',
  'Power': '⚡',
  'Lightbulb': '💡',
  'Umbrella': '☂️',
  'Cloud': '☁️',
  'CloudRain': '🌧️',
  'CloudSnow': '❄️',
  'Thermometer': '🌡️',
  'Scissors': '✂️',
  'Pen': '🖊️',
  'Pencil': '✏️',
  'Paintbrush': '🖌️',
  'Palette': '🎨',
  'Gamepad': '🎮',
  'Puzzle': '🧩',
  'Trophy': '🏆',
  'Medal': '🏅',
  'Flag': '🚩',
  'Bookmark': '🔖',
  'Tag': '🏷️',
  'Lock': '🔒',
  'Unlock': '🔓',
  'Key': '🔑',
  'Shield': '🛡️',
  'Hammer': '🔨',
  'Wrench': '🔧',
  'Tool': '🔧',
  'Anchor': '⚓',
  'Link': '🔗',
  'Paperclip': '📎',
  'Trash': '🗑️',
  'Archive': '📦',
  'Download': '⬇️',
  'Upload': '⬆️',
  'Share': '📤',
  'Send': '📤',
  'Inbox': '📥',
  'Reply': '↩️',
  'Forward': '↪️',
  'Undo': '↩️',
  'Redo': '↪️',
  'Refresh': '🔄',
  'Repeat': '🔁',
  'Shuffle': '🔀',
  'Volume': '🔊',
  'VolumeX': '🔇',
  'Maximize': '⬜',
  'Minimize': '➖',
  'MoreHorizontal': '⋯',
  'MoreVertical': '⋮',
  'Menu': '☰',
  'Grid': '⊞',
  'List': '☰',
  'Layout': '📐',
  'Columns': '📊',
  'Rows': '📊',
  'Table': '📋',
  'Type': '🔤',
  'Bold': '𝐁',
  'Italic': '𝐼',
  'Underline': 'U̲',
  'AlignLeft': '⬅️',
  'AlignCenter': '⬛',
  'AlignRight': '➡️',
  'AlignJustify': '⬛',
  'Code': '💻',
  'Terminal': '💻',
  'Database': '🗄️',
  'Server': '🖥️',
  'Cpu': '🔲',
  'HardDrive': '💾',
  'Save': '💾',
  'Copy': '📋',
  'Paste': '📋',
  'Cut': '✂️',
  'Edit': '✏️',
  'ZoomIn': '🔍',
  'ZoomOut': '🔍',
  'RotateCw': '🔄',
  'RotateCcw': '🔄',
  'Move': '↔️',
  'Crop': '✂️',
  'Filter': '🔍',
  'Sort': '↕️',
  'Sliders': '🎚️',
  'Settings2': '⚙️',
  'Cog': '⚙️',
  'Gear': '⚙️',
  'User': '👤',
  'UserPlus': '👤',
  'UserMinus': '👤',
  'UserCheck': '👤',
  'UserX': '👤',
  'Users2': '👥',
  'Group': '👥',
  'Team': '👥',
};

// Helper to display icons - handles both emojis and legacy Lucide icon names
function DisplayIcon({ icon, className = "text-2xl" }: { icon: string; className?: string }) {
  // Check if it's an emoji (contains emoji characters) or a Lucide icon name
  const isEmoji = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(icon);
  
  if (isEmoji) {
    return <span className={className}>{icon}</span>;
  }
  
  // Try to map legacy icon name to emoji
  const mappedEmoji = LEGACY_ICON_MAP[icon];
  if (mappedEmoji) {
    return <span className={className}>{mappedEmoji}</span>;
  }
  
  // Fallback: show the icon name in a badge-like style
  return (
    <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">
      {icon}
    </span>
  );
}

// =====================================
// MAIN COMPONENT
// =====================================

export function RoutineManagement() {
  const [activeTab, setActiveTab] = useState('plans');

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="plans" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-1">
            <FolderOpen className="h-3 w-3" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="pro-templates" className="flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Pro Templates
          </TabsTrigger>
          <TabsTrigger value="task-templates" className="flex items-center gap-1">
            <ListTodo className="h-3 w-3" />
            Task Templates
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          <PlansManager />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoriesManager />
        </TabsContent>

        <TabsContent value="pro-templates" className="mt-4">
          <ProTemplatesManager />
        </TabsContent>

        <TabsContent value="task-templates" className="mt-4">
          <TaskTemplatesManager />
        </TabsContent>

        <TabsContent value="statistics" className="mt-4">
          <StatisticsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================
// PLANS MANAGER
// =====================================

function PlansManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RoutinePlan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pro' | 'regular'>('all');
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    icon: '✨',
    color: 'yellow',
    category_id: null as string | null,
    estimated_minutes: 15,
    points: 10,
    is_featured: false,
    is_popular: false,
    is_pro_routine: false,
    is_active: true,
    cover_image_url: null as string | null,
    display_order: 0,
  });

  // Queries
  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-routine-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plans')
        .select(`
          *,
          category:routine_categories(id, name, slug)
        `)
        .order('display_order');
      if (error) throw error;
      return data as RoutinePlan[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-routine-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as RoutineCategory[];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('routine_plans').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plans'] });
      toast.success('Plan created');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('routine_plans').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plans'] });
      toast.success('Plan updated');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routine_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plans'] });
      toast.success('Plan deleted');
      setDeleteId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      icon: '✨',
      color: 'yellow',
      category_id: null,
      estimated_minutes: 15,
      points: 10,
      is_featured: false,
      is_popular: false,
      is_pro_routine: false,
      is_active: true,
      cover_image_url: null,
      display_order: (plans?.length || 0) + 1,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (plan: RoutinePlan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      subtitle: plan.subtitle || '',
      description: plan.description || '',
      icon: plan.icon,
      color: plan.color,
      category_id: plan.category_id,
      estimated_minutes: plan.estimated_minutes,
      points: plan.points,
      is_featured: plan.is_featured,
      is_popular: plan.is_popular,
      is_pro_routine: plan.is_pro_routine,
      is_active: plan.is_active,
      cover_image_url: plan.cover_image_url,
      display_order: plan.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
  };

  const handleSubmit = () => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredPlans = plans?.filter(plan => {
    if (filter === 'pro') return plan.is_pro_routine;
    if (filter === 'regular') return !plan.is_pro_routine;
    return true;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Routine Plans
          </CardTitle>
          <CardDescription>Create and manage routine plan templates</CardDescription>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pro">Pro Only</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !filteredPlans?.length ? (
          <div className="text-center py-8 text-muted-foreground">No plans found</div>
        ) : (
          <div className="space-y-2">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="border rounded-lg">
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                >
                  <div className="flex items-center gap-3">
                    <DisplayIcon icon={plan.icon} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.title}</span>
                        {plan.is_pro_routine && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                            <Crown className="h-3 w-3 mr-1" />
                            Pro
                          </Badge>
                        )}
                        {plan.is_featured && <Badge variant="outline">Featured</Badge>}
                        {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.category?.name || 'No category'} • {plan.estimated_minutes} min
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenEdit(plan); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteId(plan.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    {expandedPlanId === plan.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
                {expandedPlanId === plan.id && (
                  <div className="border-t p-3 bg-muted/30">
                    <PlanTasksEditor planId={plan.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create/Edit Plan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Morning Wellness"
              />
            </div>
            <div>
              <Label>Subtitle (optional)</Label>
              <Input
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Start your day right"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon (Emoji)</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start text-2xl h-12"
                  onClick={() => setShowEmojiPicker(true)}
                >
                  {formData.icon}
                </Button>
              </div>
              <div>
                <Label>Color</Label>
                <Select value={formData.color} onValueChange={(v) => setFormData(prev => ({ ...prev, color: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${TASK_COLOR_CLASSES[c.value as TaskColor] || 'bg-gray-200'}`} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
              <Select 
                  value={formData.category_id || 'none'} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v === 'none' ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={formData.estimated_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_minutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pro Routine</Label>
                <Switch
                  checked={formData.is_pro_routine}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_pro_routine: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Featured</Label>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Popular</Label>
                <Switch
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
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
            <div>
              <Label>Cover Image URL (optional)</Label>
              <Input
                value={formData.cover_image_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value || null }))}
                placeholder="https://example.com/cover.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emoji Picker */}
      <EmojiPicker
        open={showEmojiPicker}
        onOpenChange={setShowEmojiPicker}
        selectedEmoji={formData.icon}
        onSelect={(emoji) => setFormData(prev => ({ ...prev, icon: emoji }))}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this plan and all its tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// =====================================
// PLAN TASKS EDITOR
// =====================================

interface ProTaskTemplate {
  id: string;
  title: string;
  duration_minutes: number;
  icon: string;
  pro_link_type: string;
  pro_link_value: string | null;
  linked_playlist_id: string | null;
  is_active: boolean;
}

function PlanTasksEditor({ planId }: { planId: string }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RoutinePlanTask | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    duration_minutes: 5,
    icon: '✨',
    task_order: 0,
    is_active: true,
    pro_link_type: null as string | null,
    pro_link_value: null as string | null,
    linked_playlist_id: null as string | null,
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['admin-routine-plan-tasks', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plan_tasks')
        .select('*')
        .eq('plan_id', planId)
        .order('task_order');
      if (error) throw error;
      return data as RoutinePlanTask[];
    },
  });

  // Fetch Pro Task Templates for quick add
  const { data: proTemplates } = useQuery({
    queryKey: ['admin-pro-task-templates-for-plan'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_task_templates')
        .select('id, title, duration_minutes, icon, pro_link_type, pro_link_value, linked_playlist_id, is_active')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as ProTaskTemplate[];
    },
  });

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

  const { data: breathingExercises } = useQuery({
    queryKey: ['admin-breathing-for-linking'],
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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // If playlist type, also set linked_playlist_id
      const insertData = {
        title: data.title,
        duration_minutes: data.duration_minutes,
        icon: data.icon,
        task_order: data.task_order,
        is_active: data.is_active,
        pro_link_type: data.pro_link_type,
        pro_link_value: data.pro_link_value,
        linked_playlist_id: data.pro_link_type === 'playlist' && data.pro_link_value ? data.pro_link_value : null,
        plan_id: planId,
      };
      const { error } = await supabase.from('routine_plan_tasks').insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plan-tasks', planId] });
      toast.success('Task added');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      // If playlist type, also set linked_playlist_id
      const updateData = {
        title: data.title,
        duration_minutes: data.duration_minutes,
        icon: data.icon,
        task_order: data.task_order,
        is_active: data.is_active,
        pro_link_type: data.pro_link_type,
        pro_link_value: data.pro_link_value,
        linked_playlist_id: data.pro_link_type === 'playlist' && data.pro_link_value ? data.pro_link_value : null,
      };
      const { error } = await supabase.from('routine_plan_tasks').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plan-tasks', planId] });
      toast.success('Task updated');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routine_plan_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-plan-tasks', planId] });
      toast.success('Task deleted');
      setDeleteId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      duration_minutes: 5,
      icon: '✨',
      task_order: (tasks?.length || 0) + 1,
      is_active: true,
      pro_link_type: null,
      pro_link_value: null,
      linked_playlist_id: null,
    });
    setIsDialogOpen(true);
  };

  const handleAddFromTemplate = (template: ProTaskTemplate) => {
    setEditingTask(null);
    setFormData({
      title: template.title,
      duration_minutes: template.duration_minutes,
      icon: template.icon,
      task_order: (tasks?.length || 0) + 1,
      is_active: true,
      pro_link_type: template.pro_link_type,
      pro_link_value: template.pro_link_value,
      linked_playlist_id: template.linked_playlist_id,
    });
    setShowTemplateSelector(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: RoutinePlanTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      duration_minutes: task.duration_minutes,
      icon: task.icon,
      task_order: task.task_order,
      is_active: task.is_active,
      pro_link_type: task.pro_link_type,
      pro_link_value: task.pro_link_value,
      linked_playlist_id: null, // Will be set from pro_link_value if type is playlist
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = () => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const selectedLinkConfig = formData.pro_link_type ? PRO_LINK_CONFIGS[formData.pro_link_type as ProLinkType] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Tasks ({tasks?.length || 0})</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowTemplateSelector(true)}>
            <Sparkles className="h-3 w-3 mr-1" />
            From Template
          </Button>
          <Button size="sm" variant="outline" onClick={handleOpenCreate}>
            <Plus className="h-3 w-3 mr-1" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Template Selector Dialog */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Add from Pro Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {!proTemplates?.length ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No templates available. Create some in Pro Templates tab.
              </div>
            ) : (
              proTemplates.map((template) => {
                const config = template.pro_link_type ? PRO_LINK_CONFIGS[template.pro_link_type as ProLinkType] : null;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleAddFromTemplate(template)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-xl">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{template.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{template.duration_minutes}m</span>
                        {config && (
                          <Badge variant="secondary" className={config.badgeColorClass}>
                            {config.badgeText}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : !tasks?.length ? (
        <div className="text-sm text-muted-foreground">No tasks yet</div>
      ) : (
        <div className="space-y-1">
          {tasks.map((task) => {
            const linkConfig = task.pro_link_type ? PRO_LINK_CONFIGS[task.pro_link_type as ProLinkType] : null;
            return (
              <div key={task.id} className="flex items-center justify-between p-2 bg-background rounded border">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <DisplayIcon icon={task.icon} className="text-lg" />
                  <span className="text-sm">{task.title}</span>
                  <span className="text-xs text-muted-foreground">{task.duration_minutes}m</span>
                  {linkConfig && (
                    <Badge variant="secondary" className={linkConfig.badgeColorClass}>
                      {linkConfig.badgeText}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(task)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(task.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Morning stretch"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon (Emoji)</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start text-2xl h-12"
                  onClick={() => setShowEmojiPicker(true)}
                >
                  {formData.icon}
                </Button>
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <Label>Pro Link Type (optional)</Label>
              <Select 
                value={formData.pro_link_type || 'none'} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, pro_link_type: v === 'none' ? null : v, pro_link_value: null }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (regular task)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {PRO_LINK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value selector based on link type */}
            {selectedLinkConfig?.requiresValue && (
              <div>
                <Label>{selectedLinkConfig.label} Value</Label>
                {formData.pro_link_type === 'playlist' && (
                  <Select 
                    value={formData.pro_link_value || ''} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, pro_link_value: v || null }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      {playlists?.map((pl) => (
                        <SelectItem key={pl.id} value={pl.id}>{pl.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {formData.pro_link_type === 'breathe' && (
                  <Select 
                    value={formData.pro_link_value || ''} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, pro_link_value: v || null }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      {breathingExercises?.map((ex) => (
                        <SelectItem key={ex.id} value={ex.id}>
                          {ex.emoji} {ex.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {(formData.pro_link_type === 'channel' || formData.pro_link_type === 'program' || formData.pro_link_type === 'route') && (
                  <Input
                    value={formData.pro_link_value || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pro_link_value: e.target.value || null }))}
                    placeholder={formData.pro_link_type === 'route' ? '/app/some-page' : 'ID or slug'}
                  />
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingTask ? 'Save' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emoji Picker */}
      <EmojiPicker
        open={showEmojiPicker}
        onOpenChange={setShowEmojiPicker}
        selectedEmoji={formData.icon}
        onSelect={(emoji) => setFormData(prev => ({ ...prev, icon: emoji }))}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =====================================
// CATEGORIES MANAGER
// =====================================

function CategoriesManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RoutineCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '📁',
    color: 'yellow',
    display_order: 0,
    is_active: true,
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-routine-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_categories')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as RoutineCategory[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('routine_categories').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-categories'] });
      toast.success('Category created');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('routine_categories').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-categories'] });
      toast.success('Category updated');
      handleCloseDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routine_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routine-categories'] });
      toast.success('Category deleted');
      setDeleteId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      icon: '📁',
      color: 'yellow',
      display_order: (categories?.length || 0) + 1,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (cat: RoutineCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      color: cat.color,
      display_order: cat.display_order,
      is_active: cat.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required');
      return;
    }
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-500" />
            Categories
          </CardTitle>
          <CardDescription>Organize routines into categories</CardDescription>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !categories?.length ? (
          <div className="text-center py-8 text-muted-foreground">No categories yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell><DisplayIcon icon={cat.icon} /></TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                  <TableCell>
                    <div className={`w-6 h-6 rounded ${TASK_COLOR_CLASSES[cat.color as TaskColor] || 'bg-gray-200'}`} />
                  </TableCell>
                  <TableCell>{cat.display_order}</TableCell>
                  <TableCell>{cat.is_active ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(cat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(cat.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Morning"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="morning"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon (Emoji)</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start text-2xl h-12"
                  onClick={() => setShowEmojiPicker(true)}
                >
                  {formData.icon}
                </Button>
              </div>
              <div>
                <Label>Color</Label>
                <Select value={formData.color} onValueChange={(v) => setFormData(prev => ({ ...prev, color: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${TASK_COLOR_CLASSES[c.value as TaskColor] || 'bg-gray-200'}`} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingCategory ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emoji Picker */}
      <EmojiPicker
        open={showEmojiPicker}
        onOpenChange={setShowEmojiPicker}
        selectedEmoji={formData.icon}
        onSelect={(emoji) => setFormData(prev => ({ ...prev, icon: emoji }))}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Plans in this category will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// =====================================
// PRO TEMPLATES MANAGER (reuses existing)
// =====================================

import { ProTaskTemplatesManager as ExistingProTaskTemplatesManager } from './ProTaskTemplatesManager';

function ProTemplatesManager() {
  return <ExistingProTaskTemplatesManager />;
}

// =====================================
// TASK TEMPLATES MANAGER (reuses existing)
// =====================================

import { TaskTemplatesManager as ExistingTaskTemplatesManager } from './TaskTemplatesManager';

function TaskTemplatesManager() {
  return <ExistingTaskTemplatesManager />;
}

// =====================================
// STATISTICS MANAGER (reuses existing)
// =====================================

import { RoutineStatisticsManager } from './RoutineStatisticsManager';

function StatisticsManager() {
  return <RoutineStatisticsManager />;
}
