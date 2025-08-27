import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  renderTime: number;
  interactionDelay: number;
  memoryUsage?: number;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const startTime = useRef(performance.now());
  const interactionStartTime = useRef<number | null>(null);

  useEffect(() => {
    // Measure page load time
    const measurePageLoad = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        
        setMetrics(prev => ({
          ...prev,
          pageLoadTime,
          renderTime: performance.now() - startTime.current,
        } as PerformanceMetrics));
      }
    };

    // Measure memory usage if available
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory.usedJSHeapSize / 1048576; // Convert to MB
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory,
        } as PerformanceMetrics));
      }
    };

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      measurePageLoad();
      measureMemory();
    } else {
      window.addEventListener('load', () => {
        measurePageLoad();
        measureMemory();
      });
    }

    // Monitor interactions
    const handleInteraction = () => {
      if (!interactionStartTime.current) {
        interactionStartTime.current = performance.now();
      }
    };

    const handleInteractionEnd = () => {
      if (interactionStartTime.current) {
        const interactionDelay = performance.now() - interactionStartTime.current;
        setMetrics(prev => ({
          ...prev,
          interactionDelay,
        } as PerformanceMetrics));
        interactionStartTime.current = null;
      }
    };

    document.addEventListener('mousedown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('mouseup', handleInteractionEnd);
    document.addEventListener('touchend', handleInteractionEnd);

    return () => {
      document.removeEventListener('mousedown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('mouseup', handleInteractionEnd);
      document.removeEventListener('touchend', handleInteractionEnd);
    };
  }, []);

  const getPerformanceGrade = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (!metrics) return 'fair';
    
    const { pageLoadTime, renderTime, interactionDelay } = metrics;
    
    if (pageLoadTime < 1000 && renderTime < 100 && interactionDelay < 100) {
      return 'excellent';
    } else if (pageLoadTime < 2000 && renderTime < 200 && interactionDelay < 200) {
      return 'good';
    } else if (pageLoadTime < 3000 && renderTime < 500 && interactionDelay < 300) {
      return 'fair';
    } else {
      return 'poor';
    }
  };

  const logMetrics = () => {
    if (metrics) {
      console.log('Performance Metrics:', {
        ...metrics,
        grade: getPerformanceGrade(),
        timestamp: new Date().toISOString(),
      });
    }
  };

  return {
    metrics,
    grade: getPerformanceGrade(),
    logMetrics,
    isReady: metrics !== null,
  };
};