import { ReactNode, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaywallSheet } from './PaywallSheet';
import { Lock, Sparkles } from 'lucide-react';

interface PaywallGateProps {
  programSlug?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PaywallGate = ({ programSlug, children, fallback }: PaywallGateProps) => {
  const { isSubscribed, hasAccessToProgram, isLoading } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  // Fetch the program data for the paywall sheet
  const { data: program } = useQuery({
    queryKey: ['paywall-program', programSlug],
    queryFn: async () => {
      if (!programSlug) return null;
      const { data, error } = await supabase
        .from('program_catalog')
        .select('title, ios_product_id, annual_ios_product_id, price_amount, annual_price_amount, subscription_interval, trial_days, features')
        .eq('slug', programSlug)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!programSlug,
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) return null;

  const hasAccess = programSlug 
    ? hasAccessToProgram(programSlug) 
    : isSubscribed;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <button
        onClick={() => setShowPaywall(true)}
        className="flex flex-col items-center justify-center p-8 text-center space-y-3 w-full active:scale-95 transition-transform"
      >
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-base font-semibold">Premium Content</h3>
        <p className="text-muted-foreground text-xs max-w-xs">
          Tap to unlock with a subscription
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          View Plans
        </span>
      </button>

      {program && (
        <PaywallSheet
          open={showPaywall}
          onOpenChange={setShowPaywall}
          program={{
            ...program,
            features: Array.isArray(program.features) ? program.features : [],
          }}
        />
      )}
    </>
  );
};
