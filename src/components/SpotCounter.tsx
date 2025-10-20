import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

interface SpotCounterProps {
  totalSpots?: number;
  className?: string;
}

const SpotCounter = ({ totalSpots = 1000, className = "" }: SpotCounterProps) => {
  // Simulate spots taken - in production, this would come from your database
  const [spotsTaken, setSpotsTaken] = useState(927);
  const spotsLeft = totalSpots - spotsTaken;
  const percentageFilled = (spotsTaken / totalSpots) * 100;

  // Simulate real-time updates (optional - remove in production)
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsTaken(prev => {
        if (prev < totalSpots - 5) {
          return prev + Math.floor(Math.random() * 2);
        }
        return prev;
      });
    }, 45000); // Update every 45 seconds

    return () => clearInterval(interval);
  }, [totalSpots]);

  return (
    <div className={`bg-luxury-white/10 backdrop-blur-sm border border-secondary/30 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-center gap-3 mb-3">
        <Users className="text-secondary w-6 h-6" />
        <span className="text-secondary font-bold text-xl font-farsi">
          تعداد جای باقی‌مانده
        </span>
      </div>
      
      <div className="text-center">
        <div className="text-4xl font-bold text-luxury-white mb-2 animate-pulse">
          {spotsLeft}
        </div>
        <div className="text-luxury-silver/80 text-sm font-farsi">
          از {totalSpots} جای اولیه
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 bg-luxury-black/30 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-secondary h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentageFilled}%` }}
        />
      </div>

      <div className="mt-3 text-center">
        <span className="text-red-400 font-bold text-sm font-farsi animate-pulse">
          ⚠️ در حال تکمیل شدن
        </span>
      </div>
    </div>
  );
};

export default SpotCounter;
