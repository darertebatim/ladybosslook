import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Clock } from "lucide-react";
import { PlaylistCard } from "@/components/audio/PlaylistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { isNativeApp } from "@/lib/platform";
import { usePlayerData } from "@/hooks/useAppData";
import { PlayerSkeleton } from "@/components/app/skeletons";

export default function AppPlayer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "in_progress" | "completed">("all");

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
    // If no program_slug, it's a standalone free playlist - show it
    if (!playlist.program_slug) return true;
    
    // If user is enrolled in this program, always show the playlist
    // This ensures purchased content is visible even if program is hidden from store
    if (enrollments?.includes(playlist.program_slug)) return true;
    
    // If in native app, check if the associated program is available on mobile
    // (for non-enrolled users - controls visibility in store/discovery)
    if (isNativeApp()) {
      const program = programs?.find(p => p.slug === playlist.program_slug);
      return program?.available_on_mobile !== false;
    }
    
    // On web, show all playlists
    return true;
  };

  const filterPlaylistByProgress = (playlist: any) => {
    const stats = getPlaylistStats(playlist.id);
    const progress = stats.trackCount > 0 ? (stats.completedTracks / stats.trackCount) * 100 : 0;
    
    if (filterTab === "in_progress") return progress > 0 && progress < 100;
    if (filterTab === "completed") return progress >= 100;
    return true;
  };

  const filterPlaylistBySearch = (playlist: any) => {
    if (!searchQuery) return true;
    return playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           playlist.description?.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const filterByCategory = (category: string) => {
    return playlists
      ?.filter(p => !p.is_hidden) // Extra safety: filter hidden playlists client-side
      ?.filter(isPlaylistAvailableOnMobile)
      ?.filter(p => p.category === category)
      .filter(filterPlaylistBySearch)
      .filter(filterPlaylistByProgress) || [];
  };

  const getAllPlaylists = () => {
    return playlists
      ?.filter(p => !p.is_hidden) // Extra safety: filter hidden playlists client-side
      ?.filter(isPlaylistAvailableOnMobile)
      ?.filter(filterPlaylistBySearch)
      .filter(filterPlaylistByProgress) || [];
  };

  const allPlaylists = getAllPlaylists();
  const audiobooks = filterByCategory('audiobook');
  const coursePlaylists = filterByCategory('course_supplement');
  const podcasts = filterByCategory('podcast');

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

  // Continue Learning section
  const continueListening = playlists?.filter(playlist => {
    const stats = getPlaylistStats(playlist.id);
    const progress = stats.trackCount > 0 ? (stats.completedTracks / stats.trackCount) * 100 : 0;
    return progress > 0 && progress < 100 && !isPlaylistLocked(playlist) && isPlaylistAvailableOnMobile(playlist);
  }).sort((a, b) => {
    // Sort by most recently played
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

  // Show skeleton while loading all data
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background pb-28">
        <div 
          className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-lg border-b"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="pt-6 pb-3 px-4 space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Audio Library</h1>
              <p className="text-sm text-muted-foreground">Listen and learn on the go</p>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div style={{ height: 'calc(200px + env(safe-area-inset-top, 0px))' }} />
        <PlayerSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-28">
      {/* Fixed Header with safe area + visual padding */}
      <div 
        className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-lg border-b"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pt-6 pb-3 px-4 space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Audio Library</h1>
            <p className="text-sm text-muted-foreground">Listen and learn on the go</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Header spacer - matches fixed header height (~200px + safe area) */}
      <div style={{ height: 'calc(200px + env(safe-area-inset-top, 0px))' }} />

      <div className="p-4 space-y-6">
        {/* Continue Learning Section */}
        {filterTab === "all" && !searchQuery && continueListening.length > 0 && (
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

        {/* Category Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="audiobooks">Audiobooks</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {renderPlaylistGrid(allPlaylists)}
          </TabsContent>

          <TabsContent value="audiobooks" className="mt-4">
            {renderPlaylistGrid(audiobooks)}
          </TabsContent>

          <TabsContent value="courses" className="mt-4">
            {renderPlaylistGrid(coursePlaylists)}
          </TabsContent>

          <TabsContent value="podcasts" className="mt-4">
            {renderPlaylistGrid(podcasts)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}