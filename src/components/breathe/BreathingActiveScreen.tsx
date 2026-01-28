import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Pause, Play, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BreathingCircle } from './BreathingCircle';
import { BreathingExercise, useSaveBreathingSession } from '@/hooks/useBreathingExercises';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BreathingActiveScreenProps {
  exercise: BreathingExercise;
  duration: number; // total session duration in seconds
  onClose: () => void;
  onComplete: () => void;
}

type BreathPhase = 'inhale' | 'inhale_hold' | 'exhale' | 'exhale_hold';

interface PhaseConfig {
  type: BreathPhase;
  duration: number;
  text: string;
  method?: string;
}

export function BreathingActiveScreen({
  exercise,
  duration,
  onClose,
  onComplete,
}: BreathingActiveScreenProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [countdown, setCountdown] = useState(3);
  
  const saveSession = useSaveBreathingSession();
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

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
  const cycleDuration = phases.reduce((acc, p) => acc + p.duration, 0);
  const progressPercent = (totalElapsed / duration) * 100;

  // Initial countdown before starting
  useEffect(() => {
    if (!isStarting) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsStarting(false);
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
  }, [isStarting, phases]);

  // Main breathing timer
  useEffect(() => {
    if (isStarting || isPaused) return;

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
        if (newElapsed >= duration) {
          // Session complete
          clearInterval(timer);
          haptic.success();
          handleComplete();
        }
        return newElapsed;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarting, isPaused, currentPhaseIndex, phases, duration]);

  const handleComplete = useCallback(() => {
    // Save session to database
    saveSession.mutate(
      { exerciseId: exercise.id, durationSeconds: totalElapsed },
      {
        onSuccess: () => {
          toast.success('Breathing session complete! 🧘');
        },
      }
    );
    onComplete();
  }, [exercise.id, totalElapsed, saveSession, onComplete]);

  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      // Resuming
      pausedTimeRef.current = 0;
    } else {
      // Pausing
      pausedTimeRef.current = Date.now();
    }
    setIsPaused(!isPaused);
    haptic.light();
  }, [isPaused]);

  const handleClose = useCallback(() => {
    if (totalElapsed > 10) {
      // Save partial session if they did at least 10 seconds
      saveSession.mutate({ exerciseId: exercise.id, durationSeconds: totalElapsed });
    }
    onClose();
  }, [exercise.id, totalElapsed, saveSession, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#5C5A8D] to-[#4A4875]">
      {/* Safe area top padding */}
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <span className="text-white/80 font-medium">
          {formatTime(duration - totalElapsed)}
        </span>
        
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={cn(
            "p-2 rounded-full transition-colors",
            showHelp ? "bg-white/20 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
          )}
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>

      {/* Help overlay */}
      {showHelp && (
        <div className="absolute inset-x-4 top-20 bg-white/20 backdrop-blur-md rounded-2xl p-4 z-10">
          <h4 className="font-semibold text-white mb-2">How to breathe</h4>
          <ul className="text-sm text-white/80 space-y-1">
            <li>• Follow the expanding and contracting circles</li>
            <li>• Inhale through your {exercise.inhale_method}</li>
            <li>• Exhale through your {exercise.exhale_method}</li>
            {exercise.inhale_hold_seconds > 0 && (
              <li>• Hold after inhaling for {exercise.inhale_hold_seconds} seconds</li>
            )}
            {exercise.exhale_hold_seconds > 0 && (
              <li>• Hold after exhaling for {exercise.exhale_hold_seconds} seconds</li>
            )}
          </ul>
        </div>
      )}

      {/* Main breathing visualization */}
      <div className="flex-1 flex items-center justify-center">
        {isStarting ? (
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <span className="text-6xl font-bold text-white">{countdown}</span>
            </div>
            <span className="text-white/70 text-lg">Get ready...</span>
          </div>
        ) : (
          <BreathingCircle
            phase={isPaused ? 'ready' : currentPhase?.type || 'inhale'}
            phaseDuration={isPaused ? 0 : currentPhase?.duration || 4}
            phaseText={isPaused ? 'Paused' : currentPhase?.text || 'Inhale'}
            methodText={isPaused ? undefined : currentPhase?.method}
            countdown={currentPhase?.type.includes('hold') ? phaseTimeRemaining : undefined}
          />
        )}
      </div>

      {/* Progress and controls */}
      <div className="px-6 pb-safe mb-8">
        {/* Progress bar */}
        <div className="mb-6">
          <Progress 
            value={progressPercent} 
            className="h-2 bg-white/20"
          />
          <div className="flex justify-between mt-2 text-sm text-white/60">
            <span>{formatTime(totalElapsed)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Pause/Play button */}
        {!isStarting && (
          <Button
            onClick={handlePauseToggle}
            className="w-full h-14 text-lg font-semibold bg-white/20 text-white hover:bg-white/30 rounded-2xl border border-white/10"
          >
            {isPaused ? (
              <>
                <Play className="h-5 w-5 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
