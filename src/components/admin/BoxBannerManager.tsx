import { useState } from 'react';
import { dearMeFlow } from '@/data/onboarding-flows/dear-me';
import { mePlusFlow } from '@/data/onboarding-flows/me-plus';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Eye, EyeOff, Megaphone, Video, Link, Play, MapPin, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { detectVideoType, extractYouTubeId, getVideoPlatformLabel } from '@/lib/videoUtils';
import { PromoAudienceSelector, TargetType } from './PromoAudienceSelector';

type DestinationType = 'routine' | 'playlist' | 'journal' | 'programs' | 'breathe' | 'water' | 'channels' | 'home' | 'inspire' | 'custom_url' | 'tasks' | 'routines_hub' | 'tasks_bank' | 'breathe_exercise' | 'external_url' | 'emotion' | 'mood' | 'period' | 'chat' | 'profile' | 'planner' | 'rate' | 'onboarding' | 'watch' | 'video_playlist' | 'routine_player' | 'audio_track' | 'video_track';
type DisplayFrequency = 'once' | 'daily' | 'weekly' | 'forever';
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
];

interface BoxBanner {
  id: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_url: string | null;
  video_url: string | null;
  background_color: string | null;
  icon: string | null;
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  destination_type: string | null;
  destination_id: string | null;
  display_frequency: string | null;
  display_location: string[] | null;
  target_type: string | null;
  include_programs: string[] | null;
  exclude_programs: string[] | null;
  include_playlists: string[] | null;
  exclude_playlists: string[] | null;
  include_tools: string[] | null;
  exclude_tools: string[] | null;
  target_languages: string[] | null;
  target_timezones: string[] | null;
  include_update_status: string[] | null;
  target_instructor_ids: string[] | null;
  display_delay_seconds: number | null;
}

