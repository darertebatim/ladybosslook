import { useEffect, useState } from 'react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

const STORAGE_KEY = 'ritual_add_hint_dismissed';

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

export function AddToRitualHandHint({ show }: AddToRitualHandHintProps) {
  if (!show) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed z-[60]"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 105px)',
          /* shift left of center — right ~40% puts it just left of mid */
          right: '40%',
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))',
          animation: 'handDownBounce 1.4s ease-in-out infinite',
          /* 60° tilt: tilted to the right pointing down-right */
          transform: 'rotate(-30deg)',
        }}
      >
        <FluentEmoji emoji="👇" size={90} />
      </div>

      <style>{`
        @keyframes handDownBounce {
          0%   { transform: rotate(-30deg) translateY(0px); }
          40%  { transform: rotate(-30deg) translateY(10px); }
          55%  { transform: rotate(-30deg) translateY(5px); }
          70%  { transform: rotate(-30deg) translateY(10px); }
          100% { transform: rotate(-30deg) translateY(0px); }
        }
      `}</style>
    </>
  );
}
