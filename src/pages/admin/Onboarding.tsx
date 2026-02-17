import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FlaskConical, Smartphone, ArrowRight } from 'lucide-react';

export default function Onboarding() {
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

      {/* Empty state */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FlaskConical className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg mb-2">No onboarding flows yet</CardTitle>
          <CardDescription className="max-w-sm mb-6">
            Create your first onboarding flow to guide new users through your app experience.
          </CardDescription>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create First Flow
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
