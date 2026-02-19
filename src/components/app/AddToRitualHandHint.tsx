import { useEffect, useState } from 'react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

const STORAGE_KEY = 'ritual_add_hint_dismissed';

/**
 * Hook: tracks whether the hand hint should be shown.
 * Dismissed permanently in localStorage after first tap.
 */
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

interface AddToRitualHandHintProps {
  show: boolean;
}

/**
 * Large 3D hand emoji floating above the "Add to my rituals" button,
 * pointing downward toward it, offset to the right of center.
 * Only shown to first-time users until they tap the button.
 */
export function AddToRitualHandHint({ show }: AddToRitualHandHintProps) {
  if (!show) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed z-[60]"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 110px)',
          right: '18%',
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.30))',
          animation: 'handDownBounce 1.4s ease-in-out infinite',
        }}
      >
        <FluentEmoji emoji="👇" size={180} />
      </div>

      <style>{`
        @keyframes handDownBounce {
          0%   { transform: translateY(0px); }
          40%  { transform: translateY(14px); }
          55%  { transform: translateY(8px); }
          70%  { transform: translateY(14px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </>
  );
}
