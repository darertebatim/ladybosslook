import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, X, Clock, LayoutGrid, Brain, Dumbbell, Waves, Heart, BookOpen, GraduationCap, Podcast, Globe, Crown, ChevronRight } from "lucide-react";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
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
import { useSubscription } from "@/hooks/useSubscription";
import { PaywallSheet } from "@/components/app/PaywallSheet";
import { haptic } from "@/lib/haptics";
import { PersianFlag } from "@/components/ui/PersianFlag";
import { useScrollRestore } from "@/hooks/useScrollRestore";
import heroStormVideo from "@/assets/watch-hero-storm.mp4";
import { WatchCategoryPill } from "@/components/video/WatchCategoryPill";
import { useUserPreferredLanguage, preferredLanguageSorter } from "@/hooks/useUserPreferredLanguage";
import { LanguagePreferencePopup, shouldShowLanguagePopup } from "@/components/app/LanguagePreferencePopup";

const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All', flag: '🌐' },
  { value: 'american', label: 'English', flag: '🇺🇸' },
  { value: 'persian', label: 'Persian', flag: null },
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [progressFilter, setProgressFilter] = useState<"all" | "in_progress" | "completed">("all");
  const [showPaywall, setShowPaywall] = useState(false);
  const { hasAccessToProgram } = useSubscription();
  const hasSoundscapeAccess = hasAccessToProgram('simora-plus');
  const [preferredLanguage, setPreferredLanguage] = useState('all');

  const handleLanguageChange = useCallback((lang: string) => {
    setPreferredLanguage(lang);
    localStorage.setItem('player-language', lang);
  }, []);

  const selectedLang = LANGUAGE_OPTIONS.find(l => l.value === preferredLanguage) || LANGUAGE_OPTIONS[0];

  const [startTour, setStartTour] = useState<(() => void) | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollRef: listenScrollRef } = useScrollRestore('listen_scroll', { autoSave: true });
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  }, []);

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
  const userLang = useUserPreferredLanguage();
  const [showLangPopup, setShowLangPopup] = useState(false);

  // Show language preference popup on first visit if not set
  useEffect(() => {
    if (!isLoading && shouldShowLanguagePopup(userLang)) {
      const timer = setTimeout(() => setShowLangPopup(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, userLang]);

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
    if (playlist.requires_subscription) return false; // Plus playlists gate inside detail page
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

  // Filter by language - "all" language playlists always show
  const filterByLanguage = (playlist: any) => {
    if (preferredLanguage === 'all') return true;
    if (playlist.language === 'all' || !playlist.language) return true;
    return playlist.language === preferredLanguage;
  };

  // Filter and sort playlists - preferred language first
  const filteredPlaylists = playlists
    ?.filter(p => !p.is_hidden)
    ?.filter(isPlaylistAvailableOnMobile)
    ?.filter(filterByLanguage)
    ?.filter(p => selectedCategory === 'all' || p.category === selectedCategory)
    ?.filter(filterPlaylistBySearch)
    ?.filter(filterPlaylistByProgress)
    ?.sort(preferredLanguageSorter(userLang)) || [];

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
        <div className="text-center py-12 text-white/60">
          <p className="text-base">No playlists found</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
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
              language={playlist.language}
              isFree={playlist.is_free}
              isLocked={isPlaylistLocked(playlist)}
               programSlug={playlist.program_slug}
               requiresSubscription={playlist.requires_subscription}
               isSubscribed={hasSoundscapeAccess}
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
      <div className="flex flex-col h-full overflow-hidden" style={{ background: '#132240' }}>
        <div className="fixed top-0 left-0 right-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="h-12 flex items-center px-4"><Skeleton className="h-6 w-24 bg-white/10" /></div>
          <div className="px-4 pb-3 flex gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-16 h-8 rounded-full bg-white/10" />)}
          </div>
          <div className="px-4 pb-3 flex gap-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-7 w-20 rounded-full bg-white/10" />)}
          </div>
        </div>
        <div style={{ height: 'calc(160px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl bg-white/10" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#132240' }}>
      {/* Hero Video Background */}
      <div ref={heroRef} className="fixed top-0 left-0 right-0 z-0 h-[420px] overflow-hidden" style={{ transform: `translateY(${-scrollY * 0.4}px)` }}>
        <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-50" src={heroStormVideo} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, transparent 30%, rgba(19,34,64,0.5) 60%, #132240 100%)' }} />
        <div className="absolute inset-0 bg-white/5 animate-[lightning-flash_8s_ease-in-out_infinite]" />
      </div>

      {/* Glass Header */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="relative z-10">
          {/* Title bar */}
          <div className="h-12 flex items-center justify-between px-4">
            {showSearch ? (
              <div className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input
                    placeholder="Search audio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-white/10 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
                    autoFocus
                  />
                </div>
                <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="p-2 -mr-2">
                  <X className="h-5 w-5 text-white/70" />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-white tracking-tight">Listen</h1>
                <div className="flex items-center">
                  {startTour && <TourHelpButton onClick={startTour} />}
                  <button onClick={() => setShowSearch(true)} className="tour-player-search p-2 -mr-2">
                    <Search className="h-5 w-5 text-white/70" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Category pills */}
          <div className="tour-player-categories px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto py-1.5 scrollbar-hide">
              {availableCategories.map((cat) => {
                const config = categoryConfig[cat] || { name: cat, icon: 'Sparkles', color: 'purple' };
                const isSoundscapeLocked = cat === 'soundscape' && !hasSoundscapeAccess;
                return (
                  <div key={cat} className="relative">
                    {isSoundscapeLocked && (
                      <div className="absolute -top-2 -left-1 z-10 flex items-center gap-0.5 bg-amber-200 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        <Crown className="h-2.5 w-2.5" /> PLUS
                      </div>
                    )}
                    <WatchCategoryPill
                      name={config.name}
                      isSelected={selectedCategory === cat}
                      onClick={() => {
                        if (isSoundscapeLocked) {
                          haptic.light();
                          setShowPaywall(true);
                        } else {
                          haptic.selection();
                          setSelectedCategory(cat);
                        }
                      }}
                    />
                    {isSoundscapeLocked && (
                      <div className="absolute -bottom-0.5 -right-0.5 z-10 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                        <FluentEmoji emoji="🔒" size={12} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters row */}
          <div className="tour-player-progress-filter px-4 pb-3 flex items-center justify-between">
            <div className="flex gap-2">
              {(['all', 'in_progress', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setProgressFilter(filter)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    progressFilter === filter
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'text-white/50 hover:text-white/70'
                  )}
                >
                  {filter === 'all' ? 'All' : filter === 'in_progress' ? 'In Progress' : 'Completed'}
                </button>
              ))}
            </div>

            {/* Language Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/70 backdrop-blur-sm">
                  {selectedLang.value === 'persian'
                    ? <PersianFlag size={14} />
                    : <span className="text-sm">{selectedLang.flag}</span>
                  }
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-40 p-1 bg-[#1a2d4a]/95 backdrop-blur-xl border-white/10">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => handleLanguageChange(lang.value)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                      preferredLanguage === lang.value
                        ? 'bg-white/15 text-white font-medium'
                        : 'text-white/70 hover:bg-white/10'
                    )}
                  >
                    {lang.value === 'persian'
                      ? <PersianFlag size={14} />
                      : <span>{lang.flag}</span>
                    }
                    <span>{lang.label}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Header Spacer */}
      <div style={{ height: 'calc(190px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />

      {/* Scrollable Content */}
      <div ref={listenScrollRef} className="flex-1 overflow-y-auto overscroll-contain relative z-10" onScroll={handleScroll} style={{ maskImage: 'linear-gradient(to bottom, transparent 0px, black 24px)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 24px)' }}>
        <div className="p-4 pb-safe space-y-6">
          {/* Continue Learning Section */}
          {progressFilter === "all" && selectedCategory === "all" && !searchQuery && continueListening.length > 0 && (
            <div className="space-y-3 tour-continue-listening">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-sky-400" />
                <h2 className="text-lg font-semibold text-white">Continue Learning</h2>
              </div>
              <div className="flex flex-col gap-3">
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
                      language={playlist.language}
                      isFree={playlist.is_free}
                      isLocked={isPlaylistLocked(playlist)}
                       programSlug={playlist.program_slug}
                       requiresSubscription={playlist.requires_subscription}
                       isSubscribed={hasSoundscapeAccess}
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
            <h2 className="tour-playlists-header text-sm font-semibold text-white/70 uppercase tracking-wider">
              {selectedCategory === 'all' ? 'All Playlists' : categoryConfig[selectedCategory]?.name || selectedCategory}
            </h2>
            
            {/* Promo Banner - Listen Page (under heading) */}
            <PromoBanner location="listen" className="mb-2" />
            
            {renderPlaylistGrid(filteredPlaylists)}

            {/* CTA to support chat */}
            <div className="pt-4 pb-2">
              <p className="text-sm text-white/50">Not any playlists you want above?</p>
              <button
                onClick={() => navigate('/app/chat?draft=' + encodeURIComponent("Hi! I'd love to have a playlist for: "))}
                className="text-sm text-blue-400 font-medium flex items-center gap-1 mt-1"
              >
                Tell us what you want <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Feature Tour */}
      <PlayerTour isFirstVisit={true} onTourReady={handleTourReady} />

      {/* Paywall for locked categories */}
      <PaywallSheet open={showPaywall} onOpenChange={setShowPaywall} />

      {/* Language preference popup */}
      <LanguagePreferencePopup open={showLangPopup} onClose={() => setShowLangPopup(false)} />
    </div>
  );
}