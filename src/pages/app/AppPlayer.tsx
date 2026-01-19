import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, Clock, LayoutGrid, Brain, Dumbbell, Waves, Heart, BookOpen, GraduationCap, Podcast } from "lucide-react";
import { PlaylistCard } from "@/components/audio/PlaylistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { isNativeApp } from "@/lib/platform";
import { usePlayerData } from "@/hooks/useAppData";
import { PlayerSkeleton } from "@/components/app/skeletons";
import { CategoryCircle } from "@/components/app/CategoryCircle";
import { cn } from "@/lib/utils";

// Category configuration with icons and colors
const categoryConfig: Record<string, { name: string; icon: string; color: string }> = {
  all: { name: 'All', icon: 'LayoutGrid', color: 'purple' },
  meditate: { name: 'Meditate', icon: 'Brain', color: 'indigo' },
  workout: { name: 'Workout', icon: 'Dumbbell', color: 'orange' },
  soundscape: { name: 'Soundscape', icon: 'Waves', color: 'teal' },
  affirmation: { name: 'Affirmations', icon: 'Heart', color: 'pink' },
  audiobook: { name: 'Audiobooks', icon: 'BookOpen', color: 'blue' },
  course_supplement: { name: 'Courses', icon: 'GraduationCap', color: 'green' },
  podcast: { name: 'Podcast', icon: 'Podcast', color: 'rose' },
};

export default function AppPlayer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [progressFilter, setProgressFilter] = useState<"all" | "in_progress" | "completed">("all");

  // Use centralized data hook with parallel fetching
  const { playlists, playlistItems, progressData, enrollments, programs, isLoading } = usePlayerData();

  const getPlaylistStats = (playlistId: string) => {
    const items = playlistItems?.filter(item => item.playlist_id === playlistId) || [];
    const trackCount = items.length;
    const totalDuration = items.reduce((sum, item) => sum + (item.audio_content?.duration_seconds || 0), 0);
    
    const completedTracks = items.filter(item => {
      const progress = progressData?.find(p => p.audio_id === item.audio_id);
      return progress?.completed || false;
    }).length;

    const coverImage = items[0]?.audio_content?.cover_image_url;

    return { trackCount, totalDuration, completedTracks, coverImage };
  };

  const isPlaylistLocked = (playlist: any) => {
    if (playlist.is_free) return false;
    if (!playlist.program_slug) return false;
    return !enrollments?.includes(playlist.program_slug);
  };

  const isPlaylistAvailableOnMobile = (playlist: any) => {
    if (!playlist.program_slug) return true;
    if (enrollments?.includes(playlist.program_slug)) return true;
    if (isNativeApp()) {
      const program = programs?.find(p => p.slug === playlist.program_slug);
      return program?.available_on_mobile !== false;
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

  // Get available categories from playlists
  const availableCategories = ['all', ...new Set(
    playlists
      ?.filter(p => !p.is_hidden && isPlaylistAvailableOnMobile(p))
      ?.map(p => p.category)
      .filter(Boolean) || []
  )];

  // Filter playlists based on selected category
  const filteredPlaylists = playlists
    ?.filter(p => !p.is_hidden)
    ?.filter(isPlaylistAvailableOnMobile)
    ?.filter(p => selectedCategory === 'all' || p.category === selectedCategory)
    ?.filter(filterPlaylistBySearch)
    ?.filter(filterPlaylistByProgress) || [];

  // Continue Learning section
  const continueListening = playlists?.filter(playlist => {
    const stats = getPlaylistStats(playlist.id);
    const progress = stats.trackCount > 0 ? (stats.completedTracks / stats.trackCount) * 100 : 0;
    return progress > 0 && progress < 100 && !isPlaylistLocked(playlist) && isPlaylistAvailableOnMobile(playlist);
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
          className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b"
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
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b"
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
              <button onClick={() => setShowSearch(true)} className="p-2 -mr-2">
                <Search className="h-5 w-5 text-muted-foreground" />
              </button>
            </>
          )}
        </div>

        {/* Category Circles */}
        <div className="px-4 pb-3">
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

        {/* Progress Filter Pills */}
        <div className="px-4 pb-3 flex gap-2">
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
      </div>

      {/* Header Spacer - accounts for header + categories + filter pills */}
      <div style={{ height: 'calc(160px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 pb-safe space-y-6">
          {/* Continue Learning Section */}
          {progressFilter === "all" && selectedCategory === "all" && !searchQuery && continueListening.length > 0 && (
            <div className="space-y-3">
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
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedCategory === 'all' ? 'All Playlists' : categoryConfig[selectedCategory]?.name || selectedCategory}
            </h2>
            {renderPlaylistGrid(filteredPlaylists)}
          </div>
        </div>
      </div>
    </div>
  );
}