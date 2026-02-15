import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';

interface PaywallGateProps {
  programSlug?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PaywallGate = ({ programSlug, children, fallback }: PaywallGateProps) => {
  const { isSubscribed, hasAccessToProgram, isLoading } = useSubscription();
  const navigate = useNavigate();

  if (isLoading) return null;

  // If a specific program slug is provided, check per-program access
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
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">Premium Content</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        This content requires an active subscription. Subscribe to unlock full access.
      </p>
      <Button 
        onClick={() => navigate(programSlug ? `/${programSlug}` : '/app/explore')}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        View Plans
      </Button>
    </div>
  );
};
