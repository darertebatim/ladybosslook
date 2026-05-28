import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { EmotionDashboard } from '@/components/emotion/EmotionDashboard';
import { EmotionSelector } from '@/components/emotion/EmotionSelector';
import { EmotionContext } from '@/components/emotion/EmotionContext';
import { MoodCelebrationSheet } from '@/components/mood/MoodCelebrationSheet';
import { useEmotionLogs } from '@/hooks/useEmotionLogs';
import { useAutoCompleteProTask } from '@/hooks/useAutoCompleteProTask';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import type { Valence } from '@/lib/emotionData';

type Step = 'dashboard' | 'select' | 'context' | 'complete';

interface EmotionState {
  valence: Valence | null;
  category: string | null;
  emotions: string[];
}

const AppEmotion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from || '/app/home';
  const [searchParams, setSearchParams] = useSearchParams();
  const { createLog } = useEmotionLogs();
  const { autoCompleteEmotion } = useAutoCompleteProTask();

  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* not available */ }
  const hasActivePlayer = routinePlayer?.isActive && routinePlayer?.isMinimized;
  
  const initialStep = searchParams.get('step') === 'select' ? 'select' : 'dashboard';
  const [step, setStep] = useState<Step>(initialStep);

  // Clear the query param after consuming it
  useEffect(() => {
    if (searchParams.get('step')) {
      setSearchParams({}, { replace: true });
    }
  }, []);
  const [state, setState] = useState<EmotionState>({
    valence: null,
    category: null,
    emotions: [],
  });

  const handleStartCheckIn = useCallback(() => setStep('select'), []);
  
  const handleEmotionComplete = useCallback((valence: Valence, category: string, emotions: string[]) => {
    setState({ valence, category, emotions });
    setStep('context');
  }, []);

  const handleSave = useCallback(async (contexts: string[], notes: string) => {
    if (!state.valence || !state.category || state.emotions.length === 0) return;

    await createLog.mutateAsync({
      valence: state.valence,
      category: state.category,
      emotion: state.emotions.join(','),
      contexts,
      notes: notes || undefined,
    });

    await autoCompleteEmotion();
    setStep('complete');
  }, [state, createLog, autoCompleteEmotion]);

  const handleDone = useCallback(() => {
    if (hasActivePlayer) {
      navigate(returnTo, { replace: true });
      routinePlayer!.maximize();
      return;
    }
    navigate(returnTo, { replace: true });
  }, [navigate, hasActivePlayer, routinePlayer, returnTo]);

  const handleBack = useCallback(() => {
    switch (step) {
      case 'select':
        setStep('dashboard');
        break;
      case 'context':
        setStep('select');
        break;
      default:
        navigate('/app/home');
    }
  }, [step, navigate]);

  const renderStep = () => {
    switch (step) {
      case 'dashboard':
        return <EmotionDashboard onStartCheckIn={handleStartCheckIn} />;
      case 'select':
        return (
          <EmotionSelector 
            onComplete={handleEmotionComplete} 
            onBack={handleBack} 
          />
        );
      case 'context':
        if (!state.valence || !state.category || state.emotions.length === 0) return null;
        return (
          <EmotionContext
            valence={state.valence}
            category={state.category}
            emotions={state.emotions}
            onSave={handleSave}
            onBack={handleBack}
            isSaving={createLog.isPending}
          />
        );
      case 'complete':
        return (
          <>
            <EmotionContext
              valence={state.valence!}
              category={state.category!}
              emotions={state.emotions}
              onSave={() => {}}
              onBack={handleBack}
              isSaving={false}
            />
            <MoodCelebrationSheet
              open
              onOpenChange={(o) => { if (!o) handleDone(); }}
              mood={state.valence === 'pleasant' ? 'great' : state.valence === 'unpleasant' ? 'not_great' : 'okay'}
              onDone={handleDone}
            />
          </>
        );
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
};

export default AppEmotion;
