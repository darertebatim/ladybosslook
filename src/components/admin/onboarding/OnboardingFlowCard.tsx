import { OnboardingFlow } from '@/types/onboarding';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  flow: OnboardingFlow;
  onPreview: () => void;
  isDefault?: boolean;
  onSetDefault?: () => void;
}

export function OnboardingFlowCard({ flow, onPreview, isDefault, onSetDefault }: Props) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onPreview}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="rounded-xl bg-indigo-50 p-3">
          <Smartphone className="h-6 w-6 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{flow.name}</h3>
            {isDefault && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{flow.description}</p>
          <p className="text-xs text-muted-foreground mt-1">{flow.steps.length} screens · {flow.appName}</p>
        </div>
        <div className="flex items-center gap-1">
          {!isDefault && onSetDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onSetDefault(); }}
              className="text-xs text-muted-foreground"
            >
              Set Default
            </Button>
          )}
          <Button variant="ghost" size="sm">
            Preview <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
