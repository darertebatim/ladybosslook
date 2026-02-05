import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Trash2, Plus, ExternalLink, Sparkles, Loader2, Pencil, Users } from 'lucide-react';
import { format } from 'date-fns';
import { PromoAudienceSelector, TargetType } from './PromoAudienceSelector';

type DestinationType = 'routine' | 'playlist' | 'journal' | 'programs' | 'breathe' | 'water' | 'channels' | 'home' | 'inspire' | 'custom_url' | 'tasks' | 'routines_hub' | 'tasks_bank' | 'breathe_exercise' | 'external_url' | 'emotion' | 'period' | 'chat' | 'profile' | 'planner';
type DisplayFrequency = 'once' | 'daily' | 'weekly';
type AspectRatio = '3:1' | '16:9' | '1:1';

interface PromoBanner {
  id: string;
  cover_image_url: string;
  destination_type: DestinationType;
  destination_id: string | null;
  custom_url: string | null;
  display_frequency: DisplayFrequency;
  aspect_ratio: AspectRatio;
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  target_type: TargetType;
  include_programs: string[];
  exclude_programs: string[];
  include_playlists: string[];
  exclude_playlists: string[];
  include_tools: string[];
  exclude_tools: string[];
}

export function PromoBannerManager() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Form state
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [destinationType, setDestinationType] = useState<DestinationType>('routine');
  const [destinationId, setDestinationId] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [displayFrequency, setDisplayFrequency] = useState<DisplayFrequency>('once');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);
  
  // AI generation state
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:1');
  
  // Audience targeting state
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [includePrograms, setIncludePrograms] = useState<string[]>([]);
  const [excludePrograms, setExcludePrograms] = useState<string[]>([]);
  const [includePlaylists, setIncludePlaylists] = useState<string[]>([]);
  const [excludePlaylists, setExcludePlaylists] = useState<string[]>([]);
  const [includeTools, setIncludeTools] = useState<string[]>([]);
  const [excludeTools, setExcludeTools] = useState<string[]>([]);

  // Fetch banners
  const { data: banners, isLoading } = useQuery({
    queryKey: ['promo-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PromoBanner[];
    },
  });

  // Fetch routines for destination selector
  const { data: routines } = useQuery({
    queryKey: ['routine-plans-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plans')
        .select('id, title')
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Fetch playlists for destination selector
  const { data: playlists } = useQuery({
    queryKey: ['playlists-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name')
        .eq('is_hidden', false)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch task templates for destination selector
  const { data: taskTemplates } = useQuery({
    queryKey: ['task-templates-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_task_bank')
        .select('id, title, emoji')
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Fetch routines bank for destination selector
  const { data: routinesBank } = useQuery({
    queryKey: ['routines-bank-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines_bank')
        .select('id, title, emoji')
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Fetch breathing exercises for destination selector
  const { data: breathingExercises } = useQuery({
    queryKey: ['breathing-exercises-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breathing_exercises')
        .select('id, name, emoji')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Upload image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('promo-banners')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('promo-banners')
        .getPublicUrl(fileName);

      setCoverImageUrl(urlData.publicUrl);
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // AI Generate banner image
  const handleGenerateBanner = async () => {
    if (!bannerTitle.trim()) {
      toast.error('Please enter a title for the banner');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-promo-banner', {
        body: {
          title: bannerTitle.trim(),
          subtitle: bannerSubtitle.trim() || undefined,
          aspectRatio,
        },
      });

      if (error) throw error;
      
      if (data?.imageData) {
        // Upload the base64 image to storage
        const base64Data = data.imageData.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        
        const fileName = `ai-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('promo-banners')
          .upload(fileName, blob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('promo-banners')
          .getPublicUrl(fileName);

        setCoverImageUrl(urlData.publicUrl);
        toast.success('Banner generated successfully!');
      } else {
        throw new Error('No image returned');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error('Failed to generate banner: ' + (error.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  // Create banner mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const needsDestinationId = ['routine', 'playlist', 'tasks', 'routines_hub', 'breathe_exercise'].includes(destinationType);
      const needsCustomUrl = ['custom_url', 'external_url'].includes(destinationType);
      const { error } = await supabase.from('promo_banners').insert({
        cover_image_url: coverImageUrl,
        destination_type: destinationType,
        destination_id: needsDestinationId ? destinationId || null : null,
        custom_url: needsCustomUrl ? customUrl : null,
        display_frequency: displayFrequency,
        aspect_ratio: aspectRatio,
        is_active: isActive,
        priority,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
        target_type: targetType,
        include_programs: includePrograms,
        exclude_programs: excludePrograms,
        include_playlists: includePlaylists,
        exclude_playlists: excludePlaylists,
        include_tools: includeTools,
        exclude_tools: excludeTools,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
      toast.success('Banner created');
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to create banner: ' + error.message);
    },
  });

  // Update banner mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingBanner) return;
      const needsDestinationId = ['routine', 'playlist', 'tasks', 'routines_hub', 'breathe_exercise'].includes(destinationType);
      const needsCustomUrl = ['custom_url', 'external_url'].includes(destinationType);
      const { error } = await supabase.from('promo_banners').update({
        cover_image_url: coverImageUrl,
        destination_type: destinationType,
        destination_id: needsDestinationId ? destinationId || null : null,
        custom_url: needsCustomUrl ? customUrl : null,
        display_frequency: displayFrequency,
        aspect_ratio: aspectRatio,
        is_active: isActive,
        priority,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
      }).eq('id', editingBanner.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
      toast.success('Banner updated');
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to update banner: ' + error.message);
    },
  });

  // Delete banner mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promo_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
      toast.success('Banner deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('promo_banners')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
    },
  });

  const resetForm = () => {
    setIsCreating(false);
    setEditingBanner(null);
    setCoverImageUrl('');
    setDestinationType('routine');
    setDestinationId('');
    setCustomUrl('');
    setDisplayFrequency('once');
    setAspectRatio('3:1');
    setIsActive(true);
    setPriority(0);
    setStartsAt('');
    setEndsAt('');
    setBannerTitle('');
    setBannerSubtitle('');
  };

  const startEditing = (banner: PromoBanner) => {
    setEditingBanner(banner);
    setCoverImageUrl(banner.cover_image_url);
    setDestinationType(banner.destination_type);
    setDestinationId(banner.destination_id || '');
    setCustomUrl(banner.custom_url || '');
    setDisplayFrequency(banner.display_frequency);
    setAspectRatio(banner.aspect_ratio || '3:1');
    setIsActive(banner.is_active);
    setPriority(banner.priority);
    setStartsAt(banner.starts_at ? banner.starts_at.slice(0, 16) : '');
    setEndsAt(banner.ends_at ? banner.ends_at.slice(0, 16) : '');
  };

  const getDestinationLabel = (banner: PromoBanner) => {
    switch (banner.destination_type) {
      case 'routine':
        const routine = routines?.find(r => r.id === banner.destination_id);
        return routine?.title || 'Unknown Routine';
      case 'playlist':
        const playlist = playlists?.find(p => p.id === banner.destination_id);
        return playlist?.name || 'Unknown Playlist';
      case 'tasks':
        const task = taskTemplates?.find(t => t.id === banner.destination_id);
        return task ? `${task.emoji} ${task.title}` : 'Unknown Task';
      case 'routines_hub':
        const routineBank = routinesBank?.find(r => r.id === banner.destination_id);
        return routineBank ? `${routineBank.emoji || '📋'} ${routineBank.title}` : 'Unknown Routine';
      case 'breathe_exercise':
        const exercise = breathingExercises?.find(e => e.id === banner.destination_id);
        return exercise ? `${exercise.emoji || '🫁'} ${exercise.name}` : 'Unknown Exercise';
      case 'tasks_bank':
        return 'Tasks Bank Page';
      case 'journal':
        return 'Journal';
      case 'programs':
        return 'Programs / Store';
      case 'breathe':
        return 'Breathe Page';
      case 'water':
        return 'Water Tracking';
      case 'channels':
        return 'Feed / Channels';
      case 'home':
        return 'Home Page';
      case 'inspire':
        return 'Inspire / Routines';
      case 'emotion':
        return 'Emotion Tracker';
      case 'period':
        return 'Period Tracker';
      case 'chat':
        return 'Chat / Support';
      case 'profile':
        return 'Profile / Settings';
      case 'planner':
        return 'Task Planner';
      case 'custom_url':
        return banner.custom_url || 'Custom URL';
      case 'external_url':
        return banner.custom_url || 'External URL';
      default:
        return 'Unknown';
    }
  };
  
  const getAspectRatioClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9': return 'aspect-video';
      case '1:1': return 'aspect-square';
      default: return 'aspect-[3/1]';
    }
  };
  
  const getAspectRatioDimensions = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9': return '1920×1080';
      case '1:1': return '1080×1080';
      default: return '1200×400';
    }
  };

  const isFormOpen = isCreating || editingBanner !== null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Promo Banners</CardTitle>
          {!isFormOpen && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Banner
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isFormOpen && (
            <div className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold">{editingBanner ? 'Edit Banner' : 'Create New Banner'}</h3>
              
              {/* Aspect Ratio Selection */}
              <div className="space-y-2">
                <Label>Banner Size / Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3:1">3:1 Wide Banner (1200×400)</SelectItem>
                    <SelectItem value="16:9">16:9 Video Banner (1920×1080)</SelectItem>
                    <SelectItem value="1:1">1:1 Square Banner (1080×1080)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* AI Generation Section */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/30 rounded-lg border border-violet-200 dark:border-violet-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  <Label className="text-sm font-medium">Generate with AI</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter a title and optional subtitle to generate a {getAspectRatioDimensions(aspectRatio)} banner image
                </p>
                <div className="grid gap-2">
                  <Input
                    placeholder="Banner Title (e.g., 'New Year Sale')"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    disabled={generating}
                  />
                  <Input
                    placeholder="Subtitle (optional)"
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    disabled={generating}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateBanner}
                    disabled={generating || !bannerTitle.trim()}
                    className="gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Banner
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Or Upload Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading || generating}
                  />
                  {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                </div>
                {coverImageUrl && (
                  <div className="space-y-1">
                    <img
                      src={coverImageUrl}
                      alt="Preview"
                      className={`w-full ${getAspectRatioClass(aspectRatio)} rounded-lg object-cover border max-w-md`}
                    />
                    <p className="text-xs text-muted-foreground">Recommended: {getAspectRatioDimensions(aspectRatio)} pixels ({aspectRatio} ratio)</p>
                  </div>
                )}
              </div>

              {/* Destination Type */}
              <div className="space-y-2">
                <Label>Destination Type</Label>
                <Select value={destinationType} onValueChange={(v) => setDestinationType(v as DestinationType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">🏠 Home</SelectItem>
                    <SelectItem value="inspire">✨ Inspire / Routines Hub</SelectItem>
                    <SelectItem value="routine">📋 Routine Plan (specific)</SelectItem>
                    <SelectItem value="routines_hub">📚 Routine Bank (specific)</SelectItem>
                    <SelectItem value="tasks_bank">📝 Tasks Bank Page</SelectItem>
                    <SelectItem value="tasks">☑️ Task Template (specific)</SelectItem>
                    <SelectItem value="planner">📅 Task Planner</SelectItem>
                    <SelectItem value="playlist">🎧 Playlist (specific)</SelectItem>
                    <SelectItem value="programs">🎓 Programs / Store</SelectItem>
                    <SelectItem value="journal">📔 Journal</SelectItem>
                    <SelectItem value="breathe">🫁 Breathe Page</SelectItem>
                    <SelectItem value="breathe_exercise">💨 Breathing Exercise (specific)</SelectItem>
                    <SelectItem value="water">💧 Water Tracking</SelectItem>
                    <SelectItem value="emotion">😊 Emotion Tracker</SelectItem>
                    <SelectItem value="period">🌸 Period Tracker</SelectItem>
                    <SelectItem value="channels">💬 Feed / Channels</SelectItem>
                    <SelectItem value="chat">🗨️ Chat / Support</SelectItem>
                    <SelectItem value="profile">👤 Profile / Settings</SelectItem>
                    <SelectItem value="custom_url">🔗 Custom URL (in-app)</SelectItem>
                    <SelectItem value="external_url">🌐 External URL (opens browser)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Destination ID - for types that need specific selection */}
              {['routine', 'playlist', 'tasks', 'routines_hub', 'breathe_exercise'].includes(destinationType) && (
                <div className="space-y-2">
                  <Label>
                    {destinationType === 'routine' && 'Select Routine Plan'}
                    {destinationType === 'playlist' && 'Select Playlist'}
                    {destinationType === 'tasks' && 'Select Task Template'}
                    {destinationType === 'routines_hub' && 'Select Routine from Bank'}
                    {destinationType === 'breathe_exercise' && 'Select Breathing Exercise'}
                  </Label>
                  <Select value={destinationId} onValueChange={setDestinationId}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Choose a ${destinationType.replace('_', ' ')}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {destinationType === 'routine' && routines?.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                      ))}
                      {destinationType === 'playlist' && playlists?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                      {destinationType === 'tasks' && taskTemplates?.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.emoji} {t.title}</SelectItem>
                      ))}
                      {destinationType === 'routines_hub' && routinesBank?.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.emoji || '📋'} {r.title}</SelectItem>
                      ))}
                      {destinationType === 'breathe_exercise' && breathingExercises?.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.emoji || '🫁'} {e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom URL */}
              {destinationType === 'custom_url' && (
                <div className="space-y-2">
                  <Label>Custom URL (e.g., /app/inspire)</Label>
                  <Input
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="/app/..."
                  />
                </div>
              )}

              {/* External URL */}
              {destinationType === 'external_url' && (
                <div className="space-y-2">
                  <Label>External URL (opens in browser)</Label>
                  <Input
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://apps.apple.com/..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Full URL including https:// - opens in device browser
                  </p>
                </div>
              )}

              {/* Display Frequency */}
              <div className="space-y-2">
                <Label>Display Frequency</Label>
                <Select value={displayFrequency} onValueChange={(v) => setDisplayFrequency(v as DisplayFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once (never show again after dismiss)</SelectItem>
                    <SelectItem value="daily">Daily (show again after 24 hours)</SelectItem>
                    <SelectItem value="weekly">Weekly (show again after 7 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority (higher = shown first)</Label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Scheduling */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Starts At (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ends At (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Active</Label>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {editingBanner ? (
                  <Button
                    onClick={() => updateMutation.mutate()}
                    disabled={!coverImageUrl || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={!coverImageUrl || createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Banner'}
                  </Button>
                )}
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Banners List */}
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : banners?.length === 0 ? (
            <p className="text-muted-foreground">No promo banners yet</p>
          ) : (
            <div className="space-y-4">
              {banners?.map((banner) => (
                <div
                  key={banner.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <img
                    src={banner.cover_image_url}
                    alt="Banner"
                    className="h-16 w-28 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">
                        {banner.destination_type.replace('_', ' ')}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate">
                        {getDestinationLabel(banner)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {banner.display_frequency} • Priority: {banner.priority}
                      {banner.starts_at && ` • From: ${format(new Date(banner.starts_at), 'MMM d')}`}
                      {banner.ends_at && ` • Until: ${format(new Date(banner.ends_at), 'MMM d')}`}
                    </div>
                  </div>
                  <Switch
                    checked={banner.is_active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: banner.id, is_active: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(banner)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(banner.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
