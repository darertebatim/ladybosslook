import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BreathingExercisesManager } from '@/components/admin/BreathingExercisesManager';
import { Wind } from 'lucide-react';

export default function Tools() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-muted-foreground">Manage app tools and wellness features</p>
      </div>

      <Tabs defaultValue="breathing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breathing" className="flex items-center gap-2">
            <Wind className="h-4 w-4" />
            Breathing
          </TabsTrigger>
          {/* Future tools can be added as additional tabs here */}
        </TabsList>

        <TabsContent value="breathing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wind className="h-5 w-5" />
                Breathing Exercises
              </CardTitle>
              <CardDescription>
                Manage breathing techniques available in the app. Users can access these from the home screen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BreathingExercisesManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
