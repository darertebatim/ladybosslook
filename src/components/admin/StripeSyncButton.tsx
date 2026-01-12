import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncResult {
  program: string;
  matched: boolean;
  stripeProduct?: string;
  stripePrice?: string;
  updated: boolean;
  reason?: string;
}

interface SyncResponse {
  results: SyncResult[];
  summary: {
    total: number;
    matched: number;
    updated: number;
    notMatched: number;
  };
}

export function StripeSyncButton() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SyncResponse | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('sync-stripe-products');

      if (error) {
        throw error;
      }

      setResults(data as SyncResponse);
      
      if (data.summary.updated > 0) {
        toast.success(`Synced ${data.summary.updated} programs with Stripe`);
      } else if (data.summary.matched === data.summary.total) {
        toast.info('All programs already synced');
      } else {
        toast.warning(`${data.summary.notMatched} programs could not be matched`);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Stripe Product Sync</CardTitle>
          <Button onClick={handleSync} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Sync Products'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Match Stripe products with your program catalog to reuse product/price IDs
        </p>
      </CardHeader>

      {results && (
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Badge variant="outline" className="gap-1">
              <span className="font-semibold">{results.summary.total}</span> Total
            </Badge>
            <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3" />
              <span className="font-semibold">{results.summary.matched}</span> Matched
            </Badge>
            <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800">
              <RefreshCw className="h-3 w-3" />
              <span className="font-semibold">{results.summary.updated}</span> Updated
            </Badge>
            <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800">
              <AlertCircle className="h-3 w-3" />
              <span className="font-semibold">{results.summary.notMatched}</span> Not Matched
            </Badge>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {results.results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded text-sm ${
                  result.updated
                    ? 'bg-green-50 border border-green-200'
                    : result.matched
                    ? 'bg-muted/50'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.updated ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : result.matched ? (
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <XCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="font-medium">{result.program}</span>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {result.matched ? (
                    <span>
                      → {result.stripeProduct}
                      {result.updated && <span className="text-green-600 ml-1">(updated)</span>}
                      {result.reason === 'Already synced' && <span className="ml-1">(synced)</span>}
                    </span>
                  ) : (
                    <span className="text-yellow-700">{result.reason}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
