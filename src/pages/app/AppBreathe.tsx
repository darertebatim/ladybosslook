import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/SEOHead';
import { 
  useBreathingExercises, 
  BreathingExercise,
  BREATHING_CATEGORIES 
} from '@/hooks/useBreathingExercises';
import { BreathingExerciseCard } from '@/components/breathe/BreathingExerciseCard';
import { BreathingInfoSheet } from '@/components/breathe/BreathingInfoSheet';
import { BreathingSettingsSheet } from '@/components/breathe/BreathingSettingsSheet';
import { BreathingActiveScreen } from '@/components/breathe/BreathingActiveScreen';
import { Skeleton } from '@/components/ui/skeleton';
import { haptic } from '@/lib/haptics';

export default function AppBreathe() {
  const navigate = useNavigate();
  const { data: exercises, isLoading } = useBreathingExercises();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('calm');
  const [selectedExercise, setSelectedExercise] = useState<BreathingExercise | null>(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showActiveScreen, setShowActiveScreen] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(180); // 3 minutes default

  // Filter exercises by category
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter(e => e.category === selectedCategory);
  }, [exercises, selectedCategory]);

  const handleExerciseClick = (exercise: BreathingExercise) => {
    setSelectedExercise(exercise);
    setShowInfoSheet(true);
    haptic.light();
  };

  const handleStartFromInfo = () => {
    setShowInfoSheet(false);
    setShowSettingsSheet(true);
  };

  const handleStartSession = () => {
    setShowSettingsSheet(false);
    setShowActiveScreen(true);
    haptic.medium();
  };

  const handleSessionComplete = () => {
    setShowActiveScreen(false);
    setSelectedExercise(null);
    haptic.success();
  };

  const handleCloseSession = () => {
    setShowActiveScreen(false);
  };

  // If active breathing screen is open, show it full screen
  if (showActiveScreen && selectedExercise) {
    return (
      <BreathingActiveScreen
        exercise={selectedExercise}
        duration={sessionDuration}
        onClose={handleCloseSession}
        onComplete={handleSessionComplete}
      />
    );
  }

  return (
    <>
      <SEOHead 
        title="Breathe - LadyBoss" 
        description="Breathing exercises for relaxation and focus" 
      />
      
      <div className="min-h-screen bg-gradient-to-b from-[#5C5A8D] to-[#4A4875]">
        {/* Safe area padding */}
        <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-300" />
            <h1 className="text-xl font-bold text-white">Breathe</h1>
          </div>
          
          <div className="w-9" /> {/* Spacer for centering */}
        </header>

        {/* Category tabs */}
        <div className="px-4 pt-2 pb-4">
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
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
                    ? 'bg-white text-[#5C5A8D]'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                )}
              >
                <span>{category.emoji}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Exercise list */}
        <div className="px-4 space-y-3 pb-safe">
          {isLoading ? (
            // Loading skeletons
            [...Array(4)].map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-28 rounded-2xl bg-white/10" 
              />
            ))
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">No exercises in this category yet</p>
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

        {/* Info Sheet */}
        <BreathingInfoSheet
          exercise={selectedExercise}
          open={showInfoSheet}
          onOpenChange={setShowInfoSheet}
          onStart={handleStartFromInfo}
        />

        {/* Settings Sheet */}
        <BreathingSettingsSheet
          exercise={selectedExercise}
          open={showSettingsSheet}
          onOpenChange={setShowSettingsSheet}
          selectedDuration={sessionDuration}
          onDurationChange={setSessionDuration}
          onStart={handleStartSession}
        />
      </div>
    </>
  );
}
