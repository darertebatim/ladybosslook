import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ProgramEvent } from '@/hooks/usePlannerProgramEvents';
import { ProgramEventCard, EVENT_STYLES } from '@/components/app/ProgramEventCard';

interface StackedEventDeckProps {
  events: ProgramEvent[];
  date: Date;
}

const MAX_PEEKS = 3; // visible cards peeking behind the top card
const PEEK_OFFSET = 16; // px of each underlying card visible below the one above

export function StackedEventDeck({ events, date }: StackedEventDeckProps) {
  // Uncompleted events first, completed ones go to the back of the stack
  const stackEvents = [...events].sort(
    (a, b) => Number(a.isCompleted) - Number(b.isCompleted)
  );
  const totalRemaining = stackEvents.length;
  const topEvent = stackEvents[0];

  if (totalRemaining === 0 || !topEvent) return null;

  const peekEvents = stackEvents.slice(1, MAX_PEEKS + 1);
  const stackPadding = peekEvents.length * PEEK_OFFSET;

  return (
    <div className="px-4 pt-2 pb-3">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 pl-1">
        <div
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: '#EB5E33' }}
        >
          Today's events
        </div>
        <div
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(90deg, rgba(235,94,51,0.33), transparent)' }}
        />
      </div>

      {/* Stack — top card is the original ProgramEventCard design */}
      <div className="relative" style={{ paddingBottom: stackPadding }}>
        {/* Peeking cards behind (bottom strips visible) */}
        {peekEvents.map((event, i) => {
          const depth = i + 1;
          const style = EVENT_STYLES[event.type];
          return (
            <div
              key={`${event.type}-${event.id}`}
              className={cn(
                'absolute inset-x-0 top-0 rounded-3xl shadow-card-warm pointer-events-none',
                style.tintBg
              )}
              style={{
                bottom: stackPadding,
                transform: `translateY(${depth * PEEK_OFFSET}px) scaleX(${1 - depth * 0.045})`,
                transformOrigin: 'top center',
                zIndex: 10 - depth,
              }}
            />
          );
        })}

        {/* Top card — original design, animates away when done */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${topEvent.type}-${topEvent.id}`}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative"
            style={{ zIndex: 20 }}
          >
            <ProgramEventCard event={topEvent} date={date} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Stack indicator */}
      {totalRemaining > 1 && (
        <div className="flex justify-center items-center mt-2 gap-1.5">
          <div className="w-6 h-1 rounded-full" style={{ background: '#b9785c' }} />
          {Array.from({ length: Math.min(totalRemaining - 1, 4) }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1 rounded-full"
              style={{ background: '#e5d5c8' }}
            />
          ))}
          <span className="ml-2 text-[10px] font-bold uppercase" style={{ color: '#b9785c' }}>
            {totalRemaining - 1} more
          </span>
        </div>
      )}
    </div>
  );
}
