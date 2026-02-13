import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, X, Clock, LayoutGrid, Brain, Dumbbell, Waves, Heart, BookOpen, GraduationCap, Podcast, Globe } from "lucide-react";
import { PlaylistCard } from "@/components/audio/PlaylistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { isNativeApp } from "@/lib/platform";
import { usePlayerData } from "@/hooks/useAppData";
import { PlayerSkeleton } from "@/components/app/skeletons";
import { CategoryCircle } from "@/components/app/CategoryCircle";
import { cn } from "@/lib/utils";
import { PromoBanner } from "@/components/app/PromoBanner";
import { PlayerTour, TourHelpButton } from "@/components/app/tour";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All', flag: '🌐' },
  { value: 'american', label: 'English', flag: '🇺🇸' },
  { value: 'persian', label: 'فارسی', flag: '🦁' },
  { value: 'turkish', label: 'Türkçe', flag: '🇹🇷' },
  { value: 'spanish', label: 'Español', flag: '🇪🇸' },
];

// Category configuration with icons and colors
const categoryConfig: Record<string, { name: string; icon: string; color: string }> = {
  all: { name: 'All', icon: 'LayoutGrid', color: 'purple' },
  meditate: { name: 'Meditate', icon: 'Brain', color: 'indigo' },
  workout: { name: 'Workout', icon: 'Dumbbell', color: 'orange' },
  soundscape: { name: 'Soundscape', icon: 'Waves', color: 'teal' },
  affirmation: { name: 'Affirmations', icon: 'Heart', color: 'pink' },
  audiobook: { name: 'Audiobooks', icon: 'BookOpen', color: 'blue' },
  course: { name: 'Course', icon: 'GraduationCap', color: 'green' },
  podcast: { name: 'Podcast', icon: 'Podcast', color: 'rose' },
};

