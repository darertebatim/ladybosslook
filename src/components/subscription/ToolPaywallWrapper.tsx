import { ReactNode } from 'react';
import { PaywallGate } from './PaywallGate';

interface ToolPaywallWrapperProps {
  toolId: string;
  featureName: string;
  children: ReactNode;
}

/**
 * Wrapper to gate tool pages behind subscription.
 * Used at the route level in App.tsx.
 */
export const ToolPaywallWrapper = ({ toolId, featureName, children }: ToolPaywallWrapperProps) => {
  return (
    <PaywallGate toolId={toolId} featureName={featureName}>
      {children}
    </PaywallGate>
  );
};
