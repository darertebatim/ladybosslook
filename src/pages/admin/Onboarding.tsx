import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FlaskConical } from 'lucide-react';
import { dearMeFlow } from '@/data/onboarding-flows/dear-me';
import { mePlusFlow } from '@/data/onboarding-flows/me-plus';
import { OnboardingFlowCard } from '@/components/admin/onboarding/OnboardingFlowCard';
import { OnboardingPreview } from '@/components/admin/onboarding/OnboardingPreview';

export default function Onboarding() {
  const [previewFlowId, setPreviewFlowId] = useState<string | null>(null);
  const flows = [dearMeFlow, mePlusFlow];
  const previewFlow = flows.find(f => f.id === previewFlowId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onboarding Lab</h1>
          <p className="text-muted-foreground">Build and manage onboarding flows for your app</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Flow
        </Button>
      </div>

      <div className="space-y-3">
        {flows.map(flow => (
          <OnboardingFlowCard
            key={flow.id}
            flow={flow}
            onPreview={() => setPreviewFlowId(flow.id)}
          />
        ))}
      </div>

      {previewFlow && (
        <OnboardingPreview
          flow={previewFlow}
          onClose={() => setPreviewFlowId(null)}
        />
      )}
    </div>
  );
}
