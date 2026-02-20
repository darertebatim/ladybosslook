import { useEffect, useState } from 'react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

const STORAGE_KEY = 'ritual_add_hint_dismissed';
const SAVE_HINT_KEY = 'ritual_save_hint_dismissed';

// DEV RESET: remove these two lines once hints are verified
localStorage.removeItem(STORAGE_KEY);
localStorage.removeItem(SAVE_HINT_KEY);

export function useAddToRitualHint() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const t = setTimeout(() => setShowHint(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismissHint = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowHint(false);
  };

  return { showHint, dismissHint };
}

export function useSaveRitualHint(isSheetOpen: boolean) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!isSheetOpen) {
      setShowHint(false);
      return;
    }
    const dismissed = localStorage.getItem(SAVE_HINT_KEY);
    if (!dismissed) {
      const t = setTimeout(() => setShowHint(true), 800);
      return () => clearTimeout(t);
    }
  }, [isSheetOpen]);

  const dismissHint = () => {
    localStorage.setItem(SAVE_HINT_KEY, 'true');
    setShowHint(false);
  };

  return { showHint, dismissHint };
}

interface AddToRitualHandHintProps {
  show: boolean;
}

export function AddToRitualHandHint({ show }: AddToRitualHandHintProps) {
  if (!show) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed z-[60]"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 185px)',
          left: '18%',
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))',
          animation: 'handDownBounce 1.4s ease-in-out infinite',
          transform: 'rotate(-45deg)',
        }}
      >
        <FluentEmoji emoji="👇" size={90} />
      </div>

      <style>{`
        @keyframes handDownBounce {
          0%   { transform: rotate(-45deg) translateY(0px); }
          40%  { transform: rotate(-45deg) translateY(10px); }
          55%  { transform: rotate(-45deg) translateY(5px); }
          70%  { transform: rotate(-45deg) translateY(10px); }
          100% { transform: rotate(-45deg) translateY(0px); }
        }
      `}</style>
    </>
  );
}

export function SaveRitualHandHint({ show }: AddToRitualHandHintProps) {
  if (!show) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed z-[200]"
        style={{
          bottom: 'calc(max(24px, env(safe-area-inset-bottom)) + 56px)',
          right: '80px',
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))',
          animation: 'saveHandBounce 1.4s ease-in-out infinite',
          transform: 'rotate(-45deg)',
        }}
      >
        <FluentEmoji emoji="👇" size={90} />
      </div>

      <style>{`
        @keyframes saveHandBounce {
          0%   { transform: rotate(-45deg) translateY(0px); }
          40%  { transform: rotate(-45deg) translateY(10px); }
          55%  { transform: rotate(-45deg) translateY(5px); }
          70%  { transform: rotate(-45deg) translateY(10px); }
          100% { transform: rotate(-45deg) translateY(0px); }
        }
      `}</style>
    </>
  );
}
