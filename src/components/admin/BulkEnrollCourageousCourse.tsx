import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Loader2 } from 'lucide-react';

const ROUND_1_ID = '71b674b8-0bf4-467d-bbd9-fca6b4bc57c8'; // US1
const ROUND_2_ID = '68c08fe6-c94c-4157-971b-9c93278f0c57'; // europe2

// US, Canada, Australia → Round #1
const ROUND_1_COUNTRIES = ['US', 'CA', 'AU', 'NZ'];

// Europe, Middle East, Asia → Round #2
const ROUND_2_COUNTRIES = ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'PL', 'CZ', 'TR', 'AE', 'SA', 'IR', 'IL', 'MY', 'SG'];

export function BulkEnrollCourageousCourse() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const determineRoundByCountry = (country: string): string | null => {
    if (ROUND_1_COUNTRIES.includes(country)) return ROUND_1_ID;
    if (ROUND_2_COUNTRIES.includes(country)) return ROUND_2_ID;
    return ROUND_1_ID; // default to round 1
  };

  const handleBulkEnroll = async () => {
    setIsProcessing(true);
    setResults([]);
    const processingResults: any[] = [];

    try {
      // Fetch all Courageous Character orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .or('program_slug.eq.courageous-character-course,program_slug.eq.courageous-character,product_name.ilike.%courageous%')
        .eq('status', 'paid');

      if (ordersError) throw ordersError;

      toast({
        title: "Processing",
        description: `Found ${orders?.length || 0} paid orders to process`
      });

      for (const order of orders || []) {
        try {
          // Get user profile or find by email
          let userId = order.user_id;
          
          if (!userId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', order.email)
              .maybeSingle();
            
            userId = profile?.id;
          }

          if (!userId) {
            processingResults.push({
              email: order.email,
              status: 'skipped',
              reason: 'No user account found'
            });
            continue;
          }

          // Check if already enrolled
          const { data: existing } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('user_id', userId)
            .eq('course_name', 'Courageous Character Course')
            .maybeSingle();

          if (existing) {
            processingResults.push({
              email: order.email,
              status: 'skipped',
              reason: 'Already enrolled'
            });
            continue;
          }

          // Get country from Stripe if session exists
          let country = null;
          if (order.stripe_session_id && order.stripe_session_id.startsWith('cs_')) {
            try {
              const { data: stripeData } = await supabase.functions.invoke('get-stripe-session-details', {
                body: { sessionId: order.stripe_session_id }
              });
              country = stripeData?.customer_details?.address?.country;
            } catch (e) {
              console.log('Could not fetch Stripe details:', e);
            }
          }

          // Determine round based on country
          const roundId = country ? determineRoundByCountry(country) : ROUND_1_ID;

          // Create enrollment
          const { error: enrollError } = await supabase
            .from('course_enrollments')
            .insert({
              user_id: userId,
              course_name: 'Courageous Character Course',
              program_slug: 'courageous-character-course',
              round_id: roundId,
              status: 'active'
            });

          if (enrollError) throw enrollError;

          processingResults.push({
            email: order.email,
            status: 'success',
            round: roundId === ROUND_1_ID ? 'Round 1 (US/CA/AU)' : 'Round 2 (EU/ME)',
            country: country || 'unknown'
          });

        } catch (error: any) {
          processingResults.push({
            email: order.email,
            status: 'error',
            reason: error.message
          });
        }
      }

      setResults(processingResults);
      
      const successCount = processingResults.filter(r => r.status === 'success').length;
      toast({
        title: "Processing Complete",
        description: `Successfully enrolled ${successCount} students`
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Bulk Enroll Courageous Character Students
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <p className="text-sm">
            This will automatically enroll all paid Courageous Character students into their rounds:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>• Round #1: US, Canada, Australia, New Zealand</li>
            <li>• Round #2: Europe, Middle East, Asia</li>
          </ul>
        </div>

        <Button
          onClick={handleBulkEnroll}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Start Bulk Enrollment'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h4 className="font-semibold text-sm">Results:</h4>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded border text-xs ${
                  result.status === 'success'
                    ? 'bg-green-500/10 border-green-500/20'
                    : result.status === 'skipped'
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <p className="font-medium">{result.email}</p>
                <p className="text-muted-foreground">
                  {result.status === 'success'
                    ? `✓ Enrolled in ${result.round} (Country: ${result.country})`
                    : result.status === 'skipped'
                    ? `⊘ ${result.reason}`
                    : `✗ ${result.reason}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
