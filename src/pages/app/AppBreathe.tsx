import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wind } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { AppHeader, AppHeaderSpacer } from '@/components/app/AppHeader';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { 
  useBreathingExercises, 
  BreathingExercise,
  BREATHING_CATEGORIES 
} from '@/hooks/useBreathingExercises';
import { BreathingExerciseCard } from '@/components/breathe/BreathingExerciseCard';
import { BreathingExerciseScreen } from '@/components/breathe/BreathingExerciseScreen';
import { Skeleton } from '@/components/ui/skeleton';
import { BreatheTour } from '@/components/app/tour';
import { haptic } from '@/lib/haptics';

export default function AppBreathe() {
  const [searchParams] = useSearchParams();
  const { data: exercises, isLoading } = useBreathingExercises();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  // Filter exercises by category (show all active when 'all' selected)
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    const activeExercises = exercises.filter(e => e.is_active);
    if (selectedCategory === 'all') {
      return activeExercises;
    }
    return activeExercises.filter(e => e.category === selectedCategory);
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
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <AppHeader
          title="Breathe"
          showBack
          backTo="/app/home"
        />
        <AppHeaderSpacer />

        {/* Category circles */}
        <div className="px-4 py-4 tour-categories">
          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
            {BREATHING_CATEGORIES.map((category) => (
              <CategoryCircle
                key={category.value}
                name={category.label}
                icon={category.icon}
                emoji={category.emoji}
                color={category.color}
                isSelected={selectedCategory === category.value}
                onClick={() => {
                  setSelectedCategory(category.value);
                  haptic.light();
                }}
              />
            ))}
          </div>
        </div>

        {/* Exercise list */}
        <div className="px-4 pb-safe space-y-3">
          {isLoading ? (
            // Loading skeletons
            [...Array(4)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-24 rounded-2xl" 
              />
            ))
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Wind className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No exercises in this category yet</p>
            </div>
          ) : (
            filteredExercises.map((exercise, index) => (
              <BreathingExerciseCard
                key={exercise.id}
                exercise={exercise}
                onClick={() => handleExerciseClick(exercise)}
                className={index === 0 ? 'tour-exercise-card' : undefined}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Feature Tour */}
      <BreatheTour isFirstVisit={true} />
    </>
  );
}
