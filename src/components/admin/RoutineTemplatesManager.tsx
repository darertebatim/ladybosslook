import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, ListTodo } from 'lucide-react';
import { RoutineCategoriesManager } from './RoutineCategoriesManager';
import { RoutinePlansManager } from './RoutinePlansManager';
import { RoutinePlanDetailManager } from './RoutinePlanDetailManager';
import { RoutineStatisticsManager } from './RoutineStatisticsManager';
import { ProTaskTemplatesManager } from './ProTaskTemplatesManager';
import { TaskTemplatesManager } from './TaskTemplatesManager';

export function RoutineTemplatesManager() {
  const [activeTab, setActiveTab] = useState('categories');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // When a plan is selected for editing, show the detail manager
  if (selectedPlanId) {
    return (
      <RoutinePlanDetailManager 
        planId={selectedPlanId} 
        onBack={() => setSelectedPlanId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Routine Templates</h2>
        <p className="text-muted-foreground">
          Manage routine suggestions and templates for the Routines page
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="pro-templates" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Pro Templates
          </TabsTrigger>
          <TabsTrigger value="task-templates" className="flex items-center gap-1">
            <ListTodo className="h-3 w-3" />
            Task Templates
          </TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          <RoutineCategoriesManager />
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          <RoutinePlansManager onSelectPlan={setSelectedPlanId} />
        </TabsContent>

        <TabsContent value="pro-templates" className="mt-4">
          <ProTaskTemplatesManager />
        </TabsContent>

        <TabsContent value="task-templates" className="mt-4">
          <TaskTemplatesManager />
        </TabsContent>

        <TabsContent value="statistics" className="mt-4">
          <RoutineStatisticsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
