import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

export const useKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
      console.log('[useKeyboard] Keyboard will show, height:', info.keyboardHeight);
      setKeyboardHeight(info.keyboardHeight);
      setIsKeyboardOpen(true);
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      console.log('[useKeyboard] Keyboard will hide');
      setKeyboardHeight(0);
      setIsKeyboardOpen(false);
    });

    return () => {
      showListener.then(l => l.remove());
      hideListener.then(l => l.remove());
    };
  }, []);

  return { keyboardHeight, isKeyboardOpen };
};
