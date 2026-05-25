import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, ArrowLeft, ChevronRight, ChevronLeft, Settings, CalendarPlus, Check, AlertCircle, Music, Maximize, Bell, Coffee, Timer as TimerIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { Switch } from '@/components/ui/switch';
import { timerThemes } from '@/lib/timerThemes';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExistingProTask } from '@/hooks/usePlaylistRoutine';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { toast } from 'sonner';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { FocusStatsScreen } from '@/components/app/FocusStatsScreen';
import { FocusShareButton } from '@/components/app/FocusShareButton';
import { useSaveFocusSession } from '@/hooks/useFocusSessions';
import { scheduleFocusTimerNotification, cancelFocusTimerNotification } from '@/lib/routineTaskNotification';
import { SlideUpPage, useSlideClose } from '@/components/app/SlideUpPage';

type Screen = 'setup' | 'adjustTime' | 'pickTheme' | 'running' | 'completed' | 'stopped' | 'pomodoroRoundDone' | 'pomodoroBreak' | 'pomodoroBreakDone' | 'settings' | 'stats';

// Defaults moved to state: pomodoroCycles, breakMinutes

const SYNTHETIC_TIMER_TASK: RoutinePlanTask = {
  id: 'synthetic-focus-timer',
  plan_id: 'synthetic-focus-timer',
  title: 'Focus Timer',
  icon: '⏱️',
  color: 'stone',
  task_order: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  linked_playlist_id: null,
  pro_link_type: 'focus_timer',
  pro_link_value: null,
  linked_playlist: null,
  tag: 'pro',
};

export default function AppTimer() {
  return (
    <SlideUpPage defaultBack="/app/home">
      <AppTimerInner />
    </SlideUpPage>
  );
}

