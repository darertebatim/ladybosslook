import { BreathingExercise } from '@/hooks/useBreathingExercises';
import { cn } from '@/lib/utils';

interface BreathingExerciseCardProps {
  exercise: BreathingExercise;
  onClick: () => void;
}

export function BreathingExerciseCard({ exercise, onClick }: BreathingExerciseCardProps) {
  // Calculate total cycle duration
  const cycleDuration = 
    exercise.inhale_seconds + 
    exercise.inhale_hold_seconds + 
    exercise.exhale_seconds + 
    exercise.exhale_hold_seconds;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-2xl transition-all',
        'bg-white/20 backdrop-blur-sm border border-white/10',
        'hover:bg-white/30 active:scale-[0.98]'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Emoji */}
        <div className="text-3xl flex-shrink-0">{exercise.emoji}</div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-lg">{exercise.name}</h3>
          <p className="text-white/70 text-sm line-clamp-2 mt-0.5">
            {exercise.description}
          </p>
          
          {/* Timing info */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
              {cycleDuration}s cycle
            </span>
            {exercise.inhale_hold_seconds > 0 && (
              <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                with holds
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
