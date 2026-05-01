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

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

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

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 390;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 844;
  const cy = rect.top + rect.height / 2;

  let ringLeft = 0;
  let ringTop = 0;
  let ringWidth = 0;
  let ringHeight = 0;
  let ringRadius = '12px';

  if (variant === 'check') {
    const ringSize = 54;
    ringLeft = rect.right - ringSize - 8;
    ringWidth = ringSize;
    ringHeight = ringSize;
    ringRadius = '50%';
    ringTop = cy - ringHeight / 2;
  } else if (variant === 'tap') {
    ringLeft = rect.left - 6;
    ringTop = rect.top - 6;
    ringWidth = rect.width + 12;
    ringHeight = rect.height + 12;
    ringRadius = '26px';
  } else {
    ringLeft = rect.left - 12;
    ringTop = rect.top - 12;
    ringWidth = rect.width + 24;
    ringHeight = rect.height + 24;
    ringRadius = '50%';
  }

  const handLeft =
    variant === 'check'
      ? ringLeft - 30
      : variant === 'add'
        ? ringLeft + ringWidth - 18
        : ringLeft + 20;
  const handTop =
    variant === 'check'
      ? ringTop - 20
      : variant === 'add'
        ? ringTop + ringHeight - 6
        : ringTop + ringHeight - 8;

  const bubbleMaxWidth = Math.min(250, viewportW - 24);
  const placeBubbleBelow = variant === 'add' || ringTop < 92;
  const bubbleTop = placeBubbleBelow
    ? Math.min(ringTop + ringHeight + 18, viewportH - 80)
    : Math.max(ringTop - 58, 12);
  const bubbleLeft = clamp(
    (variant === 'add' ? rect.right - bubbleMaxWidth + 24 : rect.left + rect.width / 2 - bubbleMaxWidth / 2),
    12,
    viewportW - bubbleMaxWidth - 12,
  );

  return (
    <>
      <div
        className="fixed pointer-events-none z-[10020]"
        style={{
          left: ringLeft,
          top: ringTop,
          width: ringWidth,
          height: ringHeight,
          borderRadius: ringRadius,
          border: '2px solid hsl(0 0% 100% / 0.98)',
          boxShadow:
            '0 0 0 9999px hsl(0 0% 0% / 0.82), 0 0 0 8px hsl(0 0% 0% / 0.24), 0 10px 28px hsl(0 0% 0% / 0.45)',
          animation: 'taskCoachGlow 1.6s ease-in-out infinite',
        }}
      />
      <div
        className="fixed pointer-events-none z-[10021]"
        style={{
          left: handLeft,
          top: handTop,
          filter: 'drop-shadow(0 8px 20px hsl(0 0% 0% / 0.42))',
          animation: 'taskCoachBounce 1.4s ease-in-out infinite',
          transform: 'rotate(-25deg)',
          transformOrigin: 'center',
        }}
      >
        <FluentEmoji emoji="👇" size={56} />
      </div>
      {message && (
        <div
          className="fixed z-[10022] pointer-events-none"
          style={{ top: bubbleTop, left: bubbleLeft, width: bubbleMaxWidth }}
        >
          <div
            className="pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold shadow-[0_8px_24px_hsl(0_0%_0%_/_0.45)]"
            style={{ background: 'hsl(0 0% 0%)', color: 'hsl(0 0% 100%)' }}
          >
            <span>{message}</span>
            {onSkip && (
              <button
                onClick={onSkip}
                className="ml-1 rounded-full px-2 py-0.5 text-[11px] font-medium active:opacity-85"
                style={{ background: 'hsl(0 0% 100% / 0.16)', color: 'hsl(0 0% 100%)' }}
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
          0%, 100% { box-shadow: 0 0 0 9999px hsl(0 0% 0% / 0.82), 0 0 0 8px hsl(0 0% 0% / 0.24), 0 10px 28px hsl(0 0% 0% / 0.45); }
          50%      { box-shadow: 0 0 0 9999px hsl(0 0% 0% / 0.82), 0 0 0 12px hsl(0 0% 0% / 0.3), 0 14px 34px hsl(0 0% 0% / 0.55); }
        }
      `}</style>
    </>
  );
}
