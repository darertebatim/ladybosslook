import { useState, useEffect, useRef } from 'react';
import { Plus, ArrowLeft, Music, Wind, Brain, Headphones, MessageCircle, Video, Clapperboard, GraduationCap, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { haptic } from '@/lib/haptics';
import { PRO_LINK_CONFIGS, type ProLinkType, getProTaskNavigationPath } from '@/lib/proTaskTypes';
import { ProLinkPicker } from '@/components/app/ProLinkPicker';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getProLinkEmoji } from '@/lib/proLinkPresentation';
import { useTodayMood } from '@/hooks/useMoodLogs';
import { useTodayProLinkCompletions, isShortcutCompletedToday } from '@/hooks/useTodayProLinkCompletions';

interface ShortcutData {
  type: ProLinkType;
  value: string | null;
  label: string;
  emoji: string;
}

const STORAGE_KEY = 'tool-shortcuts-v6';
const LEGACY_KEYS = ['tool-shortcuts', 'tool-shortcuts-v2', 'tool-shortcuts-v3', 'tool-shortcuts-v4', 'tool-shortcuts-v5'];
const MAX_SHORTCUTS = 4;
const DEFAULT_SHORTCUTS: (ShortcutData | null)[] = [
  { type: 'myprograms', value: null, label: 'My Programs', emoji: '🎓' },
  { type: 'reflection', value: null, label: 'Reflection Journal', emoji: '✏️' },
  { type: 'protein', value: null, label: 'Protein Counter', emoji: '🍗' },
  null,
];

function loadShortcuts(): (ShortcutData | null)[] {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === MAX_SHORTCUTS) {
        const valid = parsed.every((s: any) =>
          s === null || (typeof s === 'object' && s.type && typeof s.type === 'string' && typeof s.label === 'string' && typeof s.emoji === 'string')
        );
        if (valid) return parsed;
      }
    }
  } catch {}
  return [...DEFAULT_SHORTCUTS];
}

