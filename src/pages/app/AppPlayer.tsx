import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AudioCard } from "@/components/audio/AudioCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppPlayer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "in_progress" | "completed">("all");

  // Fetch audio content
  const { data: audioContent, isLoading } = useQuery({
    queryKey: ['audio-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_content')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's progress
  const { data: progressData } = useQuery({
    queryKey: ['audio-progress'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('audio_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's enrollments to check access
  const { data: enrollments } = useQuery({
    queryKey: ['user-enrollments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('course_enrollments')
        .select('program_slug')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (error) throw error;
      return data.map(e => e.program_slug);
    },
  });

  const getAudioProgress = (audioId: string) => {
    const progress = progressData?.find(p => p.audio_id === audioId);
    if (!progress) return 0;
    const percentage = (progress.current_position_seconds / (audioContent?.find(a => a.id === audioId)?.duration_seconds || 1)) * 100;
    return Math.min(percentage, 100);
  };

  const isAudioLocked = (audio: any) => {
    if (audio.is_free) return false;
    if (!audio.program_slug) return false;
    return !enrollments?.includes(audio.program_slug);
  };

  const filterAudioByProgress = (audio: any) => {
    const progress = getAudioProgress(audio.id);
    if (filterTab === "in_progress") return progress > 0 && progress < 100;
    if (filterTab === "completed") return progress >= 100;
    return true;
  };

  const filterAudioBySearch = (audio: any) => {
    if (!searchQuery) return true;
    return audio.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           audio.description?.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const filterByCategory = (category: string) => {
    return audioContent
      ?.filter(a => a.category === category)
      .filter(filterAudioBySearch)
      .filter(filterAudioByProgress) || [];
  };

  const audiobooks = filterByCategory('audiobook');
  const courseAudio = filterByCategory('course_supplement');
  const podcasts = filterByCategory('podcast');

  const renderAudioGrid = (items: any[]) => {
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
          <p>No audio content found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        {items.map((audio) => (
          <AudioCard
            key={audio.id}
            id={audio.id}
            title={audio.title}
            description={audio.description}
            coverImageUrl={audio.cover_image_url}
            durationSeconds={audio.duration_seconds}
            isFree={audio.is_free}
            isLocked={isAudioLocked(audio)}
            progress={getAudioProgress(audio.id)}
            category={audio.category}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4 space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Audio Library</h1>
            <p className="text-sm text-muted-foreground">Listen and learn on the go</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audio..."
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

      <Tabs defaultValue="audiobooks" className="p-4">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="audiobooks">Audiobooks</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
        </TabsList>

        <TabsContent value="audiobooks" className="mt-0">
          {renderAudioGrid(audiobooks)}
        </TabsContent>

        <TabsContent value="courses" className="mt-0">
          {renderAudioGrid(courseAudio)}
        </TabsContent>

        <TabsContent value="podcasts" className="mt-0">
          {renderAudioGrid(podcasts)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
