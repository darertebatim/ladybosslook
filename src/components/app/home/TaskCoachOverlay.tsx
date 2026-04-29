import { useEffect, useState } from 'react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

type Variant = 'check' | 'tap';

interface TaskCoachOverlayProps {
  taskId: string | null | undefined;
  variant: Variant; // 'check' = ring on right checkbox, 'tap' = ring on left body
}

/**
 * Renders a glowing ring + bouncing hand anchored to a specific task card,
 * found via [data-task-id="..."]. Recomputes on scroll/resize.
 * The full task list stays visible; this overlay just adds a focal point.
 */
export function TaskCoachOverlay({ taskId, variant }: TaskCoachOverlayProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!taskId) return;
    let raf = 0;

    const update = () => {
      const el = document.querySelector(`[data-task-id="${taskId}"]`);
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
    const interval = setInterval(update, 250); // catch reflows from list animations

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', tick, true);
      window.removeEventListener('resize', tick);
      clearInterval(interval);
    };
  }, [taskId]);

  if (!rect) return null;

  const ringSize = 48;
  const cy = rect.top + rect.height / 2;

  // Position depending on variant
  const ringLeft =
    variant === 'check'
      ? rect.right - ringSize - 10
      : rect.left + 12;
  const ringWidth = variant === 'check' ? ringSize : Math.min(rect.width - ringSize - 30, 200);
  const ringHeight = variant === 'check' ? ringSize : 36;
  const handLeft = variant === 'check' ? ringLeft - 36 : ringLeft + 12;
  const handTop = cy - 60;

  return (
    <>
      {/* Glow ring */}
      <div
        className="fixed pointer-events-none z-[102]"
        style={{
          left: ringLeft,
          top: cy - ringHeight / 2,
          width: ringWidth,
          height: ringHeight,
          borderRadius: variant === 'check' ? '50%' : '12px',
          boxShadow:
            '0 0 14px 6px rgba(255,255,255,0.7), 0 0 28px 12px rgba(255,255,255,0.35)',
          animation: 'taskCoachGlow 1.6s ease-in-out infinite',
        }}
      />
      {/* Bouncing hand */}
      <div
        className="fixed pointer-events-none z-[103]"
        style={{
          left: handLeft,
          top: handTop,
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.28))',
          animation: 'taskCoachBounce 1.4s ease-in-out infinite',
          transform: 'rotate(-25deg)',
          transformOrigin: 'center',
        }}
      >
        <FluentEmoji emoji="👇" size={56} />
      </div>
      <style>{`
        @keyframes taskCoachBounce {
          0%   { transform: rotate(-25deg) translateY(0px); }
          40%  { transform: rotate(-25deg) translateY(8px); }
          55%  { transform: rotate(-25deg) translateY(4px); }
          70%  { transform: rotate(-25deg) translateY(8px); }
          100% { transform: rotate(-25deg) translateY(0px); }
        }
        @keyframes taskCoachGlow {
          0%, 100% { box-shadow: 0 0 14px 6px rgba(255,255,255,0.7), 0 0 28px 12px rgba(255,255,255,0.35); }
          50%      { box-shadow: 0 0 22px 10px rgba(255,255,255,0.9), 0 0 40px 18px rgba(255,255,255,0.45); }
        }
      `}</style>
    </>
  );
}