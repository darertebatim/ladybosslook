import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmotionIntro } from '@/components/emotion/EmotionIntro';
import { EmotionSelector } from '@/components/emotion/EmotionSelector';
import { EmotionContext } from '@/components/emotion/EmotionContext';
import { EmotionComplete } from '@/components/emotion/EmotionComplete';
import { useEmotionLogs } from '@/hooks/useEmotionLogs';
import type { Valence } from '@/lib/emotionData';

type Step = 'intro' | 'select' | 'context' | 'complete';

interface EmotionState {
  valence: Valence | null;
  category: string | null;
  emotion: string | null;
}

const AppEmotion = () => {
  const navigate = useNavigate();
  const { createLog } = useEmotionLogs();
  
  const [step, setStep] = useState<Step>('intro');
  const [state, setState] = useState<EmotionState>({
    valence: null,
    category: null,
    emotion: null,
  });

  // Navigation handlers
  const handleStart = useCallback(() => setStep('select'), []);
  
  const handleEmotionComplete = useCallback((valence: Valence, category: string, emotion: string) => {
    setState({ valence, category, emotion });
    setStep('context');
  }, []);

  const handleSave = useCallback(async (contexts: string[], notes: string) => {
    if (!state.valence || !state.category || !state.emotion) return;

    await createLog.mutateAsync({
      valence: state.valence,
      category: state.category,
      emotion: state.emotion,
      contexts,
      notes: notes || undefined,
    });

    setStep('complete');
  }, [state, createLog]);

  const handleDone = useCallback(() => {
    navigate('/app/home');
  }, [navigate]);

  const handleBack = useCallback(() => {
    switch (step) {
      case 'select':
        setStep('intro');
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
    case 'intro':
      return <EmotionIntro onStart={handleStart} />;
    
    case 'select':
      return (
        <EmotionSelector 
          onComplete={handleEmotionComplete} 
          onBack={handleBack} 
        />
      );
    
    case 'context':
      if (!state.valence || !state.category || !state.emotion) return null;
      return (
        <EmotionContext
          valence={state.valence}
          category={state.category}
          emotion={state.emotion}
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