function saveShortcuts(shortcuts: (ShortcutData | null)[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}

export function ToolShortcuts({ hideWhenEmpty = false, hideLabels = false }: { hideWhenEmpty?: boolean; hideLabels?: boolean } = {}) {
  const navigate = useNavigate();
  const { data: todayMood } = useTodayMood();
  const { data: proLinkCompletions } = useTodayProLinkCompletions();
  const [shortcuts, setShortcuts] = useState<(ShortcutData | null)[]>(loadShortcuts);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingType, setPendingType] = useState<ProLinkType | null>(null);
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showBreathingPicker, setShowBreathingPicker] = useState(false);
  const [showReflectionPicker, setShowReflectionPicker] = useState(false);
  const [showRoutinePicker, setShowRoutinePicker] = useState(false);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [showVideoPlaylistPicker, setShowVideoPlaylistPicker] = useState(false);
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [showRoutineTemplatePicker, setShowRoutineTemplatePicker] = useState(false);
  const [showReadingPicker, setShowReadingPicker] = useState(false);
  const [routineTemplateSearchQuery, setRoutineTemplateSearchQuery] = useState('');
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');
  const [audioSearchQuery, setAudioSearchQuery] = useState('');
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [videoPlaylistSearchQuery, setVideoPlaylistSearchQuery] = useState('');
  const suppressTapUntilRef = useRef(0);

  useEffect(() => {
    saveShortcuts(shortcuts);
  }, [shortcuts]);

  const { data: playlists = [] } = useQuery({
    queryKey: ['shortcut-linkable-playlists'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return [];

      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('program_slug')
        .eq('user_id', authUser.id)
        .eq('status', 'active');
      const enrolledSlugs = (enrollments || []).map(e => e.program_slug).filter(Boolean) as string[];

      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .limit(1);
      const hasSubscription = !!(subs && subs.length > 0);

      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name, cover_image_url, category, is_free, requires_subscription, program_slug')
        .eq('is_hidden', false)
        .order('name', { ascending: true });
      if (error) throw error;

      return (data || []).filter(p => p.is_free || (p.requires_subscription && hasSubscription) || (p.program_slug && enrolledSlugs.includes(p.program_slug)));
    },
  });

  const { data: breathingExercises = [] } = useQuery({
    queryKey: ['shortcut-linkable-breathing-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breathing_exercises')
        .select('id, name, emoji, category')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as { id: string; name: string; emoji: string | null; category: string }[];
    },
  });

  const { data: reflections = [] } = useQuery({
    queryKey: ['shortcut-linkable-reflections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflections' as any)
        .select('id, title, subtitle, cover_image_url, emoji')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as unknown as { id: string; title: string; subtitle: string | null; cover_image_url: string | null; emoji: string | null }[];
    },
  });

  const { data: linkableRoutines = [] } = useQuery({
    queryKey: ['shortcut-linkable-user-routines'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return [];
      const { data, error } = await supabase
        .from('user_routines_bank')
        .select('routine_id, title, emoji, category')
        .eq('user_id', authUser.id)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []).map((r: any) => ({ id: r.routine_id, title: r.title, emoji: r.emoji, category: r.category })) as { id: string; title: string; emoji: string | null; category: string }[];
    },
  });

  // Fetch routines bank templates for inspire linking
  const { data: routineTemplates = [] } = useQuery({
    queryKey: ['shortcut-linkable-routine-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines_bank')
        .select('id, title, emoji, category, subtitle, cover_image_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as { id: string; title: string; emoji: string | null; category: string; subtitle: string | null; cover_image_url: string | null }[];
    },
  });

  const { data: audioTracks = [] } = useQuery({
    queryKey: ['shortcut-linkable-audio-tracks'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return [];

      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('program_slug')
        .eq('user_id', authUser.id)
        .eq('status', 'active');
      const enrolledSlugs = (enrollments || []).map(e => e.program_slug).filter(Boolean) as string[];

      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .limit(1);
      const hasSubscription = !!(subs && subs.length > 0);

      const { data: allTracks, error } = await supabase
        .from('audio_content')
        .select('id, title, cover_image_url, category, duration_seconds, is_free, program_slug')
        .order('title', { ascending: true });
      if (error) throw error;

      const trackIds = (allTracks || []).map(t => t.id);
      const { data: playlistItems } = await supabase
        .from('audio_playlist_items')
        .select('audio_id, playlist_id')
        .in('audio_id', trackIds);

      const playlistIds = [...new Set((playlistItems || []).map(i => i.playlist_id))];
      const { data: playlistNames } = playlistIds.length > 0
        ? await supabase.from('audio_playlists').select('id, name').in('id', playlistIds)
        : { data: [] };

      const playlistNameMap: Record<string, string> = {};
      (playlistNames || []).forEach(p => { playlistNameMap[p.id] = p.name; });
      const trackPlaylistMap: Record<string, string> = {};
      (playlistItems || []).forEach((item) => {
        if (playlistNameMap[item.playlist_id]) trackPlaylistMap[item.audio_id] = playlistNameMap[item.playlist_id];
      });

      return (allTracks || []).filter(t => t.is_free || hasSubscription || (t.program_slug && enrolledSlugs.includes(t.program_slug))).map(t => ({
        ...t,
        playlist_name: trackPlaylistMap[t.id] || null,
      })) as { id: string; title: string; cover_image_url: string | null; category: string; duration_seconds: number; playlist_name: string | null }[];
    },
  });

  const { data: feedChannels = [] } = useQuery({
    queryKey: ['shortcut-linkable-feed-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_channels')
        .select('id, name, slug, cover_image_url, type')
        .eq('is_archived', false)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as { id: string; name: string; slug: string; cover_image_url: string | null; type: string }[];
    },
  });

  const { data: videoTracks = [] } = useQuery({
    queryKey: ['shortcut-linkable-video-tracks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_content')
        .select('id, title, thumbnail_url, video_type, duration_seconds')
        .order('title', { ascending: true });
      if (error) throw error;
      return data as { id: string; title: string; thumbnail_url: string | null; video_type: string; duration_seconds: number }[];
    },
  });

  const { data: videoPlaylists = [] } = useQuery({
    queryKey: ['shortcut-linkable-video-playlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_playlists')
        .select('id, name, cover_image_url, category')
        .eq('is_hidden', false)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as { id: string; name: string; cover_image_url: string | null; category: string | null }[];
    },
  });

  const { data: readingContent = [] } = useQuery({
    queryKey: ['shortcut-reading-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_content' as any)
        .select('id, title, emoji, cover_url, type, category')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as unknown as { id: string; title: string; emoji: string | null; cover_url: string | null; type: string; category: string }[];
    },
  });

  const setShortcutAtIndex = (shortcut: ShortcutData) => {
    if (editingIndex === null) return;
    const updated = [...shortcuts];
    updated[editingIndex] = shortcut;
    setShortcuts(updated);
    setPickerOpen(false);
    setEditingIndex(null);
    setPendingType(null);
    setPendingValue(null);
  };

  const handleSlotTap = (index: number) => {
    if (Date.now() < suppressTapUntilRef.current) return;

    const shortcut = shortcuts[index];
    if (shortcut) {
      haptic.light();
      navigate(getProTaskNavigationPath(shortcut.type, shortcut.value));
      return;
    }

    haptic.light();
    setEditingIndex(index);
    setPendingType(null);
    setPendingValue(null);
    setPickerOpen(true);
  };

  const handleLongPress = (index: number) => {
    if (!shortcuts[index]) return;
    haptic.medium();
    suppressTapUntilRef.current = Date.now() + 700;
    const updated = [...shortcuts];
    updated[index] = null;
    setShortcuts(updated);
  };

  const handleSelectProLink = (type: ProLinkType) => {
    setPendingType(type);
    setPendingValue(null);

    if (type === 'route') return;
    if (type === 'playlist') {
      setPickerOpen(false);
      setShowPlaylistPicker(true);
      return;
    }
    if (type === 'breathe') {
      setPickerOpen(false);
      setShowBreathingPicker(true);
      return;
    }
    if (type === 'reflection') {
      setPickerOpen(false);
      setShowReflectionPicker(true);
      return;
    }
    if (type === 'routine') {
      setPickerOpen(false);
      setShowRoutinePicker(true);
      return;
    }
    if (type === 'audio') {
      setPickerOpen(false);
      setShowAudioPicker(true);
      return;
    }
    if (type === 'channel') {
      setPickerOpen(false);
      setShowChannelPicker(true);
      return;
    }
    if (type === 'video') {
      setPickerOpen(false);
      setShowVideoPicker(true);
      return;
    }
    if (type === 'video_playlist') {
      setPickerOpen(false);
      setShowVideoPlaylistPicker(true);
      return;
    }
    if (type === 'program') {
      setPickerOpen(false);
      setShowProgramPicker(true);
      return;
    }
    if (type === 'inspire') {
      setPickerOpen(false);
      setShowRoutineTemplatePicker(true);
      return;
    }
    if (type === 'reading_item') {
      setPickerOpen(false);
      setShowReadingPicker(true);
      return;
    }

    setShortcutAtIndex({
      type,
      value: null,
      label: PRO_LINK_CONFIGS[type].label,
      emoji: getProLinkEmoji(type),
    });
  };

  const handleClearProLink = () => {
    setPendingType(null);
    setPendingValue(null);
  };

  const handleProLinkDone = () => {
    if (!pendingType) return;
    setShortcutAtIndex({
      type: pendingType,
      value: pendingValue,
      label: PRO_LINK_CONFIGS[pendingType].label,
      emoji: getProLinkEmoji(pendingType),
    });
  };

  const hasAny = shortcuts.some(s => s !== null);
  const filteredPlaylists = playlists.filter(p => p.name.toLowerCase().includes(playlistSearchQuery.toLowerCase()));

  if (hideWhenEmpty && !hasAny) return null;

  return (
    <section>
      {!hideLabels && (
        <div className="flex items-center justify-between mb-1.5 px-1">
          <h2 className="text-sm font-semibold text-foreground">My Shortcuts</h2>
          {hasAny && <p className="text-[10px] text-muted-foreground">Long press to remove</p>}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {shortcuts.map((shortcut, i) => {
          if (shortcut) {
            return (
              <ShortcutSlot key={i} onTap={() => handleSlotTap(i)} onLongPress={() => handleLongPress(i)}>
                <div className={cn("relative w-full rounded-2xl flex flex-col items-center justify-center bg-accent/60 px-1", hideLabels ? "aspect-square" : "aspect-square")}>
                  {!hideLabels && shortcut.emoji && (
                    <FluentEmoji emoji={shortcut.emoji} size={22} className="mb-0.5" />
                  )}
                  <span className="text-[10px] font-bold text-foreground leading-tight text-center line-clamp-3 w-full px-1">
                    {shortcut.value ? shortcut.label : (PRO_LINK_CONFIGS[shortcut.type]?.label || shortcut.label)}
                  </span>
                  {/* Completion indicator hidden temporarily */}
                </div>
              </ShortcutSlot>
            );
          }

          return (
            <ShortcutSlot key={i} onTap={() => handleSlotTap(i)}>
              <div className={cn("w-full rounded-2xl bg-muted/60 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-0.5", hideLabels ? "aspect-square" : "aspect-square")}>
                <Plus className="h-4 w-4 text-muted-foreground/60" />
                <span className="text-[9px] text-muted-foreground/50">Add</span>
              </div>
            </ShortcutSlot>
          );
        })}
      </div>

      <ProLinkPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        proLinkType={pendingType}
        onSelect={handleSelectProLink}
        onClear={handleClearProLink}
        proLinkValue={pendingValue}
        onValueChange={setPendingValue}
        onDone={handleProLinkDone}
      />

      <Sheet open={showPlaylistPicker} onOpenChange={setShowPlaylistPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowPlaylistPicker(false); setPickerOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>Select Playlist</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input value={playlistSearchQuery} onChange={(e) => setPlaylistSearchQuery(e.target.value)} placeholder="Search playlists..." className="mb-2" />
            <ScrollArea className="h-[45vh]">
              <div className="space-y-2 pr-4">
                {filteredPlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => {
                      setShortcutAtIndex({ type: 'playlist', value: playlist.id, label: playlist.name, emoji: '🎵' });
                      setShowPlaylistPicker(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80"
                  >
                    {playlist.cover_image_url ? <img src={playlist.cover_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Music className="h-5 w-5 text-muted-foreground" /></div>}
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{playlist.name}</p>
                      {playlist.category && <p className="text-xs text-muted-foreground capitalize">{playlist.category}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showBreathingPicker} onOpenChange={setShowBreathingPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowBreathingPicker(false); setPickerOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>Select Breathing Exercise</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <button onClick={() => { setShortcutAtIndex({ type: 'breathe', value: null, label: 'Breathe', emoji: '🌬️' }); setShowBreathingPicker(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80">
              <div className="w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center"><FluentEmoji emoji="🌬️" size={22} /></div>
              <div className="flex-1 text-left"><p className="font-medium">Any Exercise</p><p className="text-xs text-muted-foreground">Open the Breathe page to choose</p></div>
            </button>
            <ScrollArea className="h-[35vh]"><div className="space-y-2 pr-4">{breathingExercises.map((exercise) => (
              <button key={exercise.id} onClick={() => { setShortcutAtIndex({ type: 'breathe', value: exercise.id, label: exercise.name, emoji: exercise.emoji || '🌬️' }); setShowBreathingPicker(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80">
                <div className="w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center"><FluentEmoji emoji={exercise.emoji || '🌬️'} size={22} /></div>
                <div className="flex-1 text-left"><p className="font-medium truncate">{exercise.name}</p><p className="text-xs text-muted-foreground capitalize">{exercise.category}</p></div>
              </button>
            ))}</div></ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showReflectionPicker} onOpenChange={setShowReflectionPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowReflectionPicker(false); setPickerOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>Select Reflection</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <button onClick={() => { setShortcutAtIndex({ type: 'reflection', value: null, label: 'Reflection', emoji: '✏️' }); setShowReflectionPicker(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80">
              <div className="w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center"><FluentEmoji emoji="✏️" size={22} /></div>
              <div className="flex-1 text-left"><p className="font-medium">Any Reflection</p><p className="text-xs text-muted-foreground">Open the Reflections page to choose</p></div>
            </button>
            <ScrollArea className="h-[40vh]"><div className="space-y-2 pr-4">{reflections.map((reflection) => (
              <button key={reflection.id} onClick={() => { setShortcutAtIndex({ type: 'reflection', value: reflection.id, label: reflection.title, emoji: reflection.emoji || '✏️' }); setShowReflectionPicker(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80">
                {reflection.cover_image_url ? <img src={reflection.cover_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center"><FluentEmoji emoji={reflection.emoji || '✏️'} size={22} /></div>}
                <div className="flex-1 text-left"><p className="font-medium truncate">{reflection.title}</p>{reflection.subtitle && <p className="text-xs text-muted-foreground truncate">{reflection.subtitle}</p>}</div>
              </button>
            ))}</div></ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showRoutinePicker} onOpenChange={setShowRoutinePicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowRoutinePicker(false); setPickerOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>Select Routine</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <ScrollArea className="h-[45vh]"><div className="space-y-2 pr-4">{linkableRoutines.map((routine) => (
              <button key={routine.id} onClick={() => { setShortcutAtIndex({ type: 'routine', value: routine.id, label: routine.title, emoji: routine.emoji || '🚀' }); setShowRoutinePicker(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80">
                <div className="w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center"><FluentEmoji emoji={routine.emoji || '🚀'} size={22} /></div>
                <div className="flex-1 text-left"><p className="font-medium truncate">{routine.title}</p><p className="text-xs text-muted-foreground capitalize">{routine.category}</p></div>
              </button>
            ))}</div></ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Routine Template Picker Sheet */}
      <Sheet open={showRoutineTemplatePicker} onOpenChange={setShowRoutineTemplatePicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowRoutineTemplatePicker(false); setPickerOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>Select Routine Template</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input value={routineTemplateSearchQuery} onChange={(e) => setRoutineTemplateSearchQuery(e.target.value)} placeholder="Search templates..." className="mb-2" />
            <ScrollArea className="h-[45vh]">
              <div className="space-y-2 pr-4">
                {routineTemplates.filter(r => !routineTemplateSearchQuery || r.title.toLowerCase().includes(routineTemplateSearchQuery.toLowerCase())).map((routine) => (
                  <button
                    key={routine.id}
                    onClick={() => {
                      setShortcutAtIndex({ type: 'inspire', value: routine.id, label: routine.title, emoji: routine.emoji || '📋' });
                      setShowRoutineTemplatePicker(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 flex items-center justify-center">
                      <FluentEmoji emoji={routine.emoji || '📋'} size={22} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{routine.title}</p>
                      {routine.subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{routine.subtitle}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showAudioPicker} onOpenChange={setShowAudioPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowAudioPicker(false); setPickerOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>Select Audio Track</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input value={audioSearchQuery} onChange={(e) => setAudioSearchQuery(e.target.value)} placeholder="Search audio tracks..." className="mb-2" />
            <ScrollArea className="h-[45vh]"><div className="space-y-2 pr-4">{audioTracks.filter(a => a.title.toLowerCase().includes(audioSearchQuery.toLowerCase())).map((audio) => (
              <button key={audio.id} onClick={() => { setShortcutAtIndex({ type: 'audio', value: audio.id, label: audio.title, emoji: '🎧' }); setShowAudioPicker(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80">
                {audio.cover_image_url ? <img src={audio.cover_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center"><Headphones className="h-5 w-5 text-muted-foreground" /></div>}
                <div className="flex-1 text-left"><p className="font-medium truncate">{audio.title}</p><p className="text-xs text-muted-foreground">{audio.playlist_name || audio.category} • {Math.floor(audio.duration_seconds / 60)}min</p></div>
              </button>
            ))}</div></ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showChannelPicker} onOpenChange={setShowChannelPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowChannelPicker(false); setPickerOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>Select Channel</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input value={channelSearchQuery} onChange={(e) => setChannelSearchQuery(e.target.value)} placeholder="Search channels..." className="mb-2" />
            <ScrollArea className="h-[45vh]"><div className="space-y-2 pr-4">{feedChannels.filter(c => c.name.toLowerCase().includes(channelSearchQuery.toLowerCase())).map((channel) => (
              <button key={channel.id} onClick={() => { setShortcutAtIndex({ type: 'channel', value: channel.slug, label: channel.name, emoji: channel.cover_image_url?.startsWith('emoji:') ? channel.cover_image_url.replace('emoji:', '') : '💬' }); setShowChannelPicker(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80">
                {channel.cover_image_url && !channel.cover_image_url.startsWith('emoji:') ? <img src={channel.cover_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center">{channel.cover_image_url?.startsWith('emoji:') ? <FluentEmoji emoji={channel.cover_image_url.replace('emoji:', '')} size={22} /> : <MessageCircle className="h-5 w-5 text-muted-foreground" />}</div>}
                <div className="flex-1 text-left"><p className="font-medium truncate">{channel.name}</p><p className="text-xs text-muted-foreground capitalize">{channel.type}</p></div>
              </button>
            ))}</div></ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showVideoPicker} onOpenChange={setShowVideoPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowVideoPicker(false); setPickerOpen(true); }} className="p-1.5 rounded-lg active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>Select Video</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input value={videoSearchQuery} onChange={(e) => setVideoSearchQuery(e.target.value)} placeholder="Search videos..." className="mb-2" />
            <ScrollArea className="h-[45vh]"><div className="space-y-2 pr-4">{videoTracks.filter(v => v.title.toLowerCase().includes(videoSearchQuery.toLowerCase())).map((video) => (
              <button key={video.id} onClick={() => { setShortcutAtIndex({ type: 'video', value: video.id, label: video.title, emoji: '🎬' }); setShowVideoPicker(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80">
                {video.thumbnail_url ? <img src={video.thumbnail_url} alt="" className="w-14 h-10 rounded-lg object-cover" /> : <div className="w-14 h-10 rounded-lg bg-accent/60 flex items-center justify-center"><Video className="h-5 w-5 text-muted-foreground" /></div>}
                <div className="flex-1 text-left"><p className="font-medium truncate">{video.title}</p><p className="text-xs text-muted-foreground capitalize">{video.video_type} • {Math.floor(video.duration_seconds / 60)}min</p></div>
              </button>
            ))}</div></ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showVideoPlaylistPicker} onOpenChange={setShowVideoPlaylistPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowVideoPlaylistPicker(false); setPickerOpen(true); }} className="p-1.5 rounded-lg active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>Select Video Playlist</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input value={videoPlaylistSearchQuery} onChange={(e) => setVideoPlaylistSearchQuery(e.target.value)} placeholder="Search video playlists..." className="mb-2" />
            <ScrollArea className="h-[45vh]"><div className="space-y-2 pr-4">{videoPlaylists.filter(vp => vp.name.toLowerCase().includes(videoPlaylistSearchQuery.toLowerCase())).map((playlist) => (
              <button key={playlist.id} onClick={() => { setShortcutAtIndex({ type: 'video_playlist', value: playlist.id, label: playlist.name, emoji: '📺' }); setShowVideoPlaylistPicker(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80">
                {playlist.cover_image_url ? <img src={playlist.cover_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center"><Clapperboard className="h-5 w-5 text-muted-foreground" /></div>}
                <div className="flex-1 text-left"><p className="font-medium truncate">{playlist.name}</p>{playlist.category && <p className="text-xs text-muted-foreground capitalize">{playlist.category}</p>}</div>
              </button>
            ))}</div></ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showProgramPicker} onOpenChange={setShowProgramPicker}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowProgramPicker(false); setPickerOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>Link Program</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">Enter the program slug to link this shortcut.</p>
            <Input value={pendingValue || ''} onChange={(e) => setPendingValue(e.target.value || null)} placeholder="Program slug (e.g., mindset-reset)" autoFocus />
            <Button onClick={() => { if (!pendingValue) return; setShortcutAtIndex({ type: 'program', value: pendingValue, label: 'Program', emoji: '🎓' }); setShowProgramPicker(false); }} className="w-full rounded-xl" disabled={!pendingValue}>Done</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reading Content Picker Sheet */}
      <Sheet open={showReadingPicker} onOpenChange={setShowReadingPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="flex-row items-center gap-2">
            <button onClick={() => { setShowReadingPicker(false); setPickerOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted active:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <SheetTitle>Select Reading</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-2 pr-4">
                {readingContent.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setShortcutAtIndex({ type: 'reading_item', value: item.id, label: item.title, emoji: item.emoji || '📖' });
                      setShowReadingPicker(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/80',
                      pendingValue === item.id && 'bg-primary/10 ring-1 ring-primary/30'
                    )}
                  >
                    {item.cover_url ? (
                      <img src={item.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 flex items-center justify-center">
                        <FluentEmoji emoji={item.emoji || '📖'} size={22} />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.type} · {item.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

function ShortcutSlot({ children, onTap, onLongPress }: { children: React.ReactNode; onTap: () => void; onLongPress?: () => void; }) {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  const clearPressTimer = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  };

  const handlePressStart = (pointerType?: string, button?: number) => {
    if (pointerType === 'mouse' && button !== 0) return;
    didLongPressRef.current = false;
    if (onLongPress) {
      pressTimerRef.current = setTimeout(() => {
        didLongPressRef.current = true;
        onLongPress();
      }, 600);
    }
  };

  const handlePressEnd = (triggerTap = true, pointerType?: string, button?: number) => {
    if (pointerType === 'mouse' && button !== 0) return;
    const didLongPress = didLongPressRef.current;
    clearPressTimer();
    if (triggerTap && !didLongPress) onTap();
    didLongPressRef.current = false;
  };

  return (
    <button
      className="flex flex-col items-center active:scale-95 transition-transform"
      onPointerDown={(e) => handlePressStart(e.pointerType, e.button)}
      onPointerUp={(e) => handlePressEnd(true, e.pointerType, e.button)}
      onPointerCancel={() => handlePressEnd(false)}
      onPointerLeave={() => handlePressEnd(false)}
      onContextMenu={(e) => { if (onLongPress) e.preventDefault(); }}
      onClick={(e) => { if (e.detail === 0) onTap(); }}
    >
      {children}
    </button>
  );
}
