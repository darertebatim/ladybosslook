import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BreathingExercisesManager } from '@/components/admin/BreathingExercisesManager';
import { RoutineManager } from '@/components/admin/RoutineManager';
import { Wind, Sparkles } from 'lucide-react';

export default function Tools() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="text-muted-foreground">Manage app tools and wellness features</p>
      </div>

      <Tabs defaultValue="routines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="routines" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Routines
          </TabsTrigger>
          <TabsTrigger value="breathing" className="flex items-center gap-2">
            <Wind className="h-4 w-4" />
            Breathing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routines">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Routine Management
              </CardTitle>
              <CardDescription>
                Create and manage routine templates that users can add to their daily planner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoutineManager />
            </CardContent>
          </Card>
        </TabsContent>

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
