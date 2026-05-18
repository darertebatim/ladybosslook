import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Paperclip,
  Search,
  Headphones,
  Film,
  Sparkles,
  GraduationCap,
  BookOpen,
  MessageCircle,
  Brain,
  Play,
  Loader2,
  Wind,
  PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntityRow {
  type: string;
  label: string;
  subtitle?: string;
  url: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface AttachEntityPickerProps {
  /** Called with the URL to insert into the message at the current cursor */
  onPick: (url: string) => void;
  className?: string;
}

const TOOL_ENTITIES: EntityRow[] = [
  { type: 'tool', label: 'Breathe', url: '/app/breathe', Icon: Sparkles },
  { type: 'tool', label: 'Mood Check-in', url: '/app/mood', Icon: Sparkles },
  { type: 'tool', label: 'Emotions', url: '/app/emotion', Icon: Sparkles },
  { type: 'tool', label: 'Fasting', url: '/app/fasting', Icon: Sparkles },
  { type: 'tool', label: 'Water', url: '/app/water', Icon: Sparkles },
  { type: 'tool', label: 'Period', url: '/app/period', Icon: Sparkles },
  { type: 'tool', label: 'Reflections', url: '/app/reflections', Icon: BookOpen },
  { type: 'tool', label: 'Focus Timer', url: '/app/timer', Icon: Sparkles },
  { type: 'tool', label: 'Presence', url: '/app/presence', Icon: Sparkles },
  { type: 'tool', label: 'Self-Care Tasks', url: '/app/tasksbank', Icon: Sparkles },
];

export function AttachEntityPicker({ onPick, className }: AttachEntityPickerProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const { data: playlists } = useQuery({
    queryKey: ['attach-picker-playlists'],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from('audio_playlists')
        .select('id, name')
        .eq('is_hidden', false)
        .order('name')
        .limit(100);
      return data || [];
    },
  });

  const { data: routines } = useQuery({
    queryKey: ['attach-picker-routines'],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from('routines_bank')
        .select('id, title, emoji')
        .eq('is_active', true)
        .order('title')
        .limit(100);
      return data || [];
    },
  });

  const { data: programs } = useQuery({
    queryKey: ['attach-picker-programs'],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_catalog')
        .select('slug, title')
        .eq('is_active', true)
        .order('title')
        .limit(100);
      return data || [];
    },
  });

  const { data: channels } = useQuery({
    queryKey: ['attach-picker-channels'],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from('feed_channels')
        .select('slug, name')
        .eq('is_archived', false)
        .order('name')
        .limit(100);
      return data || [];
    },
  });

  const { data: readings } = useQuery({
    queryKey: ['attach-picker-readings'],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from('reading_content')
        .select('id, title')
        .eq('is_published', true)
        .order('title')
        .limit(100);
      return data || [];
    },
  });

  const { data: videoPlaylists } = useQuery({
    queryKey: ['attach-picker-video-playlists'],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from('video_playlists')
        .select('id, name')
        .eq('is_hidden', false)
        .order('name')
        .limit(100);
      return data || [];
    },
  });

  const { data: tracks } = useQuery({
    queryKey: ['attach-picker-tracks'],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from('audio_content')
        .select('id, title')
        .order('title')
        .limit(200);
      return data || [];
    },
  });

  const { data: breathingExercises } = useQuery({
    queryKey: ['attach-picker-breathing'],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from('breathing_exercises')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
        .limit(100);
      return data || [];
    },
  });

  const { data: reflections } = useQuery({
    queryKey: ['attach-picker-reflections'],
    enabled: open,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('reflections')
        .select('id, title')
        .eq('is_active', true)
        .order('title')
        .limit(200);
      return (data as { id: string; title: string }[]) || [];
    },
  });

  const loading = !playlists && !routines && !programs;

  const all: EntityRow[] = useMemo(() => {
    const rows: EntityRow[] = [
      ...TOOL_ENTITIES,
      ...(playlists?.map((p) => ({
        type: 'Playlist',
        label: p.name,
        url: `/app/player/playlist/${p.id}`,
        Icon: Headphones,
      })) ?? []),
      ...(tracks?.map((t) => ({
        type: 'Track',
        label: t.title,
        url: `/app/player/${t.id}`,
        Icon: Play,
      })) ?? []),
      ...(videoPlaylists?.map((p) => ({
        type: 'Video Playlist',
        label: p.name,
        url: `/app/watch/playlist/${p.id}`,
        Icon: Film,
      })) ?? []),
      ...(routines?.map((r) => ({
        type: 'Routine',
        label: `${r.emoji || '🚀'} ${r.title}`,
        url: `/app/routines/${r.id}`,
        Icon: Sparkles,
      })) ?? []),
      ...(breathingExercises?.map((b) => ({
        type: 'Breathing',
        label: b.name,
        url: `/app/breathe?exercise=${b.id}`,
        Icon: Wind,
      })) ?? []),
      ...(reflections?.map((r) => ({
        type: 'Reflection',
        label: r.title,
        url: `/app/reflections/${r.id}`,
        Icon: PenLine,
      })) ?? []),
      ...(programs?.map((p) => ({
        type: 'Program',
        label: p.title,
        url: `/app/myprograms/${p.slug}`,
        Icon: GraduationCap,
      })) ?? []),
      ...(channels?.map((c) => ({
        type: 'Channel',
        label: c.name,
        url: `/app/channels/${c.slug}`,
        Icon: MessageCircle,
      })) ?? []),
      ...(readings?.map((r) => ({
        type: 'Reading',
        label: r.title,
        url: `/app/read/${r.id}`,
        Icon: BookOpen,
      })) ?? []),
    ];
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.label.toLowerCase().includes(needle) ||
        r.type.toLowerCase().includes(needle),
    );
  }, [q, playlists, tracks, videoPlaylists, routines, breathingExercises, reflections, programs, channels, readings]);

  // Group by type for display
  const grouped = useMemo(() => {
    const g = new Map<string, EntityRow[]>();
    for (const row of all) {
      const key = row.type === 'tool' ? '🎯 Tools' : `📌 ${row.type}s`;
      if (!g.has(key)) g.set(key, []);
      g.get(key)!.push(row);
    }
    return g;
  }, [all]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-7 px-2 gap-1.5 text-xs', className)}
          title="Attach an in-app link (playlist, routine, tool, ...)"
        >
          <Paperclip className="h-3.5 w-3.5" />
          Attach
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0" sideOffset={8}>
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search playlists, routines, tools..."
              className="pl-9 h-9"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Inserts a link on its own line — renders as a rich card in the post.
          </p>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
            </div>
          )}
          {!loading && all.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">
              No matches
            </p>
          )}
          {!loading &&
            Array.from(grouped.entries()).map(([group, rows]) => (
              <div key={group} className="mt-2">
                <p className="px-3 py-1 text-xs font-medium text-muted-foreground">
                  {group}
                </p>
                {rows.slice(0, 20).map((row) => {
                  const Icon = row.Icon;
                  return (
                    <button
                      key={row.url}
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted/80 transition-colors flex items-center gap-2.5"
                      onClick={() => {
                        onPick(row.url);
                        setOpen(false);
                        setQ('');
                      }}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{row.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}