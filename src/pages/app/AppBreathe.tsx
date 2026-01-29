import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/SEOHead';
import { BackButton } from '@/components/app/BackButton';
import { 
  useBreathingExercises, 
  BreathingExercise,
  BREATHING_CATEGORIES 
} from '@/hooks/useBreathingExercises';
import { BreathingExerciseCard } from '@/components/breathe/BreathingExerciseCard';
import { BreathingExerciseScreen } from '@/components/breathe/BreathingExerciseScreen';
import { Skeleton } from '@/components/ui/skeleton';
import { haptic } from '@/lib/haptics';

export default function AppBreathe() {
  const [searchParams] = useSearchParams();
  const { data: exercises, isLoading } = useBreathingExercises();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('calm');
  const [selectedExercise, setSelectedExercise] = useState<BreathingExercise | null>(null);

  // Handle deep link to specific exercise from pro task
  const exerciseId = searchParams.get('exercise');
  
  useEffect(() => {
    if (exerciseId && exercises && exercises.length > 0) {
      const exercise = exercises.find(e => e.id === exerciseId);
      if (exercise) {
        setSelectedExercise(exercise);
        setSelectedCategory(exercise.category);
      }
    }
  }, [exerciseId, exercises]);

  // Filter exercises by category
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter(e => e.category === selectedCategory);
  }, [exercises, selectedCategory]);

  const handleExerciseClick = (exercise: BreathingExercise) => {
    setSelectedExercise(exercise);
    haptic.light();
  };

  const handleCloseExercise = () => {
    setSelectedExercise(null);
  };

  // If an exercise is selected, show the unified exercise screen
  if (selectedExercise) {
    return (
      <BreathingExerciseScreen
        exercise={selectedExercise}
        onClose={handleCloseExercise}
      />
    );
  }

  return (
    <>
      <SEOHead 
        title="Breathe - LadyBoss" 
        description="Breathing exercises for relaxation and focus" 
      />
      
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-gradient-to-b from-primary-dark to-primary">
        {/* Fixed Header */}
        <div 
          className="fixed top-0 left-0 right-0 z-10"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-3">
              <BackButton to="/app/home" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10" />
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary-light" />
                <h1 className="text-xl font-bold text-primary-foreground">Breathe</h1>
              </div>
            </div>
          </div>
          
          {/* Category tabs */}
          <div className="px-4 pt-2 pb-3">
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
              {BREATHING_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => {
                    setSelectedCategory(category.value);
                    haptic.light();
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                    selectedCategory === category.value
                      ? 'bg-primary-foreground text-primary'
                      : 'bg-primary-foreground/10 text-primary-foreground/80 hover:bg-primary-foreground/20'
                  )}
                >
                  <span>{category.emoji}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Spacer for fixed header */}
        <div className="shrink-0" style={{ height: 'calc(110px + env(safe-area-inset-top, 0px))' }} />

        {/* Scroll container */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="px-4 pb-safe space-y-4">
            {/* Exercise list */}
            {isLoading ? (
              // Loading skeletons
              [...Array(4)].map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="h-28 rounded-2xl bg-primary-foreground/10" 
                />
              ))
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-4">
                  <Leaf className="h-8 w-8 text-primary-foreground/60" />
                </div>
                <p className="text-primary-foreground/60">No exercises in this category yet</p>
              </div>
            ) : (
              filteredExercises.map((exercise) => (
                <BreathingExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onClick={() => handleExerciseClick(exercise)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
