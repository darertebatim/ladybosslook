import { OnboardingFlow } from '@/types/onboarding';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  flow: OnboardingFlow;
  onPreview: () => void;
}

export function OnboardingFlowCard({ flow, onPreview }: Props) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onPreview}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="rounded-xl bg-indigo-50 p-3">
          <Smartphone className="h-6 w-6 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{flow.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{flow.description}</p>
          <p className="text-xs text-muted-foreground mt-1">{flow.steps.length} screens · {flow.appName}</p>
        </div>
        <Button variant="ghost" size="sm">
          Preview <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
