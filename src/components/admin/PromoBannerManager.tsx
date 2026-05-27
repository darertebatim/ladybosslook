import { useState } from 'react';
import { dearMeFlow } from '@/data/onboarding-flows/dear-me';
import { mePlusFlow } from '@/data/onboarding-flows/me-plus';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Trash2, Plus, ExternalLink, Sparkles, Loader2, Pencil, Users, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { PromoAudienceSelector, TargetType } from './PromoAudienceSelector';

type DestinationType = 'routine' | 'playlist' | 'journal' | 'programs' | 'breathe' | 'water' | 'channels' | 'home' | 'inspire' | 'custom_url' | 'tasks' | 'routines_hub' | 'tasks_bank' | 'breathe_exercise' | 'external_url' | 'emotion' | 'mood' | 'period' | 'chat' | 'profile' | 'planner' | 'rate' | 'onboarding' | 'watch' | 'video_playlist' | 'routine_player' | 'audio_track' | 'video_track';
type DisplayFrequency = 'once' | 'daily' | 'weekly' | 'forever';
type AspectRatio = '3:1' | '4:1' | '16:9' | '1:1' | 'full';
type DisplayLocation = 'home_top' | 'home_rituals' | 'explore' | 'explore_tools' | 'listen' | 'player' | 'programs' | 'channels' | 'watch' | 'video_player' | 'routines_top' | 'routines_after_categories' | 'routine_player' | 'tasks_bank_top' | 'tasks_bank_after_categories' | 'my_rilo_top' | 'my_rilo_bottom';

