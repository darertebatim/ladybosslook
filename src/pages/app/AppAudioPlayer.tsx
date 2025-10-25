import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Headphones } from "lucide-react";
import { AudioControls } from "@/components/audio/AudioControls";
import { ProgressBar } from "@/components/audio/ProgressBar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppAudioPlayer() {
  const { audioId } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const queryClient = useQueryClient();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Fetch audio content
  const { data: audio, isLoading } = useQuery({
    queryKey: ['audio-content', audioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_content')
        .select('*')
        .eq('id', audioId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!audioId,
  });

  // Fetch progress
  const { data: progress } = useQuery({
    queryKey: ['audio-progress', audioId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('audio_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('audio_id', audioId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!audioId,
  });

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (position: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('audio_progress')
        .upsert({
          user_id: user.id,
          audio_id: audioId!,
          current_position_seconds: Math.floor(position),
          completed: duration > 0 && position >= duration * 0.95,
          last_played_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-progress'] });
    },
  });

  // Load initial progress
  useEffect(() => {
    if (progress && audioRef.current) {
      audioRef.current.currentTime = progress.current_position_seconds;
      setCurrentTime(progress.current_position_seconds);
    }
  }, [progress]);

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      saveProgressMutation.mutate(audio.duration);
    };
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      toast.error('Failed to load audio file');
      setIsPlaying(false);
    };
    const handleLoadedMetadata = () => {
      console.log('Audio loaded, duration:', audio.duration);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [audio?.file_url]);

  // Save progress every 5 seconds
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (audioRef.current) {
        saveProgressMutation.mutate(audioRef.current.currentTime);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Playback controls
  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        toast.error('Failed to play audio');
        console.error(err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSkipBack = () => {
    handleSeek(Math.max(0, currentTime - 10));
  };

  const handleSkipForward = () => {
    handleSeek(Math.min(duration, currentTime + 10));
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-8 w-8 mb-6" />
        <Skeleton className="aspect-square w-full max-w-md mx-auto mb-6" />
        <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-4 w-1/2 mx-auto mb-8" />
      </div>
    );
  }

  if (!audio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Audio not found</p>
          <Button onClick={() => navigate('/app/player')}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/app/player')}
          className="mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="max-w-md mx-auto space-y-8">
          {/* Cover Art */}
          <div className="aspect-square rounded-lg overflow-hidden shadow-2xl">
            {audio.cover_image_url ? (
              <img
                src={audio.cover_image_url}
                alt={audio.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Headphones className="h-24 w-24 text-primary/40" />
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{audio.title}</h1>
            {audio.description && (
              <p className="text-muted-foreground">{audio.description}</p>
            )}
          </div>

          {/* Progress Bar */}
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
          />

          {/* Controls */}
          <AudioControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSkipBack={handleSkipBack}
            onSkipForward={handleSkipForward}
            playbackRate={playbackRate}
            onPlaybackRateChange={handlePlaybackRateChange}
          />

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={audio.file_url}
            preload="metadata"
            crossOrigin="anonymous"
          />
        </div>
      </div>
    </div>
  );
}
