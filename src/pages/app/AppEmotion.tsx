import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmotionDashboard } from '@/components/emotion/EmotionDashboard';
import { EmotionSelector } from '@/components/emotion/EmotionSelector';
import { EmotionContext } from '@/components/emotion/EmotionContext';
import { EmotionComplete } from '@/components/emotion/EmotionComplete';
import { useEmotionLogs } from '@/hooks/useEmotionLogs';
import { useAutoCompleteProTask } from '@/hooks/useAutoCompleteProTask';
import type { Valence } from '@/lib/emotionData';

type Step = 'dashboard' | 'select' | 'context' | 'complete';

interface EmotionState {
  valence: Valence | null;
  category: string | null;
  emotions: string[]; // Now supports multiple emotions
}

const AppEmotion = () => {
  const navigate = useNavigate();
  const { createLog } = useEmotionLogs();
  const { autoCompleteEmotion } = useAutoCompleteProTask();
  
  const [step, setStep] = useState<Step>('dashboard');
  const [state, setState] = useState<EmotionState>({
    valence: null,
    category: null,
    emotions: [],
  });

  // Navigation handlers
  const handleStartCheckIn = useCallback(() => setStep('select'), []);
  
  const handleEmotionComplete = useCallback((valence: Valence, category: string, emotions: string[]) => {
    setState({ valence, category, emotions });
    setStep('context');
  }, []);

  const handleSave = useCallback(async (contexts: string[], notes: string) => {
    if (!state.valence || !state.category || state.emotions.length === 0) return;

    // Store multiple emotions as comma-separated string
    await createLog.mutateAsync({
      valence: state.valence,
      category: state.category,
      emotion: state.emotions.join(','),
      contexts,
      notes: notes || undefined,
    });

    // Auto-complete any emotion pro tasks for today
    await autoCompleteEmotion();

    setStep('complete');
  }, [state, createLog, autoCompleteEmotion]);

  const handleDone = useCallback(() => {
    // Reset state and go back to dashboard
    setState({ valence: null, category: null, emotions: [] });
    setStep('dashboard');
  }, []);

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

  // Render current step
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
      return <EmotionComplete onDone={handleDone} />;
    
    default:
      return null;
  }
};

export default AppEmotion;
