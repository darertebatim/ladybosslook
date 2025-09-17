import React, { useEffect } from 'react';
import { Play, Pause, Volume2, Download, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Voice, getGoogleDriveAudioUrl } from '@/data/voices';

interface VoicePlayerProps {
  voice: Voice;
  isActive?: boolean;
  onPlay?: () => void;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({ 
  voice, 
  isActive = false, 
  onPlay 
}) => {
  // Always call the hook first - never conditionally
  const { audioRef, state, actions } = useAudioPlayer();

  // Load audio when component becomes active
  useEffect(() => {
    if (isActive && audioRef.current) {
      const audioUrl = getGoogleDriveAudioUrl(voice.googleDriveId);
      actions.load(audioUrl);
    }
  }, [isActive, voice.googleDriveId, actions]);

  const handlePlayClick = () => {
    onPlay?.();
    actions.togglePlay();
  };

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * state.duration;
    actions.seek(newTime);
  };

  const handleDownload = () => {
    const audioUrl = getGoogleDriveAudioUrl(voice.googleDriveId);
    window.open(audioUrl, '_blank');
  };

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <Card className={`transition-all duration-300 hover:shadow-medium ${
      isActive ? 'ring-2 ring-primary shadow-glow' : ''
    }`}>
      <CardContent className="p-6">
        {/* Hidden audio element */}
        <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
        
        {/* Voice Info */}
        <div className="mb-4">
          <h3 className="font-display text-lg font-semibold mb-1 text-foreground">
            {voice.title}
          </h3>
          <p className="font-farsi text-base text-muted-foreground mb-2 rtl">
            {voice.titleFarsi}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {voice.description}
          </p>
          <p className="font-farsi text-sm text-muted-foreground mt-1 rtl">
            {voice.descriptionFarsi}
          </p>
          
          {/* Duration */}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{voice.duration || 'Loading...'}</span>
          </div>
        </div>

        {/* Player Controls */}
        <div className="space-y-3">
          {/* Progress Bar - Always render to maintain hook order */}
          <div className={`space-y-2 ${isActive ? 'block' : 'hidden'}`}>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{actions.formatTime(state.currentTime)}</span>
              <span>{actions.formatTime(state.duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayClick}
                disabled={state.isLoading}
                className="flex items-center gap-2"
              >
                {state.isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : state.isPlaying && isActive ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {state.isLoading ? 'Loading...' : state.isPlaying && isActive ? 'Pause' : 'Play'}
                </span>
              </Button>

              {/* Volume Control - Always render to maintain hook order */}
              <div className={`flex items-center gap-2 ${isActive ? 'block' : 'hidden'}`}>
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Progress 
                  value={state.volume * 100} 
                  className="w-16 h-2 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const width = rect.width;
                    const newVolume = Math.max(0, Math.min(1, x / width));
                    actions.setVolume(newVolume);
                  }}
                />
              </div>
            </div>

            {/* Download Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>

          {/* Error Message - Always render to maintain hook order */}
          <div className={`text-sm text-destructive bg-destructive/10 p-2 rounded ${state.error ? 'block' : 'hidden'}`}>
            {state.error || 'No error'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};