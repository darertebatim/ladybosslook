import { createContext, useContext } from 'react';

const BASE_Z_INDEX = 10000;

/**
 * ZStackContext tracks the current z-index level in the component tree.
 * Each nested portal layer (Sheet, Dialog, Popover, etc.) increments the level
 * so children automatically stack above their parents.
 * 
 * Celebrations/OverlayPortal use a fixed high tier (10100) outside this system.
 */
const ZStackContext = createContext<number>(BASE_Z_INDEX);

export function useZIndex(): number {
  return useContext(ZStackContext);
}

export { ZStackContext, BASE_Z_INDEX };
