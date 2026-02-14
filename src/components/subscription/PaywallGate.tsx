import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallPrompt } from './PaywallPrompt';

interface PaywallGateProps {
  children: ReactNode;
  /** For tool-based gating (journal, breathe, etc.) */
  toolId?: string;
  /** For content-based gating (playlist, ritual, program) */
  requiresSubscription?: boolean;
  /** Optional custom message */
  featureName?: string;
}

export const PaywallGate = ({ children, toolId, requiresSubscription, featureName }: PaywallGateProps) => {
  const { hasAccess, isLoading } = useSubscription();

  if (isLoading) return <>{children}</>;

  const canAccess = hasAccess({ toolId, requiresSubscription });

  if (canAccess) return <>{children}</>;

  return <PaywallPrompt featureName={featureName || toolId || 'this feature'} />;
};