const DISPLAY_LOCATION_OPTIONS: { value: DisplayLocation; label: string }[] = [
  { value: 'home_top', label: '🏠 Home - Above Tasks' },
  { value: 'home_rituals', label: '🏠 Home - After Routines' },
  { value: 'explore', label: '🧰 Tools Page - Top' },
  { value: 'explore_tools', label: '🧰 Tools Page - Under Tools' },
  { value: 'listen', label: '🎧 Listen Page' },
  { value: 'player', label: '▶️ Audio Player' },
  { value: 'programs', label: '📚 Programs Page' },
  { value: 'channels', label: '📢 Channels Page' },
  { value: 'watch', label: '📺 Watch Page' },
  { value: 'video_player', label: '🎥 Video Player' },
  { value: 'routines_top', label: '✨ Routines - Top' },
  { value: 'routines_after_categories', label: '✨ Routines - Under Categories' },
  { value: 'routine_player', label: '🎬 Routine Player' },
  { value: 'tasks_bank_top', label: '☑️ Tasks Bank - Top' },
  { value: 'tasks_bank_after_categories', label: '☑️ Tasks Bank - Under Categories' },
  { value: 'my_rilo_top', label: '🧡 My Rilo - Top' },
  { value: 'my_rilo_bottom', label: '🧡 My Rilo - Bottom (after path)' },
];

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
  target_languages: string[];
  target_timezones: string[];
  include_update_status: string[];
  target_instructor_ids: string[];
  display_location: string[];
  target_playlist_ids: string[];
  target_audio_ids: string[];
  target_video_ids: string[];
  display_delay_seconds: number;
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
  
  // Display location state
  const [displayLocations, setDisplayLocations] = useState<DisplayLocation[]>(['home_top']);
  const [targetPlaylistIds, setTargetPlaylistIds] = useState<string[]>([]);
  const [targetAudioIds, setTargetAudioIds] = useState<string[]>([]);
  const [targetVideoIds, setTargetVideoIds] = useState<string[]>([]);
  const [displayDelaySeconds, setDisplayDelaySeconds] = useState(0);

  // Audience targeting state
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [includePrograms, setIncludePrograms] = useState<string[]>([]);
  const [excludePrograms, setExcludePrograms] = useState<string[]>([]);
  const [includePlaylists, setIncludePlaylists] = useState<string[]>([]);
  const [excludePlaylists, setExcludePlaylists] = useState<string[]>([]);
  const [includeTools, setIncludeTools] = useState<string[]>([]);
  const [excludeTools, setExcludeTools] = useState<string[]>([]);
  const [targetLanguages, setTargetLanguages] = useState<string[]>([]);
  const [targetTimezones, setTargetTimezones] = useState<string[]>([]);
  const [includeUpdateStatus, setIncludeUpdateStatus] = useState<string[]>([]);
  const [targetInstructorIds, setTargetInstructorIds] = useState<string[]>([]);
  const [audiencePresetId, setAudiencePresetId] = useState<string | null>(null);

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

  // Fetch audio content for target audio selector
  const { data: audioTracks } = useQuery({
    queryKey: ['audio-tracks-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_content')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Fetch video content for target video selector
  const { data: videoTracks } = useQuery({
    queryKey: ['video-tracks-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_content')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Fetch video playlists for destination selector
  const { data: videoPlaylists } = useQuery({
    queryKey: ['video-playlists-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_playlists')
        .select('id, name')
        .eq('is_hidden', false)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

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
      const isSelfcareQuiz = destinationType === 'onboarding' && destinationId === 'selfcare-quiz';
      const needsDestinationId = !isSelfcareQuiz && ['playlist', 'tasks', 'routines_hub', 'breathe_exercise', 'onboarding', 'video_playlist', 'audio_track', 'video_track'].includes(destinationType);
      const needsCustomUrl = ['custom_url', 'external_url'].includes(destinationType);
      if (!isSelfcareQuiz && ['playlist', 'tasks', 'routines_hub', 'breathe_exercise', 'onboarding', 'video_playlist', 'audio_track', 'video_track'].includes(destinationType) && !destinationId) {
        throw new Error(`Please select a ${destinationType.replace('_', ' ')} before saving`);
      }
      const { error } = await supabase.from('promo_banners').insert({
        cover_image_url: coverImageUrl,
        destination_type: destinationType,
        destination_id: needsDestinationId ? destinationId || null : null,
        custom_url: isSelfcareQuiz ? 'selfcare-quiz' : (needsCustomUrl ? customUrl : null),
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
        target_languages: targetLanguages,
        target_timezones: targetTimezones,
        include_update_status: includeUpdateStatus,
        target_instructor_ids: targetInstructorIds,
        display_location: displayLocations,
        target_playlist_ids: targetPlaylistIds,
        target_audio_ids: targetAudioIds,
        target_video_ids: targetVideoIds,
        display_delay_seconds: displayDelaySeconds,
        audience_preset_id: audiencePresetId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
      queryClient.invalidateQueries({ queryKey: ['active-promo-banners'] });
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
      const isSelfcareQuiz = destinationType === 'onboarding' && destinationId === 'selfcare-quiz';
      const needsDestinationId = !isSelfcareQuiz && ['playlist', 'tasks', 'routines_hub', 'breathe_exercise', 'onboarding', 'video_playlist', 'audio_track', 'video_track'].includes(destinationType);
      const needsCustomUrl = ['custom_url', 'external_url'].includes(destinationType);
      if (!isSelfcareQuiz && ['playlist', 'tasks', 'routines_hub', 'breathe_exercise', 'onboarding', 'video_playlist', 'audio_track', 'video_track'].includes(destinationType) && !destinationId) {
        throw new Error(`Please select a ${destinationType.replace('_', ' ')} before saving`);
      }
      const { error } = await supabase.from('promo_banners').update({
        cover_image_url: coverImageUrl,
        destination_type: destinationType,
        destination_id: needsDestinationId ? destinationId || null : null,
        custom_url: isSelfcareQuiz ? 'selfcare-quiz' : (needsCustomUrl ? customUrl : null),
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
        target_languages: targetLanguages,
        target_timezones: targetTimezones,
        include_update_status: includeUpdateStatus,
        target_instructor_ids: targetInstructorIds,
        display_location: displayLocations,
        target_playlist_ids: targetPlaylistIds,
        target_audio_ids: targetAudioIds,
        target_video_ids: targetVideoIds,
        display_delay_seconds: displayDelaySeconds,
        audience_preset_id: audiencePresetId,
      }).eq('id', editingBanner.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
      queryClient.invalidateQueries({ queryKey: ['active-promo-banners'] });
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
      queryClient.invalidateQueries({ queryKey: ['active-promo-banners'] });
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
      queryClient.invalidateQueries({ queryKey: ['active-promo-banners'] });
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
    // Reset targeting
    setTargetType('all');
    setIncludePrograms([]);
    setExcludePrograms([]);
    setIncludePlaylists([]);
    setExcludePlaylists([]);
    setIncludeTools([]);
    setExcludeTools([]);
    setTargetLanguages([]);
    setTargetTimezones([]);
    setIncludeUpdateStatus([]);
    setTargetInstructorIds([]);
    setAudiencePresetId(null);
    // Reset location
    setDisplayLocations(['home_top']);
    setTargetPlaylistIds([]);
    setTargetAudioIds([]);
    setTargetVideoIds([]);
    setDisplayDelaySeconds(0);
  };

  const startEditing = (banner: PromoBanner) => {
    setEditingBanner(banner);
    setCoverImageUrl(banner.cover_image_url);
    setDestinationType(banner.destination_type);
    setDestinationId(banner.destination_type === 'onboarding' && banner.custom_url === 'selfcare-quiz' ? 'selfcare-quiz' : (banner.destination_id || ''));
    setCustomUrl(banner.custom_url || '');
    setDisplayFrequency(banner.display_frequency);
    setAspectRatio(banner.aspect_ratio || '3:1');
    setIsActive(banner.is_active);
    setPriority(banner.priority);
    setStartsAt(banner.starts_at ? banner.starts_at.slice(0, 16) : '');
    setEndsAt(banner.ends_at ? banner.ends_at.slice(0, 16) : '');
    // Load targeting
    setTargetType(banner.target_type || 'all');
    setIncludePrograms(banner.include_programs || []);
    setExcludePrograms(banner.exclude_programs || []);
    setIncludePlaylists(banner.include_playlists || []);
    setExcludePlaylists(banner.exclude_playlists || []);
    setIncludeTools(banner.include_tools || []);
    setExcludeTools(banner.exclude_tools || []);
    setTargetLanguages((banner as any).target_languages || []);
    setTargetTimezones((banner as any).target_timezones || []);
    setIncludeUpdateStatus((banner as any).include_update_status || []);
    setTargetInstructorIds((banner as any).target_instructor_ids || []);
    setAudiencePresetId((banner as any).audience_preset_id || null);
    // Load location
    setDisplayLocations((banner.display_location as DisplayLocation[]) || ['home_top']);
    setTargetPlaylistIds(banner.target_playlist_ids || []);
    setTargetAudioIds(banner.target_audio_ids || []);
    setTargetVideoIds(banner.target_video_ids || []);
    setDisplayDelaySeconds(banner.display_delay_seconds || 0);
  };

  const getDestinationLabel = (banner: PromoBanner) => {
    switch (banner.destination_type) {
      case 'routine':
      case 'routines_hub': {
        const routineBank = routinesBank?.find(r => r.id === banner.destination_id);
        if (routineBank) return `${routineBank.emoji || '📋'} ${routineBank.title}`;
        const routine = routines?.find(r => r.id === banner.destination_id);
        return routine?.title || 'Unknown Routine';
      }
      case 'playlist': {
        const playlist = playlists?.find(p => p.id === banner.destination_id);
        return playlist?.name || 'Unknown Playlist';
      }
      case 'tasks': {
        const task = taskTemplates?.find(t => t.id === banner.destination_id);
        return task ? `${task.emoji} ${task.title}` : 'Unknown Task';
      }
      case 'breathe_exercise': {
        const exercise = breathingExercises?.find(e => e.id === banner.destination_id);
        return exercise ? `${exercise.emoji || '🫁'} ${exercise.name}` : 'Unknown Exercise';
      }
      case 'tasks_bank':
      case 'planner':
      case 'home':
        return 'Home / Task Planner';
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
      case 'inspire':
        return 'Routines Hub';
      case 'emotion':
        return 'Emotion Tracker';
      case 'period':
        return 'Period Tracker';
      case 'chat':
        return 'Chat / Support';
      case 'profile':
        return 'Profile / Settings';
      case 'custom_url':
        return banner.custom_url || 'Custom URL';
      case 'external_url':
        return banner.custom_url || 'External URL';
      case 'onboarding':
        const onboardingFlows = [dearMeFlow, mePlusFlow];
        if (banner.custom_url === 'selfcare-quiz') return '🩺 Self-Care Quiz';
        const obFlow = onboardingFlows.find(f => f.id === banner.destination_id);
        return obFlow ? `🎯 ${obFlow.name}` : 'Unknown Flow';
      case 'watch':
        return 'Watch Page';
      case 'video_playlist':
        return banner.destination_id || 'Video Playlist';
      default:
        return 'Unknown';
    }
  };
  
  const getAspectRatioClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9': return 'aspect-video';
      case '1:1': return 'aspect-square';
      case 'full': return 'aspect-[9/16]';
      default: return 'aspect-[3/1]';
    }
  };
  
  const getAspectRatioDimensions = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9': return '1920×1080';
      case '1:1': return '1080×1080';
      case 'full': return '1080×1920 (mobile full screen)';
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
                    <SelectItem value="4:1">4:1 Ultra Wide (1600×400)</SelectItem>
                    <SelectItem value="16:9">16:9 Video Banner (1920×1080)</SelectItem>
                    <SelectItem value="1:1">1:1 Square Banner (1080×1080)</SelectItem>
                    <SelectItem value="full">📱 Full Screen Overlay (1080×1920)</SelectItem>
                  </SelectContent>
                </Select>
              </div>



              <div className="space-y-2">
                <Label>Upload Image</Label>
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

              {/* Display Locations */}
              <div className="space-y-2">
                <Label>Display Locations</Label>
                <div className="space-y-2">
                  {DISPLAY_LOCATION_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={displayLocations.includes(opt.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setDisplayLocations(prev => [...prev, opt.value]);
                          } else {
                            setDisplayLocations(prev => prev.filter(l => l !== opt.value));
                          }
                        }}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select one or more locations where this banner should appear
                </p>
              </div>

              {/* Target Playlists - only show when location is 'player' */}
              {displayLocations.includes('player') && (
                <div className="space-y-2">
                  <Label>Target Playlists (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to show on all audio players, or select specific playlists
                  </p>
                  <Select 
                    value={targetPlaylistIds[0] || ''} 
                    onValueChange={(v) => {
                      if (v && !targetPlaylistIds.includes(v)) {
                        setTargetPlaylistIds([...targetPlaylistIds, v]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add a playlist..." />
                    </SelectTrigger>
                    <SelectContent>
                      {playlists?.filter(p => !targetPlaylistIds.includes(p.id)).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {targetPlaylistIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {targetPlaylistIds.map(id => {
                        const playlist = playlists?.find(p => p.id === id);
                        return (
                          <span 
                            key={id} 
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                          >
                            {playlist?.name || id}
                            <button 
                              type="button"
                              onClick={() => setTargetPlaylistIds(targetPlaylistIds.filter(pid => pid !== id))}
                              className="hover:text-destructive"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Target Audios - only show when location is 'player' */}
              {displayLocations.includes('player') && (
                <div className="space-y-2">
                  <Label>Target Audio Tracks (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to show on all audio players, or select specific tracks to overlay the Up Next box
                  </p>
                  <Select 
                    value={targetAudioIds[0] || ''} 
                    onValueChange={(v) => {
                      if (v && !targetAudioIds.includes(v)) {
                        setTargetAudioIds([...targetAudioIds, v]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add an audio track..." />
                    </SelectTrigger>
                    <SelectContent>
                      {audioTracks?.filter(a => !targetAudioIds.includes(a.id)).map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {targetAudioIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {targetAudioIds.map(id => {
                        const track = audioTracks?.find(a => a.id === id);
                        return (
                          <span 
                            key={id} 
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                          >
                            🎵 {track?.title || id}
                            <button 
                              type="button"
                              onClick={() => setTargetAudioIds(targetAudioIds.filter(aid => aid !== id))}
                              className="hover:text-destructive"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Target Videos - only show when location is 'video_player' */}
              {displayLocations.includes('video_player') && (
                <div className="space-y-2">
                  <Label>Target Video Tracks (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to show on all video players, or select specific videos to overlay above the progress bar
                  </p>
                  <Select 
                    value={targetVideoIds[0] || ''} 
                    onValueChange={(v) => {
                      if (v && !targetVideoIds.includes(v)) {
                        setTargetVideoIds([...targetVideoIds, v]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add a video..." />
                    </SelectTrigger>
                    <SelectContent>
                      {videoTracks?.filter(v => !targetVideoIds.includes(v.id)).map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {targetVideoIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {targetVideoIds.map(id => {
                        const track = videoTracks?.find(v => v.id === id);
                        return (
                          <span 
                            key={id} 
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                          >
                            🎬 {track?.title || id}
                            <button 
                              type="button"
                              onClick={() => setTargetVideoIds(targetVideoIds.filter(vid => vid !== id))}
                              className="hover:text-destructive"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Display Delay - show for player/video_player locations or full-screen overlay banners */}
              {(displayLocations.includes('player') || displayLocations.includes('video_player') || aspectRatio === 'full') && (
                <div className="space-y-2">
                  <Label>Display Delay (seconds)</Label>
                  <p className="text-xs text-muted-foreground">
                    {aspectRatio === 'full'
                      ? 'Show overlay after this many seconds on the page. Set to 0 for immediate display.'
                      : 'Show banner after this many seconds of playback. Set to 0 for immediate display.'}
                  </p>
                  <Input
                    type="number"
                    min={0}
                    max={300}
                    value={displayDelaySeconds}
                    onChange={(e) => setDisplayDelaySeconds(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              )}

              {/* Destination Type */}
              <div className="space-y-2">
                <Label>Destination Type</Label>
                <Select value={destinationType} onValueChange={(v) => setDestinationType(v as DestinationType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">🏠 Home / Action Planner</SelectItem>
                    <SelectItem value="inspire">✨ Routines Hub</SelectItem>
                    <SelectItem value="routines_hub">📋 Routine (specific)</SelectItem>
                    <SelectItem value="tasks">☑️ Action Template (specific)</SelectItem>
                    <SelectItem value="playlist">🎧 Playlist (specific)</SelectItem>
                    <SelectItem value="programs">🎓 Programs / Store</SelectItem>
                    <SelectItem value="journal">📔 Journal</SelectItem>
                    <SelectItem value="breathe">🫁 Breathe Page</SelectItem>
                    <SelectItem value="breathe_exercise">💨 Breathing Exercise (specific)</SelectItem>
                    <SelectItem value="water">💧 Water Tracking</SelectItem>
                    <SelectItem value="emotion">😊 Emotion Tracker</SelectItem>
                    <SelectItem value="mood">🎭 Mood Check</SelectItem>
                    <SelectItem value="period">🌸 Period Tracker</SelectItem>
                    <SelectItem value="channels">💬 Feed / Channels</SelectItem>
                    <SelectItem value="chat">🗨️ Chat / Support</SelectItem>
                    <SelectItem value="profile">👤 Profile / Settings</SelectItem>
                    <SelectItem value="rate">⭐ Rate App</SelectItem>
                    <SelectItem value="custom_url">🔗 Custom URL (in-app)</SelectItem>
                    <SelectItem value="external_url">🌐 External URL (opens browser)</SelectItem>
                    <SelectItem value="onboarding">🎯 Onboarding Flow</SelectItem>
                    <SelectItem value="watch">📺 Watch Page</SelectItem>
                    <SelectItem value="video_playlist">🎬 Video Playlist (specific)</SelectItem>
                    <SelectItem value="routine_player">🎬 Routine Player</SelectItem>
                    <SelectItem value="audio_track">🎵 Audio Track (specific)</SelectItem>
                    <SelectItem value="video_track">📹 Video Track (specific)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Destination ID - for types that need specific selection */}
              {['playlist', 'tasks', 'routines_hub', 'breathe_exercise', 'onboarding', 'video_playlist', 'audio_track', 'video_track'].includes(destinationType) && (
                <div className="space-y-2">
                  <Label>
                    {destinationType === 'routines_hub' && 'Select Routine'}
                    {destinationType === 'playlist' && 'Select Playlist'}
                    {destinationType === 'tasks' && 'Select Action Template'}
                    {destinationType === 'routines_hub' && 'Select Routine from Bank'}
                    {destinationType === 'breathe_exercise' && 'Select Breathing Exercise'}
                    {destinationType === 'onboarding' && 'Select Onboarding Flow'}
                    {destinationType === 'video_playlist' && 'Select Video Playlist'}
                    {destinationType === 'audio_track' && 'Select Audio Track'}
                    {destinationType === 'video_track' && 'Select Video Track'}
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
                      {destinationType === 'onboarding' && [dearMeFlow, mePlusFlow].map(f => (
                        <SelectItem key={f.id} value={f.id}>🎯 {f.name}</SelectItem>
                      ))}
                      {destinationType === 'onboarding' && (
                        <SelectItem value="selfcare-quiz">🩺 Self-Care Quiz</SelectItem>
                      )}
                      {destinationType === 'video_playlist' && videoPlaylists?.map(p => (
                        <SelectItem key={p.id} value={p.id}>🎬 {p.name}</SelectItem>
                      ))}
                      {destinationType === 'audio_track' && audioTracks?.map(a => (
                        <SelectItem key={a.id} value={a.id}>🎵 {a.title}</SelectItem>
                      ))}
                      {destinationType === 'video_track' && videoTracks?.map(v => (
                        <SelectItem key={v.id} value={v.id}>📹 {v.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom URL */}
              {destinationType === 'custom_url' && (
                <div className="space-y-2">
                  <Label>Custom URL (e.g., /app/tools)</Label>
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
                    <SelectItem value="forever">Forever (always visible, can't dismiss)</SelectItem>
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

              {/* Audience Targeting */}
              <PromoAudienceSelector
                targetType={targetType}
                setTargetType={setTargetType}
                includePrograms={includePrograms}
                setIncludePrograms={setIncludePrograms}
                excludePrograms={excludePrograms}
                setExcludePrograms={setExcludePrograms}
                includePlaylists={includePlaylists}
                setIncludePlaylists={setIncludePlaylists}
                excludePlaylists={excludePlaylists}
                setExcludePlaylists={setExcludePlaylists}
                includeTools={includeTools}
                setIncludeTools={setIncludeTools}
                excludeTools={excludeTools}
                setExcludeTools={setExcludeTools}
                targetLanguages={targetLanguages}
                setTargetLanguages={setTargetLanguages}
                targetTimezones={targetTimezones}
                setTargetTimezones={setTargetTimezones}
                includeUpdateStatus={includeUpdateStatus}
                setIncludeUpdateStatus={setIncludeUpdateStatus}
                targetInstructorIds={targetInstructorIds}
                setTargetInstructorIds={setTargetInstructorIds}
                presetId={audiencePresetId}
                setPresetId={setAudiencePresetId}
              />

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
                      {banner.target_type !== 'all' && (
                        <span className="inline-flex items-center gap-1 ml-2">
                          <Users className="h-3 w-3" />
                          {banner.target_type === 'enrolled' ? 'Enrolled' : 'Custom'}
                        </span>
                      )}
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
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      // Duplicate the banner by pre-filling the form
                      setCoverImageUrl(banner.cover_image_url);
                      setDestinationType(banner.destination_type);
                      setDestinationId(banner.destination_id || '');
                      setCustomUrl(banner.custom_url || '');
                      setDisplayFrequency(banner.display_frequency);
                      setAspectRatio(banner.aspect_ratio || '3:1');
                      setIsActive(true);
                      setPriority(banner.priority);
                      setStartsAt('');
                      setEndsAt('');
                      setTargetType(banner.target_type || 'all');
                      setIncludePrograms(banner.include_programs || []);
                      setExcludePrograms(banner.exclude_programs || []);
                      setIncludePlaylists(banner.include_playlists || []);
                      setExcludePlaylists(banner.exclude_playlists || []);
                      setIncludeTools(banner.include_tools || []);
                      setExcludeTools(banner.exclude_tools || []);
                      setTargetLanguages((banner as any).target_languages || []);
                      setTargetTimezones((banner as any).target_timezones || []);
                      setIncludeUpdateStatus((banner as any).include_update_status || []);
                      setTargetInstructorIds((banner as any).target_instructor_ids || []);
                      setAudiencePresetId((banner as any).audience_preset_id || null);
                      setDisplayLocations((banner.display_location as DisplayLocation[]) || ['home_top']);
                      setTargetPlaylistIds(banner.target_playlist_ids || []);
                      setTargetAudioIds(banner.target_audio_ids || []);
                      setTargetVideoIds(banner.target_video_ids || []);
                      setDisplayDelaySeconds(banner.display_delay_seconds || 0);
                      setEditingBanner(null);
                      setIsCreating(true);
                      toast.success('Banner duplicated - modify and save as new');
                    }}
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(banner.id)}
                    title="Delete"
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
