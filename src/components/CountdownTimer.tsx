import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
}

const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="inline-flex items-center gap-1 text-white font-bold" dir="ltr">
      <span className="bg-white/10 px-2 py-1 rounded text-sm md:text-base">
        {timeLeft.days.toString().padStart(2, '0')}d
      </span>
      <span className="text-white/60">:</span>
      <span className="bg-white/10 px-2 py-1 rounded text-sm md:text-base">
        {timeLeft.hours.toString().padStart(2, '0')}h
      </span>
      <span className="text-white/60">:</span>
      <span className="bg-white/10 px-2 py-1 rounded text-sm md:text-base">
        {timeLeft.minutes.toString().padStart(2, '0')}m
      </span>
      <span className="text-white/60">:</span>
      <span className="bg-white/10 px-2 py-1 rounded text-sm md:text-base">
        {timeLeft.seconds.toString().padStart(2, '0')}s
      </span>
    </div>
  );
};

export default CountdownTimer;
