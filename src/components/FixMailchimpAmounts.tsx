import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const FixMailchimpAmounts = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFix = async () => {
    setIsFixing(true);
    setResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('fix-mailchimp-amounts', {
        body: {}
      });

      if (error) {
        throw error;
      }

      setResults(data);

      if (data.success) {
        toast({
          title: "Amounts Fixed! ✅",
          description: data.message,
        });
      } else {
        throw new Error(data.error || "Failed to fix amounts");
      }

      console.log('Fix results:', data);
    } catch (error: any) {
      console.error('Fix error:', error);
      toast({
        title: "Fix Failed",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Fix Mailchimp Amount Fields</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This will update all CCW workshop records in Mailchimp from "9700" to "97.00"
        </p>
      </div>
      
      <Button 
        onClick={handleFix}
        disabled={isFixing}
        size="sm"
      >
        {isFixing ? 'Fixing Amounts...' : 'Fix Amount Fields'}
      </Button>

      {results && results.results && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Results:</p>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {results.results.map((result: any, index: number) => (
              <div 
                key={index} 
                className="text-xs flex items-center gap-2 p-2 rounded bg-background"
              >
                {result.success ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                )}
                <span className="flex-1">
                  {result.email}: {result.success ? `Updated to ${result.newAmount}` : result.error}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FixMailchimpAmounts;
