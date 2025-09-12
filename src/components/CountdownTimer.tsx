import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate?: Date;
  className?: string;
}

const CountdownTimer = ({ targetDate, className = "" }: CountdownTimerProps) => {
  // Default to a future date if none provided
  const defaultTarget = new Date();
  defaultTarget.setHours(defaultTarget.getHours() + 24); // 24 hours from now
  
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
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-luxury-white/10 backdrop-blur-sm border border-secondary/30 flex items-center justify-center text-2xl md:text-3xl font-bold text-secondary">
        {value.toString().padStart(2, '0')}
      </div>
      <span className="text-xs md:text-sm text-luxury-silver/80 mt-2 font-medium uppercase tracking-wider">
        {label}
      </span>
    </div>
  );

  return (
    <div className={`flex items-center justify-center gap-4 md:gap-6 ${className}`}>
      <TimeUnit value={timeLeft.hours} label="ساعت" />
      <div className="text-secondary text-2xl font-bold animate-pulse">:</div>
      <TimeUnit value={timeLeft.minutes} label="دقیقه" />
      <div className="text-secondary text-2xl font-bold animate-pulse">:</div>
      <TimeUnit value={timeLeft.seconds} label="ثانیه" />
    </div>
  );
};

export default CountdownTimer;