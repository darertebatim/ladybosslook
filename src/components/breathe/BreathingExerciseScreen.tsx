import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Pause, Play, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BreathingCircle } from './BreathingCircle';
import { BreathingInfoSheet } from './BreathingInfoSheet';
import { BreathingExercise, useSaveBreathingSession } from '@/hooks/useBreathingExercises';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BreathingExerciseScreenProps {
  exercise: BreathingExercise;
  onClose: () => void;
}

type BreathPhase = 'inhale' | 'inhale_hold' | 'exhale' | 'exhale_hold';

interface PhaseConfig {
  type: BreathPhase;
  duration: number;
  text: string;
  method?: string;
}

const DURATION_OPTIONS = [
  { value: 60, label: '1 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' },
];

export function BreathingExerciseScreen({
  exercise,
  onClose,
}: BreathingExerciseScreenProps) {
  // Setup state
  const [selectedDuration, setSelectedDuration] = useState(180); // 3 min default
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  
  // Active session state
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  const saveSession = useSaveBreathingSession();
  const startTimeRef = useRef<number>(0);

  // Always show info sheet when exercise opens
  useEffect(() => {
    setShowInfoSheet(true);
  }, [exercise.id]);

  // Build phases array from exercise config
  const phases: PhaseConfig[] = [];
  
  if (exercise.inhale_seconds > 0) {
    phases.push({
      type: 'inhale',
      duration: exercise.inhale_seconds,
      text: 'Inhale',
      method: exercise.inhale_method === 'nose' ? 'Nose' : 'Mouth',
    });
  }
  
  if (exercise.inhale_hold_seconds > 0) {
    phases.push({
      type: 'inhale_hold',
      duration: exercise.inhale_hold_seconds,
      text: 'Hold',
    });
  }
  
  if (exercise.exhale_seconds > 0) {
    phases.push({
      type: 'exhale',
      duration: exercise.exhale_seconds,
      text: 'Exhale',
      method: exercise.exhale_method === 'nose' ? 'Nose' : 'Mouth',
    });
  }
  
  if (exercise.exhale_hold_seconds > 0) {
    phases.push({
      type: 'exhale_hold',
      duration: exercise.exhale_hold_seconds,
      text: 'Hold',
    });
  }

  const currentPhase = phases[currentPhaseIndex];
  const progressPercent = isActive ? (totalElapsed / selectedDuration) * 100 : 0;

  // Initial countdown before starting
  useEffect(() => {
    if (!isCountingDown) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCountingDown(false);
          setIsActive(true);
          setPhaseTimeRemaining(phases[0]?.duration || 4);
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

  // Main breathing timer
  useEffect(() => {
    if (!isActive || isPaused || isCountingDown) return;

    const timer = setInterval(() => {
      setPhaseTimeRemaining((prev) => {
        if (prev <= 1) {
          // Move to next phase
          const nextIndex = (currentPhaseIndex + 1) % phases.length;
          setCurrentPhaseIndex(nextIndex);
          haptic.light();
          return phases[nextIndex].duration;
        }
        return prev - 1;
      });

      setTotalElapsed((prev) => {
        const newElapsed = prev + 1;
        if (newElapsed >= selectedDuration) {
          // Session complete
          clearInterval(timer);
          haptic.success();
          handleComplete(newElapsed);
        }
        return newElapsed;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isPaused, isCountingDown, currentPhaseIndex, phases, selectedDuration]);

  const handleComplete = useCallback((elapsed: number) => {
    // Save session to database
    saveSession.mutate(
      { exerciseId: exercise.id, durationSeconds: elapsed },
      {
        onSuccess: () => {
          toast.success('Breathing session complete! 🧘');
        },
      }
    );
    setIsActive(false);
    setTotalElapsed(0);
    setCurrentPhaseIndex(0);
  }, [exercise.id, saveSession]);

  const handleStart = useCallback(() => {
    setCountdown(3);
    setIsCountingDown(true);
    haptic.medium();
  }, []);

  const handlePauseToggle = useCallback(() => {
    setIsPaused(!isPaused);
    haptic.light();
  }, [isPaused]);

  const handleClose = useCallback(() => {
    if (isActive && totalElapsed > 10) {
      // Save partial session if they did at least 10 seconds
      saveSession.mutate({ exerciseId: exercise.id, durationSeconds: totalElapsed });
    }
    onClose();
  }, [exercise.id, isActive, totalElapsed, saveSession, onClose]);

  const handleInfoDismiss = useCallback(() => {
    setShowInfoSheet(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine what to show in the breathing circle
  const getCircleState = () => {
    if (isCountingDown) {
      return { phase: 'ready' as const, text: countdown.toString(), method: undefined };
    }
    if (!isActive) {
      return { phase: 'ready' as const, text: 'Ready', method: undefined };
    }
    if (isPaused) {
      return { phase: 'ready' as const, text: 'Paused', method: undefined };
    }
    return {
      phase: currentPhase?.type || 'inhale',
      text: currentPhase?.text || 'Inhale',
      method: currentPhase?.method,
    };
  };

  const circleState = getCircleState();

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Safe area top padding */}
      <div className="absolute top-0 left-0 right-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          {isActive && (
            <span className="text-muted-foreground font-medium">
              {formatTime(selectedDuration - totalElapsed)}
            </span>
          )}
          
          <button
            onClick={() => setShowInfoSheet(true)}
            className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main breathing visualization - absolutely centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
        {/* Duration selector (only shown when not active) */}
        {!isActive && !isCountingDown && (
          <div className="mb-4 animate-fade-in">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 text-center">LENGTH</h4>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedDuration(option.value);
                    haptic.light();
                  }}
                  className={cn(
                    'py-3 px-2 rounded-xl text-sm font-medium transition-all',
                    selectedDuration === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {option.label}
                </button>
              ))}
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
              <span>{formatTime(totalElapsed)}</span>
              <span>{formatTime(selectedDuration)}</span>
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
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              )
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start
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
    </div>
  );
}
