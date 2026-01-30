import { useEffect } from 'react';
import { RoutineTemplatesManager } from '@/components/admin/RoutineTemplatesManager';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { toast } from 'sonner';

export default function Routines() {
  const { registerFormHandler, unregisterFormHandler } = useAIAssistant();

  useEffect(() => {
    // Register handlers for AI-generated content
    registerFormHandler('routine_plan', (data) => {
      // For now, show the generated routine in a toast since the form is complex
      console.log('AI generated routine plan:', data);
      toast.success('Routine plan generated! Copy the JSON to create it manually.', {
        description: data.name,
        duration: 5000,
      });
    });

    registerFormHandler('task_templates', (data) => {
      console.log('AI suggested task templates:', data);
      toast.success(`${data.suggestions?.length || 0} task suggestions generated!`, {
        duration: 5000,
      });
    });

    return () => {
      unregisterFormHandler('routine_plan');
      unregisterFormHandler('task_templates');
    };
  }, [registerFormHandler, unregisterFormHandler]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Routine Templates</h1>
        <p className="text-muted-foreground">
          Manage routine suggestions and templates for the Inspire page
        </p>
      </div>

      <RoutineTemplatesManager />
    </div>
  );
}
