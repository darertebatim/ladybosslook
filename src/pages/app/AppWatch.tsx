import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, Clock, Video, CalendarPlus } from "lucide-react";
import { VideoPlaylistCard } from "@/components/video/VideoPlaylistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { isNativeApp } from "@/lib/platform";
import { CategoryCircle } from "@/components/app/CategoryCircle";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollments } from "@/hooks/useAppData";
import { useSubscription } from "@/hooks/useSubscription";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PersianFlag } from "@/components/ui/PersianFlag";
import { AddedToRoutineButton } from "@/components/app/AddedToRoutineButton";
import { useExistingProTask } from "@/hooks/usePlaylistRoutine";
import { useAddRoutinePlan, RoutinePlanTask } from "@/hooks/useRoutinePlans";
import { RoutinePreviewSheet, EditedTask } from "@/components/app/RoutinePreviewSheet";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";

const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All', flag: '🌐' },
  { value: 'american', label: 'English', flag: '🇺🇸' },
  { value: 'persian', label: 'Persian', flag: null },
  { value: 'turkish', label: 'Türkçe', flag: '🇹🇷' },
  { value: 'spanish', label: 'Español', flag: '🇪🇸' },
];

const categoryConfig: Record<string, { name: string; icon: string; color: string }> = {
  all: { name: 'All', icon: 'LayoutGrid', color: 'purple' },
  tutorial: { name: 'Tutorial', icon: 'BookOpen', color: 'blue' },
  course: { name: 'Course', icon: 'GraduationCap', color: 'green' },
  podcast: { name: 'Podcast', icon: 'Podcast', color: 'rose' },
  workshop: { name: 'Workshop', icon: 'Wrench', color: 'orange' },
  motivation: { name: 'Motivation', icon: 'Heart', color: 'pink' },
  vlog: { name: 'Vlog', icon: 'Video', color: 'teal' },
};

