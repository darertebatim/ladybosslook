import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Search, X, Clock, Video, CalendarPlus, ChevronRight } from "lucide-react";
import { VideoPlaylistCard } from "@/components/video/VideoPlaylistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { isNativeApp } from "@/lib/platform";
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
import heroStormVideo from "@/assets/watch-hero-storm.mp4";
import { WatchCategoryPill } from "@/components/video/WatchCategoryPill";
import { useUserPreferredLanguage, preferredLanguageSorter } from "@/hooks/useUserPreferredLanguage";
import { PromoBanner } from "@/components/app/PromoBanner";
import { HomeBanner } from "@/components/app/HomeBanner";

const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All', flag: '🌐' },
  { value: 'american', label: 'American', flag: '🇺🇸' },
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
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  }, []);

  // Add to routines
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

  const handleAddWatchToRoutines = useCallback(() => {
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
      toast.success(t('watch.addedToRoutines'));
    } catch (error) {
      console.error('Failed to add routine:', error);
      toast.error(t('watch.addToRoutinesFailed'));
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
  const userLang = useUserPreferredLanguage();
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

  const filtered = playlists?.filter(isVisible)?.filter(filterLang)?.filter(p => selectedCategory === 'all' || p.category === selectedCategory)?.filter(filterSearch)?.filter(filterProgress)?.sort(preferredLanguageSorter(userLang)) || [];

  const continueWatching = playlists?.filter(p => {
    const s = getStats(p.id);
    const pct = s.trackCount > 0 ? (s.completedTracks / s.trackCount) * 100 : 0;
    return pct > 0 && pct < 100 && !isLocked(p) && isVisible(p) && filterLang(p);
  }) || [];

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a1628 0%, #152238 40%, #1a2d4a 100%)' }}>
        <div className="fixed top-0 left-0 right-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="h-12 flex items-center px-4"><Skeleton className="h-6 w-24 bg-white/10" /></div>
          <div className="px-4 pb-3 flex gap-4"><Skeleton className="w-16 h-8 rounded-full bg-white/10" /><Skeleton className="w-16 h-8 rounded-full bg-white/10" /><Skeleton className="w-16 h-8 rounded-full bg-white/10" /></div>
        </div>
        <div style={{ height: 'calc(160px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />
        <div className="flex-1 overflow-y-auto p-4"><div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl bg-white/10" />)}</div></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#132240' }}>
      {/* Hero Video Background - behind the header */}
      <div ref={heroRef} className="fixed top-0 left-0 right-0 z-0 h-[420px] overflow-hidden" style={{ transform: `translateY(${-scrollY * 0.4}px)` }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-50"
          src={heroStormVideo}
        />
        {/* Smooth gradient fade from video into page background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, transparent 30%, rgba(19,34,64,0.5) 60%, #132240 100%)' }} />
        {/* Lightning flash overlay */}
        <div className="absolute inset-0 bg-white/5 animate-[lightning-flash_8s_ease-in-out_infinite]" />
      </div>

      {/* Glass Header */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Fully transparent header - no backdrop */}
        
        <div className="relative z-10">
          {/* Title bar */}
          <div className="h-12 flex items-center justify-between px-4">
            {showSearch ? (
              <div className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input
                    placeholder={t('watch.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-white/10 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
                    autoFocus
                  />
                </div>
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-2 -mr-2">
                  <X className="h-5 w-5 text-white/70" />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-white tracking-tight">{t('watch.title')}</h1>
                <div className="flex items-center gap-1">
                  <AddedToRoutineButton isAdded={!!isWatchAdded} onAddClick={handleAddWatchToRoutines} iconOnly />
                  <button onClick={() => setShowSearch(true)} className="p-2 -mr-2">
                    <Search className="h-5 w-5 text-white/70" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Category pills - horizontal scroll */}
          <div className="px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto py-1.5 scrollbar-hide">
              {categories.map((cat) => {
                const config = categoryConfig[cat] || { name: cat, icon: 'Sparkles', color: 'purple' };
                return (
                  <WatchCategoryPill
                    key={cat}
                    name={config.name}
                    isSelected={selectedCategory === cat}
                    onClick={() => { haptic.selection(); setSelectedCategory(cat); }}
                  />
                );
              })}
            </div>
          </div>

          {/* Filters row */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex gap-2">
              {(['all', 'in_progress', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setProgressFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    progressFilter === f
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'text-white/50'
                  )}
                >
                  {f === 'all' ? t('watch.filterAll') : f === 'in_progress' ? t('watch.filterInProgress') : t('watch.filterCompleted')}
                </button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/70 backdrop-blur-sm">
                  {selectedLang.value === 'persian' ? <PersianFlag size={14} /> : <span className="text-sm">{selectedLang.flag}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-40 p-1 bg-[#1a2d4a]/95 backdrop-blur-xl border-white/10">
                {LANGUAGE_OPTIONS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => handleLanguageChange(l.value)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                      preferredLanguage === l.value ? 'bg-white/15 text-white font-medium' : 'text-white/70'
                    )}
                  >
                    {l.value === 'persian' ? <PersianFlag size={14} /> : <span>{l.flag}</span>} <span>{l.label}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div style={{ height: 'calc(190px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto overscroll-contain relative z-10" onScroll={handleScroll}>
        <div className="p-4 pb-safe space-y-6">
          {/* Promo Banner - Watch Page */}
          <PromoBanner location="watch" className="" />
          <HomeBanner location="watch" className="" />

          {/* Continue Watching */}
          {progressFilter === 'all' && selectedCategory === 'all' && !searchQuery && continueWatching.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-sky-400" />
                <h2 className="text-lg font-semibold text-white">{t('watch.continueWatching')}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {continueWatching.slice(0, 4).map((p) => {
                  const s = getStats(p.id);
                  return <VideoPlaylistCard key={p.id} id={p.id} name={p.name} description={p.description} coverImageUrl={p.cover_image_url} category={p.category} language={p.language} isFree={p.is_free} isLocked={isLocked(p)} programSlug={p.program_slug} requiresSubscription={p.requires_subscription} isSubscribed={hasPlus} trackCount={s.trackCount} completedTracks={s.completedTracks} totalDuration={s.totalDuration} />;
                })}
              </div>
            </div>
          )}

          {/* All Playlists */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
              {selectedCategory === 'all' ? t('watch.allPlaylists') : categoryConfig[selectedCategory]?.name || selectedCategory}
            </h2>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-white/60"><p className="text-base">{t('watch.noPlaylists')}</p></div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filtered.map((p) => {
                  const s = getStats(p.id);
                  return <VideoPlaylistCard key={p.id} id={p.id} name={p.name} description={p.description} coverImageUrl={p.cover_image_url} category={p.category} language={p.language} isFree={p.is_free} isLocked={isLocked(p)} programSlug={p.program_slug} requiresSubscription={p.requires_subscription} isSubscribed={hasPlus} trackCount={s.trackCount} completedTracks={s.completedTracks} totalDuration={s.totalDuration} />;
                })}
              </div>
            )}

            {/* CTA to support chat */}
            <div className="pt-4 pb-2">
              <p className="text-sm text-white/50">{t('watch.notSeeingVideos')}</p>
              <button
                onClick={() => navigate('/app/chat?draft=' + encodeURIComponent(t('watch.draftPrefix')))}
                className="text-sm text-blue-400 font-medium flex items-center gap-1 mt-1"
              >
                {t('watch.tellUsWhat')} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <RoutinePreviewSheet
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[syntheticWatchTask]}
        routineTitle={t('watch.watchVideos')}
        onSave={handleSaveRoutine}
        isSaving={addPlanMutation.isPending}
      />
    </div>
  );
}
