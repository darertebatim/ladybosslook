import { useEffect, useState } from 'react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

/**
 * Renders a bouncing finger anchored to the quick-add (+) button (.coach-add-btn).
 * Mirrors the TaskCoachOverlay style used in the 'check' step.
 */
export function AddButtonCoachOverlay() {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const el = document.querySelector('.coach-add-btn');
      if (!el) {
        setRect(null);
        return;
      }
      setRect(el.getBoundingClientRect());
    };

    const tick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', tick, true);
    window.addEventListener('resize', tick);
    const interval = setInterval(update, 250);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', tick, true);
      window.removeEventListener('resize', tick);
      clearInterval(interval);
    };
  }, []);

  if (!rect) return null;

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const handLeft = cx - 28 - 36; // offset to the left of the button, like check variant
  const handTop = cy - 60;

  return (
    <>
      <div
        className="fixed pointer-events-none z-[10061]"
        style={{
          left: handLeft,
          top: handTop,
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))',
          animation: 'addCoachBounce 1.4s ease-in-out infinite',
          transform: 'rotate(-25deg)',
          transformOrigin: 'center',
        }}
      >
        <FluentEmoji emoji="👇" size={56} />
      </div>
      <style>{`
        @keyframes addCoachBounce {
          0%   { transform: rotate(-25deg) translateY(0px); }
          40%  { transform: rotate(-25deg) translateY(8px); }
          55%  { transform: rotate(-25deg) translateY(4px); }
          70%  { transform: rotate(-25deg) translateY(8px); }
          100% { transform: rotate(-25deg) translateY(0px); }
        }
      `}</style>
    </>
  );
}