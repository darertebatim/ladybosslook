import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface LoadTestResults {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

export const LoadTester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<LoadTestResults | null>(null);
  const [concurrent, setConcurrent] = useState(10);
  const [totalRequests, setTotalRequests] = useState(100);
  const { toast } = useToast();

  const runLoadTest = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      const startTime = Date.now();
      const responseTimes: number[] = [];
      let successCount = 0;
      let failCount = 0;

      // Create batches of concurrent requests
      const batches = Math.ceil(totalRequests / concurrent);
      
      for (let batch = 0; batch < batches; batch++) {
        const batchSize = Math.min(concurrent, totalRequests - (batch * concurrent));
        const batchPromises: Promise<void>[] = [];

        for (let i = 0; i < batchSize; i++) {
          const requestPromise = async () => {
            const requestStart = Date.now();
            
            try {
              const { data, error } = await supabase.functions.invoke('mailchimp-subscribe', {
                body: {
                  email: `test${Date.now()}${Math.random()}@example.com`,
                  name: `Test User ${Date.now()}`,
                  city: 'Test City',
                  phone: '+1234567890',
                  source: 'load_test',
                  tags: ['load_test']
                }
              });

              const responseTime = Date.now() - requestStart;
              responseTimes.push(responseTime);

              if (error) {
                console.error('Request failed:', error);
                failCount++;
              } else {
                successCount++;
              }
            } catch (error) {
              const responseTime = Date.now() - requestStart;
              responseTimes.push(responseTime);
              failCount++;
              console.error('Request error:', error);
            }
          };

          batchPromises.push(requestPromise());
        }

        // Wait for this batch to complete before starting the next
        await Promise.all(batchPromises);
        
        // Small delay between batches to prevent overwhelming
        if (batch < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const totalTime = Date.now() - startTime;
      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);
      const requestsPerSecond = (totalRequests / totalTime) * 1000;
      const errorRate = (failCount / totalRequests) * 100;

      const testResults: LoadTestResults = {
        totalRequests,
        successfulRequests: successCount,
        failedRequests: failCount,
        averageResponseTime,
        minResponseTime,
        maxResponseTime,
        requestsPerSecond,
        errorRate
      };

      setResults(testResults);
      
      toast({
        title: "Load Test Completed",
        description: `${successCount}/${totalRequests} requests successful (${errorRate.toFixed(1)}% error rate)`,
        variant: errorRate > 10 ? "destructive" : "default"
      });

    } catch (error) {
      console.error('Load test error:', error);
      toast({
        title: "Load Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Load Testing Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Concurrent Requests</label>
            <Input
              type="number"
              value={concurrent}
              onChange={(e) => setConcurrent(parseInt(e.target.value) || 10)}
              min="1"
              max="50"
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Total Requests</label>
            <Input
              type="number"
              value={totalRequests}
              onChange={(e) => setTotalRequests(parseInt(e.target.value) || 100)}
              min="1"
              max="1000"
              disabled={isRunning}
            />
          </div>
        </div>

        <Button 
          onClick={runLoadTest} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Load Test...' : 'Start Load Test'}
        </Button>

        {results && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-lg">Test Results</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Total Requests:</strong> {results.totalRequests}
              </div>
              <div>
                <strong>Successful:</strong> {results.successfulRequests}
              </div>
              <div>
                <strong>Failed:</strong> {results.failedRequests}
              </div>
              <div>
                <strong>Error Rate:</strong> {results.errorRate.toFixed(2)}%
              </div>
              <div>
                <strong>Avg Response Time:</strong> {results.averageResponseTime.toFixed(0)}ms
              </div>
              <div>
                <strong>Min/Max Response:</strong> {results.minResponseTime}ms / {results.maxResponseTime}ms
              </div>
              <div>
                <strong>Requests/Second:</strong> {results.requestsPerSecond.toFixed(2)}
              </div>
              <div className={`font-semibold ${results.errorRate > 10 ? 'text-red-600' : 'text-green-600'}`}>
                <strong>Status:</strong> {results.errorRate > 10 ? 'Needs Optimization' : 'Performing Well'}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p><strong>Note:</strong> This tool sends real requests to test system capacity. Use sparingly and only during development/testing.</p>
          <p><strong>Recommendation:</strong> For 1000-2000 users, target &lt;5% error rate and &lt;2000ms avg response time.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadTester;