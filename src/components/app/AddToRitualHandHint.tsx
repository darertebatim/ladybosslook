import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ritual_add_hint_dismissed';

export function useAddToRitualHint() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const t = setTimeout(() => setShowHint(true), 700);
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

/**
 * Illustrated hand cursor pointing right toward the "Add to my rituals" button.
 * Positioned at the left side of the button container, animating rightward.
 * Shown only once until the user taps the button (tracked in localStorage).
 */
export function AddToRitualHandHint({ show }: AddToRitualHandHintProps) {
  if (!show) return null;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: '8px',
          bottom: 'calc(100% - 8px)',
          zIndex: 50,
          pointerEvents: 'none',
          animation: 'handPoint 1.15s ease-in-out infinite',
        }}
      >
        {/* Illustrated pointing hand (pointing right) */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(3px 5px 10px rgba(0,0,0,0.28))' }}
        >
          {/* === HAND POINTING RIGHT === */}
          
          {/* Palm base */}
          <path
            d="M10 38 C10 28 18 22 28 22 L28 58 C18 58 10 50 10 38Z"
            fill="#FDDBA6"
            stroke="#C88A3A"
            strokeWidth="1.8"
          />

          {/* Index finger — extended to the right */}
          <rect x="25" y="16" width="58" height="16" rx="8" fill="#FDDBA6" stroke="#C88A3A" strokeWidth="1.8" />
          {/* Fingertip highlight */}
          <rect x="74" y="18" width="8" height="12" rx="4" fill="#F5C07A" />

          {/* Middle finger — slightly bent, behind index */}
          <path
            d="M25 33 L42 33 Q50 33 50 40 L50 44 Q50 50 44 50 L25 50Z"
            fill="#FDDBA6"
            stroke="#C88A3A"
            strokeWidth="1.5"
          />

          {/* Ring finger */}
          <path
            d="M25 50 L38 50 Q45 50 45 56 L45 60 Q45 66 39 66 L25 66Z"
            fill="#FDDBA6"
            stroke="#C88A3A"
            strokeWidth="1.5"
          />

          {/* Pinky */}
          <path
            d="M25 66 L34 66 Q40 66 40 71 L40 74 Q40 78 35 78 L25 78Z"
            fill="#FDDBA6"
            stroke="#C88A3A"
            strokeWidth="1.5"
          />

          {/* Thumb */}
          <path
            d="M10 44 Q8 44 6 50 Q5 56 10 58 L28 58 L28 44Z"
            fill="#FDDBA6"
            stroke="#C88A3A"
            strokeWidth="1.5"
          />

          {/* Knuckle lines on index finger */}
          <line x1="44" y1="18" x2="44" y2="30" stroke="#C88A3A" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="58" y1="18" x2="58" y2="30" stroke="#C88A3A" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      <style>{`
        @keyframes handPoint {
          0%   { transform: translateX(0px) rotate(-5deg);  opacity: 1; }
          45%  { transform: translateX(20px) rotate(-5deg); opacity: 1; }
          65%  { transform: translateX(14px) rotate(-5deg); opacity: 1; }
          82%  { transform: translateX(20px) rotate(-5deg); opacity: 1; }
          100% { transform: translateX(0px) rotate(-5deg);  opacity: 1; }
        }
      `}</style>
    </>
  );
}
