import type { CoachMode } from './AICoachHeader';

const MODE_COLORS: Record<CoachMode, string> = {
  coach: 'bg-purple-400',
  assistant: 'bg-blue-400',
  companion: 'bg-pink-400',
};

export function AICoachTypingIndicator({ mode }: { mode: CoachMode }) {
  const dotColor = MODE_COLORS[mode];

  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl rounded-tl-md px-5 py-3.5 shadow-sm">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${dotColor} animate-bounce`}
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.8s' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
