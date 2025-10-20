import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate?: Date;
  className?: string;
}

const CountdownTimer = ({ targetDate, className = "" }: CountdownTimerProps) => {
  const defaultTarget = new Date();
  defaultTarget.setHours(defaultTarget.getHours() + 24);
  
  const target = targetDate || defaultTarget;
  
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = target.getTime() - now;

      if (distance > 0) {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [target]);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex items-center gap-0.5">
      <div className="bg-accent/20 backdrop-blur-sm border border-accent/40 rounded-lg px-2 py-1 min-w-[32px] text-center">
        <span className="text-accent font-bold text-base md:text-lg tabular-nums">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] text-luxury-silver/70 font-medium">
        {label}
      </span>
    </div>
  );

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <TimeUnit value={timeLeft.hours} label="h" />
      <span className="text-accent text-sm font-bold">:</span>
      <TimeUnit value={timeLeft.minutes} label="m" />
      <span className="text-accent text-sm font-bold">:</span>
      <TimeUnit value={timeLeft.seconds} label="s" />
    </div>
  );
};

export default CountdownTimer;
