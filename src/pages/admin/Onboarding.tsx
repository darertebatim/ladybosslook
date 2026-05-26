import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { dearMeFlow } from '@/data/onboarding-flows/dear-me';
import { mePlusFlow } from '@/data/onboarding-flows/me-plus';
import { quickStartFlow } from '@/data/onboarding-flows/quick-start';
import { preAuthWelcomeFlow } from '@/data/onboarding-flows/pre-auth-welcome';
import { weeklyReviewFlow } from '@/data/onboarding-flows/weekly-review';
import { selfcareQuizFlow } from '@/data/onboarding-flows/selfcare-quiz';
import { selfcareWeeklyReviewFlow } from '@/data/onboarding-flows/selfcare-weekly-review';
import { whatIsRiloFlow } from '@/data/onboarding-flows/what-is-rilo';
import { riloDoorsFlow } from '@/data/onboarding-flows/rilo-doors';
import { OnboardingFlowCard } from '@/components/admin/onboarding/OnboardingFlowCard';
import { useDefaultOnboarding, useSetDefaultOnboarding } from '@/hooks/useDefaultOnboarding';
import { toast } from 'sonner';
import OnboardingAnswers from './OnboardingAnswers';

export default function Onboarding() {
  const flows = [riloDoorsFlow, whatIsRiloFlow, preAuthWelcomeFlow, dearMeFlow, mePlusFlow, quickStartFlow, weeklyReviewFlow, selfcareQuizFlow, selfcareWeeklyReviewFlow];
  const { flowId: defaultFlowId } = useDefaultOnboarding();
  const setDefaultMutation = useSetDefaultOnboarding();

  const handleSetDefault = (flowId: string) => {
    setDefaultMutation.mutate(flowId, {
      onSuccess: () => toast.success('Default onboarding flow updated'),
      onError: () => toast.error('Failed to update default flow'),
    });
  };

  const handlePreview = (flowId: string) => {
    window.open(`/app/onboarding/${flowId}`, '_blank');
  };

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

      <Tabs defaultValue="flows">
        <TabsList>
          <TabsTrigger value="flows">Flows</TabsTrigger>
          <TabsTrigger value="answers">Answers</TabsTrigger>
        </TabsList>

        <TabsContent value="flows" className="mt-4">
          <div className="space-y-3">
            {flows.map(flow => (
              <OnboardingFlowCard
                key={flow.id}
                flow={flow}
                onPreview={() => handlePreview(flow.id)}
                isDefault={defaultFlowId === flow.id}
                onSetDefault={() => handleSetDefault(flow.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="answers" className="mt-4">
          <OnboardingAnswers />
        </TabsContent>
      </Tabs>
    </div>
  );
}
