import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ChevronRight, Settings, CalendarDays, Check, AlertCircle, Music, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { timerThemes } from '@/lib/timerThemes';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Screen = 'setup' | 'adjustTime' | 'pickTheme' | 'running' | 'completed' | 'stopped';

export default function AppTimer() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('setup');
  const [minutes, setMinutes] = useState(25);
  const [selectedTheme, setSelectedTheme] = useState('Focus');
  const [customTheme, setCustomTheme] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'timer' | 'pomodoro'>('timer');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSoundUrl, setSelectedSoundUrl] = useState<string | null>(null);
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef<number>(0);
  const rulerRef = useRef<HTMLDivElement>(null);
  const lastHapticVal = useRef(25);
  const rulerInitialized = useRef(false);

  // Fetch individual audio tracks from soundscape playlists
  const { data: soundscapeTracks = [] } = useQuery({
    queryKey: ['timer-soundscape-tracks'],
    queryFn: async () => {
      // Get soundscape playlists
      const { data: playlists, error } = await supabase
        .from('audio_playlists')
        .select('id, name')
        .eq('category', 'soundscape')
        .eq('is_hidden', false)
        .order('sort_order', { ascending: true });
      if (error || !playlists?.length) return [];

      const playlistIds = playlists.map(p => p.id);

      // Get all tracks from these playlists
      const { data: items } = await supabase
        .from('audio_playlist_items')
        .select('audio_id, playlist_id, sort_order, audio_content:audio_id(id, title, file_url, cover_image_url)')
        .in('playlist_id', playlistIds)
        .order('sort_order', { ascending: true });

      if (!items) return [];

      return (items as any[])
        .filter(item => item.audio_content?.file_url)
        .map(item => ({
          id: item.audio_content.id,
          name: item.audio_content.title,
          cover: item.audio_content.cover_image_url,
          url: item.audio_content.file_url,
        }));
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Soundscape audio management
  useEffect(() => {
    if (screen === 'running' && selectedSoundUrl) {
      const audio = new Audio(selectedSoundUrl);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(() => {});
      audioRef.current = audio;
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [screen, selectedSoundUrl]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    haptic.medium();
    const total = minutes * 60;
    setSecondsLeft(total);
    setTotalSeconds(total);
    setScreen('running');

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          haptic.success();
          setScreen('completed');
          // Fire confetti
          setTimeout(() => {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#a78bfa', '#c084fc', '#e879f9', '#f0abfc', '#fcd34d'] });
          }, 200);
          confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ['#a78bfa', '#c084fc', '#e879f9'] });
          confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ['#a78bfa', '#c084fc', '#e879f9'] });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    haptic.warning();
    setScreen('stopped');
  }, []);

  // Hold-to-stop handlers
  const onHoldStart = () => {
    holdStartRef.current = Date.now();
    setHoldProgress(0);
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(elapsed / 2000, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        clearInterval(holdTimerRef.current!);
        holdTimerRef.current = null;
        stopTimer();
      }
    }, 16);
  };

  const onHoldEnd = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  const goBack = () => {
    haptic.light();
    navigate(-1);
  };

  // Ruler scroll helpers
  const TICK_WIDTH = 16;
  const MAX_MIN = 90;

  const scrollToMinute = useCallback((min: number, smooth = true) => {
    if (!rulerRef.current) return;
    const containerW = rulerRef.current.clientWidth;
    const paddingLeft = containerW / 2; // paddingLeft is '50%' of container
    const scrollPos = paddingLeft + min * TICK_WIDTH - containerW / 2;
    rulerRef.current.scrollTo({ left: scrollPos, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const handleRulerScroll = useCallback(() => {
    if (!rulerRef.current) return;
    const containerW = rulerRef.current.clientWidth;
    const paddingLeft = containerW / 2;
    const scrollLeft = rulerRef.current.scrollLeft;
    const val = Math.round((scrollLeft - paddingLeft + containerW / 2) / TICK_WIDTH);
    const clamped = Math.max(1, Math.min(MAX_MIN, val));
    if (clamped !== lastHapticVal.current) {
      if (clamped % 5 === 0) {
        haptic.medium();
      } else {
        haptic.selection();
      }
      lastHapticVal.current = clamped;
    }
    setMinutes(clamped);
  }, []);

  // Scroll ruler to current minute when entering adjustTime
  useEffect(() => {
    if (screen === 'adjustTime') {
      rulerInitialized.current = false;
      setTimeout(() => {
        scrollToMinute(minutes, false);
        rulerInitialized.current = true;
      }, 50);
    }
  }, [screen, scrollToMinute]);

  // ─── SETUP SCREEN ───
  if (screen === 'setup') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={goBack} className="p-2 -ml-2">
            <X className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex bg-muted rounded-full p-1">
            <button
              onClick={() => { setActiveTab('timer'); haptic.light(); }}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === 'timer' ? 'bg-foreground text-background' : 'text-muted-foreground'
              )}
            >
              Timer
            </button>
            <button
              onClick={() => { setActiveTab('pomodoro'); haptic.light(); }}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === 'pomodoro' ? 'bg-foreground text-background' : 'text-muted-foreground'
              )}
            >
              Pomodoro
            </button>
          </div>
          <div className="w-9" />
        </div>

        {/* Timer Display */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-8">
          {/* Hand-drawn ellipse */}
          <div className="relative">
            {/* SVG Ellipse */}
            <svg width="280" height="280" viewBox="0 0 280 280" className="drop-shadow-sm">
              <ellipse
                cx="140" cy="140" rx="125" ry="125"
                fill="none"
                stroke="hsl(var(--foreground) / 0.1)"
                strokeWidth="3"
                strokeDasharray="8 6"
                className="opacity-80"
              />
              <ellipse
                cx="140" cy="140" rx="115" ry="115"
                fill="hsl(var(--foreground) / 0.04)"
                stroke="hsl(var(--foreground) / 0.12)"
                strokeWidth="2"
              />
            </svg>

            {/* Decorative dots */}
            <div className="absolute top-4 right-6 text-muted-foreground/40 text-lg select-none">●</div>
            <div className="absolute top-10 right-2 text-muted-foreground/20 text-xs select-none">●</div>

            {/* Time display */}
            <button
              onClick={() => { setScreen('adjustTime'); haptic.light(); }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <span className="text-6xl font-bold text-foreground tracking-tight">
                {formatTime(minutes * 60)}
              </span>
              <span className="text-sm text-muted-foreground mt-1">tap to adjust</span>
            </button>
          </div>

          {/* Theme selector */}
          <button
            onClick={() => { setScreen('pickTheme'); haptic.light(); }}
            className="flex items-center gap-1.5 mt-6 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">{customTheme || selectedTheme}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Bottom bar */}
        <div className="px-6 pb-8 pt-4 flex items-center gap-3">
          <button
            onClick={() => { setScreen('adjustTime'); haptic.light(); }}
            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={startTimer}
            className="flex-1 h-12 rounded-full bg-foreground text-background font-semibold text-base transition-transform active:scale-[0.97]"
          >
            Start Timer
          </button>
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }


  // ─── ADJUST TIME SCREEN ───
  if (screen === 'adjustTime') {

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 pb-2">
          <button onClick={() => { setScreen('setup'); haptic.light(); }} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h2 className="text-xl font-semibold text-foreground mb-16">Adjust the time</h2>

          {/* Triangle pointer */}
          <div className="mb-2">
            <svg width="20" height="12" viewBox="0 0 20 12">
              <polygon points="10,0 20,12 0,12" fill="hsl(265, 80%, 60%)" />
            </svg>
          </div>

          {/* Large minute display */}
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-7xl font-bold text-purple-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {minutes}
            </span>
            <span className="text-2xl font-semibold text-purple-400">min</span>
          </div>

          {/* Scrollable ruler */}
          <div className="w-full max-w-sm relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            
            {/* Center line indicator */}
            <div className="absolute left-1/2 -translate-x-[1.5px] top-0 w-[3px] h-16 bg-purple-500 rounded-full z-10 pointer-events-none" />

            <div
              ref={rulerRef}
              className="overflow-x-auto scrollbar-hide"
              onScroll={handleRulerScroll}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              <div className="flex items-end" style={{ width: `${(MAX_MIN + 1) * TICK_WIDTH + 400}px`, paddingLeft: '50%', paddingRight: '50%' }}>
                {Array.from({ length: MAX_MIN + 1 }, (_, i) => {
                  const isMajor = i % 5 === 0;
                  return (
                    <div key={i} className="flex flex-col items-center" style={{ width: `${TICK_WIDTH}px`, flexShrink: 0 }}>
                      <div
                        className={cn(
                          "rounded-full transition-colors",
                          isMajor ? "w-[3px] h-10" : "w-[2px] h-6",
                          i === minutes ? "bg-purple-500" : "bg-muted-foreground/25"
                        )}
                      />
                      {isMajor && (
                        <span className={cn(
                          "text-xs mt-2 font-medium transition-colors",
                          i === minutes ? "text-purple-500" : "text-muted-foreground/40"
                        )}>
                          {i}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Done button with lavender gradient */}
        <div className="px-6 pb-8 pt-4 relative">
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-purple-100/50 to-transparent pointer-events-none dark:from-purple-950/20" />
          <button
            onClick={() => { setScreen('setup'); haptic.medium(); }}
            className="relative w-full h-12 rounded-full bg-foreground text-background font-semibold text-base transition-transform active:scale-[0.97]"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ─── THEME PICKER SCREEN ───
  if (screen === 'pickTheme') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 pb-2">
          <button onClick={() => { setScreen('setup'); haptic.light(); }} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center px-6 pt-12">
          {/* Custom theme input */}
          <input
            type="text"
            maxLength={50}
            placeholder="Custom Themes"
            value={customTheme}
            onChange={(e) => setCustomTheme(e.target.value)}
            className="text-center text-2xl font-semibold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 w-full mb-10"
          />

          {/* Quick-pick chips */}
          <div className="flex flex-wrap gap-2.5 justify-center">
            {timerThemes.map(theme => (
              <button
                key={theme.id}
                onClick={() => {
                  haptic.light();
                  setSelectedTheme(theme.label);
                  setCustomTheme('');
                  setScreen('setup');
                }}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-transform active:scale-95',
                  theme.color,
                  selectedTheme === theme.label && !customTheme && 'ring-2 ring-purple-400 ring-offset-2'
                )}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── RUNNING SCREEN ───
  if (screen === 'running') {
    const timeStr = formatTime(secondsLeft);
    const [mm, ss] = timeStr.split(':');
    const digitColors = ['text-purple-400', 'text-pink-400', 'text-violet-500', 'text-fuchsia-400'];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-black flex flex-col items-center justify-center relative select-none overflow-hidden"
        onTouchStart={onHoldStart}
        onTouchEnd={onHoldEnd}
        onTouchCancel={onHoldEnd}
        onMouseDown={onHoldStart}
        onMouseUp={onHoldEnd}
        onMouseLeave={onHoldEnd}
      >
        {/* Top-right controls */}
        <div className="absolute top-12 right-4 flex flex-col gap-3 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); haptic.light(); setShowSoundPicker(!showSoundPicker); }}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm"
          >
            <div className="relative">
              <Music className="h-5 w-5 text-white/60" />
              {!selectedSoundId && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[1.5px] h-7 bg-white/60 rotate-45 rounded-full" />
                </div>
              )}
            </div>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); haptic.light(); setIsFullscreen(!isFullscreen); }}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm"
          >
            <Maximize className="h-5 w-5 text-white/60" />
          </button>
        </div>

        {/* Soundscape bottom sheet */}
        <AnimatePresence>
          {showSoundPicker && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-30"
                onClick={(e) => { e.stopPropagation(); setShowSoundPicker(false); }}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-40 bg-background rounded-t-3xl max-h-[70vh] flex flex-col"
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <button onClick={(e) => { e.stopPropagation(); setShowSoundPicker(false); }}>
                    <X className="h-5 w-5 text-foreground" />
                  </button>
                  <span className="text-base font-semibold text-foreground">White Noise</span>
                  <div className="w-5" />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-5 pb-8">
                  {/* Music off */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.light();
                      setSelectedSoundId(null);
                      setSelectedSoundUrl(null);
                      setShowSoundPicker(false);
                    }}
                    className="w-full flex items-center gap-4 py-4 border-b border-border"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <div className="relative">
                        <Music className="h-5 w-5 text-purple-600" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-[1.5px] h-7 bg-purple-600 rotate-45 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <span className="text-base font-medium text-foreground flex-1 text-left">Music off</span>
                    {!selectedSoundId && (
                      <div className="w-6 h-6 rounded-full border-[5px] border-foreground" />
                    )}
                  </button>

                  {/* Tracks */}
                  {soundscapeTracks.map(track => (
                    <button
                      key={track.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic.light();
                        setSelectedSoundId(track.id);
                        setSelectedSoundUrl(track.url);
                        setShowSoundPicker(false);
                      }}
                      className="w-full flex items-center gap-4 py-4 border-b border-border"
                    >
                      {track.cover ? (
                        <img src={track.cover} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Music className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-base font-medium text-foreground flex-1 text-left truncate">{track.name}</span>
                      {selectedSoundId === track.id && (
                        <div className="w-6 h-6 rounded-full border-[5px] border-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Hearts decoration */}
        {!isFullscreen && (
          <>
            <div className="absolute top-20 right-16 text-pink-400/40 text-2xl select-none">💜</div>
            <div className="absolute top-28 right-20 text-pink-300/30 text-sm select-none">💕</div>
            <div className="absolute top-24 left-10 text-purple-400/30 text-lg select-none">✨</div>
          </>
        )}

        {/* Countdown */}
        <div className="flex items-center justify-center flex-col">
          {isFullscreen ? (
            // Fullscreen: digits rotated 90° so phone is held landscape-style
            <div className="rotate-90 flex items-center" style={{ transformOrigin: 'center center' }}>
              {[mm[0], mm[1]].map((d, i) => (
                <span key={`m${i}`} className={cn("font-black", digitColors[i])}
                  style={{ fontSize: 'min(40vh, 300px)', lineHeight: 0.85 }}>{d}</span>
              ))}
              <div className="flex flex-col gap-3 mx-2">
                <div className="w-5 h-5 rounded-full bg-white/30" />
                <div className="w-5 h-5 rounded-full bg-white/30" />
              </div>
              {[ss[0], ss[1]].map((d, i) => (
                <span key={`s${i}`} className={cn("font-black", digitColors[i + 2])}
                  style={{ fontSize: 'min(40vh, 300px)', lineHeight: 0.85 }}>{d}</span>
              ))}
            </div>
          ) : (
            // Normal: horizontal time display
            <>
              <div className="flex items-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {[mm[0], mm[1]].map((d, i) => (
                  <span key={`m${i}`} className={cn("text-8xl font-black inline-block w-[1.15ch] text-center", digitColors[i])}>{d}</span>
                ))}
                <div className="flex flex-col gap-2 mx-1">
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                </div>
                {[ss[0], ss[1]].map((d, i) => (
                  <span key={`s${i}`} className={cn("text-8xl font-black inline-block w-[1.15ch] text-center", digitColors[i + 2])}>{d}</span>
                ))}
              </div>
              {/* Decorative lines */}
              <div className="flex gap-1 mt-4">
                <div className="w-8 h-0.5 rounded-full bg-purple-500/40" />
                <div className="w-12 h-0.5 rounded-full bg-pink-500/30" />
                <div className="w-6 h-0.5 rounded-full bg-violet-500/40" />
              </div>
              <p className="text-white/30 text-sm mt-3">{customTheme || selectedTheme}</p>
            </>
          )}
        </div>

        {/* Hold to stop */}
        <div className="absolute bottom-16 left-0 right-0 px-10 flex flex-col items-center gap-3">
          <p className="text-white/40 text-sm">Hold to stop timer</p>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
              style={{ width: `${holdProgress * 100}%` }}
              transition={{ duration: 0 }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── COMPLETED SCREEN ───
  if (screen === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: 'linear-gradient(180deg, hsl(270 80% 96%) 0%, hsl(280 60% 94%) 100%)' }}
      >
        <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center mb-6">
          <Check className="h-8 w-8 text-background" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Wow! You did it!</h1>
        <p className="text-muted-foreground text-center mb-10">Celebrate your progress!</p>
        <button
          onClick={() => { haptic.success(); setScreen('setup'); }}
          className="w-full max-w-xs h-12 rounded-full bg-foreground text-background font-semibold text-base transition-transform active:scale-[0.97]"
        >
          I'm doing great!
        </button>
      </motion.div>
    );
  }

  // ─── STOPPED SCREEN ───
  if (screen === 'stopped') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: 'linear-gradient(180deg, hsl(270 80% 96%) 0%, hsl(280 60% 94%) 100%)' }}
      >
        <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-background" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Relax! Every effort counts!</h1>
        <p className="text-muted-foreground text-center mb-10">Let's continue when you're ready.</p>
        <button
          onClick={() => { haptic.light(); setScreen('setup'); }}
          className="w-full max-w-xs h-12 rounded-full bg-foreground text-background font-semibold text-base transition-transform active:scale-[0.97]"
        >
          Got it!
        </button>
      </motion.div>
    );
  }

  return null;
}
