import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

interface SpotCounterProps {
  totalSpots?: number;
  className?: string;
}

const SpotCounter = ({ totalSpots = 1000, className = "" }: SpotCounterProps) => {
  const [spotsTaken, setSpotsTaken] = useState(927);
  const spotsLeft = totalSpots - spotsTaken;
  const percentageFilled = (spotsTaken / totalSpots) * 100;

  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsTaken(prev => {
        if (prev < totalSpots - 5) {
          return prev + Math.floor(Math.random() * 2);
        }
        return prev;
      });
    }, 45000);

    return () => clearInterval(interval);
  }, [totalSpots]);

  return (
    <div className={`flex items-center justify-center gap-2 text-center ${className}`}>
      <Users className="text-accent w-4 h-4 flex-shrink-0" />
      <div className="flex items-baseline gap-1">
        <span className="text-2xl md:text-3xl font-bold text-luxury-white animate-pulse">
          {spotsLeft}
        </span>
        <span className="text-xs text-luxury-silver/70 font-farsi">
          جا باقی از {totalSpots}
        </span>
      </div>
      <div className="bg-luxury-black/30 rounded-full h-1.5 w-20 overflow-hidden ml-1">
        <div 
          className="bg-accent h-full rounded-full transition-all duration-1000"
          style={{ width: `${percentageFilled}%` }}
        />
      </div>
    </div>
  );
};

export default SpotCounter;
