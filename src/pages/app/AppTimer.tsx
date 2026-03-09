import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ChevronRight, Settings, CalendarDays, Check, AlertCircle, VolumeX, Volume2, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { timerThemes } from '@/lib/timerThemes';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const soundscapes = [
  { id: 'none', label: 'No Sound', emoji: '🔇' },
  { id: 'rain', label: 'Rain', emoji: '🌧️', url: 'https://cdn.freesound.org/previews/531/531947_6386839-lq.mp3' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊', url: 'https://cdn.freesound.org/previews/467/467330_5765286-lq.mp3' },
  { id: 'forest', label: 'Forest', emoji: '🌲', url: 'https://cdn.freesound.org/previews/365/365492_4284968-lq.mp3' },
  { id: 'fire', label: 'Fireplace', emoji: '🔥', url: 'https://cdn.freesound.org/previews/499/499023_9497060-lq.mp3' },
  { id: 'birds', label: 'Birds', emoji: '🐦', url: 'https://cdn.freesound.org/previews/368/368004_4284968-lq.mp3' },
  { id: 'wind', label: 'Wind', emoji: '💨', url: 'https://cdn.freesound.org/previews/377/377837_3905081-lq.mp3' },
];

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
  const [selectedSound, setSelectedSound] = useState('none');
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef<number>(0);

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
    if (screen === 'running' && selectedSound !== 'none') {
      const sound = soundscapes.find(s => s.id === selectedSound);
      if (sound?.url) {
        const audio = new Audio(sound.url);
        audio.loop = true;
        audio.volume = 0.5;
        audio.play().catch(() => {});
        audioRef.current = audio;
      }
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
  }, [screen, selectedSound]);

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
                activeTab === 'timer' ? 'bg-purple-200 text-purple-800' : 'text-muted-foreground'
              )}
            >
              Timer
            </button>
            <button
              onClick={() => { setActiveTab('pomodoro'); haptic.light(); }}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === 'pomodoro' ? 'bg-purple-200 text-purple-800' : 'text-muted-foreground'
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
                stroke="hsl(var(--primary) / 0.15)"
                strokeWidth="3"
                strokeDasharray="8 6"
                className="opacity-80"
              />
              <ellipse
                cx="140" cy="140" rx="115" ry="115"
                fill="hsl(var(--primary) / 0.06)"
                stroke="hsl(var(--primary) / 0.25)"
                strokeWidth="2"
              />
            </svg>

            {/* Hearts decoration */}
            <div className="absolute top-4 right-6 text-pink-300 text-lg select-none">💜</div>
            <div className="absolute top-10 right-2 text-pink-200 text-xs select-none">💕</div>

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
          <h2 className="text-xl font-semibold text-foreground mb-10">Adjust the time</h2>

          {/* Large minute display */}
          <div className="flex items-baseline gap-2 mb-12">
            <span className="text-7xl font-bold bg-gradient-to-r from-purple-500 to-violet-500 bg-clip-text text-transparent">
              {minutes}
            </span>
            <span className="text-2xl font-medium text-muted-foreground">min</span>
          </div>

          {/* Slider */}
          <div className="w-full max-w-xs">
            <input
              type="range"
              min={1}
              max={90}
              value={minutes}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v !== minutes) haptic.selection();
                setMinutes(v);
              }}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-purple-500
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>1 min</span>
              <span>90 min</span>
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
            {selectedSound === 'none' ? (
              <VolumeX className="h-5 w-5 text-white/60" />
            ) : (
              <Volume2 className="h-5 w-5 text-white/60" />
            )}
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

        {/* Soundscape picker dropdown */}
        <AnimatePresence>
          {showSoundPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-28 right-4 z-30 bg-white/10 backdrop-blur-xl rounded-2xl p-2 min-w-[160px]"
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {soundscapes.map(s => (
                <button
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    haptic.light();
                    setSelectedSound(s.id);
                    setShowSoundPicker(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors',
                    selectedSound === s.id ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/5'
                  )}
                >
                  <span className="text-base">{s.emoji}</span>
                  <span className="text-sm font-medium">{s.label}</span>
                  {selectedSound === s.id && <Check className="h-3.5 w-3.5 ml-auto text-purple-400" />}
                </button>
              ))}
            </motion.div>
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
        <div className={cn(
          "flex items-center justify-center",
          isFullscreen ? "flex-col" : "flex-col"
        )}>
          {isFullscreen ? (
            // Fullscreen: huge vertical digits filling the screen
            <div className="flex flex-col items-center gap-0 leading-none">
              {[mm[0], mm[1]].map((d, i) => (
                <span key={`m${i}`} className={cn("font-black", digitColors[i])}
                  style={{ fontSize: 'min(45vw, 220px)', lineHeight: 0.85 }}>{d}</span>
              ))}
              <div className="flex gap-3 my-1">
                <div className="w-5 h-5 rounded-full bg-white/30" />
                <div className="w-5 h-5 rounded-full bg-white/30" />
              </div>
              {[ss[0], ss[1]].map((d, i) => (
                <span key={`s${i}`} className={cn("font-black", digitColors[i + 2])}
                  style={{ fontSize: 'min(45vw, 220px)', lineHeight: 0.85 }}>{d}</span>
              ))}
            </div>
          ) : (
            // Normal: horizontal time display
            <>
              <div className="flex items-center">
                {[mm[0], mm[1]].map((d, i) => (
                  <span key={`m${i}`} className={cn("text-8xl font-black", digitColors[i])}>{d}</span>
                ))}
                <div className="flex flex-col gap-2 mx-1">
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                </div>
                {[ss[0], ss[1]].map((d, i) => (
                  <span key={`s${i}`} className={cn("text-8xl font-black", digitColors[i + 2])}>{d}</span>
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
          onClick={() => { haptic.success(); navigate(-1); }}
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
          onClick={() => { haptic.light(); navigate(-1); }}
          className="w-full max-w-xs h-12 rounded-full bg-foreground text-background font-semibold text-base transition-transform active:scale-[0.97]"
        >
          Got it!
        </button>
      </motion.div>
    );
  }

  return null;
}
