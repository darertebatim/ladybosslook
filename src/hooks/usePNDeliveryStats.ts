import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PNStats {
  sent: number;
  failed: number;
}

export function usePNDeliveryStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['pn-delivery-stats'],
    queryFn: async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data, error } = await supabase
        .from('pn_schedule_logs')
        .select('function_name, sent_count, failed_count')
        .gte('created_at', yesterday.toISOString());
      
      if (error) {
        console.error('Error fetching PN stats:', error);
        return {};
      }
      
      // Aggregate by function name
      const statsMap: Record<string, PNStats> = {};
      
      for (const log of data || []) {
        if (!log.function_name) continue;
        
        if (!statsMap[log.function_name]) {
          statsMap[log.function_name] = { sent: 0, failed: 0 };
        }
        
        statsMap[log.function_name].sent += log.sent_count || 0;
        statsMap[log.function_name].failed += log.failed_count || 0;
      }
      
      return statsMap;
    },
    refetchInterval: 60000, // Refresh every minute
  });
  
  return { stats, isLoading };
}
