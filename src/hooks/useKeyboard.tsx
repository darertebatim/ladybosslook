import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

export const useKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [effectiveInset, setEffectiveInset] = useState(0);

  // Calculate effective keyboard inset using VisualViewport API
  // This is more reliable than Capacitor's keyboardHeight in some resize modes
  const calculateEffectiveInset = useCallback(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      const viewportHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const offsetTop = window.visualViewport.offsetTop || 0;
      
      // The difference between window.innerHeight and visualViewport.height
      // gives us how much the keyboard is covering
      const inset = Math.max(0, windowHeight - viewportHeight - offsetTop);
      return inset;
    }
    return 0;
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Listen to Capacitor keyboard events
    const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
      console.log('[useKeyboard] Keyboard will show, height:', info.keyboardHeight);
      setKeyboardHeight(info.keyboardHeight);
      setIsKeyboardOpen(true);
      // Set effective inset directly from keyboard height - no setTimeout to prevent jitter
      setEffectiveInset(info.keyboardHeight);
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      console.log('[useKeyboard] Keyboard will hide');
      setKeyboardHeight(0);
      setIsKeyboardOpen(false);
      setEffectiveInset(0);
    });

    // Also listen to VisualViewport resize for additional reliability
    const handleViewportResize = () => {
      if (isKeyboardOpen) {
        const inset = calculateEffectiveInset();
        if (inset > 0) {
          setEffectiveInset(prev => Math.max(prev, inset));
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
    }

    return () => {
      showListener.then(l => l.remove());
      hideListener.then(l => l.remove());
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
    };
  }, [calculateEffectiveInset, isKeyboardOpen]);

  return { 
    keyboardHeight, 
    isKeyboardOpen, 
    // effectiveInset is the most reliable value - use this for positioning
    effectiveInset: Math.max(keyboardHeight, effectiveInset)
  };
};
