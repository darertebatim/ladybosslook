/**
 * Keyboard hook - STUBBED (Capacitor removed)
 * 
 * Returns default values.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

import { useState } from 'react';

export const useKeyboard = () => {
  const [keyboardHeight] = useState(0);
  const [isKeyboardOpen] = useState(false);
  const [effectiveInset] = useState(0);

  return { 
    keyboardHeight, 
    isKeyboardOpen, 
    effectiveInset,
  };
};
