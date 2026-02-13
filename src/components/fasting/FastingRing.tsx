import { type FastingZone } from '@/lib/fastingZones';

interface FastingRingProps {
  progress: number;
  zone: FastingZone;
  elapsedSeconds: number;
  targetHours: number;
  isFasting: boolean;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function FastingRing({ progress, zone, elapsedSeconds, targetHours, isFasting }: FastingRingProps) {
  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  // Position of the progress dot
  const angle = progress * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const dotX = size / 2 + radius * Math.cos(rad);
  const dotY = size / 2 + radius * Math.sin(rad);

  const percentage = Math.min(Math.round(progress * 100), 100);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="drop-shadow-lg">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isFasting ? zone.color : 'hsl(var(--muted-foreground))'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-1000 ease-linear"
        />
        {/* Progress dot */}
        {isFasting && progress > 0.01 && (
          <circle
            cx={dotX}
            cy={dotY}
            r={8}
            fill={zone.color}
            className="drop-shadow-md"
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isFasting ? (
          <>
            <span className="text-3xl mb-1">{zone.emoji}</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {zone.name}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              Elapsed Time {percentage}%
            </span>
            <span className="text-4xl font-bold tracking-tight mt-1 tabular-nums" dir="ltr">
              {formatTime(elapsedSeconds)}
            </span>
          </>
        ) : (
          <>
            <span className="text-5xl mb-2">🍽️</span>
            <span className="text-sm text-muted-foreground">
              Ready to fast
            </span>
            <span className="text-lg font-semibold mt-1">
              {targetHours}h goal
            </span>
          </>
        )}
      </div>
    </div>
  );
}