export function BoxBannerManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BoxBanner | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  // New promo-style fields
  const [destinationType, setDestinationType] = useState<DestinationType>('custom_url');
  const [destinationId, setDestinationId] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [displayFrequency, setDisplayFrequency] = useState<DisplayFrequency>('forever');
  const [displayLocations, setDisplayLocations] = useState<DisplayLocation[]>(['home_top']);
  const [displayDelaySeconds, setDisplayDelaySeconds] = useState(0);

  // Audience targeting
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
    queryKey: ['box-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_banners')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BoxBanner[];
    },
  });

  // Fetch routines for destination
  const { data: routinesBank } = useQuery({
    queryKey: ['routines-bank-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('routines_bank').select('id, title, emoji').eq('is_active', true).order('title');
      if (error) throw error;
      return data;
    },
  });

  const { data: playlists } = useQuery({
    queryKey: ['playlists-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('audio_playlists').select('id, name').eq('is_hidden', false).order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: taskTemplates } = useQuery({
    queryKey: ['task-templates-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_task_bank').select('id, title, emoji').eq('is_active', true).order('title');
      if (error) throw error;
      return data;
    },
  });

  const { data: breathingExercises } = useQuery({
    queryKey: ['breathing-exercises-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('breathing_exercises').select('id, name, emoji').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: videoPlaylists } = useQuery({
    queryKey: ['video-playlists-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('video_playlists').select('id, name').eq('is_hidden', false).order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: audioTracks } = useQuery({
    queryKey: ['audio-tracks-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('audio_content').select('id, title').order('title');
      if (error) throw error;
      return data;
    },
  });

  const { data: videoTracks } = useQuery({
    queryKey: ['video-tracks-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('video_content').select('id, title').order('title');
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setButtonText('');
    setButtonUrl('');
    setVideoUrl('');
    setIsActive(true);
    setPriority(0);
    setStartsAt('');
    setEndsAt('');
    setEditingBanner(null);
    setDestinationType('custom_url');
    setDestinationId('');
    setCustomUrl('');
    setDisplayFrequency('forever');
    setDisplayLocations(['home_top']);
    setDisplayDelaySeconds(0);
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
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (banner: BoxBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setDescription(banner.description || '');
    setButtonText(banner.button_text || '');
    setButtonUrl(banner.button_url || '');
    setVideoUrl(banner.video_url || '');
    setIsActive(banner.is_active);
    setPriority(banner.priority);
    setStartsAt(banner.starts_at ? banner.starts_at.slice(0, 16) : '');
    setEndsAt(banner.ends_at ? banner.ends_at.slice(0, 16) : '');
    setDestinationType((banner.destination_type as DestinationType) || 'custom_url');
    setDestinationId(banner.destination_type === 'onboarding' && banner.button_url === 'selfcare-quiz' ? 'selfcare-quiz' : (banner.destination_id || ''));
    setCustomUrl(banner.button_url || '');
    setDisplayFrequency((banner.display_frequency as DisplayFrequency) || 'forever');
    setDisplayLocations((banner.display_location as DisplayLocation[]) || ['home_top']);
    setDisplayDelaySeconds(banner.display_delay_seconds || 0);
    setTargetType((banner.target_type as TargetType) || 'all');
    setIncludePrograms(banner.include_programs || []);
    setExcludePrograms(banner.exclude_programs || []);
    setIncludePlaylists(banner.include_playlists || []);
    setExcludePlaylists(banner.exclude_playlists || []);
    setIncludeTools(banner.include_tools || []);
    setExcludeTools(banner.exclude_tools || []);
    setTargetLanguages(banner.target_languages || []);
    setTargetTimezones(banner.target_timezones || []);
    setIncludeUpdateStatus(banner.include_update_status || []);
    setTargetInstructorIds((banner as any).target_instructor_ids || []);
    setAudiencePresetId((banner as any).audience_preset_id || null);
    setDialogOpen(true);
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Title is required');
      const { error } = await supabase.from('home_banners').insert({
        title: title.trim(),
        description: description.trim() || null,
        button_text: buttonText.trim() || null,
        button_url: buttonUrl.trim() || null,
        video_url: videoUrl.trim() || null,
        is_active: isActive,
        priority,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        destination_type: destinationType,
        destination_id: destinationId || null,
        display_frequency: displayFrequency,
        display_location: displayLocations,
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
        display_delay_seconds: displayDelaySeconds,
        audience_preset_id: audiencePresetId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['box-banners'] });
      toast.success('Box banner created');
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingBanner) return;
      if (!title.trim()) throw new Error('Title is required');
      const { error } = await supabase.from('home_banners').update({
        title: title.trim(),
        description: description.trim() || null,
        button_text: buttonText.trim() || null,
        button_url: buttonUrl.trim() || null,
        video_url: videoUrl.trim() || null,
        is_active: isActive,
        priority,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        destination_type: destinationType,
        destination_id: destinationId || null,
        display_frequency: displayFrequency,
        display_location: displayLocations,
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
        display_delay_seconds: displayDelaySeconds,
        audience_preset_id: audiencePresetId,
      }).eq('id', editingBanner.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['box-banners'] });
      toast.success('Box banner updated');
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('home_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['box-banners'] });
      toast.success('Banner deleted');
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Toggle active
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('home_banners').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['box-banners'] });
    },
  });

  const handleSave = () => {
    if (editingBanner) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const getDestinationLabel = (banner: BoxBanner) => {
    const dt = banner.destination_type || 'custom_url';
    switch (dt) {
      case 'routines_hub': {
        const r = routinesBank?.find(r => r.id === banner.destination_id);
        return r ? `${r.emoji || '📋'} ${r.title}` : 'Routine';
      }
      case 'playlist': {
        const p = playlists?.find(p => p.id === banner.destination_id);
        return p?.name || 'Playlist';
      }
      case 'tasks': {
        const t = taskTemplates?.find(t => t.id === banner.destination_id);
        return t ? `${t.emoji} ${t.title}` : 'Task';
      }
      case 'onboarding':
        if (banner.destination_id === 'selfcare-quiz') return '🩺 Self-Care Quiz';
        return '🎯 Onboarding Flow';
      case 'home': return '🏠 Home';
      case 'programs': return '📚 Programs';
      case 'journal': return '📔 Journal';
      case 'breathe': return '🫁 Breathe';
      case 'custom_url': return banner.button_url || '🔗 Custom URL';
      case 'external_url': return '🌐 External';
      default: return dt;
    }
  };

  const getLocationSummary = (locs: string[] | null) => {
    if (!locs || locs.length === 0) return 'No location';
    if (locs.length === 1) {
      const opt = DISPLAY_LOCATION_OPTIONS.find(o => o.value === locs[0]);
      return opt?.label || locs[0];
    }
    return `${locs.length} locations`;
  };

  const detectedVideoType = videoUrl ? detectVideoType(videoUrl) : null;
  const youtubeId = detectedVideoType === 'youtube' ? extractYouTubeId(videoUrl) : null;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="border-[#D94B2B]/20">
      <CardHeader className="bg-gradient-to-r from-[#D94B2B]/5 to-[#F5A623]/10 rounded-t-lg flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-[#D94B2B]">
            <Megaphone className="h-5 w-5" />
            Box Banners
          </CardTitle>
          <CardDescription>
            In-app message banners with text, buttons, videos, and smart targeting
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-[#D94B2B] hover:bg-[#A63520]">
              <Plus className="h-4 w-4 mr-2" />
              New Box Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#D94B2B]">
                {editingBanner ? 'Edit Box Banner' : 'Create New Box Banner'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Content Section */}
              <div className="space-y-4 p-4 border border-[#D94B2B]/10 rounded-lg bg-[#D94B2B]/5">
                <h4 className="text-sm font-semibold text-[#D94B2B] flex items-center gap-2">
                  <Megaphone className="h-4 w-4" /> Content
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Banner title" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={2} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input id="buttonText" value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="e.g., Watch Now" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonUrl">Button URL</Label>
                    <Input id="buttonUrl" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="/app/... or https://..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl" className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-[#D94B2B]" /> Video URL
                  </Label>
                  <Input id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube, Vimeo, or direct MP4 link" />
                  {detectedVideoType && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Play className="h-4 w-4" />
                        <span>Detected: <strong>{getVideoPlatformLabel(detectedVideoType)}</strong></span>
                      </div>
                      {youtubeId && (
                        <img src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} alt="YouTube thumbnail" className="w-full h-auto rounded-lg border" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Destination Section */}
              <div className="space-y-4 p-4 border border-[#D94B2B]/10 rounded-lg bg-[#D94B2B]/5">
                <h4 className="text-sm font-semibold text-[#D94B2B] flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Destination
                </h4>

                <div className="space-y-2">
                  <Label>Destination Type</Label>
                  <Select value={destinationType} onValueChange={(v) => setDestinationType(v as DestinationType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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

                {/* Destination ID selector */}
                {['playlist', 'tasks', 'routines_hub', 'breathe_exercise', 'onboarding', 'video_playlist', 'audio_track', 'video_track'].includes(destinationType) && (
                  <div className="space-y-2">
                    <Label>Select {destinationType.replace(/_/g, ' ')}</Label>
                    <Select value={destinationId} onValueChange={setDestinationId}>
                      <SelectTrigger><SelectValue placeholder={`Choose a ${destinationType.replace(/_/g, ' ')}`} /></SelectTrigger>
                      <SelectContent>
                        {destinationType === 'playlist' && playlists?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        {destinationType === 'tasks' && taskTemplates?.map(t => <SelectItem key={t.id} value={t.id}>{t.emoji} {t.title}</SelectItem>)}
                        {destinationType === 'routines_hub' && routinesBank?.map(r => <SelectItem key={r.id} value={r.id}>{r.emoji || '📋'} {r.title}</SelectItem>)}
                        {destinationType === 'breathe_exercise' && breathingExercises?.map(e => <SelectItem key={e.id} value={e.id}>{e.emoji || '🫁'} {e.name}</SelectItem>)}
                        {destinationType === 'onboarding' && [dearMeFlow, mePlusFlow].map(f => <SelectItem key={f.id} value={f.id}>🎯 {f.name}</SelectItem>)}
                        {destinationType === 'onboarding' && <SelectItem value="selfcare-quiz">🩺 Self-Care Quiz</SelectItem>}
                        {destinationType === 'video_playlist' && videoPlaylists?.map(p => <SelectItem key={p.id} value={p.id}>🎬 {p.name}</SelectItem>)}
                        {destinationType === 'audio_track' && audioTracks?.map(a => <SelectItem key={a.id} value={a.id}>🎵 {a.title}</SelectItem>)}
                        {destinationType === 'video_track' && videoTracks?.map(v => <SelectItem key={v.id} value={v.id}>📹 {v.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {destinationType === 'custom_url' && (
                  <div className="space-y-2">
                    <Label>Custom URL (e.g., /app/tools)</Label>
                    <Input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="/app/..." />
                  </div>
                )}
                {destinationType === 'external_url' && (
                  <div className="space-y-2">
                    <Label>External URL (opens in browser)</Label>
                    <Input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="https://..." />
                  </div>
                )}
              </div>

              {/* Display Section */}
              <div className="space-y-4 p-4 border border-[#D94B2B]/10 rounded-lg bg-[#D94B2B]/5">
                <h4 className="text-sm font-semibold text-[#D94B2B] flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Display Settings
                </h4>

                <div className="space-y-2">
                  <Label>Display Locations</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DISPLAY_LOCATION_OPTIONS.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox
                          checked={displayLocations.includes(opt.value)}
                          onCheckedChange={(checked) => {
                            if (checked) setDisplayLocations(prev => [...prev, opt.value]);
                            else setDisplayLocations(prev => prev.filter(l => l !== opt.value));
                          }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Display Frequency</Label>
                  <Select value={displayFrequency} onValueChange={(v) => setDisplayFrequency(v as DisplayFrequency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forever">Forever (always visible)</SelectItem>
                      <SelectItem value="once">Once (never show again after dismiss)</SelectItem>
                      <SelectItem value="daily">Daily (show again after 24h)</SelectItem>
                      <SelectItem value="weekly">Weekly (show again after 7 days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Display Delay (seconds)</Label>
                  <Input type="number" min={0} max={300} value={displayDelaySeconds} onChange={(e) => setDisplayDelaySeconds(parseInt(e.target.value) || 0)} placeholder="0" />
                </div>

                <div className="space-y-2">
                  <Label>Priority (higher = shown first)</Label>
                  <Input type="number" value={priority} onChange={(e) => setPriority(parseInt(e.target.value) || 0)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Starts At (optional)</Label>
                    <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ends At (optional)</Label>
                    <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="isActive">Active</Label>
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

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-[#D94B2B] hover:bg-[#A63520]">
                  {isSaving ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading banners...</p>
        ) : !banners || banners.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No box banners yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => {
              const bannerVideoType = banner.video_url ? detectVideoType(banner.video_url) : null;
              return (
                <div
                  key={banner.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                    banner.is_active
                      ? 'bg-card border-[#D94B2B]/20 hover:border-[#D94B2B]/40'
                      : 'bg-muted/30 opacity-60 border-muted'
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{banner.title}</span>
                      {banner.is_active ? (
                        <Badge className="bg-[#D94B2B]/10 text-[#D94B2B] border-[#D94B2B]/20 text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                      {bannerVideoType && (
                        <Badge variant="outline" className="text-[10px] border-[#D94B2B]/30 text-[#D94B2B]">
                          {getVideoPlatformLabel(bannerVideoType)}
                        </Badge>
                      )}
                      {banner.button_url && <Link className="h-3.5 w-3.5 text-[#F5A623]" />}
                    </div>
                    {banner.description && (
                      <p className="text-sm text-muted-foreground truncate">{banner.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {getLocationSummary(banner.display_location)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {banner.display_frequency || 'forever'}
                      </span>
                      {banner.target_type && banner.target_type !== 'all' && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {banner.target_type}
                        </span>
                      )}
                      <span>→ {getDestinationLabel(banner)}</span>
                      <span>Priority: {banner.priority}</span>
                      {banner.starts_at && <span>Starts: {format(new Date(banner.starts_at), 'MMM d, h:mm a')}</span>}
                      {banner.ends_at && <span>Ends: {format(new Date(banner.ends_at), 'MMM d, h:mm a')}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActiveMutation.mutate({ id: banner.id, is_active: !banner.is_active })}
                      title={banner.is_active ? 'Deactivate' : 'Activate'}
                      className="hover:text-[#D94B2B]"
                    >
                      {banner.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(banner)} className="hover:text-[#D94B2B]">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this banner?')) deleteMutation.mutate(banner.id);
                      }}
                      className="text-destructive hover:text-destructive"
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
  );
}
