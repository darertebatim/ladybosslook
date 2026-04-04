import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReadingContentById, useContentSections, useReadingUserProgress, useUpsertReadingProgress } from '@/hooks/useReading';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2, VolumeX, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

export default function AppReadReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: content } = useReadingContentById(id || null);
  const { data: sections = [] } = useContentSections(id || null);
  const { data: progress = [] } = useReadingUserProgress();
  const upsertProgress = useUpsertReadingProgress();

  const prog = progress.find(p => p.content_id === id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (prog && prog.last_section_index > 0 && !prog.completed) {
      setCurrentIndex(prog.last_section_index);
    }
  }, [prog]);

  const currentSection = sections[currentIndex];
  const progressPercent = sections.length > 0 ? ((currentIndex + 1) / sections.length) * 100 : 0;
  const themeColor = content?.theme_color || '#F0E3FF';

  const saveProgress = useCallback(async (index: number, completed = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;
    await upsertProgress.mutateAsync({
      user_id: user.id,
      content_id: id,
      last_section_index: index,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    });
  }, [id, upsertProgress]);

  const goNext = useCallback(() => {
    stopTTS();
    if (currentIndex < sections.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      saveProgress(next);
    } else {
      saveProgress(currentIndex, true);
      setShowComplete(true);
    }
  }, [currentIndex, sections.length, saveProgress]);

  const goPrev = useCallback(() => {
    stopTTS();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const stopTTS = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggleTTS = async () => {
    if (isPlaying) { stopTTS(); return; }
    if (!currentSection) return;
    setTtsLoading(true);
    try {
      const text = [currentSection.heading, currentSection.body, currentSection.quote ? `"${currentSection.quote}"` : '']
        .filter(Boolean).join('. ');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );
      if (!response.ok) throw new Error('TTS failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsPlaying(false); URL.revokeObjectURL(url); };
      await audio.play();
      setIsPlaying(true);
    } catch {
      toast({ title: 'TTS not available', description: 'Text-to-speech requires an API key.', variant: 'destructive' });
    } finally {
      setTtsLoading(false);
    }
  };

  useEffect(() => { return () => stopTTS(); }, []);

  if (!content || sections.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  if (showComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: themeColor }}>
          <FluentEmoji emoji="🎉" size={48} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Well Done!</h1>
        <p className="text-black mb-8">You've finished "{content.title}"</p>
        <Button size="lg" className="rounded-xl h-12 px-8" onClick={() => navigate('/app/read')}>
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background sticky top-0 z-10">
        <button onClick={() => navigate(`/app/read/${id}`)} className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%`, backgroundColor: themeColor }}
          />
        </div>
        <span className="text-xs text-black whitespace-nowrap">
          {currentIndex + 1} / {sections.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {currentSection.image_url && (
          <img src={currentSection.image_url} alt="" className="w-full rounded-xl mb-5 max-h-48 object-cover" />
        )}
        {currentSection.heading && (
          <h2 className="text-xl font-bold mb-4 text-foreground">{currentSection.heading}</h2>
        )}
        <div className="text-base leading-relaxed text-black whitespace-pre-line">
          {currentSection.body}
        </div>
        {currentSection.quote && (
          <div className="mt-6 border-l-4 pl-4 py-2" style={{ borderColor: themeColor }}>
            <p className="text-lg italic font-medium" style={{ color: themeColor === '#FFF492' ? '#8B7000' : undefined }}>
              "{currentSection.quote}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="flex items-center justify-between px-4 py-4 border-t bg-background">
        <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIndex === 0} className="rounded-xl">
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTTS} disabled={ttsLoading} className="rounded-full">
          {isPlaying ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
        <Button size="sm" onClick={goNext} className="rounded-xl">
          {currentIndex === sections.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
