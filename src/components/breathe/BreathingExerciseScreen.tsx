import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, Play, HelpCircle, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BreathingCircle } from './BreathingCircle';
import { ImmersiveBreathingCircle, ImmersiveParticles, getImmersiveBgGradient } from './ImmersiveBreathingCircle';
import { BreathingInfoSheet } from './BreathingInfoSheet';
import { CloseButton } from '@/components/app/CloseButton';
import { BreathingExercise, useSaveBreathingSession } from '@/hooks/useBreathingExercises';
import { useAutoCompleteProTask } from '@/hooks/useAutoCompleteProTask';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { BreathingCompleteSheet } from './BreathingCompleteSheet';

interface BreathingExerciseScreenProps {
  exercise: BreathingExercise;
  onClose: () => void;
  returnTo?: string;
}

type BreathPhase = 'inhale' | 'inhale_hold' | 'exhale' | 'exhale_hold';

interface PhaseConfig {
  type: BreathPhase;
  duration: number;
  text: string;
  method?: string;
}

const CYCLE_VALUES = [3, 5, 10, 30] as const;
const MINUTE_VALUES = [1, 3, 5, 10] as const;

type DurationMode = 'cycles' | 'minutes';

type LayoutMode = 'classic' | 'immersive';

export function BreathingExerciseScreen({
  exercise,
  onClose,
  returnTo,
}: BreathingExerciseScreenProps) {
  const { t } = useTranslation();
  const CYCLE_OPTIONS = CYCLE_VALUES.map(v => ({ value: v, label: t('breathePage.cyclesShort', { count: v }) }));
  const MINUTE_OPTIONS = MINUTE_VALUES.map(v => ({ value: v, label: t('breathePage.minShort', { count: v }) }));
  // Layout toggle
  const [layout, setLayout] = useState<LayoutMode>(() => {
    try {
      return (localStorage.getItem('simora_breathe_layout') as LayoutMode) || 'immersive';
    } catch { return 'immersive'; }
  });

  const toggleLayout = useCallback(() => {
    setLayout(prev => {
      const next = prev === 'classic' ? 'immersive' : 'classic';
      try { localStorage.setItem('simora_breathe_layout', next); } catch {}
      haptic.light();
      return next;
    });
  }, []);

  // Duration mode
  const [durationMode, setDurationMode] = useState<DurationMode>('cycles');
  const [selectedMinutes, setSelectedMinutes] = useState(3);
  // Cycle-based length
  const [selectedCycles, setSelectedCycles] = useState(5);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showCompleteSheet, setShowCompleteSheet] = useState(false);
  const [completedDuration, setCompletedDuration] = useState(0);
  
  // Active session state
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  const saveSession = useSaveBreathingSession();
  const { autoCompleteBreathe } = useAutoCompleteProTask();
  const startTimeRef = useRef<number>(0);
  
  // Refs for values used inside the stable interval (single timer source of truth)
  const totalElapsedRef = useRef(totalElapsed);
  totalElapsedRef.current = totalElapsed;
  const currentPhaseIndexRef = useRef(currentPhaseIndex);
  currentPhaseIndexRef.current = currentPhaseIndex;
  const cycleCountRef = useRef(cycleCount);
  cycleCountRef.current = cycleCount;
  const phaseTimeRemainingRef = useRef(phaseTimeRemaining);
  phaseTimeRemainingRef.current = phaseTimeRemaining;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Always show info sheet when exercise opens
  useEffect(() => {
    setShowInfoSheet(true);
  }, [exercise.id]);

  // Build phases array from exercise config (memoized to stabilize effect deps)
  const phases = useMemo(() => {
    const p: PhaseConfig[] = [];
    if (exercise.inhale_seconds > 0) {
      p.push({ type: 'inhale', duration: exercise.inhale_seconds, text: t('breathePage.inhale'), method: exercise.inhale_method === 'nose' ? t('breathePage.nose') : t('breathePage.mouth') });
    }
    if (exercise.inhale_hold_seconds > 0) {
      p.push({ type: 'inhale_hold', duration: exercise.inhale_hold_seconds, text: t('breathePage.hold') });
    }
    if (exercise.exhale_seconds > 0) {
      p.push({ type: 'exhale', duration: exercise.exhale_seconds, text: t('breathePage.exhale'), method: exercise.exhale_method === 'nose' ? t('breathePage.nose') : t('breathePage.mouth') });
    }
    if (exercise.exhale_hold_seconds > 0) {
      p.push({ type: 'exhale_hold', duration: exercise.exhale_hold_seconds, text: t('breathePage.hold') });
    }
    return p;
  }, [exercise, t]);


  const currentPhase = phases[currentPhaseIndex];
  const totalTargetSeconds = durationMode === 'minutes' ? selectedMinutes * 60 : 0;
  // Smooth progress: completed cycles + fractional progress through current cycle
  const totalPhaseDuration = phases.reduce((sum, p) => sum + p.duration, 0);
  const currentPhaseElapsed = currentPhase ? currentPhase.duration - phaseTimeRemaining : 0;
  const elapsedInCurrentCycle = phases.slice(0, currentPhaseIndex).reduce((sum, p) => sum + p.duration, 0) + currentPhaseElapsed;
  const cycleFraction = totalPhaseDuration > 0 ? elapsedInCurrentCycle / totalPhaseDuration : 0;
  
  const progressPercent = isActive
    ? durationMode === 'cycles'
      ? ((cycleCount + cycleFraction) / selectedCycles) * 100
      : Math.min((totalElapsed / totalTargetSeconds) * 100, 100)
    : 0;

  // Initial countdown before starting
  useEffect(() => {
    if (!isCountingDown) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCountingDown(false);
          setIsActive(true);
          const initialPhaseDuration = phases[0]?.duration || 4;
          phaseTimeRemainingRef.current = initialPhaseDuration;
          setPhaseTimeRemaining(initialPhaseDuration);
          startTimeRef.current = Date.now();
          haptic.medium();
          return 0;
        }
        haptic.light();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountingDown, phases]);

  // Main breathing timer — single guarded interval to prevent double-ticks/skipped phases
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isActive || isPaused || isCountingDown || phases.length === 0) return;

    intervalRef.current = setInterval(() => {
      const nextElapsed = totalElapsedRef.current + 1;
      totalElapsedRef.current = nextElapsed;
      setTotalElapsed(nextElapsed);

      let nextRemaining = phaseTimeRemainingRef.current - 1;
      if (nextRemaining <= 0) {
        const nextIndex = (currentPhaseIndexRef.current + 1) % phases.length;
        currentPhaseIndexRef.current = nextIndex;
        setCurrentPhaseIndex(nextIndex);

        // Distinct haptic per phase type
        const nextPhaseType = phases[nextIndex].type;
        if (nextPhaseType === 'inhale') {
          haptic.medium();
        } else if (nextPhaseType === 'inhale_hold') {
          haptic.heavy();
        } else if (nextPhaseType === 'exhale') {
          haptic.light();
        } else if (nextPhaseType === 'exhale_hold') {
          haptic.selection();
        }

        if (nextIndex === 0) {
          const newC = cycleCountRef.current + 1;
          cycleCountRef.current = newC;
          setCycleCount(newC);
          if (durationMode === 'cycles' && newC >= selectedCycles) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            haptic.success();
            handleComplete(nextElapsed);
            return;
          }
        }

        nextRemaining = phases[nextIndex].duration;
      }

      phaseTimeRemainingRef.current = nextRemaining;
      setPhaseTimeRemaining(nextRemaining);

      if (durationMode === 'minutes' && nextElapsed >= selectedMinutes * 60) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        haptic.success();
        handleComplete(nextElapsed);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPaused, isCountingDown, phases, selectedCycles, selectedMinutes, durationMode]);

  const handleComplete = useCallback(async (elapsed: number) => {
    saveSession.mutate(
      { exerciseId: exercise.id, durationSeconds: elapsed },
      {
        onSuccess: async () => {
          await autoCompleteBreathe(exercise.id);
          setCompletedDuration(elapsed);
          setShowCompleteSheet(true);
        },
      }
    );

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsActive(false);
    setTotalElapsed(0);
    setCycleCount(0);
    setCurrentPhaseIndex(0);
    totalElapsedRef.current = 0;
    cycleCountRef.current = 0;
    currentPhaseIndexRef.current = 0;
    phaseTimeRemainingRef.current = 0;
  }, [exercise.id, saveSession, autoCompleteBreathe]);

  const handleStart = useCallback(() => {
    setCycleCount(0);
    setTotalElapsed(0);
    setCurrentPhaseIndex(0);
    setCountdown(3);
    setIsCountingDown(true);

    totalElapsedRef.current = 0;
    cycleCountRef.current = 0;
    currentPhaseIndexRef.current = 0;
    phaseTimeRemainingRef.current = 0;

    haptic.medium();
  }, []);

  const handlePauseToggle = useCallback(() => {
    setIsPaused(!isPaused);
    haptic.light();
  }, [isPaused]);

  const handleClose = useCallback(() => {
    if (isActive && totalElapsed > 10) {
      saveSession.mutate({ exerciseId: exercise.id, durationSeconds: totalElapsed });
    }
    onClose();
  }, [exercise.id, isActive, totalElapsed, saveSession, onClose]);

  const handleInfoDismiss = useCallback(() => {
    setShowInfoSheet(false);
  }, []);

  // Determine what to show in the breathing circle
  const getCircleState = () => {
    if (isCountingDown) {
      return { phase: 'ready' as const, text: countdown.toString(), method: undefined };
    }
    if (!isActive) {
      return { phase: 'ready' as const, text: t('breathePage.ready'), method: undefined };
    }
    if (isPaused) {
      return { phase: 'ready' as const, text: t('breathePage.paused'), method: undefined };
    }
    return {
      phase: currentPhase?.type || 'inhale',
      text: currentPhase?.text || t('breathePage.inhale'),
      method: currentPhase?.method,
    };
  };

  const circleState = getCircleState();

  // ─── Immersive layout ──────────────────────────────────────
  if (layout === 'immersive') {
    const immBgGradient = getImmersiveBgGradient(circleState.phase, isCountingDown);
    const isDone = cycleCount >= selectedCycles && !isActive;

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col overflow-hidden transition-all duration-[2000ms]"
        style={{ background: immBgGradient }}
      >
        <ImmersiveParticles />

        {/* Header */}
        <div className="relative z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={handleClose} className="p-2 rounded-full bg-white/10 text-white/70 active:bg-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            {isActive && (
              <span className="text-white/50 font-medium text-sm">
                {cycleCount} / {selectedCycles}
              </span>
            )}

            <div className="flex gap-2">
              <button
                onClick={toggleLayout}
                className="p-2 rounded-full bg-white/10 text-white/70 active:bg-white/20"
                title={t('breathePage.switchLayout')}
              >
                <Layers className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowInfoSheet(true)}
                className="p-2 rounded-full bg-white/10 text-white/70 active:bg-white/20"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Circle — absolutely centered, never shifts */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none" style={{ bottom: '200px' }}>
          <div className="relative flex flex-col items-center">
            <p className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-white/40 font-medium tracking-widest uppercase">{exercise.name}</p>

            <ImmersiveBreathingCircle
              phase={circleState.phase}
              phaseDuration={isActive && !isPaused ? currentPhase?.duration || 4 : 0}
              phaseText={circleState.text}
              methodText={circleState.method}
              countdown={currentPhase?.type.includes('hold') && isActive && !isPaused ? phaseTimeRemaining : undefined}
              isCountingDown={isCountingDown}
              countdownValue={countdown}
            />

            {/* Phase timer — always takes space to avoid layout shift */}
            <div className="mt-8 h-5 flex items-center justify-center">
              {isActive && !isPaused && !isCountingDown && (
                <p className="text-sm text-white/30 font-mono tracking-wider">{phaseTimeRemaining}s</p>
              )}
            </div>

            {/* Cycle dots — always takes space */}
            <div className="mt-4 h-8 flex items-center justify-center">
              {(isActive || isCountingDown) && durationMode === 'cycles' && (
                <div className="flex gap-2.5 flex-wrap justify-center max-w-[260px]">
                  {Array.from({ length: selectedCycles }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-500"
                      style={{
                        width: 8, height: 8,
                        background: i < cycleCount ? 'rgba(167,139,250,0.8)' : 'rgba(167,139,250,0.15)',
                        boxShadow: i < cycleCount ? '0 0 8px rgba(167,139,250,0.4)' : 'none',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Spacer to push controls to bottom */}
        <div className="flex-1" />

        {/* Bottom controls */}
        <div className="relative z-20 px-6 pb-safe mb-8">
          {!isActive && !isCountingDown && (
            <div className="mb-4 animate-fade-in">
              {/* Tab switcher */}
              <div className="flex justify-center gap-1 mb-3">
                {(['minutes', 'cycles'] as DurationMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setDurationMode(mode); haptic.light(); }}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-xs font-medium transition-all uppercase tracking-wider',
                      durationMode === mode
                        ? 'bg-white/20 text-white'
                        : 'text-white/40'
                    )}
                  >
                    {mode === 'minutes' ? t('breathePage.minutes') : t('breathePage.cycles')}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {durationMode === 'cycles'
                  ? CYCLE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setSelectedCycles(option.value); haptic.light(); }}
                        className={cn(
                          'py-3 px-2 rounded-xl text-sm font-medium transition-all',
                          selectedCycles === option.value
                            ? 'bg-purple-500/80 text-white'
                            : 'bg-white/10 text-white/60'
                        )}
                      >
                        {option.label}
                      </button>
                    ))
                  : MINUTE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setSelectedMinutes(option.value); haptic.light(); }}
                        className={cn(
                          'py-3 px-2 rounded-xl text-sm font-medium transition-all',
                          selectedMinutes === option.value
                            ? 'bg-purple-500/80 text-white'
                            : 'bg-white/10 text-white/60'
                        )}
                      >
                        {option.label}
                      </button>
                    ))
                }
              </div>
            </div>
          )}

          {(isActive || isCountingDown) && (
            <div className="mb-4">
              <Progress
                value={progressPercent}
                className="h-2 bg-white/10 [&>div]:bg-purple-400"
              />
              <div className="flex justify-between mt-2 text-sm text-white/40">
                {durationMode === 'cycles' ? (
                  <>
                    <span>{cycleCount} {t('breathePage.doneSuffix')}</span>
                    <span>{selectedCycles} {t('breathePage.totalSuffix')}</span>
                  </>
                ) : (
                  <>
                    <span>{Math.floor(totalElapsed / 60)}:{String(totalElapsed % 60).padStart(2, '0')}</span>
                    <span>{selectedMinutes}:00</span>
                  </>
                )}
              </div>
            </div>
          )}

          {!isCountingDown && (
            <button
              onClick={isActive ? handlePauseToggle : handleStart}
              className="w-full h-14 text-lg font-semibold rounded-2xl bg-purple-500/80 text-white active:bg-purple-600/80 transition-all flex items-center justify-center gap-2"
            >
              {isActive ? (
                isPaused ? (<><Play className="h-5 w-5" /> {t('breathePage.resume')}</>) : (<><Pause className="h-5 w-5" /> {t('breathePage.pause')}</>)
              ) : (
                <><Play className="h-5 w-5" /> {t('breathePage.start')}</>
              )}
            </button>
          )}
        </div>

        {/* Info Sheet */}
        <BreathingInfoSheet
          exercise={exercise}
          open={showInfoSheet}
          onOpenChange={setShowInfoSheet}
          onDismiss={handleInfoDismiss}
        />

        {/* Completion Sheet */}
        <BreathingCompleteSheet
          open={showCompleteSheet}
          onOpenChange={setShowCompleteSheet}
          exerciseName={exercise.name}
          durationSeconds={completedDuration}
          returnTo={returnTo}
        />
      </div>
    );
  }

  // ─── Classic layout ──────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Safe area top padding */}
      <div className="absolute top-0 left-0 right-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <CloseButton variant="muted" onClick={handleClose} to="/app/breathe" />
          
          {isActive && (
            <span className="text-muted-foreground font-medium">
              {cycleCount} / {selectedCycles}
            </span>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={toggleLayout}
              className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              title={t('breathePage.switchLayout')}
            >
              <Layers className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowInfoSheet(true)}
              className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main breathing visualization - vertically centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '200px' }}>
        <BreathingCircle
          phase={circleState.phase}
          phaseDuration={isActive && !isPaused ? currentPhase?.duration || 4 : 0}
          phaseText={circleState.text}
          methodText={circleState.method}
          countdown={currentPhase?.type.includes('hold') && isActive && !isPaused ? phaseTimeRemaining : undefined}
        />
      </div>

      {/* Controls section - fixed to bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-safe mb-8">
        {/* Cycle selector (only shown when not active) */}
        {!isActive && !isCountingDown && (
          <div className="mb-4 animate-fade-in">
            {/* Tab switcher */}
            <div className="flex justify-center gap-1 mb-3">
              {(['minutes', 'cycles'] as DurationMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setDurationMode(mode); haptic.light(); }}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-medium transition-all uppercase tracking-wider',
                    durationMode === mode
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                    {mode === 'minutes' ? t('breathePage.minutes') : t('breathePage.cycles')}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {durationMode === 'cycles'
                ? CYCLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setSelectedCycles(option.value); haptic.light(); }}
                      className={cn(
                        'py-3 px-2 rounded-xl text-sm font-medium transition-all',
                        selectedCycles === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {option.label}
                    </button>
                  ))
                : MINUTE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setSelectedMinutes(option.value); haptic.light(); }}
                      className={cn(
                        'py-3 px-2 rounded-xl text-sm font-medium transition-all',
                        selectedMinutes === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {option.label}
                    </button>
                  ))
              }
            </div>
          </div>
        )}

        {/* Progress bar (only shown when active) */}
        {(isActive || isCountingDown) && (
          <div className="mb-4 animate-fade-in">
            <Progress 
              value={progressPercent} 
              className="h-2 bg-muted [&>div]:bg-primary"
            />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              {durationMode === 'cycles' ? (
                <>
                  <span>{cycleCount} {t('breathePage.doneSuffix')}</span>
                  <span>{selectedCycles} {t('breathePage.totalSuffix')}</span>
                </>
              ) : (
                <>
                  <span>{Math.floor(totalElapsed / 60)}:{String(totalElapsed % 60).padStart(2, '0')}</span>
                  <span>{selectedMinutes}:00</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action button */}
        {!isCountingDown && (
          <Button
            onClick={isActive ? handlePauseToggle : handleStart}
            className="w-full h-14 text-lg font-semibold rounded-2xl"
          >
            {isActive ? (
              isPaused ? (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  {t('breathePage.resume')}
                </>
              ) : (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  {t('breathePage.pause')}
                </>
              )
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                {t('breathePage.start')}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Info Sheet */}
      <BreathingInfoSheet
        exercise={exercise}
        open={showInfoSheet}
        onOpenChange={setShowInfoSheet}
        onDismiss={handleInfoDismiss}
      />

      {/* Completion Sheet */}
      <BreathingCompleteSheet
        open={showCompleteSheet}
        onOpenChange={setShowCompleteSheet}
        exerciseName={exercise.name}
        durationSeconds={completedDuration}
        returnTo={returnTo}
      />
    </div>
  );
}
