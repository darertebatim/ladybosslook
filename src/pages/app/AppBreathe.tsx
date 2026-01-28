import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BackButton } from '@/components/app/BackButton';
import { 
  useBreathingExercises, 
  BreathingExercise,
  BREATHING_CATEGORIES 
} from '@/hooks/useBreathingExercises';
import { BreathingExerciseCard } from '@/components/breathe/BreathingExerciseCard';
import { BreathingInfoSheet } from '@/components/breathe/BreathingInfoSheet';
import { BreathingSettingsSheet } from '@/components/breathe/BreathingSettingsSheet';
import { BreathingActiveScreen } from '@/components/breathe/BreathingActiveScreen';
import { BreathingReminderSettings } from '@/components/breathe/BreathingReminderSettings';
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
      
      <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#5C5A8D] to-[#4A4875]">
        {/* Fixed Header */}
        <div 
          className="fixed top-0 left-0 right-0 z-10"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-3">
              <BackButton to="/app/home" className="text-white/70 hover:text-white hover:bg-white/10" />
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-300" />
                <h1 className="text-xl font-bold text-white">Breathe</h1>
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
        </div>

        {/* Spacer for fixed header */}
        <div className="shrink-0" style={{ height: 'calc(110px + env(safe-area-inset-top, 0px))' }} />

        {/* Scroll container */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="px-4 pb-safe space-y-4">
            {/* Quick Actions Card */}
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 space-y-3">
                {/* Start Breathing Button */}
                <Button 
                  className="w-full bg-white hover:bg-white/90 text-[#5C5A8D]" 
                  onClick={() => {
                    if (filteredExercises.length > 0) {
                      handleExerciseClick(filteredExercises[0]);
                    }
                  }}
                  disabled={filteredExercises.length === 0}
                >
                  <Leaf className="h-4 w-4 mr-2" />
                  Start Breathing
                </Button>

                {/* Add to Routine Button */}
                <BreathingReminderSettings />
              </CardContent>
            </Card>

            {/* Exercise list */}
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
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Leaf className="h-8 w-8 text-white/60" />
                </div>
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
