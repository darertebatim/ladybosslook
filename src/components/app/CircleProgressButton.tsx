import { memo } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CircleProgressButtonProps {
  progress: number;
  target: number;
  size?: number;
  children?: React.ReactNode;
}

/**
 * A circular button with an SVG progress ring that fills as progress increases.
 * Used for count-goal action buttons.
 */
export const CircleProgressButton = memo(function CircleProgressButton({
  progress,
  target,
  size = 36,
  children,
}: CircleProgressButtonProps) {
  const fraction = Math.min(progress / Math.max(target, 1), 1);
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);

  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG progress ring */}
      <svg
        className="absolute inset-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="fill-card-warm stroke-fg-warm"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        {fraction > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2dd4bf"
            strokeWidth={strokeWidth + 0.5}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all duration-500 ease-out"
          />
        )}
      </svg>
      {/* Inner content */}
      <span className="relative z-10 flex items-center justify-center">
        {children || <Plus className="h-4 w-4" strokeWidth={2} />}
      </span>
    </span>
  );
});