import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

const SpotCounter = () => {
  const [spotsLeft, setSpotsLeft] = useState<number>(73);
  const totalSpots = 1000;

  useEffect(() => {
    const fetchOrderCount = async () => {
      try {
        const { count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'paid');

        if (error) {
          console.error('Error fetching order count:', error);
          return;
        }

        const remaining = totalSpots - (count || 0);
        setSpotsLeft(Math.max(0, remaining));
      } catch (error) {
        console.error('Error in fetchOrderCount:', error);
      }
    };

    fetchOrderCount();
    const interval = setInterval(fetchOrderCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const percentageFilled = ((totalSpots - spotsLeft) / totalSpots) * 100;

  return (
    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
      <Users className="w-3 h-3 text-secondary flex-shrink-0" />
      <span className="text-white/90 text-xs whitespace-nowrap">
        <span className="font-bold text-secondary">{spotsLeft}</span> جا باقی
      </span>
      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden flex-shrink-0">
        <div 
          className="h-full bg-gradient-to-r from-secondary to-secondary-light transition-all duration-1000"
          style={{ width: `${percentageFilled}%` }}
        />
      </div>
    </div>
  );
};

export default SpotCounter;