export default function AppWatch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [progressFilter, setProgressFilter] = useState<"all" | "in_progress" | "completed">("all");
  const { hasAccessToProgram } = useSubscription();
  const hasPlus = hasAccessToProgram('simora-plus');
  const [preferredLanguage, setPreferredLanguage] = useState(() => localStorage.getItem('watch-language') || 'all');
  const handleLanguageChange = useCallback((lang: string) => { setPreferredLanguage(lang); localStorage.setItem('watch-language', lang); }, []);
  const selectedLang = LANGUAGE_OPTIONS.find(l => l.value === preferredLanguage) || LANGUAGE_OPTIONS[0];
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);

  // Add to rituals - synthetic "Watch Videos" task
  const { data: isWatchAdded } = useExistingProTask('route', '/app/watch');
  const addPlanMutation = useAddRoutinePlan();

  const syntheticWatchTask: RoutinePlanTask = {
    id: 'synthetic-watch-task',
    plan_id: 'synthetic-watch-task',
    title: 'Watch Videos',
    description: null,
    icon: '📺',
    color: 'sky',
    task_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    linked_playlist_id: null,
    pro_link_type: 'route',
    pro_link_value: '/app/watch',
    linked_playlist: null,
  };

  const handleAddWatchToRituals = useCallback(() => {
    haptic.medium();
    setShowRoutineSheet(true);
  }, []);

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    try {
      await addPlanMutation.mutateAsync({
        planId: 'synthetic-watch-task',
        syntheticTasks: [syntheticWatchTask],
        editedTasks,
      });
      setShowRoutineSheet(false);
      toast.success('Added to your rituals! 📺');
    } catch (error) {
      console.error('Failed to add ritual:', error);
      toast.error('Failed to add to rituals');
    }
  };

  const { data: playlists, isLoading: playlistsLoading } = useQuery({
    queryKey: ['video-playlists-app'],
    queryFn: async () => {
      const { data, error } = await supabase.from('video_playlists').select('*').eq('is_hidden', false).order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: playlistItems } = useQuery({
    queryKey: ['video-playlist-items-app'],
    queryFn: async () => {
      const { data, error } = await supabase.from('video_playlist_items').select('*, video_content(id, title, duration_seconds, thumbnail_url)').order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: progressData } = useQuery({
    queryKey: ['video-progress-app'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from('video_progress').select('*').eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollments } = useEnrollments();
  const isLoading = playlistsLoading;

  const playlistStats = useMemo(() => {
    const map = new Map<string, { trackCount: number; totalDuration: number; completedTracks: number }>();
    if (!playlists || !playlistItems) return map;
    const progMap = new Map<string, boolean>();
    progressData?.forEach(p => progMap.set(p.video_id, p.completed || false));
    playlists.forEach(pl => {
      const items = playlistItems.filter(i => i.playlist_id === pl.id);
      map.set(pl.id, {
        trackCount: items.length,
        totalDuration: items.reduce((s, i) => s + (i.video_content?.duration_seconds || 0), 0),
        completedTracks: items.filter(i => progMap.get(i.video_id)).length,
      });
    });
    return map;
  }, [playlists, playlistItems, progressData]);

  const getStats = (id: string) => playlistStats.get(id) || { trackCount: 0, totalDuration: 0, completedTracks: 0 };

  const isLocked = (p: any) => {
    if (p.is_free) return false;
    if (p.requires_subscription) return false;
    if (!p.program_slug) return false;
    return !enrollments?.includes(p.program_slug);
  };

  const isVisible = (p: any) => {
    if (p.program_slug && enrollments?.includes(p.program_slug)) return true;
    if (isNativeApp() && p.available_on_mobile === false) return false;
    return true;
  };

  const filterLang = (p: any) => {
    if (preferredLanguage === 'all') return true;
    if (p.language === 'all' || !p.language) return true;
    return p.language === preferredLanguage;
  };

  const filterProgress = (p: any) => {
    const s = getStats(p.id);
    const pct = s.trackCount > 0 ? (s.completedTracks / s.trackCount) * 100 : 0;
    if (progressFilter === 'in_progress') return pct > 0 && pct < 100;
    if (progressFilter === 'completed') return pct >= 100;
    return true;
  };

  const filterSearch = (p: any) => {
    if (!searchQuery) return true;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const catOrder = ['all', 'tutorial', 'course', 'podcast', 'workshop', 'motivation', 'vlog'];
  const availableCats = new Set(playlists?.filter(p => isVisible(p))?.map(p => p.category).filter(Boolean) || []);
  const categories = catOrder.filter(c => c === 'all' || availableCats.has(c));

  const filtered = playlists?.filter(isVisible)?.filter(filterLang)?.filter(p => selectedCategory === 'all' || p.category === selectedCategory)?.filter(filterSearch)?.filter(filterProgress) || [];

  const continueWatching = playlists?.filter(p => {
    const s = getStats(p.id);
    const pct = s.trackCount > 0 ? (s.completedTracks / s.trackCount) * 100 : 0;
    return pct > 0 && pct < 100 && !isLocked(p) && isVisible(p) && filterLang(p);
  }) || [];

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#E8F4FE] dark:bg-sky-950/90 rounded-b-3xl shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="h-12 flex items-center px-4"><Skeleton className="h-6 w-24" /></div>
          <div className="px-4 pb-3 flex gap-4"><Skeleton className="w-16 h-16 rounded-full" /><Skeleton className="w-16 h-16 rounded-full" /><Skeleton className="w-16 h-16 rounded-full" /></div>
        </div>
        <div style={{ height: 'calc(160px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />
        <div className="flex-1 overflow-y-auto p-4"><div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}</div></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#E8F4FE] dark:bg-sky-950/90 rounded-b-3xl shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="h-12 flex items-center justify-between px-4">
          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search videos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" autoFocus />
              </div>
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-2 -mr-2"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold">Watch</h1>
              <div className="flex items-center gap-1">
                <AddedToRoutineButton
                  isAdded={!!isWatchAdded}
                  onAddClick={handleAddWatchToRituals}
                  iconOnly
                />
                <button onClick={() => setShowSearch(true)} className="p-2 -mr-2"><Search className="h-5 w-5 text-muted-foreground" /></button>
              </div>
            </>
          )}
        </div>

        <div className="px-4 pb-3">
          <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide">
            {categories.map((cat) => {
              const config = categoryConfig[cat] || { name: cat, icon: 'Sparkles', color: 'purple' };
              return <CategoryCircle key={cat} name={config.name} icon={config.icon} color={config.color} isSelected={selectedCategory === cat} onClick={() => setSelectedCategory(cat)} />;
            })}
          </div>
        </div>

        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'in_progress', 'completed'] as const).map((f) => (
              <button key={f} onClick={() => setProgressFilter(f)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors', progressFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : 'Completed'}
              </button>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {selectedLang.value === 'persian' ? <PersianFlag size={14} /> : <span className="text-sm">{selectedLang.flag}</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-1">
              {LANGUAGE_OPTIONS.map((l) => (
                <button key={l.value} onClick={() => handleLanguageChange(l.value)} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors', preferredLanguage === l.value ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted')}>
                  {l.value === 'persian' ? <PersianFlag size={14} /> : <span>{l.flag}</span>} <span>{l.label}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div style={{ height: 'calc(210px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 pb-safe space-y-6">
          {progressFilter === 'all' && selectedCategory === 'all' && !searchQuery && continueWatching.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Continue Watching</h2></div>
              <div className="grid grid-cols-2 gap-4">
                {continueWatching.slice(0, 4).map((p) => {
                  const s = getStats(p.id);
                  return <VideoPlaylistCard key={p.id} id={p.id} name={p.name} description={p.description} coverImageUrl={p.cover_image_url} category={p.category} language={p.language} isFree={p.is_free} isLocked={isLocked(p)} programSlug={p.program_slug} requiresSubscription={p.requires_subscription} isSubscribed={hasPlus} trackCount={s.trackCount} completedTracks={s.completedTracks} totalDuration={s.totalDuration} />;
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedCategory === 'all' ? 'All Playlists' : categoryConfig[selectedCategory]?.name || selectedCategory}
            </h2>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><p>No playlists found</p></div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filtered.map((p) => {
                  const s = getStats(p.id);
                  return <VideoPlaylistCard key={p.id} id={p.id} name={p.name} description={p.description} coverImageUrl={p.cover_image_url} category={p.category} language={p.language} isFree={p.is_free} isLocked={isLocked(p)} programSlug={p.program_slug} requiresSubscription={p.requires_subscription} isSubscribed={hasPlus} trackCount={s.trackCount} completedTracks={s.completedTracks} totalDuration={s.totalDuration} />;
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[syntheticWatchTask]}
        routineTitle="Watch Videos"
        onSave={handleSaveRoutine}
        isSaving={addPlanMutation.isPending}
      />
    </div>
  );
}
