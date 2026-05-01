import { useEffect, useState } from 'react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

type Variant = 'check' | 'tap' | 'add';

interface TaskCoachOverlayProps {
  /** Task to anchor to (for 'tap' / 'check'). Ignored when `selector` is provided. */
  taskId?: string | null;
  /** CSS selector to anchor to (used for 'add' which targets the + button). */
  selector?: string;
  variant: Variant;
  /** Instruction text shown right next to the spotlighted element. */
  message?: string;
  /** Called when the user taps the inline Skip button. */
  onSkip?: () => void;
}

/**
 * Renders a glowing ring + bouncing hand + inline instruction bubble anchored
 * to a specific element (task card via [data-task-id="..."] or any selector).
 */
export function TaskCoachOverlay({
  taskId,
  selector,
  variant,
  message,
  onSkip,
}: TaskCoachOverlayProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!taskId && !selector) return;
    let raf = 0;

    const update = () => {
      const sel = selector ?? `[data-task-id="${taskId}"]`;
      const el = document.querySelector(sel);
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
  }, [taskId, selector]);

  if (!rect) return null;

  const cy = rect.top + rect.height / 2;

  let ringLeft = 0;
  let ringTop = 0;
  let ringWidth = 0;
  let ringHeight = 0;
  let ringRadius = '12px';

  if (variant === 'check') {
    const ringSize = 48;
    ringLeft = rect.right - ringSize - 10;
    ringWidth = ringSize;
    ringHeight = ringSize;
    ringRadius = '50%';
    ringTop = cy - ringHeight / 2;
  } else if (variant === 'tap') {
    const ringSize = 48;
    ringLeft = rect.left + 12;
    ringWidth = Math.min(rect.width - ringSize - 30, 200);
    ringHeight = 36;
    ringRadius = '12px';
    ringTop = cy - ringHeight / 2;
  } else {
    // 'add' — wrap the + button entirely
    ringLeft = rect.left - 8;
    ringTop = rect.top - 8;
    ringWidth = rect.width + 16;
    ringHeight = rect.height + 16;
    ringRadius = '50%';
  }

  const handLeft = variant === 'check' ? ringLeft - 36 : ringLeft + 12;
  const handTop = cy - 60;

  // Bubble anchored near the spotlight (above for tap/check, below for add)
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 844;
  const placeBubbleBelow = variant === 'add' || rect.top < 110;
  const bubbleTop = placeBubbleBelow
    ? Math.min(rect.bottom + 14, viewportH - 80)
    : rect.top - 52;

  return (
    <>
      {/* Glow ring */}
      <div
        className="fixed pointer-events-none z-[102]"
        style={{
          left: ringLeft,
          top: ringTop,
          width: ringWidth,
          height: ringHeight,
          borderRadius: ringRadius,
          boxShadow:
            '0 0 14px 6px rgba(0,0,0,0.7), 0 0 28px 12px rgba(0,0,0,0.35)',
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
      {/* Inline instruction bubble — sits next to the spotlight, not at the bottom */}
      {message && (
        <div
          className="fixed z-[104] pointer-events-none flex justify-center px-2"
          style={{ top: bubbleTop, left: 0, right: 0 }}
        >
          <div className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-black text-white text-[13px] font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.45)] max-w-[88vw]">
            <span>{message}</span>
            {onSkip && (
              <button
                onClick={onSkip}
                className="ml-1 px-2 py-0.5 rounded-full bg-white/15 active:bg-white/25 text-white text-[11px] font-medium"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes taskCoachBounce {
          0%   { transform: rotate(-25deg) translateY(0px); }
          40%  { transform: rotate(-25deg) translateY(8px); }
          55%  { transform: rotate(-25deg) translateY(4px); }
          70%  { transform: rotate(-25deg) translateY(8px); }
          100% { transform: rotate(-25deg) translateY(0px); }
        }
        @keyframes taskCoachGlow {
          0%, 100% { box-shadow: 0 0 14px 6px rgba(0,0,0,0.7), 0 0 28px 12px rgba(0,0,0,0.35); }
          50%      { box-shadow: 0 0 22px 10px rgba(0,0,0,0.9), 0 0 40px 18px rgba(0,0,0,0.45); }
        }
      `}</style>
    </>
  );
}
