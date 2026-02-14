import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { isNativeApp } from '@/lib/platform';

interface PaywallPromptProps {
  featureName: string;
}

export const PaywallPrompt = ({ featureName }: PaywallPromptProps) => {
  const { isTrialing, trialEndsAt } = useSubscription();
  const isNative = isNativeApp();

  const handleSubscribe = async () => {
    if (isNative) {
      // TODO: Trigger RevenueCat purchase flow
      console.log('RevenueCat purchase flow');
    } else {
      // TODO: Trigger Stripe checkout
      console.log('Stripe checkout flow');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[300px] p-6">
      <Card className="max-w-md w-full border-primary/20">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Unlock {featureName}</h3>
          <p className="text-muted-foreground text-sm">
            This feature is part of your premium subscription. Subscribe to get full access to all tools and content.
          </p>
          {isTrialing && trialEndsAt && (
            <p className="text-xs text-muted-foreground">
              Your trial ends {trialEndsAt.toLocaleDateString()}
            </p>
          )}
          <Button onClick={handleSubscribe} className="w-full" size="lg">
            <Crown className="w-4 h-4 mr-2" />
            Subscribe Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