export default function AppPlayer() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [progressFilter, setProgressFilter] = useState<"all" | "in_progress" | "completed">("all");
  const [preferredLanguage, setPreferredLanguage] = useState(() => {
    return localStorage.getItem('player-language') || 'all';
  });

  const handleLanguageChange = useCallback((lang: string) => {
    setPreferredLanguage(lang);
    localStorage.setItem('player-language', lang);
  }, []);

  const selectedLang = LANGUAGE_OPTIONS.find(l => l.value === preferredLanguage) || LANGUAGE_OPTIONS[0];

  const [startTour, setStartTour] = useState<(() => void) | null>(null);

  const handleTourReady = useCallback((tourStart: () => void) => {
    setStartTour(() => tourStart);
  }, []);

  // Read initial category from URL query param
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categoryConfig[categoryParam]) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Use centralized data hook with parallel fetching
  const { playlists, playlistItems, progressData, enrollments, programs, isLoading } = usePlayerData();

  // Memoized playlist stats calculation - O(1) lookups
  const playlistStats = useMemo(() => {
    const statsMap = new Map<string, { trackCount: number; totalDuration: number; completedTracks: number; coverImage: string | null }>();
    
    if (!playlists || !playlistItems) return statsMap;
    
    // Pre-compute progress lookup map
    const progressMap = new Map<string, boolean>();
    progressData?.forEach(p => progressMap.set(p.audio_id, p.completed || false));
    
    playlists.forEach(playlist => {
      const items = playlistItems.filter(item => item.playlist_id === playlist.id);
      const trackCount = items.length;
      const totalDuration = items.reduce((sum, item) => sum + (item.audio_content?.duration_seconds || 0), 0);
      const completedTracks = items.filter(item => progressMap.get(item.audio_id)).length;
      const coverImage = items[0]?.audio_content?.cover_image_url || null;
      
      statsMap.set(playlist.id, { trackCount, totalDuration, completedTracks, coverImage });
    });
    
    return statsMap;
  }, [playlists, playlistItems, progressData]);

  const getPlaylistStats = (playlistId: string) => {
    return playlistStats.get(playlistId) || { trackCount: 0, totalDuration: 0, completedTracks: 0, coverImage: null };
  };

  const isPlaylistLocked = (playlist: any) => {
    if (playlist.is_free) return false;
    if (!playlist.program_slug) return false;
    return !enrollments?.includes(playlist.program_slug);
  };

  const isPlaylistAvailableOnMobile = (playlist: any) => {
    // Enrolled users always see their playlists
    if (playlist.program_slug && enrollments?.includes(playlist.program_slug)) {
      return true;
    }
    
    // For non-enrolled users: respect the available_on_mobile toggle
    if (isNativeApp() && playlist.available_on_mobile === false) {
      return false;
    }
    return true;
  };

  const filterPlaylistByProgress = (playlist: any) => {
    const stats = getPlaylistStats(playlist.id);
    const progress = stats.trackCount > 0 ? (stats.completedTracks / stats.trackCount) * 100 : 0;
    
    if (progressFilter === "in_progress") return progress > 0 && progress < 100;
    if (progressFilter === "completed") return progress >= 100;
    return true;
  };

  const filterPlaylistBySearch = (playlist: any) => {
    if (!searchQuery) return true;
    return playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           playlist.description?.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Define category order
  const categoryOrder = ['all', 'podcast', 'course', 'audiobook', 'meditate', 'workout', 'soundscape', 'affirmation'];
  
  // Get available categories from playlists, sorted by defined order
  const availableCategoriesSet = new Set(
    playlists
      ?.filter(p => !p.is_hidden && isPlaylistAvailableOnMobile(p))
      ?.map(p => p.category)
      .filter(Boolean) || []
  );
  
  const availableCategories = categoryOrder.filter(cat => cat === 'all' || availableCategoriesSet.has(cat));

  // Filter by language
  const filterByLanguage = (playlist: any) => {
    if (preferredLanguage === 'all') return true;
    return playlist.language === preferredLanguage;
  };

  // Filter playlists based on selected category
  const filteredPlaylists = playlists
    ?.filter(p => !p.is_hidden)
    ?.filter(isPlaylistAvailableOnMobile)
    ?.filter(filterByLanguage)
    ?.filter(p => selectedCategory === 'all' || p.category === selectedCategory)
    ?.filter(filterPlaylistBySearch)
    ?.filter(filterPlaylistByProgress) || [];

  // Continue Learning section
  const continueListening = playlists?.filter(playlist => {
    const stats = getPlaylistStats(playlist.id);
    const progress = stats.trackCount > 0 ? (stats.completedTracks / stats.trackCount) * 100 : 0;
    return progress > 0 && progress < 100 && !isPlaylistLocked(playlist) && isPlaylistAvailableOnMobile(playlist) && filterByLanguage(playlist);
  }).sort((a, b) => {
    const itemsA = playlistItems?.filter(i => i.playlist_id === a.id) || [];
    const itemsB = playlistItems?.filter(i => i.playlist_id === b.id) || [];
    
    const lastPlayedA = Math.max(...itemsA.map(i => {
      const p = progressData?.find(pr => pr.audio_id === i.audio_id);
      return p ? new Date(p.last_played_at).getTime() : 0;
    }));
    
    const lastPlayedB = Math.max(...itemsB.map(i => {
      const p = progressData?.find(pr => pr.audio_id === i.audio_id);
      return p ? new Date(p.last_played_at).getTime() : 0;
    }));
    
    return lastPlayedB - lastPlayedA;
  }) || [];

  const renderPlaylistGrid = (items: any[]) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>No playlists found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        {items.map((playlist) => {
          const stats = getPlaylistStats(playlist.id);
          return (
            <PlaylistCard
              key={playlist.id}
              id={playlist.id}
              name={playlist.name}
              description={playlist.description}
              coverImageUrl={playlist.cover_image_url}
              category={playlist.category}
              isFree={playlist.is_free}
              isLocked={isPlaylistLocked(playlist)}
              programSlug={playlist.program_slug}
              trackCount={stats.trackCount}
              completedTracks={stats.completedTracks}
              totalDuration={stats.totalDuration}
            />
          );
        })}
      </div>
    );
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Fixed Header Skeleton */}
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="h-12 flex items-center justify-between px-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="px-4 pb-3">
            <div className="flex gap-4 overflow-x-auto py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 pb-3 flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>
        
        {/* Header Spacer */}
        <div style={{ height: 'calc(160px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />
        
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          <PlayerSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Fixed Header */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Header Row */}
        <div className="h-12 flex items-center justify-between px-4">
          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search audio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  autoFocus
                />
              </div>
              <button 
                onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                className="p-2 -mr-2"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold">Listen</h1>
              <div className="flex items-center">
                {startTour && (
                  <TourHelpButton onClick={startTour} />
                )}
                <button onClick={() => setShowSearch(true)} className="tour-player-search p-2 -mr-2">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Category Circles */}
        <div className="tour-player-categories px-4 pb-3">
          <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide">
            {availableCategories.map((cat) => {
              const config = categoryConfig[cat] || { name: cat, icon: 'Sparkles', color: 'purple' };
              return (
                <CategoryCircle
                  key={cat}
                  name={config.name}
                  icon={config.icon}
                  color={config.color}
                  isSelected={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                />
              );
            })}
          </div>
        </div>

        {/* Progress Filter Pills + Language Selector */}
        <div className="tour-player-progress-filter px-4 pb-3 flex items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'in_progress', 'completed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setProgressFilter(filter)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  progressFilter === filter
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {filter === 'all' ? 'All' : filter === 'in_progress' ? 'In Progress' : 'Completed'}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                <span className="text-sm">{selectedLang.flag}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-1">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => handleLanguageChange(lang.value)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    preferredLanguage === lang.value
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Header Spacer - accounts for header + categories + filter pills */}
      <div style={{ height: 'calc(210px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 pb-safe space-y-6">
          {/* Continue Learning Section */}
          {progressFilter === "all" && selectedCategory === "all" && !searchQuery && continueListening.length > 0 && (
            <div className="space-y-3 tour-continue-listening">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Continue Learning</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {continueListening.slice(0, 4).map((playlist) => {
                  const stats = getPlaylistStats(playlist.id);
                  return (
                    <PlaylistCard
                      key={playlist.id}
                      id={playlist.id}
                      name={playlist.name}
                      description={playlist.description}
                      coverImageUrl={playlist.cover_image_url}
                      category={playlist.category}
                      isFree={playlist.is_free}
                      isLocked={isPlaylistLocked(playlist)}
                      programSlug={playlist.program_slug}
                      trackCount={stats.trackCount}
                      completedTracks={stats.completedTracks}
                      totalDuration={stats.totalDuration}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* All Playlists Section */}
          <div className="space-y-3 tour-playlists">
            <h2 className="tour-playlists-header text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedCategory === 'all' ? 'All Playlists' : categoryConfig[selectedCategory]?.name || selectedCategory}
            </h2>
            
            {/* Promo Banner - Listen Page (under heading) */}
            <PromoBanner location="listen" className="mb-2" />
            
            {renderPlaylistGrid(filteredPlaylists)}
          </div>
        </div>
      </div>
      
      {/* Feature Tour */}
      <PlayerTour isFirstVisit={true} onTourReady={handleTourReady} />
    </div>
  );
}