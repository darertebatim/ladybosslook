/**
 * Network status hook — single source of truth for online/offline.
 *
 * Uses @capacitor/network on native (iOS/Android) for accurate connectivity
 * detection (cellular drops, captive portals, etc.) and falls back to
 * navigator.onLine + window events on web.
 *
 * Usage:
 *   const { isOnline } = useNetworkStatus();
 */
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

type NetworkState = {
  isOnline: boolean;
  /** Connection type if known: 'wifi' | 'cellular' | 'none' | 'unknown' */
  connectionType: string;
};

const initial: NetworkState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  connectionType: 'unknown',
};

/** Module-level subscribers so we only attach listeners once per app. */
const subscribers = new Set<(s: NetworkState) => void>();
let currentState: NetworkState = initial;
let listenersAttached = false;

function setState(next: NetworkState) {
  if (
    next.isOnline === currentState.isOnline &&
    next.connectionType === currentState.connectionType
  ) {
    return;
  }
  currentState = next;
  subscribers.forEach((cb) => {
    try { cb(next); } catch (err) { console.warn('[Network] subscriber error:', err); }
  });
}

async function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  // Web fallback always wired — works in dev preview too
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => setState({ ...currentState, isOnline: true }));
    window.addEventListener('offline', () => setState({ ...currentState, isOnline: false }));
  }

  if (!Capacitor.isNativePlatform()) return;

  try {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    setState({ isOnline: status.connected, connectionType: status.connectionType });

    Network.addListener('networkStatusChange', (s) => {
      setState({ isOnline: s.connected, connectionType: s.connectionType });
    });
  } catch (err) {
    console.warn('[Network] Capacitor Network plugin unavailable:', err);
  }
}

export function useNetworkStatus(): NetworkState {
  const [state, setLocal] = useState<NetworkState>(currentState);

  useEffect(() => {
    void attachListeners();
    subscribers.add(setLocal);
    // Sync any change that happened between mount and effect run
    setLocal(currentState);
    return () => {
      subscribers.delete(setLocal);
    };
  }, []);

  return state;
}

/** Imperative read for non-React code (e.g. mutation queue drain). */
export function getIsOnline(): boolean {
  return currentState.isOnline;
}

/** Subscribe imperatively (returns unsubscribe). For non-React modules. */
export function subscribeNetworkStatus(cb: (s: NetworkState) => void): () => void {
  void attachListeners();
  subscribers.add(cb);
  cb(currentState);
  return () => subscribers.delete(cb);
}