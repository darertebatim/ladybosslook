import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ritual_add_hint_dismissed';

/**
 * Animated hand pointer that floats above the "Add to my rituals" button,
 * shown only until the user taps it for the first time.
 */
export function useAddToRitualHint() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Small delay so the page renders first
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

interface AddToRitualHandHintProps {
  show: boolean;
}

export function AddToRitualHandHint({ show }: AddToRitualHandHintProps) {
  if (!show) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-end justify-center"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
    >
      {/* Hand emoji with tap-bounce animation */}
      <div
        className="text-4xl select-none"
        style={{
          animation: 'handTap 1.1s ease-in-out infinite',
          transformOrigin: 'bottom center',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
        }}
      >
        👆
      </div>

      <style>{`
        @keyframes handTap {
          0%   { transform: translateY(0px) rotate(-10deg); opacity: 1; }
          40%  { transform: translateY(-18px) rotate(-10deg); opacity: 1; }
          55%  { transform: translateY(-10px) rotate(-10deg); opacity: 1; }
          70%  { transform: translateY(-18px) rotate(-10deg); opacity: 1; }
          100% { transform: translateY(0px) rotate(-10deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
