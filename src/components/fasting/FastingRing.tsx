import { type FastingZone } from '@/lib/fastingZones';
import { type FastingMode } from '@/hooks/useFastingTracker';
import { format } from 'date-fns';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

interface FastingRingProps {
  progress: number;
  zone: FastingZone;
  elapsedSeconds: number;
  targetHours: number;
  isFasting: boolean;
  mode: FastingMode;
  eatingElapsedSeconds?: number;
  eatingTotalSeconds?: number;
  eatingEndTime?: Date | null;
  onZonePress?: () => void;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function FastingRing({ progress, zone, elapsedSeconds, targetHours, isFasting, mode, eatingElapsedSeconds = 0, eatingTotalSeconds = 0, eatingEndTime, onZonePress }: FastingRingProps) {
  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const isEating = mode === 'eating';
  const eatingProgress = eatingTotalSeconds > 0 ? Math.min(eatingElapsedSeconds / eatingTotalSeconds, 1) : 0;
  const displayProgress = isEating ? eatingProgress : progress;
  const dashOffset = circumference * (1 - displayProgress);

  // Position of the orbiting emoji on the ring
  const angle = displayProgress * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const dotX = size / 2 + radius * Math.cos(rad);
  const dotY = size / 2 + radius * Math.sin(rad);

  const percentage = Math.min(Math.round(progress * 100), 100);

  const strokeColor = isEating ? '#F87171' : (isFasting ? zone.color : 'hsl(var(--muted-foreground))');

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
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* Orbiting zone emoji - positioned on the ring edge */}
      {(isFasting || isEating) && displayProgress > 0.005 && (
        <button
          onClick={onZonePress}
          className="absolute w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center shadow-md transition-all duration-1000 ease-linear active:scale-95"
          style={{
            left: `${dotX - 20}px`,
            top: `${dotY - 20}px`,
          }}
        >
          <FluentEmoji emoji={isEating ? '🍽️' : zone.emoji} size={22} />
        </button>
      )}

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isEating ? (
          <>
            <span className="text-sm text-muted-foreground">
              Eating window
            </span>
            <span className="text-4xl font-bold tracking-tight mt-1 tabular-nums" dir="ltr">
              {formatTime(eatingElapsedSeconds)}
            </span>
            {eatingEndTime && (
              <span className="text-xs text-muted-foreground mt-1">
                Ends on {format(eatingEndTime, 'EEE d, h:mm a')}
              </span>
            )}
          </>
        ) : isFasting ? (
          <>
            <FluentEmoji emoji={zone.emoji} size={40} />
            <span className="text-xs font-semibold mt-1" style={{ color: zone.color }}>
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
            <FluentEmoji emoji="🛠️" size={56} />
            <span className="text-sm text-muted-foreground mt-1">
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
