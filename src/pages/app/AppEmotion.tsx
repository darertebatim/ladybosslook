import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmotionIntro } from '@/components/emotion/EmotionIntro';
import { EmotionValence } from '@/components/emotion/EmotionValence';
import { EmotionCategory } from '@/components/emotion/EmotionCategory';
import { EmotionSpecific } from '@/components/emotion/EmotionSpecific';
import { EmotionContext } from '@/components/emotion/EmotionContext';
import { EmotionComplete } from '@/components/emotion/EmotionComplete';
import { useEmotionLogs } from '@/hooks/useEmotionLogs';
import type { Valence } from '@/lib/emotionData';

type Step = 'intro' | 'valence' | 'category' | 'specific' | 'context' | 'complete';

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
  const handleStart = useCallback(() => setStep('valence'), []);
  
  const handleValenceSelect = useCallback((valence: Valence) => {
    setState(prev => ({ ...prev, valence }));
    setStep('category');
  }, []);

  const handleCategorySelect = useCallback((category: string) => {
    setState(prev => ({ ...prev, category }));
    setStep('specific');
  }, []);

  const handleEmotionSelect = useCallback((emotion: string) => {
    setState(prev => ({ ...prev, emotion }));
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
      case 'valence':
        setStep('intro');
        break;
      case 'category':
        setStep('valence');
        setState(prev => ({ ...prev, category: null }));
        break;
      case 'specific':
        setStep('category');
        setState(prev => ({ ...prev, emotion: null }));
        break;
      case 'context':
        setStep('specific');
        break;
      default:
        navigate('/app/home');
    }
  }, [step, navigate]);

  // Render current step
  switch (step) {
    case 'intro':
      return <EmotionIntro onStart={handleStart} />;
    
    case 'valence':
      return <EmotionValence onSelect={handleValenceSelect} onBack={handleBack} />;
    
    case 'category':
      if (!state.valence) return null;
      return (
        <EmotionCategory 
          valence={state.valence} 
          onSelect={handleCategorySelect} 
          onBack={handleBack} 
        />
      );
    
    case 'specific':
      if (!state.valence || !state.category) return null;
      return (
        <EmotionSpecific 
          valence={state.valence}
          category={state.category}
          onSelect={handleEmotionSelect}
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