function AppTimerInner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const slideCtx = useSlideClose();
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
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  // Pomodoro settings
  const [pomodoroRound, setPomodoroRound] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCycles, setPomodoroCycles] = useState(4);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [settingsTab, setSettingsTab] = useState<'timer' | 'pomodoro'>('timer');
  const [showCyclePicker, setShowCyclePicker] = useState(false);
  const [showBreakPicker, setShowBreakPicker] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef<number>(0);
  const rulerRef = useRef<HTMLDivElement>(null);
  const lastHapticVal = useRef(25);
  const rulerInitialized = useRef(false);
  const sessionStartRef = useRef<Date>(new Date());

  // Session saving
  const saveFocusSession = useSaveFocusSession();

  // Routine integration
  const { data: existingTask } = useExistingProTask('focus_timer');
  const addRoutinePlan = useAddRoutinePlan();
  const isAdded = !!existingTask || justAdded;

  const handleRoutineClick = () => {
    haptic.light();
    if (isAdded) {
      navigate('/app/home');
    } else {
      setShowRoutineSheet(true);
    }
  };

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    try {
      await addRoutinePlan.mutateAsync({
        planId: 'synthetic-focus-timer',
        selectedTaskIds,
        editedTasks,
        syntheticTasks: [SYNTHETIC_TIMER_TASK],
      });
      toast.success(t('timer.addedToRoutineToast'));
      setShowRoutineSheet(false);
      setJustAdded(true);
    } catch (error) {
      console.error('Failed to add routine:', error);
      toast.error(t('timer.addRoutineFailed'));
    }
  };

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
      cancelFocusTimerNotification();
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
    sessionStartRef.current = new Date();
    if (activeTab === 'pomodoro') {
      setPomodoroRound(0);
      setIsBreak(false);
      startPomodoroRound(0);
    } else {
      const total = minutes * 60;
      setSecondsLeft(total);
      setTotalSeconds(total);
      setScreen('running');
      runCountdown(total, () => {
        haptic.success();
        saveFocusSession.mutate({
          durationSeconds: total,
          sessionType: 'timer',
          theme: customTheme || selectedTheme,
          completed: true,
          startedAt: sessionStartRef.current,
        });
        setScreen('completed');
        fireConfetti();
      });
    }
  };

  const fireConfetti = () => {
    setTimeout(() => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#a78bfa', '#c084fc', '#e879f9', '#f0abfc', '#fcd34d'] });
    }, 200);
    confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ['#a78bfa', '#c084fc', '#e879f9'] });
    confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ['#a78bfa', '#c084fc', '#e879f9'] });
  };

  const nextRoundRef = useRef(0);

  const startPomodoroRound = (round: number) => {
    const total = minutes * 60;
    setPomodoroRound(round);
    setIsBreak(false);
    setSecondsLeft(total);
    setTotalSeconds(total);
    setScreen('running');
    runCountdown(total, () => {
      haptic.success();
      const nextRound = round + 1;
      nextRoundRef.current = nextRound;
      if (nextRound >= pomodoroCycles) {
        // Save complete pomodoro session
        saveFocusSession.mutate({
          durationSeconds: minutes * 60 * pomodoroCycles,
          sessionType: 'pomodoro',
          theme: customTheme || selectedTheme,
          pomodoroRounds: pomodoroCycles,
          completed: true,
          startedAt: sessionStartRef.current,
        });
        setScreen('completed');
        fireConfetti();
        // High-satisfaction moment → ask for a 5-star review (cooldown-protected)
        import('@/lib/appReview').then(({ triggerSoftReview }) =>
          setTimeout(() => triggerSoftReview('focus_pomodoro_complete'), 2000)
        );
      } else {
        setScreen('pomodoroRoundDone');
      }
    });
  };

  const startPomodoroBreak = () => {
    setIsBreak(true);
    setSecondsLeft(breakMinutes * 60);
    setTotalSeconds(breakMinutes * 60);
    setScreen('pomodoroBreak');
    runCountdown(breakMinutes * 60, () => {
      haptic.medium();
      // Show "Break's over" screen
      setScreen('pomodoroBreakDone');
    });
  };

  // Wall-clock refs for background resilience
  const countdownStartWallRef = useRef<number>(0);
  const countdownTotalRef = useRef<number>(0);
  const countdownCallbackRef = useRef<(() => void) | null>(null);

  const runCountdown = (total: number, onComplete: () => void) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    countdownStartWallRef.current = Date.now();
    countdownTotalRef.current = total;
    countdownCallbackRef.current = onComplete;
    setSecondsLeft(total);

    // Schedule PN for when timer ends
    const themeLabel = customTheme || selectedTheme;
    const isPomodoro = activeTab === 'pomodoro';
    scheduleFocusTimerNotification(
      isPomodoro ? `Pomodoro ${pomodoroRound + 1}/${pomodoroCycles}` : `${themeLabel} Timer`,
      isPomodoro ? '🍅' : '⏱️',
      total,
    );

    intervalRef.current = setInterval(() => {
      const wallElapsed = Math.round((Date.now() - countdownStartWallRef.current) / 1000);
      const remaining = Math.max(0, countdownTotalRef.current - wallElapsed);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        cancelFocusTimerNotification();
        onComplete();
      }
    }, 1000);
  };

  // Sync timer on app resume from background
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && intervalRef.current && countdownStartWallRef.current > 0) {
        const wallElapsed = Math.round((Date.now() - countdownStartWallRef.current) / 1000);
        const remaining = Math.max(0, countdownTotalRef.current - wallElapsed);
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          cancelFocusTimerNotification();
          countdownCallbackRef.current?.();
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    cancelFocusTimerNotification();
    // Save partial session
    const elapsed = totalSeconds - secondsLeft;
    if (elapsed > 0) {
      saveFocusSession.mutate({
        durationSeconds: elapsed,
        sessionType: activeTab === 'pomodoro' ? 'pomodoro' : 'timer',
        theme: customTheme || selectedTheme,
        pomodoroRounds: activeTab === 'pomodoro' ? pomodoroRound + 1 : undefined,
        completed: false,
        startedAt: sessionStartRef.current,
      });
    }
    haptic.warning();
    setScreen('stopped');
  }, [totalSeconds, secondsLeft, activeTab, customTheme, selectedTheme, pomodoroRound, saveFocusSession]);

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
    if (slideCtx) slideCtx.slideClose();
    else navigate(-1);
  };

  // Ruler scroll helpers
  const TICK_WIDTH = 16;
  const MAX_MIN = 90;
  const POMODORO_STEP = 5;
  const POMODORO_MIN = 5;
  const POMODORO_MAX = 60;

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
    const rawVal = (scrollLeft - paddingLeft + containerW / 2) / TICK_WIDTH;

    let clamped: number;
    if (activeTab === 'pomodoro') {
      // Snap to nearest 5-min increment
      clamped = Math.round(rawVal / POMODORO_STEP) * POMODORO_STEP;
      clamped = Math.max(POMODORO_MIN, Math.min(POMODORO_MAX, clamped));
    } else {
      clamped = Math.max(1, Math.min(MAX_MIN, Math.round(rawVal)));
    }

    if (clamped !== lastHapticVal.current) {
      if (clamped % 5 === 0) {
        haptic.medium();
      } else {
        haptic.selection();
      }
      lastHapticVal.current = clamped;
    }
    setMinutes(clamped);
  }, [activeTab]);

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
        <div
          className="flex items-center justify-between px-4 pb-2"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
        >
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
              {t('timer.timer')}
            </button>
            <button
              onClick={() => { setActiveTab('pomodoro'); haptic.light(); }}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === 'pomodoro' ? 'bg-foreground text-background' : 'text-muted-foreground'
              )}
            >
              {t('timer.pomodoro')}
            </button>
          </div>
          <button onClick={() => { setScreen('stats'); haptic.light(); }} className="p-2 -mr-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 7h18" />
              <path d="M8 3v4" />
              <path d="M16 3v4" />
              <rect x="7" y="11" width="3" height="8" rx="0.5" fill="currentColor" stroke="none" />
              <rect x="11.5" y="13" width="3" height="6" rx="0.5" fill="currentColor" stroke="none" />
              <rect x="16" y="15" width="3" height="4" rx="0.5" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>

        {/* Timer Display */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
          {/* Pomodoro tomatoes — absolutely positioned so they don't shift the circle */}
          {activeTab === 'pomodoro' && (
            <div className="absolute top-[calc(50%-180px)] flex gap-2">
              {Array.from({ length: pomodoroCycles }, (_, i) => (
                <FluentEmoji key={i} emoji="🍅" size={28} />
              ))}
            </div>
          )}

          {/* Hand-drawn ellipse */}
          <div className="relative">
            {/* SVG Ellipse */}
            <svg width="280" height="280" viewBox="0 0 280 280" className="drop-shadow-ios">
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
              <span className="text-sm text-muted-foreground mt-1">{t('timer.tapToAdjust')}</span>
            </button>
          </div>

          {/* Theme selector */}
          <button
            onClick={() => { setScreen('pickTheme'); haptic.light(); }}
            className="flex items-center gap-1.5 mt-6 px-4 py-2 rounded-full bg-muted active:bg-muted/80 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">{customTheme || selectedTheme}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Bottom bar */}
        <div className="px-6 pt-4 flex items-center gap-3" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => { setScreen('settings'); setSettingsTab(activeTab); haptic.light(); }}
            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={startTimer}
            className="flex-1 h-12 rounded-full bg-foreground text-background font-semibold text-base transition-transform active:scale-[0.97]"
          >
            {activeTab === 'pomodoro' ? t('timer.startFocus') : t('timer.startTimer')}
          </button>
          <button
            onClick={handleRoutineClick}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
              isAdded
                ? "bg-success/20"
                : "bg-urgency"
            )}
          >
            {isAdded ? (
              <Check className="h-5 w-5 text-success" />
            ) : (
              <CalendarPlus className="h-5 w-5 text-urgency-foreground" />
            )}
          </button>
        </div>

        {/* Routine Preview Sheet */}
        <RoutinePreviewSheet
          open={showRoutineSheet}
          onOpenChange={setShowRoutineSheet}
          tasks={[SYNTHETIC_TIMER_TASK]}
          routineTitle={t('timer.focusTimer')}
          onSave={handleSaveRoutine}
          isSaving={addRoutinePlan.isPending}
        />
      </div>
    );
  }


  // ─── SETTINGS SCREEN ───
  if (screen === 'settings') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
          <button onClick={() => { setScreen('setup'); haptic.light(); }} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={() => { setScreen('setup'); haptic.light(); }}
            className="text-base font-semibold text-foreground pr-2"
          >
            {t('timer.save')}
          </button>
        </div>

        <div className="px-5 pt-2 pb-4">
          <h1 className="text-2xl font-bold text-foreground">{t('timer.settings')}</h1>
        </div>

        {/* Timer / Pomodoro tabs */}
        <div className="px-5 mb-4">
          <div className="flex bg-muted rounded-full p-1">
            <button
              onClick={() => { setSettingsTab('timer'); haptic.light(); }}
              className={cn(
                'flex-1 py-2.5 rounded-full text-sm font-medium transition-colors',
                settingsTab === 'timer' ? 'bg-foreground text-background' : 'text-muted-foreground'
              )}
            >
              {t('timer.timer')}
            </button>
            <button
              onClick={() => { setSettingsTab('pomodoro'); haptic.light(); }}
              className={cn(
                'flex-1 py-2.5 rounded-full text-sm font-medium transition-colors',
                settingsTab === 'pomodoro' ? 'bg-foreground text-background' : 'text-muted-foreground'
              )}
            >
              {t('timer.pomodoro')}
            </button>
          </div>
        </div>

        {/* Reminders card */}
        <div className="px-5 mb-6">
          <div className="bg-muted/50 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-foreground" />
              <span className="text-base font-medium text-foreground">{t('timer.reminders')}</span>
            </div>
            <Switch
              checked={remindersEnabled}
              onCheckedChange={(checked) => { setRemindersEnabled(checked); haptic.light(); }}
            />
          </div>
        </div>

        {/* Pomodoro-specific settings */}
        {settingsTab === 'pomodoro' && (
          <>
            <div className="px-5 mb-3">
              <h2 className="text-lg font-bold text-foreground">{t('timer.pomodoroTechnique')}</h2>
            </div>

            <div className="px-5 mb-6">
              <div className="bg-muted/50 rounded-2xl divide-y divide-border/50">
                {/* Pomodoro Cycle */}
                <button
                  onClick={() => { setShowCyclePicker(true); haptic.light(); }}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <TimerIcon className="h-5 w-5 text-foreground" />
                    <span className="text-base font-medium text-foreground">{t('timer.pomodoroCycle')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">{t('timer.sessions', { count: pomodoroCycles })}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>

                {/* Short Break */}
                <button
                  onClick={() => { setShowBreakPicker(true); haptic.light(); }}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <Coffee className="h-5 w-5 text-foreground" />
                    <span className="text-base font-medium text-foreground">{t('timer.shortBreak')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">{t('timer.mins', { count: breakMinutes })}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              </div>
            </div>

            {/* How it works link */}
            <div className="flex-1" />
            <div className="px-5 pb-8">
              <button
                onClick={() => { setShowHowItWorks(true); haptic.light(); }}
                className="w-full text-center text-sm font-medium text-foreground underline underline-offset-2"
              >
                {t('timer.howItWorksLink')}
              </button>
            </div>
          </>
        )}

        {/* Pomodoro Cycle Picker Sheet */}
        <AnimatePresence>
          {showCyclePicker && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-30"
                onClick={() => setShowCyclePicker(false)}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-40 bg-background rounded-t-3xl"
              >
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <button onClick={() => setShowCyclePicker(false)}>
                    <X className="h-5 w-5 text-foreground" />
                  </button>
                  <span className="text-base font-semibold text-foreground">{t('timer.pomodoroCycle')}</span>
                  <div className="w-5" />
                </div>

                <div className="px-5 py-6 flex flex-col items-center gap-2">
                  {[2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => { setPomodoroCycles(n); haptic.selection(); }}
                      className={cn(
                        "w-full py-3.5 rounded-xl text-center transition-colors flex items-center justify-between px-6",
                        n === pomodoroCycles ? "bg-muted" : ""
                      )}
                    >
                      <span className={cn(
                        "text-2xl font-bold",
                        n === pomodoroCycles ? "text-foreground" : "text-muted-foreground/50"
                      )}>{n}</span>
                      {n === pomodoroCycles && (
                        <span className="text-base text-muted-foreground">{t('timer.session')}</span>
                      )}
                    </button>
                  ))}
                </div>

                <p className="text-center text-sm text-muted-foreground px-8 pb-4">
                  {t('timer.cycleHint')}
                </p>

                <div className="px-5 pb-8">
                  <button
                    onClick={() => { setShowCyclePicker(false); haptic.medium(); }}
                    className="w-full h-12 rounded-full bg-foreground text-background font-semibold text-base"
                  >
                    {t('timer.ok')}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Short Break Picker Sheet */}
        <AnimatePresence>
          {showBreakPicker && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-30"
                onClick={() => setShowBreakPicker(false)}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-40 bg-background rounded-t-3xl"
              >
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <button onClick={() => setShowBreakPicker(false)}>
                    <X className="h-5 w-5 text-foreground" />
                  </button>
                  <span className="text-base font-semibold text-foreground">{t('timer.shortBreak')}</span>
                  <div className="w-5" />
                </div>

                <div className="px-5 py-6 flex flex-col items-center gap-2">
                  {[3, 4, 5, 6, 7, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => { setBreakMinutes(n); haptic.selection(); }}
                      className={cn(
                        "w-full py-3.5 rounded-xl text-center transition-colors flex items-center justify-between px-6",
                        n === breakMinutes ? "bg-muted" : ""
                      )}
                    >
                      <span className={cn(
                        "text-2xl font-bold",
                        n === breakMinutes ? "text-foreground" : "text-muted-foreground/50"
                      )}>{n}</span>
                      {n === breakMinutes && (
                        <span className="text-base text-muted-foreground">{t('timer.min')}</span>
                      )}
                    </button>
                  ))}
                </div>

                <p className="text-center text-sm text-muted-foreground px-8 pb-4">
                  {t('timer.breakHint')}
                </p>

                <div className="px-5 pb-8">
                  <button
                    onClick={() => { setShowBreakPicker(false); haptic.medium(); }}
                    className="w-full h-12 rounded-full bg-foreground text-background font-semibold text-base"
                  >
                    {t('timer.ok')}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* How Pomodoro Works Sheet */}
        <AnimatePresence>
          {showHowItWorks && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-30"
                onClick={() => setShowHowItWorks(false)}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-40 bg-background rounded-t-3xl px-6 pt-8 pb-8"
              >
                <h2 className="text-2xl font-bold text-foreground text-center mb-6">
                  {t('timer.howItWorksTitle')}
                </h2>

                <div className="space-y-5 mb-8">
                  <p className="text-base text-foreground flex items-start gap-2">
                    <FluentEmoji emoji="🍅" size={20} className="mt-0.5 shrink-0" /> {t('timer.howItWorksP1')}
                  </p>
                  <p className="text-base text-foreground flex items-start gap-2">
                    <FluentEmoji emoji="🍅" size={20} className="mt-0.5 shrink-0" /> {t('timer.howItWorksP2')}
                  </p>
                  <p className="text-base text-foreground flex items-start gap-2">
                    <FluentEmoji emoji="🍅" size={20} className="mt-0.5 shrink-0" /> {t('timer.howItWorksP3')}
                  </p>
                  <p className="text-base text-foreground flex items-start gap-2">
                    <FluentEmoji emoji="🍅" size={20} className="mt-0.5 shrink-0" /> {t('timer.howItWorksP4')}
                  </p>
                </div>

                <button
                  onClick={() => { setShowHowItWorks(false); haptic.light(); }}
                  className="w-full h-12 rounded-full bg-foreground text-background font-semibold text-base"
                >
                  {t('timer.gotIt')}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── STATS SCREEN ───
  if (screen === 'stats') {
    return <FocusStatsScreen onBack={() => { setScreen('setup'); haptic.light(); }} />;
  }

  if (screen === 'adjustTime') {
    const isPomodoro = activeTab === 'pomodoro';
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
          <button onClick={() => { setScreen('setup'); haptic.light(); }} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h2 className="text-xl font-semibold text-foreground mb-16">
            {isPomodoro ? t('timer.adjustPomodoroTime') : t('timer.adjustTime')}
          </h2>

          {/* Triangle pointer */}
          <div className="mb-2">
            <svg width="20" height="12" viewBox="0 0 20 12">
              <polygon points="10,0 20,12 0,12" fill={isPomodoro ? 'hsl(0, 70%, 68%)' : 'hsl(var(--foreground))'} />
            </svg>
          </div>

          {/* Large minute display */}
          <div className="flex items-baseline gap-1 mb-8">
            <span
              className="text-7xl font-bold"
              style={{ fontVariantNumeric: 'tabular-nums', color: isPomodoro ? 'hsl(0, 70%, 68%)' : 'hsl(var(--foreground))' }}
            >
              {minutes}
            </span>
            <span
              className="text-2xl font-semibold"
              style={{ color: isPomodoro ? 'hsl(0, 70%, 68%)' : 'hsl(var(--muted-foreground))' }}
            >
              {t('timer.min')}
            </span>
          </div>

          {/* Scrollable ruler */}
          <div className="w-full max-w-sm relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            
            {/* Center line indicator */}
            <div
              className="absolute left-1/2 -translate-x-[1.5px] top-0 w-[3px] h-16 rounded-full z-10 pointer-events-none"
              style={{ backgroundColor: isPomodoro ? 'hsl(0, 70%, 68%)' : 'hsl(var(--foreground))' }}
            />

            <div
              ref={rulerRef}
              className="overflow-x-auto scrollbar-hide"
              onScroll={handleRulerScroll}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
              }}
            >
              {isPomodoro ? (
                /* Pomodoro: 5-min steps only */
                <div className="flex items-end" style={{ width: `${(POMODORO_MAX + 1) * TICK_WIDTH + 400}px`, paddingLeft: '50%', paddingRight: '50%' }}>
                  {Array.from({ length: POMODORO_MAX + 1 }, (_, i) => {
                    const isMajor = i % 5 === 0;
                    if (!isMajor && i % 1 === 0) {
                      // Show minor ticks between 5-min marks
                      return (
                        <div key={i} className="flex flex-col items-center" style={{ width: `${TICK_WIDTH}px`, flexShrink: 0 }}>
                          <div className="w-[2px] h-6 rounded-full bg-muted-foreground/25" />
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex flex-col items-center" style={{ width: `${TICK_WIDTH}px`, flexShrink: 0 }}>
                        <div
                          className="rounded-full transition-colors w-[3px] h-10"
                          style={{ backgroundColor: i === minutes ? 'hsl(0, 70%, 68%)' : 'hsl(var(--muted-foreground) / 0.25)' }}
                        />
                        <span
                          className="text-xs mt-2 font-medium transition-colors"
                          style={{ color: i === minutes ? 'hsl(0, 70%, 68%)' : 'hsl(var(--muted-foreground) / 0.4)' }}
                        >
                          {i}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Timer: 1-min steps */
                <div className="flex items-end" style={{ width: `${(MAX_MIN + 1) * TICK_WIDTH + 400}px`, paddingLeft: '50%', paddingRight: '50%' }}>
                  {Array.from({ length: MAX_MIN + 1 }, (_, i) => {
                    const isMajor = i % 5 === 0;
                    return (
                      <div key={i} className="flex flex-col items-center" style={{ width: `${TICK_WIDTH}px`, flexShrink: 0 }}>
                        <div
                          className={cn(
                            "rounded-full transition-colors",
                            isMajor ? "w-[3px] h-10" : "w-[2px] h-6",
                            i === minutes ? "bg-foreground" : "bg-muted-foreground/25"
                          )}
                        />
                        {isMajor && (
                          <span className={cn(
                            "text-xs mt-2 font-medium transition-colors",
                            i === minutes ? "text-foreground" : "text-muted-foreground/40"
                          )}>
                            {i}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Done button with lavender gradient */}
        <div className="px-6 pt-4 relative" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-muted/50 to-transparent pointer-events-none" />
          <button
            onClick={() => { setScreen('setup'); haptic.medium(); }}
            className="relative w-full h-12 rounded-full bg-foreground text-background font-semibold text-base transition-transform active:scale-[0.97]"
          >
            {t('timer.done')}
          </button>
        </div>
      </div>
    );
  }

  // ─── THEME PICKER SCREEN ───
  if (screen === 'pickTheme') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
          <button onClick={() => { setScreen('setup'); haptic.light(); }} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center px-6 pt-12">
          {/* Custom theme input */}
          <input
            type="text"
            maxLength={50}
            placeholder={t('timer.customThemes')}
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
                  selectedTheme === theme.label && !customTheme && 'ring-2 ring-foreground ring-offset-2'
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
    const digitColors = ['text-white', 'text-white/80', 'text-white/90', 'text-white/70'];

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
        <div className="absolute right-4 flex flex-col gap-3 z-20" style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}>
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
                  <span className="text-base font-semibold text-foreground">{t('timer.whiteNoise')}</span>
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
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <div className="relative">
                        <Music className="h-5 w-5 text-foreground" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-[1.5px] h-7 bg-foreground rotate-45 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <span className="text-base font-medium text-foreground flex-1 text-left">{t('timer.musicOff')}</span>
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

        {/* Decorative elements */}
        {!isFullscreen && (
          <>
            <div className="absolute top-20 right-16 text-white/10 text-2xl select-none">●</div>
            <div className="absolute top-28 right-20 text-white/5 text-sm select-none">●</div>
            <div className="absolute top-24 left-10 text-white/8 text-lg select-none">✦</div>
          </>
        )}

        {/* Pomodoro tomato indicators */}
        {activeTab === 'pomodoro' && !isFullscreen && (
          <div className="absolute left-0 right-0 flex justify-center gap-2" style={{ top: 'calc(env(safe-area-inset-top) + 24px)' }}>
            {Array.from({ length: pomodoroCycles }, (_, i) => (
              <span key={i} className={cn("transition-opacity", i <= pomodoroRound ? "opacity-100" : "opacity-30")}>
                <FluentEmoji emoji="🍅" size={24} />
              </span>
            ))}
          </div>
        )}

        {/* Countdown */}
        <div className="flex items-center justify-center flex-col">
          {isFullscreen ? (
            // Fullscreen: digits rotated 90° so phone is held landscape-style
            <div className="rotate-90 flex items-center" style={{ transformOrigin: 'center center', fontVariantNumeric: 'tabular-nums' }}>
              {[mm[0], mm[1]].map((d, i) => (
                <span key={`m${i}`} className={cn("font-black inline-block text-center", digitColors[i])}
                  style={{ fontSize: 'min(40vh, 300px)', lineHeight: 0.85, width: '0.65em' }}>{d}</span>
              ))}
              <div className="flex flex-col gap-3 mx-2">
                <div className="w-5 h-5 rounded-full bg-white/30" />
                <div className="w-5 h-5 rounded-full bg-white/30" />
              </div>
              {[ss[0], ss[1]].map((d, i) => (
                <span key={`s${i}`} className={cn("font-black inline-block text-center", digitColors[i + 2])}
                  style={{ fontSize: 'min(40vh, 300px)', lineHeight: 0.85, width: '0.65em' }}>{d}</span>
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
                <div className="w-8 h-0.5 rounded-full bg-white/20" />
                <div className="w-12 h-0.5 rounded-full bg-white/15" />
                <div className="w-6 h-0.5 rounded-full bg-white/20" />
              </div>
              <p className="text-white/30 text-sm mt-3">
                {activeTab === 'pomodoro' ? t('timer.roundOf', { round: pomodoroRound + 1, total: pomodoroCycles }) : (customTheme || selectedTheme)}
              </p>
            </>
          )}
        </div>

        {/* Hold to stop */}
        <div className="absolute left-0 right-0 px-10 flex flex-col items-center gap-3" style={{ bottom: 'max(64px, calc(env(safe-area-inset-bottom) + 32px))' }}>
          <p className="text-white/40 text-sm">{t('timer.holdToStop')}</p>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white/60"
              style={{ width: `${holdProgress * 100}%` }}
              transition={{ duration: 0 }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── POMODORO: ROUND DONE → "Time for a short break" ───
  if (screen === 'pomodoroRoundDone') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-black flex flex-col items-center justify-center px-8 relative select-none"
      >
        <FluentEmoji emoji="🍅" size={56} className="mb-8" />
        <h1 className="text-3xl font-extrabold text-white text-center leading-tight mb-2">
          {t('timer.youveBeenFocusing')}{' '}
          <span className="text-[hsl(var(--primary))]">{t('timer.minutesShort', { count: minutes })}</span>.
        </h1>
        <h1 className="text-3xl font-extrabold text-white text-center leading-tight">
          {t('timer.timeForBreak')}
        </h1>

        <div className="absolute left-0 right-0 px-8" style={{ bottom: 'max(48px, calc(env(safe-area-inset-bottom) + 24px))' }}>
          <button
            onClick={() => { haptic.medium(); startPomodoroBreak(); }}
            className="w-full h-14 rounded-full bg-white text-black font-semibold text-base transition-transform active:scale-[0.97]"
          >
            {t('timer.takeABreak')}
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── POMODORO: BREAK COUNTDOWN ───
  if (screen === 'pomodoroBreak') {
    const breakTimeStr = formatTime(secondsLeft);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-black flex flex-col items-center justify-center relative select-none"
      >
        {/* Tomato progress */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: pomodoroCycles }, (_, i) => (
            <span key={i} className={cn("transition-opacity", i <= pomodoroRound ? "opacity-100" : "opacity-30")}>
              <FluentEmoji emoji="🍅" size={28} />
            </span>
          ))}
        </div>

        <p className="text-white/50 text-sm mb-2">{t('timer.breakTime')}</p>
        <span className="text-6xl font-bold text-white mb-4" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {breakTimeStr}
        </span>
        <p className="text-white/40 text-sm">
          {t('timer.roundStartsSoon', { round: nextRoundRef.current + 1 })}
        </p>

        {/* Skip break */}
        <button
          onClick={() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            haptic.medium();
            startPomodoroRound(nextRoundRef.current);
          }}
          className="mt-10 px-6 py-3 rounded-full bg-white/10 text-white font-semibold text-sm transition-transform active:scale-[0.97]"
        >
          {t('timer.skipBreak')}
        </button>
      </motion.div>
    );
  }

  // ─── POMODORO: BREAK DONE → "Break's over!" ───
  if (screen === 'pomodoroBreakDone') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-black flex flex-col items-center justify-center px-8 relative select-none"
      >
        <FluentEmoji emoji="🍅" size={56} className="mb-8" />
        <h1 className="text-3xl font-extrabold text-center leading-tight mb-1">
          <span className="text-[hsl(var(--primary))]">{t('timer.breaksOver')}</span>
        </h1>
        <h1 className="text-3xl font-extrabold text-white text-center leading-tight">
          {t('timer.diveIntoNext')}
        </h1>

        <div className="absolute left-0 right-0 px-8" style={{ bottom: 'max(48px, calc(env(safe-area-inset-bottom) + 24px))' }}>
          <button
            onClick={() => { haptic.medium(); startPomodoroRound(nextRoundRef.current); }}
            className="w-full h-14 rounded-full bg-white text-black font-semibold text-base transition-transform active:scale-[0.97]"
          >
            {t('timer.startFocusBtn')}
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── COMPLETED SCREEN ───
  if (screen === 'completed') {
    const totalFocusMin = activeTab === 'pomodoro' ? minutes * pomodoroCycles : minutes;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex flex-col items-center justify-center px-6 bg-background"
      >
        <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center mb-6">
          <Check className="h-8 w-8 text-background" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">{t('timer.wow')}</h1>
        <p className="text-muted-foreground text-center mb-10">
          {activeTab === 'pomodoro'
            ? t('timer.celebratePomodoro', { count: totalFocusMin })
            : t('timer.celebrateProgress')}
        </p>
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button
            onClick={() => { haptic.success(); setScreen('setup'); }}
            className="w-full h-12 rounded-full bg-foreground text-background font-semibold text-base transition-transform active:scale-[0.97]"
          >
            {t('timer.doingGreat')}
          </button>
          <FocusShareButton minutes={totalFocusMin} mode={activeTab} />
        </div>
      </motion.div>
    );
  }

  // ─── STOPPED SCREEN ───
  if (screen === 'stopped') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex flex-col items-center justify-center px-6 bg-background"
      >
        <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-background" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">{t('timer.relax')}</h1>
        <p className="text-muted-foreground text-center mb-10">{t('timer.continueWhenReady')}</p>
        <button
          onClick={() => { haptic.light(); setScreen('setup'); }}
          className="w-full max-w-xs h-12 rounded-full bg-foreground text-background font-semibold text-base transition-transform active:scale-[0.97]"
        >
          {t('timer.gotItBang')}
        </button>
      </motion.div>
    );
  }

  return null;
}
