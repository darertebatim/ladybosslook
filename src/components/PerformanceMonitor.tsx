import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  responseTime: number;
  errorRate: number;
  successRate: number;
  timestamp: string;
}

interface Props {
  enabled?: boolean;
  monitoringInterval?: number; // in milliseconds
}

export const PerformanceMonitor: React.FC<Props> = ({ 
  enabled = false, 
  monitoringInterval = 30000 // 30 seconds default
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  useEffect(() => {
    if (!enabled) return;

    const checkHealth = async () => {
      try {
        const startTime = Date.now();
        
        // Test the health check endpoint
        const { data, error } = await supabase.functions.invoke('health-check');
        
        const responseTime = Date.now() - startTime;
        
        if (error) {
          console.warn('Health check failed:', error);
          setIsHealthy(false);
          setMetrics({
            responseTime,
            errorRate: 100,
            successRate: 0,
            timestamp: new Date().toISOString()
          });
        } else {
          setIsHealthy(data.status === 'healthy');
          setMetrics({
            responseTime,
            errorRate: data.status === 'healthy' ? 0 : 50,
            successRate: data.status === 'healthy' ? 100 : 50,
            timestamp: new Date().toISOString()
          });
          
          // Log performance data for monitoring
          console.log('Performance metrics:', {
            responseTime,
            status: data.status,
            services: data.services
          });
        }
      } catch (error) {
        console.error('Performance monitoring error:', error);
        setIsHealthy(false);
      }
    };

    // Initial check
    checkHealth();

    // Set up interval
    const interval = setInterval(checkHealth, monitoringInterval);

    return () => clearInterval(interval);
  }, [enabled, monitoringInterval]);

  // Only show when explicitly enabled and there are issues
  if (!enabled || (isHealthy && !metrics)) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`px-3 py-2 rounded-lg text-sm font-mono ${
        isHealthy 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isHealthy ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span>
            {isHealthy ? 'System Healthy' : 'System Issues Detected'}
          </span>
        </div>
        {metrics && (
          <div className="mt-1 text-xs space-y-1">
            <div>Response: {metrics.responseTime}ms</div>
            <div>Success: {metrics.successRate.toFixed(1)}%</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;