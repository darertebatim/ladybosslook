import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * One automatic popup at a time. Every auto-opening popup/sheet asks the queue
 * via useQueuedPopup(id, priority, wantsToShow) and renders open={canShow}.
 * Lower priority number = shown first.
 */
export const POPUP_PRIORITY = {
  update: 1,
  celebration: 2,
  instructor: 3,
  push: 4,
  intro: 5,
  language: 6,
  review: 7,
} as const;

const LAUNCH_DELAY_MS = 2500;
const GAP_MS = 1200;
/** Popups with priority >= this count toward the per-session cap. */
const CAPPED_FROM = POPUP_PRIORITY.instructor;
const SESSION_CAP = 2;

interface Ctx {
  request: (id: string, priority: number) => void;
  cancel: (id: string) => void;
  activeId: string | null;
}

const PopupQueueContext = createContext<Ctx | null>(null);

/** Clears scroll/tap locks left by Radix/vaul when overlays unmount out of order. */
function releaseBodyLocks() {
  window.setTimeout(() => {
    if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) return;
    const b = document.body;
    b.style.pointerEvents = '';
    b.style.overflow = '';
    b.removeAttribute('data-scroll-locked');
  }, 400);
}

export function PopupQueueProvider({ children }: { children: ReactNode }) {
  const requests = useRef(new Map<string, number>());
  const startedAt = useRef(Date.now());
  const lastClosedAt = useRef(0);
  const cappedShown = useRef(0);
  const lastWasCelebration = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);
  const timer = useRef<number | undefined>();
  const [tick, setTick] = useState(0);

  const schedule = useCallback(() => {
    window.clearTimeout(timer.current);
    if (activeRef.current || requests.current.size === 0) return;
    const now = Date.now();
    const wait = Math.max(startedAt.current + LAUNCH_DELAY_MS - now, lastClosedAt.current + GAP_MS - now, 0);
    if (wait > 0) {
      timer.current = window.setTimeout(() => setTick((t) => t + 1), wait);
      return;
    }
    const sorted = [...requests.current.entries()].sort((a, b) => a[1] - b[1]);
    for (const [id, priority] of sorted) {
      if (priority >= CAPPED_FROM && cappedShown.current >= SESSION_CAP) continue;
      if (priority === POPUP_PRIORITY.review && lastWasCelebration.current) {
        // never chain a review prompt straight after a celebration
        lastWasCelebration.current = false;
        timer.current = window.setTimeout(() => setTick((t) => t + 1), 8000);
        return;
      }
      if (priority >= CAPPED_FROM) cappedShown.current += 1;
      lastWasCelebration.current = priority === POPUP_PRIORITY.celebration;
      activeRef.current = id;
      setActiveId(id);
      return;
    }
  }, []);

  useEffect(() => { schedule(); }, [tick, schedule]);

  const request = useCallback((id: string, priority: number) => {
    requests.current.set(id, priority);
    setTick((t) => t + 1);
  }, []);

  const cancel = useCallback((id: string) => {
    requests.current.delete(id);
    if (activeRef.current === id) {
      activeRef.current = null;
      setActiveId(null);
      lastClosedAt.current = Date.now();
      releaseBodyLocks();
    }
    setTick((t) => t + 1);
  }, []);

  return (
    <PopupQueueContext.Provider value={{ request, cancel, activeId }}>
      {children}
    </PopupQueueContext.Provider>
  );
}

/** Returns true only when this popup holds the single visible slot. */
export function useQueuedPopup(id: string, priority: number, wantsToShow: boolean): boolean {
  const ctx = useContext(PopupQueueContext);
  const request = ctx?.request;
  const cancel = ctx?.cancel;
  useEffect(() => {
    if (!request || !cancel) return;
    if (wantsToShow) request(id, priority);
    else cancel(id);
  }, [wantsToShow, id, priority, request, cancel]);
  useEffect(() => () => cancel?.(id), [id, cancel]);
  if (!ctx) return wantsToShow;
  return wantsToShow && ctx.activeId === id;
}
